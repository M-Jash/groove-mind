import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Mic, MonitorSpeaker, Play, Square, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { GENRES, mockPredict, type Genre } from "@/lib/genres";

export const Route = createFileRoute("/_authenticated/live")({
  component: LivePage,
});

type Source = "mic" | "system";

function LivePage() {
  const [source, setSource] = useState<Source>("mic");
  const [running, setRunning] = useState(false);
  const [level, setLevel] = useState(0);
  const [freqBars, setFreqBars] = useState<number[]>(new Array(64).fill(0));
  const [prediction, setPrediction] = useState<{
    top: Genre;
    confidence: number;
    all: Record<Genre, number>;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [trackTitle, setTrackTitle] = useState("");
  const [movieName, setMovieName] = useState("");


  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastPredictRef = useRef<number>(0);

  function stop() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
    setRunning(false);
    setLevel(0);
  }

  useEffect(() => () => stop(), []);

  async function start() {
    try {
      let stream: MediaStream;
      if (source === "mic") {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        });
      } else {
        // System audio via display capture. User must tick "Share audio" in the picker.
        const display = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        const audioTracks = display.getAudioTracks();
        if (audioTracks.length === 0) {
          display.getTracks().forEach((t) => t.stop());
          toast.error(
            "No system audio. When sharing, pick a Chrome tab or your whole screen and enable 'Share audio'.",
          );
          return;
        }
        // Drop the video track — we only want audio
        display.getVideoTracks().forEach((t) => t.stop());
        stream = new MediaStream(audioTracks);
      }
      streamRef.current = stream;

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.75;
      src.connect(analyser);
      analyserRef.current = analyser;

      const freqData = new Uint8Array(analyser.frequencyBinCount);
      const timeData = new Uint8Array(analyser.fftSize);
      startTimeRef.current = performance.now();
      lastPredictRef.current = 0;
      setRunning(true);

      const tick = () => {
        if (!analyserRef.current) return;
        analyser.getByteFrequencyData(freqData);
        analyser.getByteTimeDomainData(timeData);

        // RMS for level meter
        let sumSq = 0;
        for (let i = 0; i < timeData.length; i++) {
          const v = (timeData[i] - 128) / 128;
          sumSq += v * v;
        }
        const rms = Math.sqrt(sumSq / timeData.length);
        setLevel(rms);

        // Downsample frequency bins to 64 bars
        const bars: number[] = [];
        const step = Math.floor(freqData.length / 64);
        for (let i = 0; i < 64; i++) {
          let s = 0;
          for (let j = 0; j < step; j++) s += freqData[i * step + j];
          bars.push(s / step / 255);
        }
        setFreqBars(bars);

        const now = performance.now();
        setElapsed(Math.floor((now - startTimeRef.current) / 1000));

        // Update prediction every ~1.2s using audio features as a deterministic seed
        if (now - lastPredictRef.current > 1200 && rms > 0.005) {
          lastPredictRef.current = now;
          const spectralCentroid = bars.reduce((a, v, i) => a + v * i, 0) / (bars.reduce((a, v) => a + v, 0) || 1);
          const seed = `${source}-${bars.slice(0, 8).map((b) => b.toFixed(2)).join(",")}-${spectralCentroid.toFixed(2)}-${Math.floor(now / 4000)}`;
          setPrediction(mockPredict(seed));
        }

        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not start capture";
      toast.error(msg);
      stop();
    }
  }

  async function saveSnapshot() {
    if (!prediction) return;
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Not signed in");
      const parts = [
        trackTitle.trim() || `Live · ${source === "mic" ? "microphone" : "system audio"}`,
        movieName.trim() && `from “${movieName.trim()}”`,
        new Date().toLocaleString(),
      ].filter(Boolean);
      const label = parts.join(" · ");

      const { error } = await supabase.from("predictions").insert({
        user_id: uid,
        file_name: label,
        file_size: 0,
        duration_seconds: elapsed,
        top_genre: prediction.top,
        confidence: prediction.confidence,
        all_scores: prediction.all,
        waveform_peaks: freqBars,
      });
      if (error) throw error;
      toast.success("Saved to history");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not save";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  const sorted = prediction
    ? (Object.entries(prediction.all) as [Genre, number][]).sort((a, b) => b[1] - a[1])
    : [];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground uppercase tracking-widest">Live</p>
        <h1 className="font-display text-4xl font-bold mt-1">Real-time genre detection</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
          Listen through your microphone or capture what's playing on your laptop, and CheckVibe
          keeps predicting as the audio flows.
        </p>
      </div>

      <GlassCard>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => !running && setSource("mic")}
              disabled={running}
              className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                source === "mic"
                  ? "bg-foreground text-background border-foreground"
                  : "bg-transparent border-foreground/15 hover:bg-foreground/5"
              } disabled:opacity-60`}
            >
              <Mic className="w-4 h-4 inline mr-2" />
              Microphone
            </button>
            <button
              type="button"
              onClick={() => !running && setSource("system")}
              disabled={running}
              className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                source === "system"
                  ? "bg-foreground text-background border-foreground"
                  : "bg-transparent border-foreground/15 hover:bg-foreground/5"
              } disabled:opacity-60`}
            >
              <MonitorSpeaker className="w-4 h-4 inline mr-2" />
              System audio
            </button>
          </div>

          <div className="flex gap-2">
            {!running ? (
              <Button
                onClick={start}
                className="bg-foreground text-background hover:bg-foreground/90 h-11 px-5"
              >
                <Play className="w-4 h-4 mr-2" /> Start listening
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={stop}
                className="h-11 px-5"
              >
                <Square className="w-4 h-4 mr-2" /> Stop
              </Button>
            )}
          </div>
        </div>

        {source === "system" && !running && (
          <p className="text-xs text-muted-foreground mt-4">
            Tip: your browser will show a share picker — pick the tab or whole screen playing music
            and enable "Share tab audio" / "Share audio" to include sound.
          </p>
        )}
      </GlassCard>

      {/* Visualizer */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold">Live spectrum</h2>
          <div className="text-xs text-muted-foreground tabular-nums">
            {running ? `${Math.floor(elapsed / 60)}:${(elapsed % 60).toString().padStart(2, "0")}` : "—"}
          </div>
        </div>
        <div className="h-40 rounded-xl bg-foreground/5 p-3 flex items-end gap-[2px] overflow-hidden">
          {freqBars.map((v, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-sm bg-foreground/80 transition-[height] duration-75"
              style={{ height: `${Math.max(2, v * 100)}%` }}
            />
          ))}
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-foreground/10 overflow-hidden">
          <div
            className="h-full bg-foreground transition-[width] duration-100"
            style={{ width: `${Math.min(100, level * 250)}%` }}
          />
        </div>
      </GlassCard>

      {/* Prediction */}
      <GlassCard>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Live prediction
            </div>
            <div className="font-display text-5xl font-bold mt-1">
              {prediction?.top ?? "—"}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {prediction ? `${(prediction.confidence * 100).toFixed(1)}% confidence` : "Waiting for audio…"}
            </div>
          </div>
          <Button
            onClick={saveSnapshot}
            disabled={!prediction || saving}
            variant="outline"
            className="shrink-0"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save snapshot
          </Button>
        </div>




        <div className="space-y-2">
          {(prediction ? sorted : GENRES.map((g) => [g, 0] as [Genre, number])).map(([g, score]) => (
            <div key={g}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium">{g}</span>
                <span className="text-muted-foreground tabular-nums">
                  {(score * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-foreground/10 overflow-hidden">
                <div
                  className="h-full bg-foreground rounded-full transition-all duration-300"
                  style={{ width: `${score * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
