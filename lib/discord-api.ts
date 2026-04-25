import type { DiscordGuild, DiscordVoiceChannel } from "@/lib/types";

const DISCORD_API_BASE = "https://discord.com/api/v10";

interface DiscordChannelResponse {
  id: string;
  guild_id?: string;
  name: string;
  type: number;
}

interface DiscordGuildResponse {
  id: string;
  name: string;
}

const VOICE_CHANNEL_TYPES = new Set([2, 13]);

async function discordApiRequest<T>(
  url: string,
  token: string,
  botToken = false,
): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Authorization: botToken ? `Bot ${token}` : `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Discord API request failed (${response.status})`);
  }

  return (await response.json()) as T;
}

export async function fetchUserGuilds(
  userAccessToken: string,
): Promise<DiscordGuild[]> {
  const guilds = await discordApiRequest<DiscordGuildResponse[]>(
    `${DISCORD_API_BASE}/users/@me/guilds`,
    userAccessToken,
  );

  return guilds.map((guild) => ({ id: guild.id, name: guild.name }));
}

async function fetchGuildVoiceChannels(
  guild: DiscordGuild,
  userAccessToken: string,
): Promise<DiscordVoiceChannel[]> {
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (botToken) {
    try {
      const channels = await discordApiRequest<DiscordChannelResponse[]>(
        `${DISCORD_API_BASE}/guilds/${guild.id}/channels`,
        botToken,
        true,
      );

      return channels
        .filter((channel) => VOICE_CHANNEL_TYPES.has(channel.type))
        .map((channel) => ({
          id: channel.id,
          name: channel.name,
          guildId: guild.id,
          guildName: guild.name,
        }));
    } catch {
      // If bot token path fails, try user token fallback.
    }
  }

  const channels = await discordApiRequest<DiscordChannelResponse[]>(
    `${DISCORD_API_BASE}/guilds/${guild.id}/channels`,
    userAccessToken,
  );

  return channels
    .filter((channel) => VOICE_CHANNEL_TYPES.has(channel.type))
    .map((channel) => ({
      id: channel.id,
      name: channel.name,
      guildId: guild.id,
      guildName: guild.name,
    }));
}

export async function fetchVoiceChannelsForUser(
  userAccessToken: string,
): Promise<DiscordVoiceChannel[]> {
  const guilds = await fetchUserGuilds(userAccessToken);
  const results = await Promise.all(
    guilds.map((guild) => fetchGuildVoiceChannels(guild, userAccessToken)),
  );

  return results.flat();
}
