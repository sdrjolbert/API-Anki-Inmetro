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
      "http://localhost:4444/api/deck/get-deck",
      filename,
      {
        headers: {
          "Content-Type": "text/plain",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const { jsonData } = response.data;

    const { notes } = jsonData;

    if (notes.length === 0) {
      return NextResponse.json(
        {
          error:
            "Ainda não há notes nesse deck, crie notes para poder recuperá-los",
        },
        {
          status: 500,
          statusText:
            "Ainda não há notes nesse deck, crie notes para poder recuperá-los",
        }
      );
    }

    return NextResponse.json(
      {
        success: `Notes do deck ${filename} do usuário ${username} recuperados com sucesso!`,
        notes,
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Não foi possível recuperar os notes do usuário: ${err}` },
      {
        status: 400,
        statusText: `Não foi possível recuperar os notes do usuário: ${err}`,
      }
    );
  }
}
