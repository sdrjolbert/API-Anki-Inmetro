import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs-extra";
import sqlite3 from "sqlite3";
import JSZip from "jszip";
import axios from "axios";

export async function POST(req = NextRequest()) {
  const bearer = req.headers.get("authorization");
  const token = bearer.split(" ")[1];
  const filename = await req.text();

  if (!filename) {
    return NextResponse.json(
      { error: "É necessário o nome do deck o qual deseja baixar!" },
      {
        status: 400,
        statusText: "É necessário o nome do deck o qual deseja baixar!",
      }
    );
  }

  try {
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

    const dbPath = path.join(process.cwd(), "collection.anki21");

    const db = new sqlite3.Database(dbPath);

    const schemaPath = path.join(process.cwd(), "schema.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf-8");

    return new Promise((resolve, reject) => {
      db.exec(schemaSql, (err) => {
        if (err) {
          db.close();
          reject(
            NextResponse.json(
              { error: `Erro ao criar o schema do banco de dados: ${err}` },
              {
                status: 500,
                statusText: `Erro ao criar o schema do banco de dados: ${err}`,
              }
            )
          );
        } else {
          const insertData = () => {
            const { cards, col, graves, notes, revlog } = jsonData;

            const insert = (table, rows) => {
              if (rows && rows.length) {
                const keys = Object.keys(rows[0]).join(", ");
                const placeholders = Object.keys(rows[0])
                  .map(() => "?")
                  .join(", ");
                const sql = `INSERT INTO ${table} (${keys}) VALUES (${placeholders})`;

                db.serialize(() => {
                  const stmt = db.prepare(sql);
                  rows.forEach((row) => stmt.run(Object.values(row)));
                  stmt.finalize();
                });
              }
            };

            insert("cards", cards);
            insert("col", col);
            insert("graves", graves);
            insert("notes", notes);
            insert("revlog", revlog);

            db.close(async () => {
              try {
                const zip = new JSZip();
                zip.file("collection.anki21", fs.readFileSync(dbPath));

                const content = await zip.generateAsync({ type: "nodebuffer" });

                fs.unlinkSync(dbPath);

                const response = new NextResponse(content, {
                  headers: {
                    "Content-Type": "application/zip",
                    "Content-Disposition": `attachment; filename="${filename}.apkg"`,
                    "X-Filename": filename,
                  },
                  status: 200,
                  statusText:
                    "Arquivo exportado com sucesso! Iniciando download!",
                });

                resolve(response);
              } catch (zipError) {
                reject(
                  NextResponse.json(
                    { error: `Erro ao criar o arquivo .apkg: ${zipError}` },
                    {
                      status: 500,
                      statusText: `Erro ao criar o arquivo .apkg: ${zipError}`,
                    }
                  )
                );
              }
            });
          };

          insertData();
        }
      });
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Erro ao baixar deck: ${err}` },
      { status: 500, statusText: `Erro ao baixar deck: ${err}` }
    );
  }
}
