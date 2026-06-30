import type { DailyHabit, WaistEntry, Walk, WeeklyReview, WeightEntry, WorkoutSession } from "../types";
import { HABITS } from "./constants";
import { inMonth, weekDates, weekNumber } from "./dates";

export function paceMinutesPerKm(distanceKm: number, durationMinutes: number) {
  return distanceKm > 0 ? durationMinutes / distanceKm : 0;
}

export function speedKmPerHour(distanceKm: number, durationMinutes: number) {
  return durationMinutes > 0 ? distanceKm / (durationMinutes / 60) : 0;
}

export function formatPace(minutesPerKm: number) {
  if (!Number.isFinite(minutesPerKm) || minutesPerKm <= 0) return "-";
  const mins = Math.floor(minutesPerKm);
  const secs = Math.round((minutesPerKm - mins) * 60).toString().padStart(2, "0");
  return `${mins}:${secs}/km`;
}

export function weeklyTier(strengthCompleted: number, walkCount: number) {
  if (strengthCompleted >= 3 && walkCount >= 5) return { tier: "Stretch", message: "Stretch target reached. The system is working." };
  if (strengthCompleted >= 3 && walkCount >= 4) return { tier: "Target", message: "Strong week. Consistency is becoming normal." };
  if (strengthCompleted >= 3 && walkCount >= 3) return { tier: "Minimum", message: "Week secured. The foundation held." };
  return { tier: "Building", message: "Keep stacking the basics." };
}

export function monthTier(strengthCompleted: number, walkCount: number, waistCount: number, habitAdherence: number) {
  if (strengthCompleted >= 12 && walkCount >= 20 && waistCount >= 4 && habitAdherence >= 80) return "Stretch";
  if (strengthCompleted >= 12 && walkCount >= 16) return "Target";
  if (strengthCompleted >= 10 && walkCount >= 12) return "Minimum";
  return "Building";
}

export function rollingAverage(entries: WeightEntry[], days = 7) {
  return [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((entry, index, sorted) => {
      const window = sorted.slice(Math.max(0, index - days + 1), index + 1);
      if (window.length < days) return { date: entry.date, average: undefined };
      return { date: entry.date, average: window.reduce((sum, item) => sum + item.weightKg, 0) / window.length };
    });
}

export function habitAdherence(habits: DailyHabit[]) {
  const monthHabits = habits.filter((habit) => inMonth(habit.date));
  const totals = monthHabits.reduce(
    (acc, habit) => {
      const enabled = HABITS.filter((name) => !habit.disabled.includes(name));
      acc.possible += enabled.length;
      acc.done += enabled.filter((name) => habit.values[name]).length;
      return acc;
    },
    { done: 0, possible: 0 },
  );
  return totals.possible ? (totals.done / totals.possible) * 100 : 0;
}

export function summarizeWeek(week: number, sessions: WorkoutSession[], walks: Walk[], weights: WeightEntry[], waists: WaistEntry[], habits: DailyHabit[], reviews: WeeklyReview[]) {
  const dates = weekDates(week);
  const weekSessions = sessions.filter((session) => session.status === "completed" && dates.includes(session.date));
  const weekWalks = walks.filter((walk) => dates.includes(walk.date));
  const weekWeights = weights.filter((entry) => dates.includes(entry.date));
  const weekWaists = waists.filter((entry) => dates.includes(entry.date));
  const weekHabits = habits.filter((habit) => dates.includes(habit.date));
  const distance = weekWalks.reduce((sum, walk) => sum + walk.distanceKm, 0);
  const duration = weekWalks.reduce((sum, walk) => sum + walk.durationMinutes, 0);
  return {
    week,
    strength: weekSessions.length,
    walks: weekWalks.length,
    distance,
    duration,
    averagePace: paceMinutesPerKm(distance, duration),
    weightAverage: weekWeights.length ? weekWeights.reduce((sum, entry) => sum + entry.weightKg, 0) / weekWeights.length : undefined,
    waist: weekWaists.at(-1)?.waistCm,
    habitAdherence: habitAdherence(weekHabits),
    tier: weeklyTier(weekSessions.length, weekWalks.length),
    reviewed: reviews.some((review) => review.week === week),
  };
}

export function monthSummary(sessions: WorkoutSession[], walks: Walk[], weights: WeightEntry[], waists: WaistEntry[], habits: DailyHabit[], reviews: WeeklyReview[]) {
  const completedStrength = sessions.filter((session) => session.status === "completed" && inMonth(session.date)).length;
  const monthWalks = walks.filter((walk) => inMonth(walk.date));
  const distance = monthWalks.reduce((sum, walk) => sum + walk.distanceKm, 0);
  const duration = monthWalks.reduce((sum, walk) => sum + walk.durationMinutes, 0);
  const adherence = habitAdherence(habits);
  const bodyTrackedDays = new Set(weights.filter((entry) => inMonth(entry.date)).map((entry) => entry.date)).size;
  const reviewCount = reviews.filter((review) => review.week >= 1 && review.week <= 4).length;
  const score = Math.round(
    Math.min(completedStrength / 12, 1) * 40 +
      Math.min(monthWalks.length / 12, 1) * 30 +
      Math.min(bodyTrackedDays / 12, 1) * 10 +
      Math.min(waists.filter((entry) => inMonth(entry.date)).length / 4, 1) * 5 +
      Math.min(adherence / 80, 1) * 10 +
      Math.min(reviewCount / 4, 1) * 5,
  );
  return {
    completedStrength,
    walkCount: monthWalks.length,
    distance,
    duration,
    averagePace: paceMinutesPerKm(distance, duration),
    bestPace: monthWalks.length ? Math.min(...monthWalks.map((walk) => paceMinutesPerKm(walk.distanceKm, walk.durationMinutes))) : 0,
    longestWalk: monthWalks.length ? Math.max(...monthWalks.map((walk) => walk.distanceKm)) : 0,
    startingWeight: [...weights].sort((a, b) => a.date.localeCompare(b.date)).at(0)?.weightKg,
    latestWeight: [...weights].sort((a, b) => a.date.localeCompare(b.date)).at(-1)?.weightKg,
    startingWaist: [...waists].sort((a, b) => a.date.localeCompare(b.date)).at(0)?.waistCm,
    latestWaist: [...waists].sort((a, b) => a.date.localeCompare(b.date)).at(-1)?.waistCm,
    habitAdherence: adherence,
    adherenceScore: score,
    tier: monthTier(completedStrength, monthWalks.length, waists.filter((entry) => inMonth(entry.date)).length, adherence),
  };
}

export function currentWeekFromDate(date: string) {
  return weekNumber(date);
}
