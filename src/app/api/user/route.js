import { NextRequest, NextResponse } from "next/server";

export async function GET(req) {}

export async function POST(req = NextRequest()) {
  const { username, email, password } = req.json();

  return NextResponse.json({ username }, { email }, { password });

  // return NextResponse.json(
  //   { ok: "OK" },
  //   { message: "Conta criada!" },
  //   { status: 201 }
  // );
}
