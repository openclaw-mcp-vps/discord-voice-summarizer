import {
  ChannelType,
  Client,
  Events,
  GatewayIntentBits,
  type VoiceState,
} from "discord.js";

interface VoiceSession {
  channelId: string;
  guildId: string;
  startedAt: string;
  speakers: Set<string>;
}

interface MonitoringOptions {
  monitoredChannelIds: string[];
  onSessionStarted?: (payload: {
    guildId: string;
    channelId: string;
    startedAt: string;
  }) => Promise<void> | void;
  onSessionEnded?: (payload: {
    guildId: string;
    channelId: string;
    startedAt: string;
    endedAt: string;
    speakers: string[];
  }) => Promise<void> | void;
}

export function createDiscordMonitoringBot(options: MonitoringOptions): Client {
  const sessions = new Map<string, VoiceSession>();

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMembers,
    ],
  });

  const monitored = new Set(options.monitoredChannelIds);

  async function handleStateUpdate(
    oldState: VoiceState,
    newState: VoiceState,
  ): Promise<void> {
    const beforeChannelId = oldState.channelId;
    const afterChannelId = newState.channelId;

    if (!beforeChannelId && !afterChannelId) {
      return;
    }

    const relevantChannelIds = [beforeChannelId, afterChannelId].filter(
      Boolean,
    ) as string[];

    for (const channelId of relevantChannelIds) {
      if (!monitored.has(channelId)) {
        continue;
      }

      const guildId = newState.guild.id || oldState.guild.id;
      const key = `${guildId}:${channelId}`;
      const channel =
        newState.guild.channels.cache.get(channelId) ||
        oldState.guild.channels.cache.get(channelId);

      if (!channel || channel.type !== ChannelType.GuildVoice) {
        continue;
      }

      const memberCount = channel.members.filter((member) => !member.user.bot).size;

      const existing = sessions.get(key);
      if (memberCount > 0 && !existing) {
        const startedAt = new Date().toISOString();
        sessions.set(key, {
          guildId,
          channelId,
          startedAt,
          speakers: new Set(),
        });

        await options.onSessionStarted?.({ guildId, channelId, startedAt });
      }

      const active = sessions.get(key);
      if (!active) {
        continue;
      }

      if (newState.member && !newState.member.user.bot) {
        active.speakers.add(newState.member.user.username);
      }

      if (oldState.member && !oldState.member.user.bot) {
        active.speakers.add(oldState.member.user.username);
      }

      if (memberCount === 0) {
        sessions.delete(key);
        await options.onSessionEnded?.({
          guildId,
          channelId,
          startedAt: active.startedAt,
          endedAt: new Date().toISOString(),
          speakers: [...active.speakers],
        });
      }
    }
  }

  client.on(Events.ClientReady, () => {
    const monitoredList = [...monitored].join(", ");
    // eslint-disable-next-line no-console
    console.log(`Discord monitor bot online. Watching channels: ${monitoredList}`);
  });

  client.on(Events.VoiceStateUpdate, (oldState, newState) => {
    void handleStateUpdate(oldState, newState);
  });

  return client;
}

export async function startDiscordMonitoringBot(
  monitoredChannelIds: string[],
): Promise<Client> {
  const token = process.env.DISCORD_BOT_TOKEN;

  if (!token) {
    throw new Error("DISCORD_BOT_TOKEN is not configured");
  }

  const webhookUrl = process.env.DISCORD_RECORDING_WEBHOOK_URL;

  const bot = createDiscordMonitoringBot({
    monitoredChannelIds,
    onSessionEnded: async (payload) => {
      if (!webhookUrl) {
        return;
      }

      await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "voice.session.ended",
          ...payload,
        }),
      });
    },
  });

  await bot.login(token);
  return bot;
}
