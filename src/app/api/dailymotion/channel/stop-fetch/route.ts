import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ ok: true, message: "Client-side AbortController stops active fetches; partial manifests remain in the browser." });
}
