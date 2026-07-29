import { Link } from "@tanstack/react-router";
import { Dumbbell } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
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
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-5 py-8">{children}</main>
    </div>
  );
}
