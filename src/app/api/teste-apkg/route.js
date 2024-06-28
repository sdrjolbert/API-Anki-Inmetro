import { NextRequest, NextResponse } from "next/server";
import path from "path";
import JSZip from "jszip";
import fs from "fs-extra";
import sqlite3 from "sqlite3";

export async function POST(req = NextRequest()) {
  const formData = await req.formData();
  const apkgFile = formData.get("apkg-file");

  if (!apkgFile) {
    return NextResponse.json(
      { error: "Nenhum arquivo foi enviado!" },
      { status: 400 }
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

      console.log("Extração concluída com sucesso!");
    } catch (e) {
      console.error(`Ocorreu um erro durante a extração: ${e}`);
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

          Promise.all(
            tables.map(
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
    "src",
    "app",
    "utils",
    "decks",
    path.parse(apkgFile.name).name
  );

  try {
    await extractAPKG(Buffer.from(fileBuffer), outputDir);

    const dbPath = path.join(outputDir, "collection.anki21");

    const data = await readDatabase(dbPath);

    return NextResponse.json(
      { success: "Arquivo .apkg extraído com sucesso!", data },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Falha na extração do arquivo .apkg: ${err}` },
      { status: 500 }
    );
  } finally {
    await fs.remove(outputDir);
  }
}
