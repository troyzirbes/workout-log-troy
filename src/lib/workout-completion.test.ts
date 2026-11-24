import { describe, expect, it } from "vitest";
import { isWorkoutComplete } from "./workout-completion";

describe("workout completion", () => {
  it("marks a workout Done only when every exercise is checked", () => {
    expect(isWorkoutComplete([{ completed: true }, { completed: true }])).toBe(true);
    expect(isWorkoutComplete([{ completed: true }, { completed: false }])).toBe(false);
  });

  it("does not mark an empty workout Done", () => {
    expect(isWorkoutComplete([])).toBe(false);
  });
});
