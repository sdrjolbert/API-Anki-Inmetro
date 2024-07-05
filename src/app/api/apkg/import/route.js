import { NextRequest, NextResponse } from "next/server";
import path from "path";
import JSZip from "jszip";
import fs from "fs-extra";
import sqlite3 from "sqlite3";
import { sql } from "@vercel/postgres";
import TokenVerifier from "@/utils/verify-token/tokenVerifier";

export async function POST(req = NextRequest()) {
  const bearerToken = req.headers.get("authorization");
  const token = bearerToken.split(" ")[1];

  try {
    const { id: uid, username } = await TokenVerifier(token);

    const formData = await req.formData();
    const apkgFile = formData.get("apkg-file");

    if (!apkgFile) {
      return NextResponse.json(
        { error: "Nenhum arquivo foi enviado!" },
        { status: 400, statusText: "Nenhum arquivo foi enviado!" }
      );
    }

    const filename = apkgFile.name.split(".apkg")[0];

    const { rows: decksRows } =
      await sql`SELECT id FROM decks WHERE username = ${username} AND filename = ${filename}`;

    if (decksRows.length > 0) {
      return NextResponse.json(
        { error: "Arquivo .apkg já importado!" },
        { status: 400, error: "Arquivo .apkg já importado!" }
      );
    }

    async function extractAPKG(buffer, outputDir) {
      try {
        const zip = await JSZip.loadAsync(buffer);

        await Promise.all(
          Object.keys(zip.files).map(async (filename) => {
            const fileData = await zip.files[filename].async("nodebuffer");
            const outputFile = path.join(outputDir, filename);

            await fs.ensureDir(path.dirname(outputFile));
            await fs.writeFile(outputFile, fileData);
          })
        );
      } catch (e) {
        throw new Error(e);
      }
    }

    function readDatabase(dbPath) {
      return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, (err) => {
          if (err) {
            reject(err);
          }
        });

        db.all(
          "SELECT name FROM sqlite_master WHERE type='table'",
          [],
          (err, tables) => {
            if (err) {
              reject(err);
            }

            const data = {};
            const filteredTables = tables.filter(
              (table) =>
                table.name !== "sqlite_stat1" && table.name !== "sqlite_stat4"
            );

            Promise.all(
              filteredTables.map(
                (table) =>
                  new Promise((resolve, reject) => {
                    db.all(`SELECT * FROM ${table.name}`, [], (err, rows) => {
                      if (err) {
                        reject(err);
                      }
                      data[table.name] = rows;
                      resolve();
                    });
                  })
              )
            )
              .then(() => {
                db.close();
                resolve(data);
              })
              .catch((err) => {
                db.close();
                reject(err);
              });
          }
        );
      });
    }

    const fileBuffer = await apkgFile.arrayBuffer();
    const outputDir = path.join(
      process.cwd(),
      "decks",
      path.parse(apkgFile.name).name
    );

    try {
      await extractAPKG(Buffer.from(fileBuffer), outputDir);

      const dbPath = path.join(outputDir, "collection.anki21");

      const deck = await readDatabase(dbPath);

      try {
        const { rows: insertReturn } = await sql`
        INSERT INTO decks (uid, username, filename, json)
        VALUES (${uid}, ${username}, ${filename}, ${deck})
        RETURNING *
      `;

        const user = insertReturn[0];

        return NextResponse.json(
          {
            success: `Arquivo .apkg importado com sucesso com o username: ${user.username}`,
          },
          { status: 200 }
        );
      } catch (err) {
        return NextResponse.json(
          {
            error: `Falha na inserção do arquivo .apkg no banco de dados: ${err}`,
          },
          {
            status: 500,
            statusText: `Falha na inserção do arquivo .apkg no banco de dados: ${err}`,
          }
        );
      }
    } catch (err) {
      return NextResponse.json(
        { error: `Falha na importação do arquivo .apkg: ${err}` },
        {
          status: 500,
          statusText: `Falha na importação do arquivo .apkg: ${err}`,
        }
      );
    } finally {
      await fs.remove(outputDir);
    }
  } catch (err) {
    return NextResponse.json(
      {
        error: `Não foi possível importar: ${err}`,
      },
      { status: 500, statusText: `Não foi possível importar: ${err}` }
    );
  }
}
