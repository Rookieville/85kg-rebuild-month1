export type SessionStatus = "planned" | "in-progress" | "completed" | "missed" | "rescheduled" | "skipped-pain" | "skipped-recovery";
export type ExerciseType = "compound" | "isolation" | "core" | "loaded carry";
export type PainStatus = "none" | "mild" | "stopped-set" | "stopped-exercise" | "stopped-workout";

export interface MutableRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface SettingRecord extends MutableRecord {
  autoStartRestTimer: boolean;
  lastBackupAt?: string;
}

export interface WorkoutTemplate extends MutableRecord {
  name: string;
  order: number;
}

export interface ExerciseDefinition extends MutableRecord {
  templateId: string;
  name: string;
  order: number;
  sets: number;
  repRange: string;
  defaultWeight: string;
  restSeconds: number;
  instructions: string;
  category: string;
  type: ExerciseType;
  enabled: boolean;
}

export interface PlannedSession extends MutableRecord {
  date: string;
  week: number;
  slot: number;
  templateId: string;
  status: SessionStatus;
}

export interface WorkoutSession extends MutableRecord {
  date: string;
  week: number;
  templateId: string;
  workoutName: string;
  status: SessionStatus;
  plannedSessionId?: string;
  startedAt?: string;
  endedAt?: string;
  pausedSeconds: number;
  notes: string;
}

export interface ExerciseLog extends MutableRecord {
  sessionId: string;
  exerciseDefinitionId: string;
  name: string;
  order: number;
  category: string;
  type: ExerciseType;
  restSeconds: number;
  instructions: string;
}

export interface SetLog extends MutableRecord {
  sessionId: string;
  exerciseLogId: string;
  setNumber: number;
  weight: string;
  reps: string;
  rir: string;
  completed: boolean;
  note: string;
  painStatus: PainStatus;
  painArea?: string;
  painScore?: number;
}

export interface Walk extends MutableRecord {
  date: string;
  time: string;
  distanceKm: number;
  durationMinutes: number;
  fastestSplit?: number;
  route: string;
  dayPart: string;
  setting: string;
  effort?: number;
  shinDiscomfort: "none" | "mild" | "moderate" | "severe";
  notes: string;
}

export interface WeightEntry extends MutableRecord {
  date: string;
  time: string;
  weightKg: number;
  morning: boolean;
  notes: string;
}

export interface WaistEntry extends MutableRecord {
  date: string;
  waistCm: number;
  location: string;
  notes: string;
}

export interface DailyHabit extends MutableRecord {
  date: string;
  values: Record<string, boolean>;
  disabled: string[];
  notes: string;
}

export interface TakeoutEntry extends MutableRecord {
  date: string;
  category: string;
  portion: string;
  drink: string;
  notes: string;
}

export interface SleepEntry extends MutableRecord {
  date: string;
  bedtime: string;
  wakeTime: string;
  hours: number;
  quality: number;
}

export interface ReadinessEntry extends MutableRecord {
  date: string;
  sessionId?: string;
  sleepHours?: number;
  energy: string;
  motivation: string;
  soreness: string;
  currentPain: string;
  notes: string;
}

export interface WeeklyReview extends MutableRecord {
  week: number;
  strengthCompleted: number;
  walksCompleted: number;
  averageBodyweight?: number;
  waistMeasurement?: number;
  anyPain: string;
  averageEnergy: string;
  averageSleep?: number;
  nutritionAdherence: number;
  biggestObstacle: string;
  workedWell: string;
  adjustment: string;
}

export interface AchievementRecord extends MutableRecord {
  achievementId: string;
  earnedAt: string;
}

export interface AppMeta extends MutableRecord {
  key: string;
  value: string;
}

export interface TimerState {
  id: string;
  label: string;
  durationSeconds: number;
  startedAt: string;
  pausedAt?: string;
  pausedSeconds: number;
  skipped?: boolean;
}
