import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import type {
  AppData,
  PurchaseRecord,
  RecordingRecord,
  SelectedChannel,
} from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const RECORDINGS_DIR = path.join(DATA_DIR, "recordings");
const DATA_FILE = path.join(DATA_DIR, "app-data.json");

const defaultData = (): AppData => ({
  purchases: [],
  userSettings: {},
  recordings: [],
});

let updateQueue: Promise<void> = Promise.resolve();

async function ensureStore(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(RECORDINGS_DIR, { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(defaultData(), null, 2), "utf8");
  }
}

export async function getRecordingsDirectory(): Promise<string> {
  await ensureStore();
  return RECORDINGS_DIR;
}

export async function readStore(): Promise<AppData> {
  await ensureStore();
  const raw = await fs.readFile(DATA_FILE, "utf8");

  try {
    const parsed = JSON.parse(raw) as AppData;
    return {
      purchases: parsed.purchases ?? [],
      userSettings: parsed.userSettings ?? {},
      recordings: parsed.recordings ?? [],
    };
  } catch {
    const fresh = defaultData();
    await fs.writeFile(DATA_FILE, JSON.stringify(fresh, null, 2), "utf8");
    return fresh;
  }
}

async function writeStore(data: AppData): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

export async function updateStore(
  mutator: (draft: AppData) => void | Promise<void>,
): Promise<AppData> {
  let nextState: AppData = defaultData();

  updateQueue = updateQueue
    .catch(() => undefined)
    .then(async () => {
      const current = await readStore();
      await mutator(current);
      await writeStore(current);
      nextState = current;
    });

  await updateQueue;
  return nextState;
}

export async function getUserSelectedChannels(
  userId: string,
): Promise<SelectedChannel[]> {
  const data = await readStore();
  return data.userSettings[userId]?.channels ?? [];
}

export async function saveUserSelectedChannels(
  userId: string,
  channels: SelectedChannel[],
): Promise<void> {
  await updateStore((draft) => {
    draft.userSettings[userId] = {
      channels,
      updatedAt: new Date().toISOString(),
    };
  });
}

export async function upsertStripePurchase(
  purchase: Omit<PurchaseRecord, "id" | "createdAt">,
): Promise<PurchaseRecord> {
  let savedPurchase: PurchaseRecord = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...purchase,
  };

  await updateStore((draft) => {
    const existing = draft.purchases.find((record) => {
      if (purchase.checkoutSessionId && record.checkoutSessionId) {
        return record.checkoutSessionId === purchase.checkoutSessionId;
      }
      return record.eventId === purchase.eventId;
    });

    if (existing) {
      existing.email = purchase.email;
      existing.source = purchase.source;
      existing.amountTotal = purchase.amountTotal ?? existing.amountTotal;
      existing.currency = purchase.currency ?? existing.currency;
      existing.eventId = purchase.eventId ?? existing.eventId;
      existing.checkoutSessionId =
        purchase.checkoutSessionId ?? existing.checkoutSessionId;
      savedPurchase = existing;
      return;
    }

    draft.purchases.unshift(savedPurchase);
  });

  return savedPurchase;
}

export async function hasPaidPurchase(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  const data = await readStore();
  return data.purchases.some((purchase) => purchase.email === normalized);
}

export async function createRecording(
  params: Omit<
    RecordingRecord,
    | "id"
    | "status"
    | "createdAt"
    | "updatedAt"
    | "summary"
    | "actionItems"
    | "decisions"
    | "risks"
    | "followUps"
    | "speakers"
  > & {
    status?: RecordingRecord["status"];
    summary?: string;
    actionItems?: string[];
    decisions?: string[];
    risks?: string[];
    followUps?: string[];
    speakers?: string[];
  },
): Promise<RecordingRecord> {
  const now = new Date().toISOString();

  const record: RecordingRecord = {
    id: randomUUID(),
    status: params.status ?? "uploaded",
    createdAt: now,
    updatedAt: now,
    summary: params.summary ?? "",
    actionItems: params.actionItems ?? [],
    decisions: params.decisions ?? [],
    risks: params.risks ?? [],
    followUps: params.followUps ?? [],
    speakers: params.speakers ?? [],
    ...params,
  };

  await updateStore((draft) => {
    draft.recordings.unshift(record);
  });

  return record;
}

export async function getRecordingById(
  recordingId: string,
): Promise<RecordingRecord | null> {
  const data = await readStore();
  return data.recordings.find((recording) => recording.id === recordingId) ?? null;
}

export async function listRecordingsForUser(
  userId: string,
): Promise<RecordingRecord[]> {
  const data = await readStore();
  return data.recordings
    .filter((recording) => recording.userId === userId)
    .sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
}

export async function updateRecording(
  recordingId: string,
  updates: Partial<Omit<RecordingRecord, "id" | "createdAt" | "userId">>,
): Promise<RecordingRecord | null> {
  let updated: RecordingRecord | null = null;

  await updateStore((draft) => {
    const target = draft.recordings.find((record) => record.id === recordingId);
    if (!target) {
      return;
    }

    Object.assign(target, updates);
    target.updatedAt = new Date().toISOString();
    updated = target;
  });

  return updated;
}

export async function clearDataForTesting(): Promise<void> {
  await writeStore(defaultData());
}
