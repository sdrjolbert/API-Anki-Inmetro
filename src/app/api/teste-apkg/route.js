import { NextRequest, NextResponse } from "next/server";
import path from "path";
import JSZip from "jszip";
import fs from "fs-extra";

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

    return NextResponse.json(
      { success: "Arquivo .apkg extraído com sucesso!", outputDir },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Falha na extração do arquivo .apkg: ${err}` },
      { status: 500 }
    );
  }
}
