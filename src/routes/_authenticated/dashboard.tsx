import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Upload, Music, TrendingUp, ArrowRight, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

interface Stats {
  total: number;
  top: { genre: string; count: number } | null;
  recent: Array<{ id: string; file_name: string; top_genre: string; confidence: number; created_at: string }>;
  displayName: string;
}

function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return;

      const [{ data: profile }, { data: preds, count }] = await Promise.all([
        supabase.from("profiles").select("display_name").eq("id", uid).maybeSingle(),
        supabase
          .from("predictions")
          .select("id, file_name, top_genre, confidence, created_at", { count: "exact" })
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      const counts: Record<string, number> = {};
      preds?.forEach((p) => (counts[p.top_genre] = (counts[p.top_genre] || 0) + 1));
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

      setStats({
        total: count ?? 0,
        top: top ? { genre: top[0], count: top[1] } : null,
        recent: preds ?? [],
        displayName: profile?.display_name ?? "there",
      });
    })();
  }, []);

  if (!stats) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground uppercase tracking-widest">Welcome back</p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold mt-1">
          Hi, <span className="gradient-text">{stats.displayName}</span>
        </h1>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <GlassCard>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Predictions</span>
            <Music className="w-4 h-4 text-primary" />
          </div>
          <div className="font-display text-4xl font-bold">{stats.total}</div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Top genre</span>
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <div className="font-display text-4xl font-bold">{stats.top?.genre ?? "—"}</div>
        </GlassCard>
        <GlassCard className="bg-foreground border-transparent text-background">
          <div className="text-xs uppercase tracking-widest text-background/70 mb-2">
            Ready to classify?
          </div>
          <div className="flex flex-col gap-2">
            <Link
              to="/upload"
              className="font-display text-2xl font-bold flex items-center gap-2 hover:opacity-80"
            >
              Upload a track <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </GlassCard>
      </div>

      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold">Recent predictions</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/history">View all</Link>
          </Button>
        </div>
        {stats.recent.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Upload className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="mb-4">No predictions yet.</p>
            <Button
              asChild
              className="bg-[image:var(--gradient-primary)] text-primary-foreground hover:opacity-95"
            >
              <Link to="/upload">Upload your first track</Link>
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {stats.recent.map((p) => (
              <Link
                key={p.id}
                to="/results/$id"
                params={{ id: p.id }}
                className="flex items-center justify-between py-3 hover:bg-white/5 -mx-2 px-2 rounded-lg transition-colors"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">{p.file_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(p.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display font-semibold">{p.top_genre}</div>
                  <div className="text-xs text-muted-foreground">
                    {(p.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
