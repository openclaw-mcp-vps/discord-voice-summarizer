import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  ACCESS_COOKIE_NAME,
  verifyAccessToken,
} from "@/lib/access";
import { getServerAuthSession } from "@/lib/auth";
import { summarizeTranscript } from "@/lib/openai";

export const runtime = "nodejs";

const summarizeSchema = z.object({
  transcript: z.string().min(20),
});

export async function POST(request: Request): Promise<NextResponse> {
  const session = await getServerAuthSession();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE_NAME)?.value;

  if (!verifyAccessToken(accessToken, session.user.email)) {
    return NextResponse.json({ error: "Paid access required" }, { status: 402 });
  }

  const body = (await request.json()) as unknown;
  const parsed = summarizeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Transcript is required" }, { status: 400 });
  }

  const summary = await summarizeTranscript(parsed.data.transcript);
  return NextResponse.json(summary);
}
