import { NextResponse } from "next/server";
import { z } from "zod";

import { getServerAuthSession } from "@/lib/auth";
import { fetchVoiceChannelsForUser } from "@/lib/discord-api";
import {
  getUserSelectedChannels,
  saveUserSelectedChannels,
} from "@/lib/storage";

export const runtime = "nodejs";

const selectedChannelsSchema = z.object({
  channels: z.array(
    z.object({
      guildId: z.string().min(1),
      guildName: z.string().min(1),
      channelId: z.string().min(1),
      channelName: z.string().min(1),
    }),
  ),
});

export async function GET(): Promise<NextResponse> {
  const session = await getServerAuthSession();

  if (!session?.user?.id || !session.discordAccessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [channels, selected] = await Promise.all([
      fetchVoiceChannelsForUser(session.discordAccessToken),
      getUserSelectedChannels(session.user.id),
    ]);

    return NextResponse.json({
      channels,
      selectedChannelIds: selected.map((channel) => channel.channelId),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch Discord channels",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = selectedChannelsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid channel payload",
      },
      { status: 400 },
    );
  }

  await saveUserSelectedChannels(session.user.id, parsed.data.channels);

  return NextResponse.json({ ok: true, saved: parsed.data.channels.length });
}
