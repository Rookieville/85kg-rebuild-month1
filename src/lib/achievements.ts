import type { AchievementRecord, DailyHabit, WaistEntry, Walk, WeeklyReview, WeightEntry, WorkoutSession } from "../types";
import { monthSummary, summarizeWeek } from "./calculations";
import { MONTH_END } from "./constants";

export function eligibleAchievements(data: {
  sessions: WorkoutSession[];
  walks: Walk[];
  weights: WeightEntry[];
  waists: WaistEntry[];
  habits: DailyHabit[];
  reviews: WeeklyReview[];
  today?: string;
}) {
  const ids = new Set<string>();
  const completedStrength = data.sessions.filter((session) => session.status === "completed").length;
  const totalDistance = data.walks.reduce((sum, walk) => sum + walk.distanceKm, 0);
  if (data.walks.length) ids.add("first-walk");
  if (completedStrength) ids.add("first-strength");
  if (totalDistance >= 10) ids.add("ten-km");
  if (totalDistance >= 25) ids.add("twenty-five-km");
  if (totalDistance >= 50) ids.add("fifty-km");
  if (data.waists.length) ids.add("measurement-habit");
  if (data.weights.length >= 3) ids.add("scale-consistency");
  const securedWeeks = [1, 2, 3, 4].filter((week) => {
    const summary = summarizeWeek(week, data.sessions, data.walks, data.weights, data.waists, data.habits, data.reviews);
    if (summary.strength >= 3) ids.add("three-for-three");
    if (summary.tier.tier === "Minimum" || summary.tier.tier === "Target" || summary.tier.tier === "Stretch") ids.add("week-secured");
    if (summary.tier.tier === "Target" || summary.tier.tier === "Stretch") ids.add("strong-week");
    if (summary.tier.tier === "Stretch") ids.add("stretch-week");
    return summary.strength >= 3 && summary.walks >= 3;
  });
  if (securedWeeks.some((week) => securedWeeks.includes(week + 1))) ids.add("two-week-builder");
  const month = monthSummary(data.sessions, data.walks, data.weights, data.waists, data.habits, data.reviews);
  if (["Minimum", "Target", "Stretch"].includes(month.tier)) ids.add("month-secured");
  if (month.completedStrength >= 12) ids.add("perfect-strength");
  if ((data.today ?? "") >= MONTH_END && data.reviews.some((review) => review.week === 4)) ids.add("month-one-complete");
  return [...ids];
}

export function newAchievementIds(eligible: string[], earned: AchievementRecord[]) {
  const earnedIds = new Set(earned.map((record) => record.achievementId));
  return eligible.filter((id) => !earnedIds.has(id));
}
