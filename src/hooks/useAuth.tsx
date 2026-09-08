import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

// After a full-page (mobile) Google sign-in, the broker returns tokens on the
// URL. Consume them once, set the session, then clean the address bar.
function extractTokensFromUrl() {
  if (typeof window === "undefined") return null;
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const query = new URLSearchParams(window.location.search);
  const access_token = hash.get("access_token") ?? query.get("access_token");
  const refresh_token = hash.get("refresh_token") ?? query.get("refresh_token");
  if (!access_token || !refresh_token) return null;
  return { access_token, refresh_token };
}

function hasPendingTokens() {
  return extractTokensFromUrl() !== null;
}

function cleanUrl() {
  const url = new URL(window.location.href);
  ["access_token", "refresh_token", "expires_in", "expires_at", "token_type", "state", "provider_token"].forEach(
    (k) => url.searchParams.delete(k),
  );
  url.hash = "";
  window.history.replaceState({}, "", url.pathname + url.search);
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const pending = hasPendingTokens();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (cancelled) return;
      setSession(next);
      if (!pending || next) setLoading(false);
    });

    (async () => {
      const tokens = extractTokensFromUrl();
      if (tokens) {
        try {
          const { data } = await supabase.auth.setSession(tokens);
          if (!cancelled && data.session) setSession(data.session);
        } catch {
          /* fall through to getSession below */
        }
        cleanUrl();
      }
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      setSession(data.session);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, user: session?.user ?? null, loading };
}
