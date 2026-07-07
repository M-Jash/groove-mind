import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/history")({
  component: History,
});

interface Row {
  id: string;
  file_name: string;
  top_genre: string;
  confidence: number;
  created_at: string;
  duration_seconds: number | null;
}

function History() {
  const [rows, setRows] = useState<Row[] | null>(null);

  async function load() {
    const { data, error } = await supabase
      .from("predictions")
      .select("id, file_name, top_genre, confidence, created_at, duration_seconds")
      .order("created_at", { ascending: false });
    if (error) return toast.error(error.message);
    setRows(data ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleDelete(id: string) {
    const { error } = await supabase.from("predictions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    setRows((r) => r?.filter((x) => x.id !== id) ?? null);
  }

  if (!rows) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground uppercase tracking-widest">History</p>
        <h1 className="font-display text-4xl font-bold mt-1">Your predictions</h1>
      </div>

      {rows.length === 0 ? (
        <GlassCard className="text-center py-16">
          <p className="text-muted-foreground mb-4">You haven't classified anything yet.</p>
          <Button
            asChild
            className="bg-[image:var(--gradient-primary)] text-primary-foreground hover:opacity-95"
          >
            <Link to="/upload">
              <Upload className="w-4 h-4 mr-2" /> Upload a track
            </Link>
          </Button>
        </GlassCard>
      ) : (
        <GlassCard className="p-0 overflow-hidden">
          <div className="divide-y divide-white/5">
            {rows.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 p-4 hover:bg-white/5 transition-colors"
              >
                <Link
                  to="/results/$id"
                  params={{ id: r.id }}
                  className="flex-1 min-w-0 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{r.file_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}
                      {r.duration_seconds ? ` · ${r.duration_seconds.toFixed(1)}s` : ""}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-display font-semibold">{r.top_genre}</div>
                    <div className="text-xs text-muted-foreground">
                      {(r.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(r.id)}
                  aria-label="Delete"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
