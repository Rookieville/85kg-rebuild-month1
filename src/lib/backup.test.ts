import { describe, expect, it } from "vitest";
import { backupFilename, backupSchema, toCsv } from "./backup";

describe("backup utilities", () => {
  it("validates backup shape", () => {
    const data = Object.fromEntries(["settings", "workoutTemplates", "exerciseDefinitions", "plannedSessions", "workoutSessions", "exerciseLogs", "setLogs", "walks", "weightEntries", "waistEntries", "dailyHabits", "takeoutEntries", "sleepEntries", "readinessEntries", "weeklyReviews", "achievements", "appMeta"].map((name) => [name, []]));
    expect(backupSchema.parse({ schemaVersion: 1, exportedAt: new Date().toISOString(), appVersion: "1.0.0", data }).schemaVersion).toBe(1);
  });

  it("formats backup filenames and csv", () => {
    expect(backupFilename(new Date("2026-06-30T07:05:00"))).toBe("85kg-rebuild-month1-backup-2026-06-30-0705.json");
    expect(toCsv([{ date: "2026-06-30", note: "a,b" }])).toContain('"a,b"');
  });
});
