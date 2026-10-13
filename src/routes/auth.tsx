import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Dumbbell } from "lucide-react";

import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In — Lift Log" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      {
        name: "description",
        content: "Sign in with Google to open your private workout log and progress charts.",
      },
      { property: "og:title", content: "Sign In — Lift Log" },
      {
        property: "og:description",
        content: "Sign in with Google to open your private workout log.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/" });
  }, [loading, session, navigate]);

  const signIn = async () => {
    setBusy(true);
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError("Sign-in didn't work. Please try again.");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-soft px-5">
      <div className="surface-soft w-full max-w-sm rounded-2xl border border-border p-8 text-center">
        <span className="mx-auto mb-5 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Dumbbell className="size-5" />
        </span>
        <h1 className="font-display text-2xl font-semibold">Lift Log</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your private training journal. Sign in to continue.
        </p>
        <Button className="mt-6 w-full" onClick={signIn} disabled={busy}>
          {busy ? "Opening Google…" : "Continue with Google"}
        </Button>
        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}
