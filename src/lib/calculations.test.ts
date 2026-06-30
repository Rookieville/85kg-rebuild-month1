import { describe, expect, it } from "vitest";
import { durationPartsToMinutes, formatDuration, formatPace, habitAdherence, minutesToDurationParts, monthTier, paceMinutesPerKm, parsePace, rollingAverage, weeklyTier } from "./calculations";
import { monthDay, weekNumber } from "./dates";
import type { DailyHabit, WeightEntry } from "../types";

const stamp = { id: "x", createdAt: "2026-06-29T00:00:00.000Z", updatedAt: "2026-06-29T00:00:00.000Z" };

describe("date and adherence calculations", () => {
  it("keeps Month 1 boundaries and weeks stable", () => {
    expect(monthDay("2026-06-29")).toBe(1);
    expect(monthDay("2026-07-26")).toBe(28);
    expect(weekNumber("2026-06-29")).toBe(1);
    expect(weekNumber("2026-07-26")).toBe(4);
  });

  it("calculates pace and tiers", () => {
    expect(paceMinutesPerKm(5, 50)).toBe(10);
    expect(formatPace(10.5)).toBe("10:30/km");
    expect(formatPace(11.05)).toBe("11:03/km");
    expect(parsePace("11:03/km")).toBe(11.05);
    expect(parsePace("10:30")).toBe(10.5);
    expect(parsePace("10:77/km")).toBeUndefined();
    expect(weeklyTier(3, 5).tier).toBe("Stretch");
    expect(monthTier(12, 20, 4, 80)).toBe("Stretch");
  });

  it("converts walk duration between h/m/s and decimal minutes", () => {
    expect(durationPartsToMinutes(0, 43, 40)).toBeCloseTo(43.6667, 4);
    expect(minutesToDurationParts(43 + 40 / 60)).toEqual({ hours: 0, minutes: 43, seconds: 40 });
    expect(formatDuration(43 + 40 / 60)).toBe("43m 40s");
    expect(formatDuration(63 + 12 / 60)).toBe("1h 03m 12s");
  });

  it("calculates rolling average only when enough readings exist", () => {
    const weights = Array.from({ length: 7 }, (_, index): WeightEntry => ({ ...stamp, id: String(index), date: `2026-07-0${index + 1}`, time: "06:00", weightKg: 100 + index, morning: true, notes: "" }));
    expect(rollingAverage(weights).at(-1)?.average).toBe(103);
  });

  it("caps disabled habits out of adherence", () => {
    const habits: DailyHabit[] = [{ ...stamp, date: "2026-06-29", values: { "No takeout": true }, disabled: ["No sugary drink"], notes: "" }];
    expect(Math.round(habitAdherence(habits))).toBe(13);
  });
});
