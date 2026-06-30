# Changelog

## Unreleased

- Added walk duration entry using hours, minutes, and seconds while preserving existing minute-based storage for compatibility.
- Added Strava-style average pace and fastest split fields using `MM:SS/km` input and display.
- Updated walk CSV exports to include human-readable duration, stored duration minutes, average pace, and fastest split.
- Kept weekly and Month 1 aggregate pace based on total distance and total duration for mathematically consistent summaries.
