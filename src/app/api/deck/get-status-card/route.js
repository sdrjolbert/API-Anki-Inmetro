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

    const reduceCards = cards.reduce(
      (acc, current) => {
        switch (current.type) {
          case 0:
            acc.newCards.push(current);
            break;
          case 1:
            acc.learningCards.push(current);
            break;
          case 2:
            acc.reviewingCards.push(current);
            break;
          default:
            throw new Error("Não foi possível separar os tipos dos cards!");
        }
        return acc;
      },
      { newCards: [], learningCards: [], reviewingCards: [] }
    );

    const { newCards } = reduceCards;
    const { learningCards } = reduceCards;
    const { reviewingCards } = reduceCards;

    return NextResponse.json(
      {
        success: `Estatísticas de status dos cards do deck ${filename} do usuário ${username} obtidos com sucesso!`,
        newCards: newCards.length,
        learningCards: learningCards.length,
        reviewingCards: reviewingCards.length,
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
