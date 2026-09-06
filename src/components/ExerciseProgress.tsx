import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { exerciseHistoryQuery } from "@/lib/workout-queries";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  exerciseId: string | null;
  exerciseName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

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

export function ExerciseProgress({
  exerciseId,
  exerciseName,
  open,
  onOpenChange,
}: Props) {
  const { data = [], isLoading } = useQuery({
    ...exerciseHistoryQuery(exerciseId ?? ""),
    enabled: open && !!exerciseId,
  });

  const chartData = data.map((p) => ({
    ...p,
    label: format(parseISO(p.date), "MMM d"),
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{exerciseName} — progress over time</DialogTitle>
        </DialogHeader>

        {isLoading && (
          <p className="text-sm text-muted-foreground">Loading history…</p>
        )}

        {!isLoading && data.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No logged sets yet. Add this exercise to a workout and record some
            sets to see your progress here.
          </p>
        )}

        {data.length > 0 && (
          <div className="space-y-6">
            <section>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                Total volume per session (reps × weight)
              </h3>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ left: 0, right: 8, top: 4 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={AXIS_TICK} />
                    <YAxis tick={AXIS_TICK} width={48} />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      labelFormatter={(_, payload) =>
                        payload?.[0] ? formatDate(payload[0].payload.date) : ""
                      }
                      formatter={(value) => [value, "Volume"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="volume"
                      stroke="var(--primary)"
                      fill="var(--primary)"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            <div className="grid gap-6 sm:grid-cols-2">
              <section>
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                  Heaviest weight lifted
                </h3>
                <div className="h-36 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ left: 0, right: 8, top: 4 }}>
                      <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                      <XAxis dataKey="label" tick={AXIS_TICK} />
                      <YAxis tick={AXIS_TICK} width={40} />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        labelFormatter={(_, payload) =>
                          payload?.[0] ? formatDate(payload[0].payload.date) : ""
                        }
                        formatter={(value) => [value, "Top weight"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="topWeight"
                        stroke="var(--accent-foreground)"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "var(--accent-foreground)" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section>
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                  Total reps per session
                </h3>
                <div className="h-36 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ left: 0, right: 8, top: 4 }}>
                      <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                      <XAxis dataKey="label" tick={AXIS_TICK} />
                      <YAxis tick={AXIS_TICK} width={40} />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        labelFormatter={(_, payload) =>
                          payload?.[0] ? formatDate(payload[0].payload.date) : ""
                        }
                        formatter={(value) => [value, "Total reps"]}
                      />
                      <Bar
                        dataKey="totalReps"
                        fill="var(--accent)"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </div>

            <section>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                Sessions
              </h3>
              <ul className="max-h-40 space-y-1 overflow-y-auto text-sm">
                {[...data].reverse().map((p) => (
                  <li
                    key={`${p.date}-${p.workoutTitle}`}
                    className="flex items-baseline justify-between gap-3 rounded-lg bg-muted/50 px-3 py-1.5"
                  >
                    <span className="font-medium">{formatDate(p.date)}</span>
                    <span className="text-muted-foreground">
                      {p.sets} sets · {p.totalReps} reps · top {p.topWeight} · vol{" "}
                      {p.volume}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
