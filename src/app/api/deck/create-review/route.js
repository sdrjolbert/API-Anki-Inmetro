import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import TokenVerifier from "@/utils/verify-token/tokenVerifier";
import moment from "moment-timezone";
import axios from "axios";

export async function POST(req = NextRequest()) {
  const bearer = req.headers.get("authorization");
  const token = bearer.split(" ")[1];
  const { card, deckName, ease, time } = await req.json();
  const { id: cid, ivl, type } = card;

  const epochInMs = moment().valueOf();

  try {
    const { username } = await TokenVerifier(token);

    const actualType = type === 0 || type === 1 ? 0 : 1;
    const actualIvl =
      ease === 4 ? ivl + 3 : ease === 3 ? -600 : ease === 2 ? -360 : -60;

    const review = {
      id: epochInMs,
      cid,
      usn: -1,
      ease,
      ivl: actualIvl,
      lastIvl: ivl,
      factor: 2500,
      time,
      type: actualType,
    };

    try {
      const response = await axios.post(
        "https://api-anki-inmetro.vercel.app/api/deck/update-card",
        { card, ease: Number(ease), deckName },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const { card: newCard } = response.data;

      try {
        const response = await axios.post(
          "https://api-anki-inmetro.vercel.app/api/deck/get-deck",
          deckName,
          {
            headers: {
              "Content-Type": "text/plain",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const { jsonData } = response.data;

        const index = jsonData.cards.findIndex((el) => el.id === cid);

        if (index !== -1) {
          jsonData.cards[index] = newCard;
          jsonData.revlog.push(review);
          try {
            await sql`UPDATE decks SET json = ${jsonData} WHERE filename = ${deckName} AND username = ${username}`;

            return NextResponse.json(
              { success: "Revisão criada com sucesso!" },
              { status: 200 }
            );
          } catch (err) {
            return NextResponse.json(
              {
                error:
                  "Não foi possível atualizar o JSON do deck no banco de dados!",
              },
              {
                status: 500,
                statusText:
                  "Não foi possível atualizar o JSON do deck no banco de dados!",
              }
            );
          }
        } else {
          return NextResponse.json(
            { error: "Não foi possível achar o card identificado na revisão!" },
            {
              status: 500,
              statusText:
                "Não foi possível achar o card identificado na revisão!",
            }
          );
        }
      } catch (err) {
        return NextResponse.json(
          {
            error: `Não foi possível realizar a busca pelo JSON do deck no banco de dados: ${err}`,
          },
          {
            status: 500,
            statusText: `Não foi possível realizar a busca pelo JSON do deck no banco de dados: ${err}`,
          }
        );
      }
    } catch (err) {
      return NextResponse.json(
        {
          error: `Não foi possível atualizar o card com as novas alterações da revisão: ${err}`,
        },
        {
          status: 500,
          statusText: `Não foi possível atualizar o card com as novas alterações da revisão: ${err}`,
        }
      );
    }
  } catch (err) {
    return NextResponse.json(
      { error: `Não foi possível criar a revisão: ${err}` },
      { status: 500, statusText: `Não foi possível criar a revisão: ${err}` }
    );
  }
}
