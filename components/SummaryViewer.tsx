"use client";

import type { RecordingRecord } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface SummaryViewerProps {
  recording: RecordingRecord | null;
}

function renderList(items: string[]) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-400">None captured from this call.</p>;
  }

  return (
    <ul className="list-disc space-y-2 pl-5 text-sm text-slate-200">
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  );
}

export function SummaryViewer({ recording }: SummaryViewerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Meeting Summary</CardTitle>
        <CardDescription>
          AI-generated notes, decisions, and action items from the selected recording.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {!recording ? (
          <p className="text-sm text-slate-400">
            Select a completed recording to view its summary.
          </p>
        ) : recording.status !== "completed" ? (
          <p className="text-sm text-slate-400">
            This recording is not completed yet. Generate notes first.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-slate-100">{recording.title}</p>
                <p className="text-xs text-slate-400">
                  Updated {new Date(recording.updatedAt).toLocaleString()}
                </p>
              </div>
              <Badge variant="success">ready</Badge>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-sm leading-7 text-slate-100">{recording.summary}</p>
            </div>

            <Separator />

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <p className="font-semibold text-slate-100">Action Items</p>
                {renderList(recording.actionItems)}
              </div>

              <div className="space-y-3">
                <p className="font-semibold text-slate-100">Decisions</p>
                {renderList(recording.decisions)}
              </div>

              <div className="space-y-3">
                <p className="font-semibold text-slate-100">Risks</p>
                {renderList(recording.risks)}
              </div>

              <div className="space-y-3">
                <p className="font-semibold text-slate-100">Follow-Ups</p>
                {renderList(recording.followUps)}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="font-semibold text-slate-100">Transcript</p>
              <p className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-sm leading-6 text-slate-300">
                {recording.transcript || "No transcript available."}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
