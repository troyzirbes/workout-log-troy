export function isWorkoutComplete(exercises: { completed: boolean }[]): boolean {
  return exercises.length > 0 && exercises.every((exercise) => exercise.completed);
}
