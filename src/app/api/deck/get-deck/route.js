import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import TokenVerifier from "@/utils/verify-token/tokenVerifier";

export async function GET(req = NextRequest()) {
  const bearerToken = req.headers.get("authorization");
  const token = bearerToken.split(" ")[1];

  if (!bearer || !token) {
    return NextResponse.json(
      { error: "Token de autorização não fornecido!" },
      { status: 401, statusText: "Token de autorização não fornecido!" }
    );
  }

  try {
    const { id: uid, username } = await TokenVerifier(token);

    try {
      const { rows: decks } =
        await sql`SELECT filename FROM decks WHERE uid = ${uid} AND username = ${username}`;

      const length = decks.length;

      return NextResponse.json(
        {
          success: "Consulta ao banco de dados realizada com sucesso!",
          length,
          decks,
        },
        { status: 200 }
      );
    } catch (err) {
      return NextResponse.json(
        {
          error: `Não foi possível realizar a consulta no banco de dados: ${err}`,
        },
        {
          status: 400,
          statusText: `Não foi possível realizar a consulta no banco de dados: ${err}`,
        }
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
  const bearerToken = req.headers.get("authorization");
  const token = bearerToken.split(" ")[1];
  const filename = await req.text();

  try {
    const { username } = await TokenVerifier(token);

    const { rows } =
      await sql`SELECT json FROM decks WHERE username = ${username} AND filename = ${filename}`;

    const jsonData = rows[0].json;

    return NextResponse.json(
      { success: "JSON recuperado com sucesso!", jsonData, filename },
      { status: 200 }
    );
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
