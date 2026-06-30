import Dexie, { type Table } from "dexie";
import type { AchievementRecord, AppMeta, DailyHabit, ExerciseDefinition, ExerciseLog, PlannedSession, ReadinessEntry, SettingRecord, SetLog, SleepEntry, TakeoutEntry, WaistEntry, Walk, WeeklyReview, WeightEntry, WorkoutSession, WorkoutTemplate } from "../types";

export class RebuildDatabase extends Dexie {
  settings!: Table<SettingRecord, string>;
  workoutTemplates!: Table<WorkoutTemplate, string>;
  exerciseDefinitions!: Table<ExerciseDefinition, string>;
  plannedSessions!: Table<PlannedSession, string>;
  workoutSessions!: Table<WorkoutSession, string>;
  exerciseLogs!: Table<ExerciseLog, string>;
  setLogs!: Table<SetLog, string>;
  walks!: Table<Walk, string>;
  weightEntries!: Table<WeightEntry, string>;
  waistEntries!: Table<WaistEntry, string>;
  dailyHabits!: Table<DailyHabit, string>;
  takeoutEntries!: Table<TakeoutEntry, string>;
  sleepEntries!: Table<SleepEntry, string>;
  readinessEntries!: Table<ReadinessEntry, string>;
  weeklyReviews!: Table<WeeklyReview, string>;
  achievements!: Table<AchievementRecord, string>;
  appMeta!: Table<AppMeta, string>;

  constructor(name = "85kg-rebuild-month1") {
    super(name);
    this.version(1).stores({
      settings: "id",
      workoutTemplates: "id, order",
      exerciseDefinitions: "id, templateId, order, enabled",
      plannedSessions: "id, date, week, templateId, status",
      workoutSessions: "id, date, week, templateId, status, plannedSessionId",
      exerciseLogs: "id, sessionId, exerciseDefinitionId, order",
      setLogs: "id, sessionId, exerciseLogId, completed, painStatus",
      walks: "id, date, time",
      weightEntries: "id, date, time",
      waistEntries: "id, date",
      dailyHabits: "id, date",
      takeoutEntries: "id, date, category",
      sleepEntries: "id, date",
      readinessEntries: "id, date, sessionId",
      weeklyReviews: "id, week",
      achievements: "id, achievementId, earnedAt",
      appMeta: "id, key",
    });
  }
}

export const db = new RebuildDatabase();

export const nowIso = () => new Date().toISOString();
export const makeId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
