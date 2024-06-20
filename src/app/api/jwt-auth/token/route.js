import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { sql } from "@vercel/postgres";
import moment from "moment-timezone";
import * as dotenv from "dotenv";
dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET;
const TIMEZONE = "America/Sao_Paulo";

export async function POST(req = NextRequest()) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { statusText: "Username e senha são obrigatórios" },
        { status: 400 }
      );
    }

    const { rows } =
      await sql`SELECT * FROM users WHERE username = ${username}`;

    if (rows.length === 0) {
      return NextResponse.json(
        { statusText: "Usuário não encontrado!" },
        { status: 404 }
      );
    }

    const user = rows[0];

    if (user.password != password) {
      return NextResponse.json(
        { statusText: "Senha incorreta!" },
        { status: 401 }
      );
    }

    const payload = {
      username: user.username,
      password: user.password,
    };
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "1h" });

    const expiresAtUTC = moment().add(1, "hour");
    const expiresAtLocal = expiresAtUTC.tz(TIMEZONE).format();

    await sql`INSERT INTO jwt_tokens ( userid, username, email, token, expiresat ) VALUES ( ${user.id}, ${user.username}, ${user.email}, ${token}, ${expiresAtLocal} )`;

    return NextResponse.json(
      {
        ok: true,
        statusText: "Token gerado com sucesso!",
        token,
        expiresAtLocal,
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { statusText: "Erro ao gerar token de autenticação: " + err },
      { status: 400 }
    );
  }
}
