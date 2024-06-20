import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function GET(req = NextRequest()) {
  const bearerToken = req.headers.get("authorization");
  const token = bearerToken.split(" ")[1];

  try {
    const { rows } =
      await sql`SELECT userid, username, email FROM jwt_tokens WHERE token = ${token}`;

    const user = rows[0];

    return NextResponse.json(
      {
        ok: true,
        statusText: "Consulta realizada com sucesso no banco de dados!",
        user,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { statusText: "Erro ao verificar banco de dados" },
      { status: 500 }
    );
  }
}

export async function POST(req = NextRequest()) {
  try {
    const { username, email, password } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json(
        { statusText: "Username, email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    const { rows } = await sql`SELECT * FROM users WHERE email = ${email}`;

    if (rows.length > 0) {
      return NextResponse.json(
        { statusText: "Email já está cadastrado!" },
        { status: 400 }
      );
    }

    const { rows: newUser } = await sql`
      INSERT INTO users (username, email, password)
      VALUES (${username}, ${email}, ${password})
      RETURNING *
    `;

    const user = newUser[0];

    return NextResponse.json(
      {
        ok: true,
        statusText: `Conta criada com sucesso com o username: ${user.username}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar usuário: ", error);
    return NextResponse.json(
      { statusText: "Erro ao criar usuário!" },
      { status: 500 }
    );
  }
}
