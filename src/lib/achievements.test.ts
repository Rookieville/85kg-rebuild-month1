import { describe, expect, it } from "vitest";
import { eligibleAchievements, newAchievementIds } from "./achievements";
import type { AchievementRecord, Walk, WorkoutSession } from "../types";

const base = { createdAt: "2026-06-29T00:00:00.000Z", updatedAt: "2026-06-29T00:00:00.000Z" };

describe("achievements", () => {
  it("finds first strength, first walk, and distance achievements", () => {
    const sessions: WorkoutSession[] = [{ ...base, id: "s", date: "2026-06-29", week: 1, templateId: "a", workoutName: "Workout A", status: "completed", pausedSeconds: 0, notes: "" }];
    const walks: Walk[] = [{ ...base, id: "w", date: "2026-06-30", time: "07:00", distanceKm: 10, durationMinutes: 100, route: "", dayPart: "morning", setting: "outside", shinDiscomfort: "none", notes: "" }];
    expect(eligibleAchievements({ sessions, walks, weights: [], waists: [], habits: [], reviews: [] })).toEqual(expect.arrayContaining(["first-strength", "first-walk", "ten-km"]));
  });

  it("does not return already earned achievements as new", () => {
    const earned: AchievementRecord[] = [{ ...base, id: "a", achievementId: "first-walk", earnedAt: "2026-06-30T00:00:00.000Z" }];
    expect(newAchievementIds(["first-walk", "ten-km"], earned)).toEqual(["ten-km"]);
  });
});
