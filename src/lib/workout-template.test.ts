import { describe, expect, it } from "vitest";
import { nextWeekDate } from "./workout-template";

describe("weekly workout templates", () => {
  it("moves each workout forward exactly seven calendar days", () => {
    expect(nextWeekDate("2026-11-24")).toBe("2026-12-01");
    expect(nextWeekDate("2026-11-28")).toBe("2026-12-05");
  });
});
