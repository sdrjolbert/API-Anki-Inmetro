import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import moment from "moment-timezone";
import TokenVerifier from "@/utils/verify-token/tokenVerifier";

export async function POST(req = NextRequest()) {
  const bearerToken = req.headers.get("authorization");
  const token = bearerToken.split(" ")[1];
  const filename = await req.text();

  if (!filename) {
    return NextResponse.json(
      { error: "O nome do deck é necessário!" },
      { status: 400, statusText: "O nome do deck é necessário!" }
    );
  }

  const epochInMs = moment().valueOf();

  const newDeck = {
    col: [
      {
        id: 1,
        crt: 1708452000,
        mod: epochInMs + 15,
        scm: epochInMs + 10,
        ver: 11,
        dty: 0,
        usn: 0,
        ls: 0,
        conf: `{"collapseTime":1200,"curDeck":1,"activeDecks":[1],"curModel":${
          epochInMs + 12
        },"nextPos":1,"sortType":"noteFld","sortBackwards":false,"schedVer":2,"sched2021":true,"dueCounts":true,"creationOffset":180,"estTimes":true,"newSpread":0,"addToCur":true,"timeLim":0,"dayLearnFirst":false}`,
        models: `{"1708524307729":{"id":1708524307729,"name":"Basic","type":0,"mod":0,"usn":0,"sortf":0,"did":null,"tmpls":[{"name":"Card 1","ord":0,"qfmt":"{{Front}}","afmt":"{{FrontSide}}\\n\\n<hr id=answer>\\n\\n{{Back}}","bqfmt":"","bafmt":"","did":null,"bfont":"","bsize":0,"id":0}],"flds":[{"name":"Front","ord":0,"sticky":false,"rtl":false,"font":"Arial","size":20,"description":"","plainText":false,"collapsed":false,"excludeFromSearch":false,"id":0,"tag":null,"preventDeletion":false},{"name":"Back","ord":1,"sticky":false,"rtl":false,"font":"Arial","size":20,"description":"","plainText":false,"collapsed":false,"excludeFromSearch":false,"id":0,"tag":null,"preventDeletion":false}],"css":".card {\\n    font-family: arial;\\n    font-size: 20px;\\n    text-align: center;\\n    color: black;\\n    background-color: white;\\n}\\n","latexPre":"\\\\documentclass[12pt]{article}\\n\\\\special{papersize=3in,5in}\\n\\\\usepackage[utf8]{inputenc}\\n\\\\usepackage{amssymb,amsmath}\\n\\\\pagestyle{empty}\\n\\\\setlength{\\\\parindent}{0in}\\n\\\\begin{document}\\n","latexPost":"\\\\end{document}","latexsvg":false,"req":[[0,"any",[0]]],"originalStockKind":1}}`,
        decks: `{"1":{"id":1,"mod":0,"name":"Default","usn":0,"lrnToday":[0,0],"revToday":[0,0],"newToday":[0,0],"timeToday":[0,0],"collapsed":true,"browserCollapsed":true,"desc":"","dyn":0,"conf":1,"extendNew":0,"extendRev":0,"reviewLimit":null,"newLimit":null,"reviewLimitToday":null,"newLimitToday":null},"${epochInMs}":{"id":${epochInMs},"mod":${
          epochInMs + 20
        },"name":\"${filename}\","usn":-1,"lrnToday":[0,0],"revToday":[0,0],"newToday":[0,0],"timeToday":[0,0],"collapsed":true,"browserCollapsed":true,"desc":"","dyn":0,"conf":1,"extendNew":0,"extendRev":0,"reviewLimit":null,"newLimit":null,"reviewLimitToday":null,"newLimitToday":null}}`,
        dconf: `{"1":{"id":1,"mod":0,"name":"Default","usn":0,"maxTaken":60,"autoplay":true,"timer":0,"replayq":true,"new":{"bury":false,"delays":[1.0,10.0],"initialFactor":2500,"ints":[1,4,0],"order":1,"perDay":20},"rev":{"bury":false,"ease4":1.3,"ivlFct":1.0,"maxIvl":36500,"perDay":200,"hardFactor":1.2},"lapse":{"delays":[10.0],"leechAction":1,"leechFails":8,"minInt":1,"mult":0.0},"dyn":false,"newMix":0,"newPerDayMinimum":0,"interdayLearningMix":0,"reviewOrder":0,"newSortOrder":0,"newGatherPriority":0,"buryInterdayLearning":false,"fsrsWeights":[],"desiredRetention":0.9,"ignoreRevlogsBeforeDate":"","stopTimerOnAnswer":false,"secondsToShowQuestion":0.0,"secondsToShowAnswer":0.0,"questionAction":0,"answerAction":0,"waitForAudio":true,"sm2Retention":0.9,"weightSearch":""}}`,
        tags: "{}",
      },
    ],
    cards: [],
    graves: [],
    revlog: [],
    notes: [],
  };

  try {
    const { id: uid, username } = await TokenVerifier(token);

    const { rows: insertReturn } = await sql`
        INSERT INTO decks (uid, username, filename, json)
        VALUES (${uid}, ${username}, ${filename}, ${newDeck})
        RETURNING *
      `;

    const user = insertReturn[0];

    return NextResponse.json(
      {
        success: `O deck ${filename} foi criado com sucesso pelo usuário ${user.username}`,
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Token inválido, expirado ou inexistente: ${err}` },
      {
        status: 400,
        statusText: `Token inválido, expirado ou inexistente: ${err}`,
      }
    );
  }
}
