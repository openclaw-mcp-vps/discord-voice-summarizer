import { createHmac } from "node:crypto";
import path from "node:path";

import { NextResponse } from "next/server";
import { z } from "zod";

import { downloadRemoteAudio } from "@/lib/audio-processor";
import { createRecording } from "@/lib/storage";

export const runtime = "nodejs";

const webhookPayloadSchema = z.object({
  type: z.string(),
  recordingUrl: z.string().url().optional(),
  userId: z.string().optional(),
  userEmail: z.string().email().optional(),
  title: z.string().optional(),
  guildId: z.string().optional(),
  guildName: z.string().optional(),
  channelId: z.string().optional(),
  channelName: z.string().optional(),
  speakers: z.array(z.string()).optional(),
});

function isSignatureValid(payload: string, signatureHeader: string | null): boolean {
  const secret = process.env.DISCORD_WEBHOOK_SECRET;

  if (!secret) {
    return true;
  }

  if (!signatureHeader) {
    return false;
  }

  const signature = signatureHeader.startsWith("sha256=")
    ? signatureHeader.slice("sha256=".length)
    : signatureHeader;

  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  return expected === signature;
}

export async function POST(request: Request): Promise<NextResponse> {
  const rawBody = await request.text();

  if (!isSignatureValid(rawBody, request.headers.get("x-discord-signature"))) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  const json = JSON.parse(rawBody) as unknown;
  const parsed = webhookPayloadSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const payload = parsed.data;

  if (payload.type !== "recording.ready") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  if (!payload.recordingUrl) {
    return NextResponse.json(
      { error: "recordingUrl is required for recording.ready events" },
      { status: 400 },
    );
  }

  try {
    const extension = path.extname(new URL(payload.recordingUrl).pathname) || ".mp3";
    const filePath = await downloadRemoteAudio(payload.recordingUrl, extension);

    const recording = await createRecording({
      userId: payload.userId || "discord-webhook",
      userEmail: (payload.userEmail || "webhook@discord.local").toLowerCase(),
      title: payload.title || "Discord Voice Session",
      source: "discord-webhook",
      guildId: payload.guildId,
      guildName: payload.guildName,
      channelId: payload.channelId,
      channelName: payload.channelName,
      filePath,
      speakers: payload.speakers ?? [],
    });

    return NextResponse.json({ ok: true, recordingId: recording.id });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process Discord recording webhook",
      },
      { status: 500 },
    );
  }
}
