import { afterEach, describe, expect, it } from "vitest";
import { RebuildDatabase } from "./database";
import { seedInitialData } from "./seed";
import { db } from "./database";

describe("seedInitialData", () => {
  afterEach(async () => {
    await db.delete();
    await new RebuildDatabase().delete();
  });

  it("is idempotent and seeds exactly one completed June 29 Workout A", async () => {
    await seedInitialData();
    await seedInitialData();
    expect(await db.plannedSessions.count()).toBe(12);
    const sessions = await db.workoutSessions.toArray();
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.date).toBe("2026-06-29");
    expect(sessions[0]?.workoutName).toBe("Workout A");
    expect(await db.walks.where("date").equals("2026-06-30").count()).toBe(0);
  });
});
