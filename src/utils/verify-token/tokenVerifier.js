import jwt from "jsonwebtoken";
import { sql } from "@vercel/postgres";

export const TokenVerifier = async (token) => {
  try {
    const { username } = jwt.verify(token, process.env.JWT_SECRET);

    const { rows: userSelect } =
      await sql`SELECT * FROM users WHERE username = ${username}`;

    if (userSelect.length > 1) {
      throw new Error(
        "Conflito no nome de usuário! Mais de um usuário com o mesmo nome de usuário"
      );
    }

    const { id } = userSelect[0];

    return { id, username };
  } catch (err) {
    throw new Error(`Token inválido, expirado ou inexistente: ${err}`);
  }
};

export default TokenVerifier;
