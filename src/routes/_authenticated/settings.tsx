import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  component: Settings,
});

function Settings() {
  const navigate = useNavigate();
  const [clearing, setClearing] = useState(false);

  async function clearHistory() {
    setClearing(true);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;
    const { error } = await supabase.from("predictions").delete().eq("user_id", uid);
    setClearing(false);
    if (error) return toast.error(error.message);
    toast.success("History cleared");
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <p className="text-sm text-muted-foreground uppercase tracking-widest">Settings</p>
        <h1 className="font-display text-4xl font-bold mt-1">Preferences</h1>
      </div>

      <GlassCard>
        <h2 className="font-display text-lg font-semibold mb-1">Prediction backend</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Sonogram is currently using a built-in demo classifier. Connect your own hosted FastAPI +
          scikit-learn / librosa service to power real predictions.
        </p>
        <div className="glass rounded-xl p-4 text-sm text-muted-foreground font-mono">
          Endpoint: <span className="text-foreground">demo (local)</span>
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="font-display text-lg font-semibold mb-1">Account</h2>
        <p className="text-sm text-muted-foreground mb-4">Sign out on this device.</p>
        <Button variant="outline" onClick={handleSignOut} className="glass">
          Sign out
        </Button>
      </GlassCard>

      <GlassCard className="border-destructive/30">
        <h2 className="font-display text-lg font-semibold mb-1 text-destructive">Danger zone</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Permanently delete every prediction from your history. This can't be undone.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={clearing}>
              {clearing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Clear all history
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="glass-strong">
            <AlertDialogHeader>
              <AlertDialogTitle>Clear all predictions?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete every prediction you've saved.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={clearHistory}>Yes, clear</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </GlassCard>
    </div>
  );
}
