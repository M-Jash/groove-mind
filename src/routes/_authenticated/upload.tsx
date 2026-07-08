import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { Waveform } from "@/components/Waveform";
import { Button } from "@/components/ui/button";
import { UploadCloud, Music, Loader2, Sparkles } from "lucide-react";
import { analyzeAudio } from "@/lib/audio";
import { mockPredict } from "@/lib/genres";
import { readAudioMetadata, type TrackMeta } from "@/lib/metadata";
import { toast } from "sonner";


export const Route = createFileRoute("/_authenticated/upload")({
  component: UploadPage,
});

const MAX_SIZE = 20 * 1024 * 1024;
const ACCEPTED = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/wave", "audio/x-wav"];

function UploadPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState<TrackMeta | null>(null);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [duration, setDuration] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [drag, setDrag] = useState(false);


  async function handleFile(f: File) {
    if (!ACCEPTED.includes(f.type) && !/\.(mp3|wav)$/i.test(f.name)) {
      return toast.error("Please upload an MP3 or WAV file");
    }
    if (f.size > MAX_SIZE) return toast.error("File is too large (20 MB max)");
    setFile(f);
    setPeaks([]);
    setAnalyzing(true);
    try {
      const res = await analyzeAudio(f, 220);
      setPeaks(res.peaks);
      setDuration(res.duration);
    } catch {
      toast.error("Could not decode this audio file");
      setFile(null);
    } finally {
      setAnalyzing(false);
    }
  }

  async function handlePredict() {
    if (!file || peaks.length === 0) return;
    setPredicting(true);
    try {
      // Simulate model latency
      await new Promise((r) => setTimeout(r, 900));
      const seed = `${file.name}-${file.size}-${peaks.slice(0, 12).join(",")}`;
      const { top, confidence, all } = mockPredict(seed);
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Not signed in");

      const { data, error } = await supabase
        .from("predictions")
        .insert({
          user_id: uid,
          file_name: file.name,
          file_size: file.size,
          duration_seconds: duration,
          top_genre: top,
          confidence,
          all_scores: all,
          waveform_peaks: peaks,
        })
        .select("id")
        .single();

      if (error) throw error;
      navigate({ to: "/results/$id", params: { id: data.id } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Prediction failed";
      toast.error(msg);
    } finally {
      setPredicting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground uppercase tracking-widest">Upload</p>
        <h1 className="font-display text-4xl font-bold mt-1">Classify a track</h1>
      </div>

      <GlassCard
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files?.[0];
          if (f) void handleFile(f);
        }}
        className={`border-2 border-dashed ${
          drag ? "border-primary shadow-[var(--shadow-glow)]" : "border-white/10"
        } text-center py-14 cursor-pointer transition-all`}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".mp3,.wav,audio/mpeg,audio/wav"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[image:var(--gradient-primary)] grid place-items-center mb-4 animate-float">
          <UploadCloud className="w-7 h-7 text-primary-foreground" />
        </div>
        <div className="font-display text-xl font-semibold mb-1">Drop your track here</div>
        <p className="text-sm text-muted-foreground">MP3 or WAV, up to 20 MB</p>
      </GlassCard>

      {file && (
        <GlassCard>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl glass grid place-items-center">
              <Music className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium truncate">{file.name}</div>
              <div className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
                {duration > 0 && ` · ${duration.toFixed(1)}s`}
              </div>
            </div>
          </div>

          <div className="glass rounded-xl p-4 mb-5">
            {analyzing ? (
              <div className="h-[120px] grid place-items-center text-muted-foreground text-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Decoding audio…
                </div>
              </div>
            ) : (
              <Waveform peaks={peaks} height={120} />
            )}
          </div>

          <Button
            onClick={handlePredict}
            disabled={analyzing || predicting || peaks.length === 0}
            className="w-full h-12 bg-[image:var(--gradient-primary)] text-primary-foreground font-semibold hover:opacity-95 hover:shadow-[var(--shadow-glow-strong)] transition-all"
          >
            {predicting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Predicting…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" /> Predict genre
              </>
            )}
          </Button>
        </GlassCard>
      )}
    </div>
  );
}
