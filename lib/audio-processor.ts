import { promises as fs } from "node:fs";
import path from "node:path";

import ffmpeg from "fluent-ffmpeg";
import ffmpegBinary from "ffmpeg-static";

import { getRecordingsDirectory } from "@/lib/storage";

if (ffmpegBinary) {
  ffmpeg.setFfmpegPath(ffmpegBinary);
}

export async function saveAudioBuffer(
  data: Buffer,
  extension: string,
): Promise<string> {
  const dir = await getRecordingsDirectory();
  const safeExt = extension.startsWith(".") ? extension : `.${extension}`;
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${safeExt}`;
  const destination = path.join(dir, filename);

  await fs.writeFile(destination, data);
  return destination;
}

export async function downloadRemoteAudio(
  sourceUrl: string,
  extension = ".mp3",
): Promise<string> {
  const response = await fetch(sourceUrl);

  if (!response.ok) {
    throw new Error(`Failed to download audio (${response.status})`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return saveAudioBuffer(Buffer.from(arrayBuffer), extension);
}

export async function normalizeAudioForWhisper(
  sourcePath: string,
): Promise<string> {
  const dir = await getRecordingsDirectory();
  const outputPath = path.join(
    dir,
    `${path.basename(sourcePath, path.extname(sourcePath))}.whisper.wav`,
  );

  return new Promise<string>((resolve, reject) => {
    ffmpeg(sourcePath)
      .audioCodec("pcm_s16le")
      .audioChannels(1)
      .audioFrequency(16000)
      .format("wav")
      .on("error", (error) => reject(error))
      .on("end", () => resolve(outputPath))
      .save(outputPath);
  });
}

export async function getAudioDurationSeconds(
  filePath: string,
): Promise<number | null> {
  return new Promise<number | null>((resolve) => {
    ffmpeg.ffprobe(filePath, (error, metadata) => {
      if (error) {
        resolve(null);
        return;
      }

      const duration = metadata.format?.duration;
      resolve(typeof duration === "number" ? duration : null);
    });
  });
}
