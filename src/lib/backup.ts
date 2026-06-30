import { z } from "zod";
import type { RebuildDatabase } from "../db/database";
import type { MutableRecord } from "../types";
import type { Table } from "dexie";
import { APP_VERSION, SCHEMA_VERSION } from "./constants";

const mutable = z.object({ id: z.string(), createdAt: z.string(), updatedAt: z.string() }).passthrough();

export const backupSchema = z.object({
  schemaVersion: z.number(),
  exportedAt: z.string(),
  appVersion: z.string(),
  data: z.object({
    settings: z.array(mutable),
    workoutTemplates: z.array(mutable),
    exerciseDefinitions: z.array(mutable),
    plannedSessions: z.array(mutable),
    workoutSessions: z.array(mutable),
    exerciseLogs: z.array(mutable),
    setLogs: z.array(mutable),
    walks: z.array(mutable),
    weightEntries: z.array(mutable),
    waistEntries: z.array(mutable),
    dailyHabits: z.array(mutable),
    takeoutEntries: z.array(mutable),
    sleepEntries: z.array(mutable),
    readinessEntries: z.array(mutable),
    weeklyReviews: z.array(mutable),
    achievements: z.array(mutable),
    appMeta: z.array(mutable),
  }),
});

export type BackupPayload = z.infer<typeof backupSchema>;

const tableNames = [
  "settings",
  "workoutTemplates",
  "exerciseDefinitions",
  "plannedSessions",
  "workoutSessions",
  "exerciseLogs",
  "setLogs",
  "walks",
  "weightEntries",
  "waistEntries",
  "dailyHabits",
  "takeoutEntries",
  "sleepEntries",
  "readinessEntries",
  "weeklyReviews",
  "achievements",
  "appMeta",
] as const;

export async function exportBackup(db: RebuildDatabase): Promise<BackupPayload> {
  const data = Object.fromEntries(await Promise.all(tableNames.map(async (name) => [name, await db[name].toArray()]))) as BackupPayload["data"];
  return { schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(), appVersion: APP_VERSION, data };
}

export async function importBackup(db: RebuildDatabase, payload: unknown, mode: "merge" | "replace") {
  const parsed = backupSchema.parse(payload);
  await db.transaction("rw", tableNames.map((name) => db[name]), async () => {
    if (mode === "replace") {
      for (const name of tableNames) await db[name].clear();
    }
    for (const name of tableNames) await (db[name] as Table<MutableRecord, string>).bulkPut(parsed.data[name] as MutableRecord[]);
  });
}

export function backupFilename(date = new Date()) {
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `85kg-rebuild-month1-backup-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}.json`;
}

export function toCsv(rows: Record<string, string | number | boolean | undefined>[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0] ?? {});
  const escape = (value: string | number | boolean | undefined) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [headers.join(","), ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))].join("\n");
}

export function downloadText(filename: string, text: string, type = "application/json") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
