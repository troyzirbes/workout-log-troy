import { describe, expect, it } from "vitest";
import { getExerciseMuscles, muscleKey, musclesWorked } from "@/lib/exercise-muscles";

describe("dumbbell side bend", () => {
  it("lists side abs as the primary target", () => {
    expect(getExerciseMuscles("Dumbbell Side Bend")?.primary).toEqual(["Obliques (side abs)"]);
  });

  it("shows obliques once, as a primary area, in a workout summary", () => {
    const worked = musclesWorked(["Dumbbell Side Bend"]);
    const obliques = worked.filter((m) => m.key === muscleKey("Obliques (side abs)"));
    expect(obliques).toHaveLength(1);
    expect(obliques[0]).toMatchObject({ label: "Obliques", primary: true });
  });
});
