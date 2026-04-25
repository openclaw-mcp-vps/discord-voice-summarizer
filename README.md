# Discord Voice Summarizer

Discord Voice Summarizer is a Next.js 15 App Router application that turns Discord voice discussions into structured meeting notes with action items.

## What It Does

- Authenticates users with Discord OAuth
- Lets each user choose Discord voice channels to monitor
- Accepts audio recordings (manual upload or Discord webhook ingestion)
- Normalizes audio for Whisper-compatible transcription
- Transcribes with OpenAI Whisper
- Summarizes transcripts with GPT into:
  - summary
  - action items
  - decisions
  - risks
  - follow-ups
- Locks the production workflow behind a paid plan using:
  - Stripe hosted checkout link
  - Stripe webhook purchase capture
  - signed cookie access unlock

## Tech Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4
- shadcn-style UI components (local `components/ui/*`)
- NextAuth (Discord provider)
- OpenAI API
- Stripe webhook verification
- JSON file persistence in `data/app-data.json`

## Key Routes

- Landing page: `/`
- Dashboard: `/dashboard`
- Health check: `/api/health`
- NextAuth: `/api/auth/[...nextauth]`
- Discord auth helper: `/api/discord/auth`
- Discord channels: `/api/discord/channels`
- Discord webhook ingest: `/api/discord/webhook`
- Recording upload/list: `/api/recordings`
- Recording processing: `/api/recordings/process`
- Transcribe directly: `/api/transcribe`
- Summarize directly: `/api/summarize`
- Stripe webhook: `/api/stripe/webhook`
- Access unlock: `/api/access/unlock`
- Access status: `/api/access/status`

## Environment Setup

Copy `.env.example` to `.env.local` and configure values.

Required for core flow:

- `NEXT_PUBLIC_STRIPE_PAYMENT_LINK`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `OPENAI_API_KEY`

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Stripe Buy Button Rule

Buy buttons use `process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK` directly as `href` to open Stripe hosted checkout.

## Persistence Notes

This project stores data in `data/app-data.json` to satisfy the no-ORM requirement. For production at scale, switch to a managed SQL store with direct queries.
