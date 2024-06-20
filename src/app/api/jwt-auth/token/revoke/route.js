import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function POST(req = NextRequest()) {
  const bearerToken = req.headers.get("authorization");
  const token = bearerToken.split(" ")[1];

  try {
    await sql`DELETE FROM jwt_tokens WHERE token = ${token}`;

    return NextResponse.json(
      {
        ok: "OK",
        statusText: "Token removido com sucesso!",
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { statusText: "Não foi possível remover o token!" },
      { statusCode: 400 }
    );
  }
}
