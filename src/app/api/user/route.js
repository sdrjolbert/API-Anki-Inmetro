import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import TokenVerifier from "@/utils/verify-token/tokenVerifier";

export async function GET(req = NextRequest()) {
  const bearerToken = req.headers.get("authorization");
  const token = bearerToken.split(" ")[1];

  try {
    const { uid, username } = await TokenVerifier(token);

    try {
      const { rows } =
        await sql`SELECT email FROM jwt_tokens WHERE uid = ${uid} AND username = ${username} AND token = ${token}`;

      const { email } = rows[0];

      return NextResponse.json(
        {
          success: "Consulta realizada com sucesso no banco de dados!",
          user: { uid, username, email },
        },
        { status: 200 }
      );
    } catch (err) {
      return NextResponse.json(
        { error: `Erro ao verificar banco de dados: ${err}` },
        { status: 500, statusText: `Erro ao verificar banco de dados: ${err}` }
      );
    }
  } catch (err) {
    return NextResponse.json(
      { error: `Token inválido, expirado ou inexistente: ${err}` },
      {
        status: 400,
        statusText: `Token inválido, expirado ou inexistente: ${err}`,
      }
    );
  }
}

export async function POST(req = NextRequest()) {
  try {
    const { username, email, password } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Username, email e senha são obrigatórios" },
        { status: 400, statusText: "Username, email e senha são obrigatórios" }
      );
    }

    const { rows } = await sql`SELECT * FROM users WHERE email = ${email}`;

    if (rows.length > 0) {
      return NextResponse.json(
        { error: "Email já está cadastrado!" },
        { status: 400, statusText: "Email já está cadastrado!" }
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
        success: `Conta criada com sucesso com o username: ${user.username}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar usuário: ", error);
    return NextResponse.json(
      { error: "Erro ao criar usuário!" },
      { status: 500, statusText: "Erro ao criar usuário!" }
    );
  }
}
