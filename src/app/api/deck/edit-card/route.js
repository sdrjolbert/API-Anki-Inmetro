import { NextRequest, NextResponse } from "next/server";
import TokenVerifier from "@/utils/verify-token/tokenVerifier";
import moment from "moment-timezone";
import axios from "axios";
import crypto from "crypto";
import { sql } from "@vercel/postgres";

export async function POST(req = NextRequest()) {
  const bearer = req.headers.get("authorization");
  const token = bearer.split(" ")[1];
  const { deckName, frontCard, backCard, note, noteIndex } = await req.json();

  const epochInS = moment().unix();

  try {
    const { username } = await TokenVerifier(token);

    note.mod = epochInS;

    const hash = crypto
      .createHash("sha1")
      .update(frontCard.slice(0, 8))
      .digest("hex")
      .slice(0, 8);

    const csum = parseInt(hash, 16);

    try {
      note.sfld = frontCard;
      note.flds = `${frontCard}\x1F${backCard}`;
      note.csum = csum;

      try {
        const response = await axios.post(
          "http://localhost:4444/api/deck/get-deck",
          deckName,
          {
            headers: {
              "Content-Type": "text/plain",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const { jsonData } = response.data;

        jsonData.notes[noteIndex] = note;

        try {
          await sql`UPDATE decks SET json = ${jsonData} WHERE filename = ${deckName} AND username = ${username}`;

          return NextResponse.json(
            { success: "Card editado com sucesso!", note },
            { status: 200 }
          );
        } catch (err) {
          return NextResponse.json(
            {
              error: `Não foi possível atualizar o deck no banco de dados: ${err}`,
            },
            {
              status: 500,
              statusText: `Não foi possível atualizar o deck no banco de dados: ${err}`,
            }
          );
        }
      } catch (err) {}
      return NextResponse.json(
        {
          error: `Não foi possível recuperar o deck do banco de dados: ${err}`,
        },
        {
          status: 500,
          statusText: `Não foi possível recuperar o deck do banco de dados: ${err}`,
        }
      );
    } catch (err) {
      return NextResponse.json(
        {
          error: `Não foi possível recuperar as notas dos cards do deck: ${err}`,
        },
        {
          status: 500,
          statusText: `Não foi possível recuperar as notas dos cards do deck: ${err}`,
        }
      );
    }
  } catch (err) {
    return NextResponse.json(
      { error: `Não foi possível editar o card: ${err}` },
      { status: 500, statusText: `Não foi possível editar o card: ${err}` }
    );
  }
}
