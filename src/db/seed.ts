import type { ExerciseType } from "../types";
import { MONTH_START } from "../lib/constants";
import { weekDates } from "../lib/dates";
import { db, nowIso } from "./database";

const workouts = [
  {
    id: "template-workout-a",
    name: "Workout A",
    exercises: [
      ["Dumbbell floor press", 3, "10-20", "15 kg each", 150, "3-second lowering and brief pause", "chest", "compound"],
      ["Supported one-arm dumbbell row", 3, "10-15 per side", "15 kg", 120, "Rest after both arms", "lats/back", "compound"],
      ["Goblet squat to bed", 3, "8-15", "10-15 kg", 120, "Control the lowering; stop if back pain occurs", "legs", "compound"],
      ["Seated dumbbell shoulder press", 2, "8-15", "8-12 kg each", 120, "Brace and keep ribs down", "shoulders", "compound"],
      ["Dumbbell lateral raise", 2, "12-20", "3-5 kg each", 75, "Lead with elbows, controlled reps", "lateral delts", "isolation"],
      ["Dead bug", 2, "6-10 per side", "bodyweight", 60, "Slow reps with low back controlled", "core", "core"],
    ],
  },
  {
    id: "template-workout-b",
    name: "Workout B",
    exercises: [
      ["Tempo push-ups", 3, "8-15", "bodyweight", 150, "3-second lowering, brief pause", "chest/triceps", "compound"],
      ["Supported one-arm dumbbell row", 3, "10-15 per side", "15 kg", 120, "Rest after both arms", "lats/back", "compound"],
      ["Supported split squat", 3, "6-10 per leg", "bodyweight", 120, "Use support and keep reps pain-free", "legs/glutes", "compound"],
      ["Close-grip dumbbell floor press", 2, "12-20", "15 kg each", 120, "Controlled press with elbows tucked", "chest/triceps", "compound"],
      ["Rear-delt row", 2, "12-20", "5-8 kg each", 75, "Pull elbows wide", "rear delts/upper back", "isolation"],
      ["Farmer hold", 2, "30-45 seconds", "15 kg each", 75, "Tall posture and steady breathing", "grip/core", "loaded carry"],
    ],
  },
] as const;

const stamp = () => ({ createdAt: nowIso(), updatedAt: nowIso() });

export async function seedInitialData() {
  await db.transaction("rw", [db.settings, db.workoutTemplates, db.exerciseDefinitions, db.plannedSessions, db.workoutSessions, db.exerciseLogs, db.setLogs, db.appMeta], async () => {
    if (!(await db.settings.get("settings"))) {
      await db.settings.add({ id: "settings", autoStartRestTimer: true, ...stamp() });
    }
    for (const [workoutIndex, workout] of workouts.entries()) {
      if (!(await db.workoutTemplates.get(workout.id))) {
        await db.workoutTemplates.add({ id: workout.id, name: workout.name, order: workoutIndex, ...stamp() });
      }
      for (const [exerciseIndex, exercise] of workout.exercises.entries()) {
        const id = `${workout.id}-exercise-${exerciseIndex + 1}`;
        if (!(await db.exerciseDefinitions.get(id))) {
          const [name, sets, repRange, defaultWeight, restSeconds, instructions, category, type] = exercise;
          await db.exerciseDefinitions.add({ id, templateId: workout.id, name, order: exerciseIndex, sets, repRange, defaultWeight, restSeconds, instructions, category, type: type as ExerciseType, enabled: true, ...stamp() });
        }
      }
    }
    const schedule = ["template-workout-a", "template-workout-b", "template-workout-a", "template-workout-b", "template-workout-a", "template-workout-b", "template-workout-a", "template-workout-b", "template-workout-a", "template-workout-b", "template-workout-a", "template-workout-b"];
    let cursor = 0;
    for (let week = 1; week <= 4; week += 1) {
      for (const [slot, date] of [weekDates(week)[0], weekDates(week)[2], weekDates(week)[4]].entries()) {
        const id = `planned-week-${week}-slot-${slot + 1}`;
        if (!(await db.plannedSessions.get(id))) {
          await db.plannedSessions.add({ id, date, week, slot: slot + 1, templateId: schedule[cursor] ?? "template-workout-a", status: date === MONTH_START ? "completed" : "planned", ...stamp() });
        }
        cursor += 1;
      }
    }
    if (!(await db.workoutSessions.get("seed-workout-2026-06-29"))) {
      const sessionId = "seed-workout-2026-06-29";
      await db.workoutSessions.add({ id: sessionId, date: MONTH_START, week: 1, templateId: "template-workout-a", workoutName: "Workout A", status: "completed", plannedSessionId: "planned-week-1-slot-1", startedAt: "2026-06-29T06:00:00.000Z", endedAt: "2026-06-29T06:45:00.000Z", pausedSeconds: 0, notes: "Initial session completed before tracker setup.", ...stamp() });
      const exercises = await db.exerciseDefinitions.where("templateId").equals("template-workout-a").sortBy("order");
      for (const exercise of exercises) {
        const exerciseLogId = `seed-${exercise.id}`;
        await db.exerciseLogs.add({ id: exerciseLogId, sessionId, exerciseDefinitionId: exercise.id, name: exercise.name, order: exercise.order, category: exercise.category, type: exercise.type, restSeconds: exercise.restSeconds, instructions: exercise.instructions, ...stamp() });
        for (let set = 1; set <= exercise.sets; set += 1) {
          await db.setLogs.add({ id: `seed-${exercise.id}-set-${set}`, sessionId, exerciseLogId, setNumber: set, weight: exercise.defaultWeight, reps: "", rir: "", completed: true, note: "", painStatus: "none", ...stamp() });
        }
      }
    }
    if (!(await db.appMeta.get("seed-v1"))) {
      await db.appMeta.add({ id: "seed-v1", key: "seed-v1", value: nowIso(), ...stamp() });
    }
  });
}

export { workouts as initialWorkouts };
