"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { RecordingRecord } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface RecordingsListProps {
  enabled: boolean;
  onSelect: (recording: RecordingRecord | null) => void;
}

function statusVariant(status: RecordingRecord["status"]): "muted" | "success" | "warning" | "danger" {
  if (status === "completed") return "success";
  if (status === "failed") return "danger";
  if (status === "processing") return "warning";
  return "muted";
}

export function RecordingsList({
  enabled,
  onSelect,
}: RecordingsListProps) {
  const [recordings, setRecordings] = useState<RecordingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const loadRecordings = useCallback(async () => {
    if (!enabled) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/recordings", { method: "GET" });
      const payload = (await response.json()) as {
        recordings?: RecordingRecord[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Failed to load recordings");
      }

      setRecordings(payload.recordings ?? []);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Failed to load recordings");
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void loadRecordings();
  }, [loadRecordings]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const intervalId = setInterval(() => {
      void loadRecordings();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [enabled, loadRecordings]);

  const completedCount = useMemo(
    () => recordings.filter((recording) => recording.status === "completed").length,
    [recordings],
  );

  async function uploadRecording(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!file) {
      setError("Choose an audio file to upload.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title.trim() || `Voice Meeting ${new Date().toLocaleString()}`);

      const response = await fetch("/api/recordings", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as {
        recording?: RecordingRecord;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Upload failed");
      }

      setTitle("");
      setFile(null);
      if (payload.recording) {
        setRecordings((previous) => [payload.recording as RecordingRecord, ...previous]);
      }
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function processRecording(recordingId: string): Promise<void> {
    setProcessingId(recordingId);
    setError("");

    try {
      const response = await fetch("/api/recordings/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recordingId }),
      });

      const payload = (await response.json()) as {
        recording?: RecordingRecord;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Processing failed");
      }

      if (payload.recording) {
        setRecordings((previous) =>
          previous.map((recording) =>
            recording.id === recordingId
              ? (payload.recording as RecordingRecord)
              : recording,
          ),
        );

        onSelect(payload.recording ?? null);
      }
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Processing failed");
    } finally {
      setProcessingId(null);
      void loadRecordings();
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recordings</CardTitle>
        <CardDescription>
          Upload voice call audio or ingest it from your Discord webhook. Completed:
          {" "}
          {completedCount}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {!enabled ? (
          <p className="text-sm text-slate-400">
            Unlock access to upload and process recordings.
          </p>
        ) : (
          <form className="grid gap-3 rounded-lg border border-slate-800 p-4" onSubmit={uploadRecording}>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Meeting title (ex: Sprint Planning Apr 25)"
              maxLength={120}
            />
            <input
              type="file"
              accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg"
              onChange={(event) => {
                const nextFile = event.target.files?.[0] ?? null;
                setFile(nextFile);
              }}
              className="text-sm text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-cyan-500 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-950 hover:file:bg-cyan-400"
            />
            <Button type="submit" disabled={uploading}>
              {uploading ? "Uploading..." : "Upload Recording"}
            </Button>
          </form>
        )}

        <div className="space-y-3">
          {loading ? <p className="text-sm text-slate-400">Loading recordings...</p> : null}

          {recordings.length === 0 && !loading ? (
            <p className="text-sm text-slate-400">No recordings yet.</p>
          ) : null}

          {recordings.map((recording) => (
            <div
              key={recording.id}
              className="rounded-lg border border-slate-800 bg-slate-950/60 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-100">{recording.title}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(recording.createdAt).toLocaleString()} · {recording.durationSec
                      ? `${Math.round(recording.durationSec)}s`
                      : "duration pending"}
                  </p>
                </div>
                <Badge variant={statusVariant(recording.status)}>
                  {recording.status}
                </Badge>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onSelect(recording)}
                  disabled={recording.status !== "completed"}
                >
                  View Summary
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => void processRecording(recording.id)}
                  disabled={
                    processingId === recording.id ||
                    recording.status === "processing" ||
                    !enabled
                  }
                >
                  {processingId === recording.id || recording.status === "processing"
                    ? "Processing..."
                    : "Generate Notes"}
                </Button>
              </div>

              {recording.error ? (
                <p className="mt-2 text-xs text-rose-300">{recording.error}</p>
              ) : null}
            </div>
          ))}
        </div>

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
