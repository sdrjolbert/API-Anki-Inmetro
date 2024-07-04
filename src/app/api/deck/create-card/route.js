// FIXME: Erro de CORS

import { NextRequest, NextResponse } from "next/server";
import moment from "moment-timezone";
import TokenVerifier from "@/utils/verify-token/tokenVerifier";
import { v4 } from "uuid";
import crypto from "crypto";
import { sql } from "@vercel/postgres";

export async function POST(req = NextRequest()) {
  const bearerToken = req.headers.get("authorization");
  const token = bearerToken.split(" ")[1];
  const { deckName, frontCard, backCard, jsonData } = await req.json();

  if (!deckName) {
    return NextResponse.json(
      { error: "É necessário o nome do deck que deseja criar o card!" },
      {
        status: 400,
        statusText: "É necessário o nome do deck que deseja criar o card!",
      }
    );
  }

  if (!frontCard || !backCard) {
    return NextResponse.json(
      { error: "A frente e o verso do card são necessários!" },
      { status: 400, statusText: "A frente e o verso do card são necessários!" }
    );
  }

  try {
    const { username } = await TokenVerifier(token);

    const epochInMs = moment().valueOf();
    const epochInS = moment().unix();

    if (jsonData.col[0].models === "{}") {
      const modelsData = `{"1708524307729":{"id":1708524307729,"name":"Basic","type":0,"mod":0,"usn":0,"sortf":0,"did":null,"tmpls":[{"name":"Card 1","ord":0,"qfmt":"{{Front}}","afmt":"{{FrontSide}}\\n\\n<hr id=answer>\\n\\n{{Back}}","bqfmt":"","bafmt":"","did":null,"bfont":"","bsize":0,"id":0}],"flds":[{"name":"Front","ord":0,"sticky":false,"rtl":false,"font":"Arial","size":20,"description":"","plainText":false,"collapsed":false,"excludeFromSearch":false,"id":0,"tag":null,"preventDeletion":false},{"name":"Back","ord":1,"sticky":false,"rtl":false,"font":"Arial","size":20,"description":"","plainText":false,"collapsed":false,"excludeFromSearch":false,"id":0,"tag":null,"preventDeletion":false}],"css":".card {\\n    font-family: arial;\\n    font-size: 20px;\\n    text-align: center;\\n    color: black;\\n    background-color: white;\\n}\\n","latexPre":"\\\\documentclass[12pt]{article}\\n\\\\special{papersize=3in,5in}\\n\\\\usepackage[utf8]{inputenc}\\n\\\\usepackage{amssymb,amsmath}\\n\\\\pagestyle{empty}\\n\\\\setlength{\\\\parindent}{0in}\\n\\\\begin{document}\\n","latexPost":"\\\\end{document}","latexsvg":false,"req":[[0,"any",[0]]],"originalStockKind":1}}`;

      const decksData = `${String(jsonData.col[0].decks).slice(
        0,
        -1
      )},"${epochInMs}":{"id":${epochInMs},"mod":${epochInS},"name":\"${deckName}\","usn":-1,"lrnToday":[0,0],"revToday":[0,0],"newToday":[0,0],"timeToday":[0,0],"collapsed":true,"browserCollapsed":true,"desc":"","dyn":0,"conf":1,"extendNew":0,"extendRev":0,"reviewLimit":null,"newLimit":null,"reviewLimitToday":null,"newLimitToday":null}}`;

      jsonData.col[0].models = modelsData;
      jsonData.col[0].decks = decksData;
    }

    const did = Number(Object.keys(JSON.parse(jsonData.col[0].decks))[1]);

    const hash = crypto
      .createHash("sha1")
      .update(frontCard.slice(0, 8))
      .digest("hex")
      .slice(0, 8);

    const csum = parseInt(hash, 16);

    const card = {
      id: epochInMs,
      nid: epochInMs,
      did,
      ord: 0,
      mod: epochInS,
      usn: -1,
      type: 0,
      queue: 0,
      due: 1,
      ivl: 0,
      factor: 2500,
      reps: 0,
      lapses: 0,
      left: 0,
      odue: 0,
      odid: 0,
      flags: 0,
      data: "",
    };

    const note = {
      id: epochInMs,
      guid: v4().replace(/-/g, ""),
      mid: 1708524307729,
      mod: epochInS,
      usn: -1,
      tags: "",
      flds: `"${frontCard}\x1F${backCard}"`,
      sfld: `"${frontCard}"`,
      csum,
      flags: 0,
      data: "",
    };

    jsonData.cards.push(card);
    jsonData.notes.push(note);

    const { rows: sqlUpdate } =
      await sql`UPDATE decks SET json = ${jsonData} WHERE filename = ${deckName} AND username = ${username}`;

    const result = sqlUpdate[0];

    return NextResponse.json(
      {
        success: `Card criado com sucesso no deck ${result.filename}, com a frente: ${frontCard} e o com o verso: ${backCard} pelo usuário ${result.username}`,
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Não foi possível criar um novo card: ${err}` },
      {
        status: 400,
        statusText: `Não foi possível criar um novo card: ${err}`,
      }
    );
  }
}
