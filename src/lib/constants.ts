export const APP_VERSION = "1.0.0";
export const MONTH_START = "2026-06-29";
export const MONTH_END = "2026-07-26";
export const TZ = "Africa/Accra";
export const SCHEMA_VERSION = 1;

export const HABITS = [
  "Protein included in at least two main meals",
  "No sugary drink",
  "Rice or starch portion measured",
  "No takeout",
  "Fruit or vegetables consumed",
  "Meal-prepped meal eaten",
  "Water target met",
  "Phone put down near intended bedtime",
  "At least 6.5 hours of sleep",
];

export const ACHIEVEMENTS = [
  ["first-walk", "First Step", "First walk logged"],
  ["first-strength", "Iron Returned", "First strength workout completed"],
  ["week-secured", "Week Secured", "Weekly minimum reached"],
  ["strong-week", "Strong Week", "Weekly target reached"],
  ["stretch-week", "Stretch Week", "Weekly stretch target reached"],
  ["three-for-three", "Three for Three", "All strength sessions completed in a week"],
  ["ten-km", "Ten Kilometres", "10 km total walked"],
  ["twenty-five-km", "Twenty-Five Kilometres", "25 km total walked"],
  ["fifty-km", "Fifty Kilometres", "50 km total walked"],
  ["measurement-habit", "Measurement Habit", "First waist measurement"],
  ["scale-consistency", "Scale Consistency", "Three weight entries"],
  ["two-week-builder", "Two-Week Builder", "Minimum targets achieved for two consecutive weeks"],
  ["month-secured", "Month Secured", "Month minimum achieved"],
  ["perfect-strength", "Perfect Strength Month", "12 of 12 strength sessions"],
  ["month-one-complete", "Month One Complete", "Reached July 26 and completed final review"],
] as const;
