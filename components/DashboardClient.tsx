"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Lock, Mic, Sparkles, Wallet } from "lucide-react";

import { DiscordChannelSelector } from "@/components/DiscordChannelSelector";
import { RecordingsList } from "@/components/RecordingsList";
import { SummaryViewer } from "@/components/SummaryViewer";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RecordingRecord } from "@/lib/types";

interface DashboardClientProps {
  user:
    | {
        id: string;
        name?: string | null;
        email?: string | null;
        image?: string | null;
      }
    | null;
  hasAccess: boolean;
  purchaseDetected: boolean;
  paymentLink: string | undefined;
}

export function DashboardClient({
  user,
  hasAccess,
  purchaseDetected,
  paymentLink,
}: DashboardClientProps) {
  const [unlocking, setUnlocking] = useState(false);
  const [unlockMessage, setUnlockMessage] = useState("");
  const [selectedRecording, setSelectedRecording] =
    useState<RecordingRecord | null>(null);

  async function unlockAccess(): Promise<void> {
    setUnlocking(true);
    setUnlockMessage("");

    try {
      const response = await fetch("/api/access/unlock", {
        method: "POST",
      });

      const payload = (await response.json()) as { error?: string; unlocked?: boolean };
      if (!response.ok || !payload.unlocked) {
        throw new Error(payload.error || "Could not unlock access yet");
      }

      setUnlockMessage("Access granted. Loading your workspace...");
      window.location.reload();
    } catch (error) {
      setUnlockMessage(
        error instanceof Error ? error.message : "Could not unlock access yet",
      );
    } finally {
      setUnlocking(false);
    }
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Connect Discord to Continue</CardTitle>
            <CardDescription>
              Sign in with your Discord account to load your server list and manage
              voice meeting summaries.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              className={buttonVariants()}
              href="/api/auth/signin/discord?callbackUrl=/dashboard"
            >
              Sign in with Discord
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const accessBlocked = !hasAccess;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                Welcome back
                <Badge variant={hasAccess ? "success" : "warning"}>
                  {hasAccess ? "active" : "locked"}
                </Badge>
              </CardTitle>
              <CardDescription>
                {user.email || user.name || "Discord user"}
              </CardDescription>
            </div>
            <Link
              className={buttonVariants({ variant: "outline", size: "sm" })}
              href="/api/auth/signout?callbackUrl=/"
            >
              Sign out
            </Link>
          </div>
        </CardHeader>
      </Card>

      {accessBlocked ? (
        <Card className="border-cyan-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-cyan-300" />
              Unlock Meeting Summaries
            </CardTitle>
            <CardDescription>
              Complete checkout and then unlock this dashboard. Access is saved in a
              secure cookie for faster future logins.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-slate-800 p-3">
                <Wallet className="mb-2 h-5 w-5 text-cyan-300" />
                <p className="text-sm font-semibold text-slate-100">1. Purchase</p>
                <p className="text-xs text-slate-400">
                  Open Stripe hosted checkout to activate your workspace.
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 p-3">
                <Mic className="mb-2 h-5 w-5 text-cyan-300" />
                <p className="text-sm font-semibold text-slate-100">2. Return</p>
                <p className="text-xs text-slate-400">
                  Come back to this dashboard after payment completes.
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 p-3">
                <CheckCircle2 className="mb-2 h-5 w-5 text-cyan-300" />
                <p className="text-sm font-semibold text-slate-100">3. Unlock</p>
                <p className="text-xs text-slate-400">
                  Click unlock to verify purchase and enable full features.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={paymentLink}
                className="inline-flex h-10 items-center rounded-md bg-cyan-500 px-4 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
                target="_blank"
                rel="noopener noreferrer"
              >
                Buy Access - $15/mo
              </a>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void unlockAccess()}
                disabled={unlocking}
              >
                {unlocking ? "Checking purchase..." : "I completed checkout"}
              </Button>
              {purchaseDetected ? (
                <Badge variant="success">Purchase detected for your email</Badge>
              ) : (
                <Badge variant="muted">Waiting for Stripe webhook confirmation</Badge>
              )}
            </div>

            {unlockMessage ? (
              <p className="text-sm text-slate-300">{unlockMessage}</p>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-cyan-300" />
              Pro Workspace Enabled
            </CardTitle>
            <CardDescription>
              Upload recordings, transcribe them with Whisper, and generate action
              items automatically.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <DiscordChannelSelector enabled={!accessBlocked} />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <RecordingsList enabled={!accessBlocked} onSelect={setSelectedRecording} />
        <SummaryViewer recording={selectedRecording} />
      </div>
    </div>
  );
}
