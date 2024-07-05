import { NextRequest, NextResponse } from "next/server";
import TokenVerifier from "@/utils/verify-token/tokenVerifier";
import axios from "axios";

export async function POST(req = NextRequest()) {
  const bearerToken = req.headers.get("authorization");
  const token = bearerToken.split(" ")[1];
  const filename = await req.text();

  try {
    const { username } = await TokenVerifier(token);

    const response = await axios.post(
      "https://api-anki-inmetro.vercel.app/api/deck/get-deck",
      filename,
      {
        headers: {
          "Content-Type": "text/plain",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const { jsonData } = response.data;

    const { cards } = jsonData;

    if (cards.length === 0) {
      return NextResponse.json(
        {
          error:
            "Ainda não há cards nesse deck, crie cards para poder recuperá-los",
        },
        {
          status: 500,
          statusText:
            "Ainda não há cards nesse deck, crie cards para poder recuperá-los",
        }
      );
    }

    const maxDueType0 = cards
      .filter((card) => card.type === 0)
      .reduce(
        (max, current) => {
          return current.due > max.due ? current : max;
        },
        { due: 0 }
      ).due;

    const maxDueType2 = cards
      .filter((card) => card.type === 2)
      .reduce(
        (max, current) => {
          return current.due > max.due ? current : max;
        },
        { due: 135 }
      ).due;

    const sortedCards = [...cards].sort((a, b) => {
      if (a.type === 0 && b.type === 0) {
        return a.due - b.due;
      } else if (a.type === 1 && b.type === 1) {
        return a.due - b.due;
      } else if (a.type === 0) {
        return -1;
      } else if (a.type === 1) {
        return b.type === 0 ? 1 : -1;
      } else {
        if (b.type === 0 || b.type === 1) {
          return 1;
        } else {
          return a.ivl - b.ivl;
        }
      }
    });

    return NextResponse.json(
      {
        success: `Cards do deck ${filename} do usuário ${username} recuperados com sucesso!`,
        cards,
        due: maxDueType0,
        due2: maxDueType2,
        sortedCards,
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Não foi possível recuperar os cards do usuário: ${err}` },
      {
        status: 400,
        statusText: `Não foi possível recuperar os cards do usuário: ${err}`,
      }
    );
  }
}
