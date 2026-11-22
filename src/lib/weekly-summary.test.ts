import { describe, expect, it } from "vitest";
import { formatWeeklySummary } from "@/lib/weekly-summary";

const week = new Date(2026, 10, 15);
const text = formatWeeklySummary(week, [
  { date: "2026-11-19", title: "Legs", exercises: [{ name: "Dumbbell Side Bend", position: 0, sets: [{ set_number: 1, reps: 12, weight: 0 }] }] },
  { date: "2026-11-16", title: "Push", exercises: [{ name: "Flat Dumbbell Flyes", position: 0, sets: [{ set_number: 1, reps: 10, weight: 25 }, { set_number: 2, reps: 8, weight: 30 }] }] },
]);

describe("weekly coach summary", () => {
  it("totals workouts, sets and volume", () => {
    expect(text).toContain("Total Workouts: 2 | Total Sets: 3 | Total Volume: 490 lbs");
  });
  it("lists workouts oldest first", () => {
    expect(text.indexOf("Push")).toBeLessThan(text.indexOf("Legs"));
  });
  it("formats weightless sets as bodyweight", () => {
    expect(text).toContain("Set 1: Bodyweight x 12 reps");
  });
});
