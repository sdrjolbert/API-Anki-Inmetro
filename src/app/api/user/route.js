import { NextResponse } from "next/server";

export async function GET(req) {}

export async function POST(req) {
  return NextResponse.json(
    { ok: "OK" },
    { message: "Conta criada!" },
    { status: 201 }
  );
}
