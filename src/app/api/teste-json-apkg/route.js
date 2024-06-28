import { NextRequest, NextResponse } from "next/server";
import path from "path";
import JSZip from "jszip";
import fs from "fs-extra";
import sqlite3 from "sqlite3";

export async function POST(req = NextRequest()) {
  const formData = await req.formData();
  const jsonFile = formData.get("json-file");

  if (!jsonFile) {
    return NextResponse.json(
      { error: "Nenhum arquivo JSON foi enviado!" },
      { status: 400 }
    );
  }

  const jsonData = await jsonFile.text();
  const deckData = JSON.parse(jsonData);

  const dbPath = path.join(process.cwd(), "collection.anki21");

  async function createDatabase(dbPath, deckData) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          reject(err);
        }

        db.serialize(() => {
          for (const table in deckData) {
            db.run(
              `CREATE TABLE ${table} (${Object.keys(deckData[table][0]).join(
                ", "
              )})`
            );
            const stmt = db.prepare(
              `INSERT INTO ${table} VALUES (${Object.keys(deckData[table][0])
                .map(() => "?")
                .join(", ")})`
            );

            for (const row of deckData[table]) {
              stmt.run(Object.values(row));
            }

            stmt.finalize();
          }

          db.close((err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
      });
    });
  }

  async function createAPKG(dbPath) {
    const zip = new JSZip();
    const buffer = await fs.readFile(dbPath);

    zip.file("collection.anki21", buffer);

    const outputDir = path.join(process.cwd(), "output");
    await fs.ensureDir(outputDir);

    const apkgPath = path.join(outputDir, "deck.apkg");
    const content = await zip.generateAsync({ type: "nodebuffer" });
    await fs.writeFile(apkgPath, content);

    return apkgPath;
  }

  try {
    await createDatabase(dbPath, deckData);
    const apkgPath = await createAPKG(dbPath);

    const fileBuffer = await fs.readFile(apkgPath);
    const headers = {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="deck.apkg"`,
    };

    return new Response(fileBuffer, { headers });
  } catch (err) {
    return NextResponse.json(
      { error: `Falha na criação do arquivo .apkg: ${err}` },
      { status: 500 }
    );
  } finally {
    await fs.remove(dbPath);
  }
}
