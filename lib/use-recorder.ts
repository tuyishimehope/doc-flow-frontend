"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Recordings stop on their own after this long (the backend takes up to 10 MB). */
export const MAX_RECORDING_SECONDS = 300;

const CANDIDATES: [mime: string, ext: string][] = [
  ["audio/webm", "webm"],
  ["audio/mp4", "m4a"],
  ["audio/ogg", "ogg"],
];

function extensionFor(mime: string) {
  return CANDIDATES.find(([m]) => mime.startsWith(m))?.[1] ?? "webm";
}

export function canRecord() {
  return (
    typeof window !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined"
  );
}

/** Records from the microphone and hands back a file the transcribe endpoint accepts. */
export function useRecorder(onAudio: (file: File) => void) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const recorder = useRef<MediaRecorder | null>(null);
  const discard = useRef(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const onAudioRef = useRef(onAudio);

  useEffect(() => {
    onAudioRef.current = onAudio;
  }, [onAudio]);

  const stop = useCallback(() => {
    if (recorder.current?.state === "recording") recorder.current.stop();
  }, []);

  const cancel = useCallback(() => {
    discard.current = true;
    stop();
  }, [stop]);

  const start = useCallback(async () => {
    const media = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mime = CANDIDATES.map(([m]) => m).find((m) => MediaRecorder.isTypeSupported(m));
    const r = new MediaRecorder(media, mime ? { mimeType: mime } : undefined);
    const chunks: Blob[] = [];
    discard.current = false;
    r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    r.onstop = () => {
      media.getTracks().forEach((t) => t.stop());
      if (timer.current) clearInterval(timer.current);
      setRecording(false);
      recorder.current = null;
      if (discard.current || chunks.length === 0) return;
      const type = r.mimeType || mime || "audio/webm";
      onAudioRef.current(new File(chunks, `recording.${extensionFor(type)}`, { type }));
    };
    recorder.current = r;
    r.start();
    setSeconds(0);
    setRecording(true);
    const startedAt = Date.now();
    timer.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setSeconds(elapsed);
      if (elapsed >= MAX_RECORDING_SECONDS) r.stop();
    }, 250);
  }, []);

  // Leaving the page drops an unfinished recording and frees the microphone.
  useEffect(() => cancel, [cancel]);

  return { recording, seconds, start, stop, cancel };
}
