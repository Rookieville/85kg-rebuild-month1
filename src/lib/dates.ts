import { addDays, differenceInCalendarDays, format, isAfter, isBefore, parseISO } from "date-fns";
import { MONTH_END, MONTH_START } from "./constants";

export const todayLocalDate = () => format(new Date(), "yyyy-MM-dd");
export const formatDisplayDate = (date: string) => format(parseISO(`${date}T00:00:00`), "EEE, d MMM yyyy");
export const dateRange = (start = MONTH_START, days = 28) => Array.from({ length: days }, (_, index) => format(addDays(parseISO(`${start}T00:00:00`), index), "yyyy-MM-dd"));

export function monthDay(date: string) {
  if (isBefore(parseISO(date), parseISO(MONTH_START))) return 0;
  if (isAfter(parseISO(date), parseISO(MONTH_END))) return 28;
  return differenceInCalendarDays(parseISO(date), parseISO(MONTH_START)) + 1;
}

export function weekNumber(date: string) {
  const day = monthDay(date);
  return Math.min(4, Math.max(1, Math.ceil(day / 7)));
}

export function weekDates(week: number) {
  const start = addDays(parseISO(`${MONTH_START}T00:00:00`), (week - 1) * 7);
  return dateRange(format(start, "yyyy-MM-dd"), 7);
}

export function inMonth(date: string) {
  return date >= MONTH_START && date <= MONTH_END;
}
