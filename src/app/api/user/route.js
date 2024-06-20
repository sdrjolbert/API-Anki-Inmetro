import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function GET(req = NextRequest()) {
  try {
    const { rows } = await sql`SELECT * FROM users LIMIT 100000`;

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Erro ao recuperar dados dos usuários: ", error);
    return NextResponse.json(
      { error: "Erro ao verificar banco de dados" },
      { status: 500 }
    );
  }
}

export async function POST(req = NextRequest()) {
  try {
    const { username, email, password } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Username, email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    const { rows } = await sql`SELECT * FROM users WHERE email = ${email}`;

    if (rows.length > 0) {
      return NextResponse.json(
        { error: "Email já está cadastrado!" },
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
        ok: "OK!",
        message: `Conta criada com sucesso com o username: ${user.username}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar usuário: ", error);
    return NextResponse.json(
      { error: "Erro ao criar usuário!" },
      { status: 500 }
    );
  }
}
