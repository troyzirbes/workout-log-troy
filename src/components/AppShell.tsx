import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Dumbbell, LogOut } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth" });
  }, [loading, session, navigate]);

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-gradient-soft">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-5">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Dumbbell className="size-4" />
            </span>
            <span className="font-display text-lg font-semibold">Lift Log</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link
              to="/"
              activeOptions={{ exact: true }}
              activeProps={{ className: "bg-card/80 font-semibold" }}
              className="rounded-lg px-3 py-1.5 transition-colors hover:bg-card/60"
            >
              Workouts
            </Link>
            <Link
              to="/exercises"
              activeProps={{ className: "bg-card/80 font-semibold" }}
              className="rounded-lg px-3 py-1.5 transition-colors hover:bg-card/60"
            >
              Exercises
            </Link>
            <Link
              to="/metrics"
              activeProps={{ className: "bg-card/80 font-semibold" }}
              className="rounded-lg px-3 py-1.5 transition-colors hover:bg-card/60"
            >
              Metrics
            </Link>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Sign out"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/auth" });
              }}
            >
              <LogOut className="size-4" />
            </Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-5 py-8">{children}</main>
    </div>
  );
}
