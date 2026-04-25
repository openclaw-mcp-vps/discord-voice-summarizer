import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const paymentLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK;

const faqItems = [
  {
    question: "How does recording work with Discord voice channels?",
    answer:
      "You connect Discord, choose channels, and send call audio through the webhook or upload panel. The app normalizes audio, transcribes speech, and produces shareable meeting notes with action items.",
  },
  {
    question: "What makes this better than manual note-taking?",
    answer:
      "It captures decisions and follow-ups consistently, even when discussions move fast. Teams can review concise summaries instead of replaying long calls.",
  },
  {
    question: "Can I use this for distributed teams across time zones?",
    answer:
      "Yes. Summaries and action lists are generated automatically, so async teammates can catch up from the dashboard without joining every call.",
  },
  {
    question: "What is included in the $15/month plan?",
    answer:
      "Discord channel monitoring, recording processing, Whisper transcription, GPT summaries, and action-item extraction in one shared workspace.",
  },
];

export default function HomePage() {
  return (
    <main className="relative mx-auto w-full max-w-6xl px-6 pb-24 pt-10 sm:px-10">
      <header className="mb-16 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
            discord-productivity
          </p>
          <h1 className="text-xl font-semibold text-slate-100">
            Discord Voice Summarizer
          </h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Open Dashboard
          </Link>
          <a
            href={paymentLink}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ size: "sm" })}
          >
            Buy For $15/mo
          </a>
        </div>
      </header>

      <section className="grid gap-8 pb-20 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Badge>Summarize Discord voice calls with action items</Badge>
          <h2 className="text-4xl font-semibold leading-tight text-slate-100 sm:text-5xl">
            Every voice discussion becomes a clear written plan your team can execute.
          </h2>
          <p className="max-w-2xl text-lg leading-8 text-slate-300">
            Teams lose context after voice calls. Discord Voice Summarizer records calls,
            transcribes with Whisper, and generates concise summaries with decisions,
            owners, and follow-ups automatically.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard" className={buttonVariants({ size: "lg" })}>
              Connect Discord
            </Link>
            <a
              href={paymentLink}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              Start Paid Plan
            </a>
          </div>
        </div>

        <Card className="border-cyan-500/30 bg-gradient-to-b from-cyan-500/10 to-slate-900/80">
          <CardContent className="space-y-4 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
              Why Teams Pay
            </p>
            <div className="space-y-3">
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                <p className="text-sm font-semibold text-slate-100">No Lost Decisions</p>
                <p className="text-xs leading-6 text-slate-300">
                  Meeting outcomes are documented while context is fresh.
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                <p className="text-sm font-semibold text-slate-100">Action-First Notes</p>
                <p className="text-xs leading-6 text-slate-300">
                  Teams get explicit action items, not generic transcripts.
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                <p className="text-sm font-semibold text-slate-100">Async Ready</p>
                <p className="text-xs leading-6 text-slate-300">
                  Remote members catch up in minutes instead of replaying calls.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section id="problem" className="pb-16">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
          The Problem
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            "Key decisions are trapped in voice channels and forgotten by the next sprint.",
            "Action items are assigned verbally but never written down in a shared place.",
            "Async teammates lose hours replaying recordings to understand what changed.",
          ].map((problem) => (
            <Card key={problem}>
              <CardContent className="p-5 text-sm leading-7 text-slate-300">
                {problem}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="solution" className="pb-16">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
          The Solution
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Record",
              description:
                "Monitor Discord voice channels and capture call audio from your team sessions.",
            },
            {
              title: "Transcribe",
              description:
                "Run Whisper transcription tuned for conversational meeting audio.",
            },
            {
              title: "Summarize",
              description:
                "Generate concise summaries, action items, decisions, and follow-ups with GPT.",
            },
          ].map((item) => (
            <Card key={item.title}>
              <CardContent className="p-5">
                <p className="mb-2 text-lg font-semibold text-slate-100">{item.title}</p>
                <p className="text-sm leading-7 text-slate-300">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="pricing" className="pb-16">
        <Card className="border-cyan-500/40 bg-gradient-to-r from-cyan-500/10 via-slate-900 to-slate-900">
          <CardContent className="grid gap-6 p-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
                Pricing
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-100">$15/month</p>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
                Built for Discord communities and remote teams that need accountable
                meeting outcomes. One subscription unlocks channel setup, transcript
                generation, and action-item tracking.
              </p>
            </div>
            <a
              href={paymentLink}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ size: "lg" }), "justify-center")}
            >
              Buy Access
            </a>
          </CardContent>
        </Card>
      </section>

      <section id="faq" className="pb-4">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
          FAQ
        </p>
        <div className="space-y-3">
          {faqItems.map((item) => (
            <Card key={item.question}>
              <CardContent className="space-y-2 p-5">
                <p className="font-semibold text-slate-100">{item.question}</p>
                <p className="text-sm leading-7 text-slate-300">{item.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
