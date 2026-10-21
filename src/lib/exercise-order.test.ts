import { describe, expect, it } from "vitest";
import { nextExercisePosition, reorderExercises } from "./exercise-order";

const entries = [
  { id: "curl", position: 0, reps: 8, weight: 20 },
  { id: "press", position: 1, reps: 10, weight: 30 },
  { id: "row", position: 4, reps: 12, weight: 25 },
];

describe("workout exercise order", () => {
  it("moves an exercise down and saves contiguous positions", () => {
    const result = reorderExercises(entries, "curl", "row");
    expect(result.map((entry) => [entry.id, entry.position])).toEqual([
      ["press", 0], ["row", 1], ["curl", 2],
    ]);
  });
  it("moves an exercise up without changing its logged reps or weight", () => {
    expect(reorderExercises(entries, "row", "curl")).toEqual([
      { id: "row", position: 0, reps: 12, weight: 25 },
      { id: "curl", position: 1, reps: 8, weight: 20 },
      { id: "press", position: 2, reps: 10, weight: 30 },
    ]);
    expect(entries[2].position).toBe(4);
  });
  it("ignores canceled, missing or unchanged destinations", () => {
    expect(reorderExercises(entries, "curl", "missing")).toBe(entries);
    expect(reorderExercises(entries, "missing", "row")).toBe(entries);
    expect(reorderExercises(entries, "curl", "curl")).toBe(entries);
  });
  it("appends new exercises after existing positions even after removals", () => {
    expect(nextExercisePosition(entries)).toBe(5);
    expect(nextExercisePosition([])).toBe(0);
  });
});