import { NextRequest, NextResponse } from "next/server";
import TokenVerifier from "@/utils/verify-token/tokenVerifier";
import moment from "moment-timezone";
import axios from "axios";

export async function POST(req = NextRequest()) {
  const bearer = req.headers.get("authorization");
  const token = bearer.split(" ")[1];
  const { card, ease, deckName } = await req.json();

  const epochInS = moment().unix();

  try {
    await TokenVerifier(token);

    card.mod = epochInS;

    try {
      const response = await axios.post(
        "http://localhost:4444/api/deck/get-cards",
        deckName,
        {
          headers: {
            "Content-Type": "text/plain",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const { due2: maxDue } = response.data;

      if (ease === 4) {
        card.type = 2;
        card.queue = 2;
        card.due = maxDue + 1;
        card.ivl += 3;
      } else {
        card.type = 1;
        card.queue = 1;
        card.ivl = 0;
        if (ease === 3) {
          card.due = moment().add(10, "minutes").unix();
        } else {
          card.due =
            ease === 2
              ? moment().add(6, "minutes").unix()
              : moment().add(1, "minute").unix();
        }
      }

      card.reps += 1;

      return NextResponse.json(
        { success: "Card atualizado com sucesso!", card },
        { status: 200 }
      );
    } catch (err) {
      return NextResponse.json(
        { error: `Não foi possível recuperar os cards do deck: ${err}` },
        {
          status: 500,
          statusText: `Não foi possível recuperar os cards do deck: ${err}`,
        }
      );
    }
  } catch (err) {
    return NextResponse.json(
      { error: `Não foi possível atualizar o card: ${err}` },
      { status: 500, statusText: `Não foi possível atualizar o card: ${err}` }
    );
  }
}
