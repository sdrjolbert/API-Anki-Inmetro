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
        { error: "Username e senha são obrigatórios" },
        { status: 400, statusText: "Username e senha são obrigatórios" }
      );
    }

    const { rows } =
      await sql`SELECT * FROM users WHERE username = ${username}`;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Usuário não encontrado!" },
        { status: 404, statusText: "Usuário não encontrado!" }
      );
    }

    const user = rows[0];

    if (user.password != password) {
      return NextResponse.json(
        { error: "Senha incorreta!" },
        { status: 401, statusText: "Senha incorreta!" }
      );
    }

    const { rows: verifyIfUserHasToken } =
      await sql`SELECT * FROM jwt_tokens WHERE uid = ${user.id} AND username = ${user.username} AND email = ${user.email}`;

    if (verifyIfUserHasToken.length !== 0) {
      await sql`DELETE FROM jwt_tokens WHERE uid = ${user.id} AND username = ${user.username} AND email = ${user.email}`;
    }

    const payload = {
      username: user.username,
      password: user.password,
    };

    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "1h" });
    const createdAt = moment().tz(TIMEZONE).format();
    const expiresAt = moment.unix(jwt.decode(token).exp).format();

    await sql`INSERT INTO jwt_tokens ( uid, username, email, token, createdat, expiresat ) VALUES ( ${user.id}, ${user.username}, ${user.email}, ${token}, ${createdAt}, ${expiresAt} )`;

    return NextResponse.json(
      {
        success: "Token gerado com sucesso!",
        token,
        createdAt,
        expiresAt,
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Erro ao gerar token de autenticação: " + err },
      { status: 400, statusText: "Erro ao gerar token de autenticação: " + err }
    );
  }
}
