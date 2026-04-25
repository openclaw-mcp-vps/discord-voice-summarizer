export type RecordingStatus = "uploaded" | "processing" | "completed" | "failed";

export type RecordingSource = "manual-upload" | "discord-webhook";

export interface SelectedChannel {
  guildId: string;
  guildName: string;
  channelId: string;
  channelName: string;
}

export interface UserSettings {
  channels: SelectedChannel[];
  updatedAt: string;
}

export interface PurchaseRecord {
  id: string;
  email: string;
  source: "stripe";
  checkoutSessionId?: string;
  eventId?: string;
  amountTotal?: number | null;
  currency?: string | null;
  createdAt: string;
}

export interface MeetingSummary {
  summary: string;
  actionItems: string[];
  decisions: string[];
  risks: string[];
  followUps: string[];
}

export interface RecordingRecord extends MeetingSummary {
  id: string;
  userId: string;
  userEmail: string;
  title: string;
  guildId?: string;
  guildName?: string;
  channelId?: string;
  channelName?: string;
  source: RecordingSource;
  filePath: string;
  normalizedPath?: string;
  transcript?: string;
  speakers: string[];
  durationSec?: number | null;
  status: RecordingStatus;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppData {
  purchases: PurchaseRecord[];
  userSettings: Record<string, UserSettings>;
  recordings: RecordingRecord[];
}

export interface DiscordGuild {
  id: string;
  name: string;
}

export interface DiscordVoiceChannel {
  id: string;
  name: string;
  guildId: string;
  guildName: string;
}
