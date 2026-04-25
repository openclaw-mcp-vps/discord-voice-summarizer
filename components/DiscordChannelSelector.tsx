"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { DiscordVoiceChannel } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type LoadState = "idle" | "loading" | "saving" | "error";

interface ChannelsResponse {
  channels: DiscordVoiceChannel[];
  selectedChannelIds: string[];
}

interface DiscordChannelSelectorProps {
  enabled: boolean;
}

export function DiscordChannelSelector({
  enabled,
}: DiscordChannelSelectorProps) {
  const [channels, setChannels] = useState<DiscordVoiceChannel[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [state, setState] = useState<LoadState>("idle");
  const [message, setMessage] = useState<string>("");

  const loadChannels = useCallback(async () => {
    if (!enabled) {
      return;
    }

    setState("loading");
    setMessage("");

    try {
      const response = await fetch("/api/discord/channels", {
        method: "GET",
        credentials: "include",
      });

      const payload = (await response.json()) as ChannelsResponse & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Failed to load channels");
      }

      setChannels(payload.channels);
      setSelectedIds(new Set(payload.selectedChannelIds));
      setState("idle");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Failed to load channels");
    }
  }, [enabled]);

  useEffect(() => {
    void loadChannels();
  }, [loadChannels]);

  const groupedChannels = useMemo(() => {
    const grouped = new Map<string, DiscordVoiceChannel[]>();

    for (const channel of channels) {
      const key = `${channel.guildId}:${channel.guildName}`;
      const current = grouped.get(key) ?? [];
      current.push(channel);
      grouped.set(key, current);
    }

    return [...grouped.entries()].map(([key, voiceChannels]) => {
      const [guildId, ...guildNameParts] = key.split(":");
      return {
        guildId,
        guildName: guildNameParts.join(":"),
        channels: voiceChannels,
      };
    });
  }, [channels]);

  async function saveSelection(): Promise<void> {
    setState("saving");
    setMessage("");

    try {
      const selectedChannels = channels
        .filter((channel) => selectedIds.has(channel.id))
        .map((channel) => ({
          guildId: channel.guildId,
          guildName: channel.guildName,
          channelId: channel.id,
          channelName: channel.name,
        }));

      const response = await fetch("/api/discord/channels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ channels: selectedChannels }),
      });

      const payload = (await response.json()) as { error?: string; saved?: number };
      if (!response.ok) {
        throw new Error(payload.error || "Failed to save channel selection");
      }

      setMessage(`Saved ${payload.saved ?? selectedChannels.length} monitored channels.`);
      setState("idle");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Failed to save channels");
    }
  }

  function toggleChannel(channelId: string): void {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(channelId)) {
        next.delete(channelId);
      } else {
        next.add(channelId);
      }
      return next;
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Discord Voice Channel Monitoring</CardTitle>
        <CardDescription>
          Select the voice channels where your team runs meetings. New recordings in
          these channels are prioritized in your dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!enabled ? (
          <p className="text-sm text-slate-400">
            Unlock access to configure monitored channels.
          </p>
        ) : null}

        {state === "loading" ? (
          <p className="text-sm text-slate-400">Loading Discord channels...</p>
        ) : null}

        {groupedChannels.length === 0 && state !== "loading" ? (
          <p className="text-sm text-slate-400">
            No voice channels found. Make sure your Discord account has access to the
            server and the bot is invited.
          </p>
        ) : null}

        {groupedChannels.map((guild) => (
          <div key={guild.guildId} className="rounded-lg border border-slate-800 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-medium text-slate-100">{guild.guildName}</p>
              <Badge variant="muted">{guild.channels.length} channels</Badge>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {guild.channels.map((channel) => {
                const checked = selectedIds.has(channel.id);
                return (
                  <label
                    key={channel.id}
                    className="flex cursor-pointer items-center gap-3 rounded-md border border-slate-800 bg-slate-950/60 p-3 text-sm hover:border-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleChannel(channel.id)}
                      disabled={!enabled}
                      className="h-4 w-4 accent-cyan-400"
                    />
                    <span className="text-slate-200">#{channel.name}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => void loadChannels()}
            disabled={!enabled || state === "loading" || state === "saving"}
          >
            Refresh Channels
          </Button>
          <Button
            type="button"
            onClick={() => void saveSelection()}
            disabled={!enabled || state === "saving" || state === "loading"}
          >
            {state === "saving" ? "Saving..." : "Save Selection"}
          </Button>
          {message ? <p className="text-sm text-slate-300">{message}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
