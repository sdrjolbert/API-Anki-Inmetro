import { NextRequest, NextResponse } from "next/server";
import moment from "moment-timezone";
import { sql } from "@vercel/postgres";
import TokenVerifier from "@/utils/verify-token/tokenVerifier";

const TIMEZONE = "America/Sao_Paulo";

export async function POST(req = NextRequest()) {
  const actualTime = moment().tz(TIMEZONE).format();

  const bearerToken = req.headers.get("authorization");
  const token = bearerToken.split(" ")[1];

  try {
    const { username } = await TokenVerifier(token);

    const { rows } = await sql`SELECT * FROM jwt_tokens WHERE token = ${token}`;

    const expiresAt = moment(rows[0].expiresat).tz(TIMEZONE).format();
    const tokenValid = moment(expiresAt).tz(TIMEZONE).isAfter(actualTime);

    if (!tokenValid) {
      await sql`DELETE FROM jwt_tokens WHERE token = ${token}`;

      return NextResponse.json(
        { error: "Token expirado! Gere um novo fazendo login novamente!" },
        {
          status: 401,
          statusText: "Token expirado! Gere um novo fazendo login novamente!",
        }
      );
    }

    return NextResponse.json(
      {
        success: `O token do usuário ${username} é válido!`,
      },
      { status: 200 }
    );
  } catch (err) {
    await sql`DELETE FROM jwt_tokens WHERE token = ${token}`;

    return NextResponse.json(
      { error: "Token inválido!" },
      { statusCode: 400, statusText: "Token inválido!" }
    );
  }
}
