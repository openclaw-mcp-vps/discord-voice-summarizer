import path from "node:path";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  ACCESS_COOKIE_NAME,
  verifyAccessToken,
} from "@/lib/access";
import { getAudioDurationSeconds, saveAudioBuffer } from "@/lib/audio-processor";
import { getServerAuthSession } from "@/lib/auth";
import { createRecording, listRecordingsForUser } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const recordings = await listRecordingsForUser(session.user.id);
  return NextResponse.json({ recordings });
}

export async function POST(request: Request): Promise<NextResponse> {
  const session = await getServerAuthSession();

  if (!session?.user?.id || !session.user.email) {
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

  const titleInput = formData.get("title");
  const title =
    typeof titleInput === "string" && titleInput.trim().length > 0
      ? titleInput.trim()
      : `Voice Meeting ${new Date().toLocaleString()}`;

  const extension = path.extname(file.name) || ".mp3";
  const buffer = Buffer.from(await file.arrayBuffer());
  const filePath = await saveAudioBuffer(buffer, extension);
  const durationSec = await getAudioDurationSeconds(filePath);

  const recording = await createRecording({
    userId: session.user.id,
    userEmail: session.user.email.toLowerCase(),
    title,
    source: "manual-upload",
    filePath,
    durationSec,
    speakers: [],
  });

  return NextResponse.json({ recording }, { status: 201 });
}
