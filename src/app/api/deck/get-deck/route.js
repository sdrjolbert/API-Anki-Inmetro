import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { sql } from "@vercel/postgres";

export async function POST(req = NextRequest()) {
  const bearerToken = req.headers.get("authorization");
  const token = bearerToken.split(" ")[1];
  const filename = await req.text();

  try {
    const { username } = jwt.verify(token, process.env.JWT_SECRET);

    const { rows: userSelect } =
      await sql`SELECT id FROM users WHERE username = ${username}`;

    if (userSelect.length > 1) {
      return NextResponse.json(
        {
          error:
            "Conflito no nome de usuário! Mais de um usuário com o mesmo nome de usuário",
        },
        {
          status: 400,
          error:
            "Conflito no nome de usuário! Mais de um usuário com o mesmo nome de usuário",
        }
      );
    }

    const { rows } =
      await sql`SELECT json FROM decks WHERE username = ${username} AND filename = ${filename}`;

    const jsonData = rows[0].json;

    return NextResponse.json(
      { success: "JSON recuperado com sucesso!", jsonData },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Token expirado ou inexistente: ${err.message}` },
      {
        status: 500,
        statusText: `Token expirado ou inexistente: ${err.message}`,
      }
    );
  }
}
