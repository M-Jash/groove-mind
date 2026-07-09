import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { Home, Upload, History, User, Settings, LogOut, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/upload", label: "Upload", icon: Upload },
  { to: "/history", label: "History", icon: History },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }

  const Logo = (
    <>
      <div className="w-9 h-9 rounded-full bg-foreground grid place-items-center">
        <div className="w-2.5 h-2.5 rounded-full bg-background" />
      </div>
      <div>
        <div className="font-display font-bold text-lg leading-tight">
          check<span className="italic font-light">vibe</span>
        </div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
          AI Genre Lab
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex">
      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 glass-strong flex items-center justify-between px-4 h-14">
        <Link to="/dashboard" className="flex items-center gap-2">{Logo}</Link>
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-9 h-9 rounded-lg glass grid place-items-center"
          aria-label="Toggle menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 h-screen w-64 z-50 glass-strong flex flex-col p-5 transition-transform duration-300",
          "lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Link to="/dashboard" className="flex items-center gap-3 mb-8">{Logo}</Link>

        <nav className="flex-1 space-y-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                "text-muted-foreground hover:text-foreground hover:bg-foreground/5",
                "data-[status=active]:text-background data-[status=active]:bg-foreground",
              )}
              activeOptions={{ exact: to === "/dashboard" }}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>

        <Button
          variant="ghost"
          onClick={handleSignOut}
          className="justify-start gap-3 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </Button>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <main className="flex-1 min-w-0 pt-14 lg:pt-0">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
