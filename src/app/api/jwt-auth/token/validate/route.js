// TO DO Corrigir API de validação de tokens

import { NextRequest, NextResponse } from "next/server";

export async function POST(req = NextRequest()) {
  const { token } = req.json();

  return NextResponse.json(
    { ok: "OK", message: "Token válido!", token },
    { status: 200 }
  );
}
