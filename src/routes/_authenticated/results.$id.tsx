import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { Waveform } from "@/components/Waveform";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Upload, Sparkles } from "lucide-react";
import { GENRE_COLORS, type Genre } from "@/lib/genres";

export const Route = createFileRoute("/_authenticated/results/$id")({
  component: Results,
});

interface Prediction {
  id: string;
  file_name: string;
  file_size: number;
  duration_seconds: number | null;
  top_genre: string;
  confidence: number;
  all_scores: Record<string, number>;
  waveform_peaks: number[] | null;
  created_at: string;
}

function Results() {
  const { id } = useParams({ from: "/_authenticated/results/$id" });
  const [pred, setPred] = useState<Prediction | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("predictions")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error || !data) return setNotFound(true);
      setPred(data as unknown as Prediction);
    })();
  }, [id]);

  if (notFound) {
    return (
      <div className="text-center py-24">
        <p className="text-muted-foreground mb-4">Prediction not found.</p>
        <Button asChild>
          <Link to="/history">Back to history</Link>
        </Button>
      </div>
    );
  }

  if (!pred) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const sorted = Object.entries(pred.all_scores).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link to="/history">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Link>
      </Button>

      <GlassCard className="text-center py-10 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-30 blur-3xl"
          style={{
            background: `radial-gradient(circle at 50% 30%, ${GENRE_COLORS[pred.top_genre as Genre] ?? "oklch(0.7 0.22 305)"} 0%, transparent 60%)`,
          }}
        />
        <div className="relative">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
            Predicted genre
          </div>
          <h1 className="font-display text-6xl sm:text-7xl font-bold gradient-text mb-3">
            {pred.top_genre}
          </h1>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            {(pred.confidence * 100).toFixed(1)}% confidence
          </div>
          <div className="mt-6 text-sm text-muted-foreground truncate max-w-lg mx-auto">
            {pred.file_name}
          </div>
        </div>
      </GlassCard>

      {pred.waveform_peaks && (
        <GlassCard>
          <h2 className="font-display text-lg font-semibold mb-3">Waveform</h2>
          <Waveform peaks={pred.waveform_peaks} height={140} />
        </GlassCard>
      )}

      <GlassCard>
        <h2 className="font-display text-lg font-semibold mb-4">All genre scores</h2>
        <div className="space-y-3">
          {sorted.map(([g, score]) => (
            <div key={g}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">{g}</span>
                <span className="text-muted-foreground">{(score * 100).toFixed(1)}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${score * 100}%`,
                    background: GENRE_COLORS[g as Genre] ?? "var(--primary)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="flex justify-center">
        <Button
          asChild
          className="bg-[image:var(--gradient-primary)] text-primary-foreground hover:opacity-95 hover:shadow-[var(--shadow-glow)]"
        >
          <Link to="/upload">
            <Upload className="w-4 h-4 mr-2" /> Classify another track
          </Link>
        </Button>
      </div>
    </div>
  );
}
