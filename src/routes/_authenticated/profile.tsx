import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  component: Profile,
});

function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const u = userData.user;
      if (!u) return;
      setEmail(u.email ?? "");
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", u.id)
        .maybeSingle();
      setDisplayName(profile?.display_name ?? "");
      setLoading(false);
    })();
  }, []);

  async function handleSave() {
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim().slice(0, 60) })
      .eq("id", uid);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
  }

  if (loading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <p className="text-sm text-muted-foreground uppercase tracking-widest">Profile</p>
        <h1 className="font-display text-4xl font-bold mt-1">Your account</h1>
      </div>

      <GlassCard className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[image:var(--gradient-primary)] grid place-items-center font-display text-2xl font-bold text-primary-foreground">
            {(displayName || email || "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-display text-xl font-semibold truncate">
              {displayName || "Unnamed listener"}
            </div>
            <div className="text-sm text-muted-foreground truncate">{email}</div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dn">Display name</Label>
          <Input
            id="dn"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={60}
          />
        </div>

        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={email} disabled />
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-[image:var(--gradient-primary)] text-primary-foreground hover:opacity-95 hover:shadow-[var(--shadow-glow)]"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save changes"}
        </Button>
      </GlassCard>
    </div>
  );
}
