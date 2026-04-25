import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: false,
      message:
        "Lemon Squeezy webhooks are disabled for this project. Use /api/stripe/webhook instead.",
    },
    { status: 410 },
  );
}
