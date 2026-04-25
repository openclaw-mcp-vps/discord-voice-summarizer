import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  ACCESS_COOKIE_NAME,
  verifyAccessToken,
} from "@/lib/access";
import { normalizeAudioForWhisper } from "@/lib/audio-processor";
import { getServerAuthSession } from "@/lib/auth";
import { summarizeTranscript, transcribeAudioFile } from "@/lib/openai";
import { getRecordingById, updateRecording } from "@/lib/storage";

export const runtime = "nodejs";

const processSchema = z.object({
  recordingId: z.string().min(1),
});

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

  const body = (await request.json()) as unknown;
  const parsed = processSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid recording id" }, { status: 400 });
  }

  const recording = await getRecordingById(parsed.data.recordingId);

  if (!recording || recording.userId !== session.user.id) {
    return NextResponse.json({ error: "Recording not found" }, { status: 404 });
  }

  await updateRecording(recording.id, {
    status: "processing",
    error: undefined,
  });

  try {
    let normalizedPath = recording.filePath;

    try {
      normalizedPath = await normalizeAudioForWhisper(recording.filePath);
    } catch {
      normalizedPath = recording.filePath;
    }

    const transcript = await transcribeAudioFile(normalizedPath);
    const summary = await summarizeTranscript(transcript);

    const updated = await updateRecording(recording.id, {
      status: "completed",
      normalizedPath,
      transcript,
      summary: summary.summary,
      actionItems: summary.actionItems,
      decisions: summary.decisions,
      risks: summary.risks,
      followUps: summary.followUps,
      error: undefined,
    });

    return NextResponse.json({ recording: updated });
  } catch (error) {
    const updated = await updateRecording(recording.id, {
      status: "failed",
      error:
        error instanceof Error
          ? error.message
          : "Unknown processing error while generating summary",
    });

    return NextResponse.json(
      {
        error: updated?.error || "Failed to process recording",
        recording: updated,
      },
      { status: 500 },
    );
  }
}
