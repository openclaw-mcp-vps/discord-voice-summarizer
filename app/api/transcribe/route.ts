import path from "node:path";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  ACCESS_COOKIE_NAME,
  verifyAccessToken,
} from "@/lib/access";
import { normalizeAudioForWhisper, saveAudioBuffer } from "@/lib/audio-processor";
import { getServerAuthSession } from "@/lib/auth";
import { transcribeAudioFile } from "@/lib/openai";

export const runtime = "nodejs";

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

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Audio file is required" }, { status: 400 });
  }

  const extension = path.extname(file.name) || ".mp3";
  const buffer = Buffer.from(await file.arrayBuffer());
  const sourcePath = await saveAudioBuffer(buffer, extension);

  let normalizedPath = sourcePath;

  try {
    normalizedPath = await normalizeAudioForWhisper(sourcePath);
  } catch {
    normalizedPath = sourcePath;
  }

  const transcript = await transcribeAudioFile(normalizedPath);

  return NextResponse.json({ transcript });
}
