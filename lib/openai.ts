import { createReadStream } from "node:fs";

import OpenAI from "openai";

import type { MeetingSummary } from "@/lib/types";

let singletonClient: OpenAI | null = null;

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  if (!singletonClient) {
    singletonClient = new OpenAI({ apiKey });
  }

  return singletonClient;
}

export async function transcribeAudioFile(filePath: string): Promise<string> {
  const openai = getClient();

  const model = process.env.OPENAI_TRANSCRIPTION_MODEL || "whisper-1";
  const result = await openai.audio.transcriptions.create({
    file: createReadStream(filePath),
    model,
  });

  return result.text;
}

function safeParseSummary(payload: string): MeetingSummary {
  try {
    const parsed = JSON.parse(payload) as Partial<MeetingSummary>;

    return {
      summary: parsed.summary?.trim() || "No summary available.",
      actionItems: Array.isArray(parsed.actionItems)
        ? parsed.actionItems.map((item) => String(item).trim()).filter(Boolean)
        : [],
      decisions: Array.isArray(parsed.decisions)
        ? parsed.decisions.map((item) => String(item).trim()).filter(Boolean)
        : [],
      risks: Array.isArray(parsed.risks)
        ? parsed.risks.map((item) => String(item).trim()).filter(Boolean)
        : [],
      followUps: Array.isArray(parsed.followUps)
        ? parsed.followUps.map((item) => String(item).trim()).filter(Boolean)
        : [],
    };
  } catch {
    return {
      summary: payload,
      actionItems: [],
      decisions: [],
      risks: [],
      followUps: [],
    };
  }
}

export async function summarizeTranscript(
  transcript: string,
): Promise<MeetingSummary> {
  const openai = getClient();
  const summaryModel = process.env.OPENAI_SUMMARY_MODEL || "gpt-4o-mini";

  const completion = await openai.chat.completions.create({
    model: summaryModel,
    temperature: 0.2,
    response_format: {
      type: "json_object",
    },
    messages: [
      {
        role: "system",
        content:
          "You summarize Discord voice meetings for remote teams. Return JSON with keys: summary (string), actionItems (string[]), decisions (string[]), risks (string[]), followUps (string[]). Keep action items specific with owners when available.",
      },
      {
        role: "user",
        content: transcript,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;

  if (!content) {
    return {
      summary: "No summary was generated.",
      actionItems: [],
      decisions: [],
      risks: [],
      followUps: [],
    };
  }

  return safeParseSummary(content);
}
