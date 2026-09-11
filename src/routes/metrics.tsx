import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/AppShell";
import { metricsQuery } from "@/lib/workout-queries";

export const Route = createFileRoute("/metrics")({
  head: () => ({
    meta: [
      { title: "Metrics — Lift Log" },
      { name: "description", content: "Collective exercise metrics over time." },
      { property: "og:title", content: "Metrics — Lift Log" },
      { property: "og:description", content: "Collective exercise metrics over time." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MetricsPage,
});

const AXIS_TICK = { fontSize: 12, fill: "var(--muted-foreground)" };
const TOOLTIP_STYLE = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "0.75rem",
  color: "var(--popover-foreground)",
  fontSize: 12,
};

function formatDate(iso: string) {
  return format(parseISO(iso), "MMM d, yyyy");
}

function buildChartData(
  series: { exerciseName: string; data: { date: string; volume: number }[] }[],
) {
  const byDate = new Map<string, Record<string, number>>();
  for (const s of series) {
    for (const d of s.data) {
      const row = byDate.get(d.date) ?? {};
      row[s.exerciseName] = d.volume;
      byDate.set(d.date, row);
    }
  }
  return [...byDate.entries()]
    .map(([date, values]) => ({ date, label: format(parseISO(date), "MMM d"), ...values }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function MetricsPage() {
  const { data = [], isLoading } = useQuery(metricsQuery);

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-2xl font-semibold">Metrics</h1>
          <p className="text-sm text-muted-foreground">
            Volume (reps × weight) over time for every exercise, grouped by muscle group.
          </p>
        </div>

        {isLoading && <p className="text-sm text-muted-foreground">Loading metrics…</p>}

        {!isLoading && data.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No logged sets yet. Complete a workout and record sets to see group metrics here.
          </p>
        )}

        {data.map(({ group, series }) => {
        const chartData = buildChartData(series);
        return (
          <section
            key={group}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <h2 className="mb-4 font-display text-lg font-semibold">{group}</h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ left: 0, right: 16, top: 8, bottom: 8 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={AXIS_TICK} />
                  <YAxis tick={AXIS_TICK} width={56} />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    labelFormatter={(_, payload) =>
                      payload?.[0] ? formatDate(payload[0].payload.date) : ""
                    }
                  />
                  <Legend wrapperStyle={{ paddingTop: 8 }} />
                  {series.map((s) => (
                    <Line
                      key={s.exerciseId}
                      type="monotone"
                      dataKey={s.exerciseName}
                      stroke={s.color}
                      strokeWidth={2}
                      dot={{ r: 3, fill: s.color }}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        );
      })}
    </div>
  );
}
