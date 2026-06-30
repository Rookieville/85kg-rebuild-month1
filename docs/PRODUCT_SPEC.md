# 85 kg Rebuild — Month 1 Fitness Tracker
## Product Specification and GPT-5.5 Implementation Brief

**Project type:** Local-first installable PWA  
**Frontend:** React + TypeScript + Vite  
**Hosting target:** GitHub Pages  
**Persistence:** IndexedDB through Dexie.js  
**Backend:** None  
**Month 1 period:** Monday, 29 June 2026 through Sunday, 26 July 2026  
**Primary user:** One local user  
**Primary device:** Phone, with Mac support  
**Timezone:** Africa/Accra  
**Locale:** English, metric units

---

# 1. Product purpose

Build a polished, mobile-first Month 1 fitness tracker for a 23-year-old Ghanaian male beginning a 15-month body-recomposition and weight-loss plan.

The user currently weighs approximately 110 kg at 5'10". The long-term target is 80–85 kg while rebuilding muscle, improving cardiovascular health, developing a V-taper, and improving general and sexual endurance.

This application covers only the first four-week adherence phase. It is not intended to be a general-purpose fitness platform yet.

The primary objective is not maximal training complexity. It is to make the following behaviors easy to complete and difficult to forget:

- Three strength sessions per week
- At least three brisk walks per week
- Morning bodyweight tracking
- Weekly waist measurements
- Simple nutrition adherence
- Pain and recovery monitoring
- End-of-week review
- End-of-month evaluation

The application must work without a backend, without Docker, and without the user starting a server for normal daily use.

---

# 2. Success criteria for Month 1

Month 1 is considered successful when the user:

- Completes at least 10 of 12 planned strength sessions
- Completes at least 12 brisk walks
- Tracks bodyweight consistently
- Records one waist measurement per week
- Reduces sugary drinks and takeout
- Improves meal structure and protein intake
- Finishes the month without aggravating the lower back or shins

The app must present success in tiers rather than as an all-or-nothing pass/fail system.

## Weekly adherence tiers

### Minimum week
- 3 strength sessions
- 3 walks

Message:
> Week secured. The foundation held.

### Target week
- 3 strength sessions
- 4 walks

Message:
> Strong week. Consistency is becoming normal.

### Stretch week
- 3 strength sessions
- 5 or more walks

Message:
> Stretch target reached. The system is working.

Stretch completion should trigger a celebratory animation and achievement badge.

## Month adherence tiers

### Minimum month
- At least 10 strength sessions
- At least 12 walks

### Target month
- All 12 strength sessions
- At least 16 walks

### Stretch month
- All 12 strength sessions
- At least 20 walks
- All four waist measurements
- At least 80% nutrition-habit adherence

---

# 3. Fixed Month 1 calendar

The tracker must be initialized with these four weeks:

- Week 1: Monday 29 June 2026 to Sunday 5 July 2026
- Week 2: Monday 6 July 2026 to Sunday 12 July 2026
- Week 3: Monday 13 July 2026 to Sunday 19 July 2026
- Week 4: Monday 20 July 2026 to Sunday 26 July 2026

The app must display dates in the Africa/Accra timezone and avoid UTC date-shifting bugs.

## Seeded history

Seed exactly one completed strength workout:

- Date: Monday, 29 June 2026
- Status: completed
- Counts toward Week 1
- Workout: Workout A unless the user changes it later
- Completion: completed session
- Notes: optional seeded note such as “Initial session completed before tracker setup.”
- The user must be able to edit or delete it.

Do not seed the Sunday, 28 June workout because it falls outside the Month 1 period.

Do not seed the Tuesday, 30 June walk. The user explicitly wants to log that manually.

The seed process must be idempotent. Reloading or updating the app must never create duplicate seeded records.

---

# 4. Technical architecture

## Required stack

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Dexie.js
- IndexedDB
- date-fns
- Recharts
- canvas-confetti
- Zod
- Lucide React
- vite-plugin-pwa

## No backend

Do not add:

- Express
- Next.js server routes
- Supabase
- Firebase
- PostgreSQL
- SQLite server
- Docker
- Authentication
- Cloud functions

All user data must remain local in IndexedDB.

## Runtime behavior

Normal use must require only opening the hosted URL or installed PWA.

The user must never need to run:

- `npm run dev`
- `npm run preview`
- Docker
- A local database
- A local API

Development commands are permitted only during development.

---

# 5. GitHub Pages compatibility

The app will be hosted as a static site on GitHub Pages.

The implementation must:

- Use a Vite `base` path compatible with a project repository
- Derive or clearly configure the repository name
- Support deep links without returning a GitHub Pages 404
- Prefer `HashRouter` unless a robust SPA fallback is implemented
- Cache static assets through the PWA service worker
- Register the service worker only in production
- Provide an update-available prompt
- Avoid silently refreshing during an active workout
- Preserve IndexedDB data across deployments and schema upgrades

Recommended routing choice:

- Use `HashRouter`
- Example URL: `https://username.github.io/repository/#/strength`

This avoids needing a custom 404 fallback for client-side routes.

---

# 6. Application pages

## 6.1 Dashboard

The dashboard is the default page.

Display:

- Current date
- Current Month 1 week
- Day number out of 28
- Overall Month 1 progress bar
- Today’s planned task
- Next strength session
- Strength sessions completed this week
- Walks completed this week
- Current bodyweight
- Most recent waist measurement
- Current streak
- Latest achievement
- Quick-log buttons
- Missing-data reminders
- Weekly adherence tier

Quick actions:

- Start strength workout
- Log walk
- Log weight
- Log waist
- Log daily habits
- Open weekly review

Dashboard reminders may include:

- One more walk secures your weekly minimum
- One strength session remains this week
- No bodyweight recorded recently
- Waist measurement is due
- Weekly review is ready
- Backup has not been exported in seven days
- Pain has been recorded repeatedly for an exercise

The dashboard should be useful within three seconds of opening the app.

---

## 6.2 Strength page

Display the alternating Month 1 schedule:

- Week 1: A, B, A
- Week 2: B, A, B
- Week 3: A, B, A
- Week 4: B, A, B

Default suggested days:

- Monday
- Wednesday
- Friday

The user may reschedule a planned session to another date within the same week.

Each session must support:

- Planned
- In progress
- Completed
- Missed
- Rescheduled
- Skipped due to pain
- Skipped due to recovery

### Workout editor

The user can edit:

- Workout name
- Exercise name
- Exercise order
- Sets
- Rep range
- Default weight
- Rest time
- Instructions
- Whether the exercise is enabled
- Exercise category
- Compound or isolation classification

The user can add, remove, disable, reorder, or replace exercises.

### Set-level logging

For each set, log:

- Actual weight
- Actual reps
- RIR
- Completed status
- Optional note
- Pain status

Weight input must support:

- One dumbbell
- Two dumbbells
- Bodyweight
- Bodyweight plus dumbbell
- Text note where exact loading is awkward

Examples:

- 15 kg each
- 10 kg each
- 15 kg goblet
- Bodyweight
- Bodyweight + 5 kg

### Rest timers

Each exercise has an editable rest time.

Defaults:

- Heavy compound exercises: 120–180 seconds
- Moderate compound exercises: 90–120 seconds
- Isolation exercises: 60–90 seconds
- Core work: 45–75 seconds

Timer requirements:

- Start automatically after marking a set complete, with an opt-out setting
- Pause
- Resume
- Add 15 seconds
- Subtract 15 seconds
- Skip
- Sound or vibration at completion
- Continue when navigating within the app
- Survive temporary app backgrounding when possible
- Calculate remaining time using timestamps rather than relying only on intervals

### Workout timer

Track:

- Start time
- End time
- Total duration
- Paused duration
- Completion percentage

### Exercise pain tracking

Each exercise can be marked:

- No pain
- Mild discomfort
- Pain, stopped set
- Pain, stopped exercise
- Pain, stopped workout

Optional fields:

- Body area
- Pain score from 1–10
- Notes

If the same exercise has pain recorded twice during Month 1, show:

> This exercise has caused discomfort more than once. Replace or review it before repeating.

Do not diagnose injuries.

### Completed workout editing

The user can reopen a completed workout and edit:

- Date
- Workout name
- Exercises
- Sets
- Reps
- Weights
- RIR
- Duration
- Notes
- Pain records
- Completion status

Changes must immediately update summaries and achievements.

Deletion must require confirmation.

---

# 7. Initial strength program

The program must be editable, but start with the following.

## Workout A

### Dumbbell floor press
- 3 sets
- 10–20 reps
- Default: 15 kg each
- Rest: 150 seconds
- Tempo note: 3-second lowering and brief pause
- Category: chest
- Type: compound

### Supported one-arm dumbbell row
- 3 sets
- 10–15 reps per side
- Default: 15 kg
- Rest: 120 seconds after both arms
- Category: lats/back
- Type: compound

### Goblet squat to bed
- 3 sets
- 8–15 reps
- Default: 10–15 kg
- Rest: 120 seconds
- Category: legs
- Type: compound

### Seated dumbbell shoulder press
- 2 sets
- 8–15 reps
- Default: 8–12 kg each
- Rest: 120 seconds
- Category: shoulders
- Type: compound

### Dumbbell lateral raise
- 2 sets
- 12–20 reps
- Default: 3–5 kg each
- Rest: 75 seconds
- Category: lateral delts
- Type: isolation

### Dead bug
- 2 sets
- 6–10 reps per side
- Default: bodyweight
- Rest: 60 seconds
- Category: core
- Type: core

## Workout B

### Tempo push-ups
- 3 sets
- 8–15 reps
- Default: bodyweight
- Rest: 150 seconds
- Tempo note: 3-second lowering, brief pause
- Category: chest/triceps
- Type: compound

### Supported one-arm dumbbell row
- 3 sets
- 10–15 reps per side
- Default: 15 kg
- Rest: 120 seconds after both arms
- Category: lats/back
- Type: compound

### Supported split squat
- 3 sets
- 6–10 reps per leg
- Default: bodyweight
- Rest: 120 seconds
- Category: legs/glutes
- Type: compound

### Close-grip dumbbell floor press
- 2 sets
- 12–20 reps
- Default: 15 kg each
- Rest: 120 seconds
- Category: chest/triceps
- Type: compound

### Rear-delt row
- 2 sets
- 12–20 reps
- Default: 5–8 kg each
- Rest: 75 seconds
- Category: rear delts/upper back
- Type: isolation

### Farmer hold
- 2 sets
- 30–45 seconds
- Default: 15 kg each
- Rest: 75 seconds
- Category: grip/core
- Type: loaded carry

## Romanian deadlift status

Loaded Romanian deadlifts must not appear as an active Month 1 exercise initially.

The user felt temporary waist/lower-back discomfort during the movement.

A technique-practice item may appear in warm-ups:

- Unloaded wall hip hinge
- 8 controlled repetitions
- No weight
- Stop if pain occurs

The user may manually enable or add Romanian deadlifts later.

---

# 8. Walking page

The walking page must make logging a walk fast on a phone.

## Walk fields

Required:

- Date
- Start time or completion time
- Distance in kilometres
- Duration

Calculated automatically:

- Average pace in min/km
- Average speed in km/h

Optional:

- Fastest split in min/km
- Split list
- Route or location note
- Morning, afternoon, or evening
- Indoor or outdoor
- Treadmill or outside
- Perceived effort from 1–10
- Shin discomfort
- General notes

## Walk editing

The user can:

- Add
- Edit
- Duplicate
- Delete
- Backdate

## Walking summaries

Display:

- Walks this week
- Walks this month
- Total distance
- Total walking time
- Average pace
- Fastest average pace
- Fastest split
- Longest walk
- Weekly distance trend
- Weekly walking-time trend
- Pace trend
- Morning-walk consistency

## Walk targets

Weekly:

- Minimum: 3
- Target: 4
- Stretch: 5

Month:

- Minimum: 12
- Target: 16
- Stretch: 20

Do not add running targets.

## Shin-splint monitoring

Allow the user to record:

- No shin discomfort
- Mild
- Moderate
- Severe

If moderate or severe discomfort is logged:

- Show a non-alarmist prompt to reduce impact and review footwear, surface, distance, and recovery
- Do not recommend running
- Do not diagnose

---

# 9. Body tracking page

## Weight

Support:

- Daily
- Weekly
- Bi-weekly
- Backdated entries

Default recommendation:

- Morning
- After bathroom
- Before food or drink
- Similar clothing conditions

Fields:

- Date
- Time
- Weight in kg
- Morning measurement toggle
- Notes

Display:

- Starting weight
- Latest weight
- Total change
- Raw weight chart
- Seven-day rolling average when enough data exists
- Weekly average
- Trend direction
- Long-term target range: 80–85 kg
- Month 1 target range: directional only, not enforced

Do not overreact to single readings.

## Waist

Fields:

- Date
- Waist in cm
- Measurement location note
- Notes

Recommended default:

- Once weekly
- Around navel
- Relaxed
- After normal exhale

Display:

- Starting waist
- Latest waist
- Total change
- Weekly trend

## Progress photos

Optional:

- Front
- Side
- Back
- Checkpoints: start, end of Week 2, end of Week 4

Requirements:

- Store in IndexedDB
- Resize and compress before storage
- Prefer WebP
- Show storage warning
- Allow deletion
- Never upload anywhere

This feature may be implemented after core tracking if time is constrained.

---

# 10. Habit tracking page

Keep nutrition tracking simple for Month 1.

## Daily habit checklist

- Protein included in at least two main meals
- No sugary drink
- Rice or starch portion measured
- No takeout
- Fruit or vegetables consumed
- Meal-prepped meal eaten
- Water target met
- Phone put down near intended bedtime
- At least 6.5 hours of sleep

Each habit must be individually editable or disableable.

## Takeout log

Categories:

- Pizza
- Shawarma
- Fried food
- Sugary drink
- Other takeout

Track:

- Date
- Category
- Portion note
- Drink
- Notes

Display:

- Takeout meals this week
- Takeout meals this month
- Sugary drinks this week
- Longest no-takeout streak

Do not use shaming language.

## Sleep

Optional daily fields:

- Bedtime
- Wake time
- Estimated sleep hours
- Sleep quality from 1–5

Display weekly average.

---

# 11. Readiness check

Before a strength session, show a brief optional readiness form:

- Sleep hours
- Energy: low, medium, high
- Motivation: low, medium, high
- Muscle soreness: none, mild, moderate, high
- Current pain: none or described
- Notes

The readiness check must never prevent the workout from starting.

If the user reports pain, show:

> Train only through pain-free movements. Stop or modify any exercise that reproduces the pain.

---

# 12. Weekly review

At the end of each week, make a review available.

Fields:

- Strength sessions completed
- Walks completed
- Average bodyweight
- Waist measurement
- Any pain?
- Average energy
- Average sleep
- Nutrition adherence
- Biggest obstacle
- What worked well?
- One adjustment for next week

The app should pre-fill calculated fields and allow manual comments.

The review remains editable.

The review should not automatically change the workout program.

---

# 13. Summary and analytics

Provide:

- Daily summary
- Weekly summary
- Month 1 summary

## Daily summary

Show:

- Strength session
- Walk
- Weight
- Habits
- Sleep
- Notes

## Weekly summary

Show:

- Strength completed versus planned
- Walk count and target tier
- Total distance
- Total walking time
- Average pace
- Weight average
- Weight change versus prior week
- Waist
- Habit adherence
- Pain incidents
- Weekly tier
- Achievements earned

## Month 1 summary

Show:

- Strength sessions completed out of 12
- Walks completed
- Total distance
- Total walking time
- Average walking pace
- Best pace
- Longest walk
- Starting and ending weight
- Seven-day average change
- Starting and ending waist
- Strength exercise improvements
- Pain incidents
- Average sleep
- Nutrition adherence
- Overall adherence score
- Month tier achieved

## Strength progression summary

For each exercise, display:

- First logged performance
- Best logged performance
- Latest logged performance
- Weight change
- Rep change
- Estimated volume trend where calculation is meaningful

Avoid fake precision for bodyweight movements and time-based exercises.

---

# 14. Month progress calculation

The overall Month 1 progress bar should combine calendar progress and adherence without becoming misleading.

Display two separate values:

## Time progress
- Current day out of 28
- Percentage of Month 1 elapsed

## Adherence progress
Weighted score:

- Strength: 40%
- Walking: 30%
- Body tracking: 10%
- Waist measurements: 5%
- Nutrition habits: 10%
- Weekly reviews: 5%

Cap each category at 100% so extra walks do not hide missed strength sessions.

Display category breakdown.

---

# 15. Achievements and celebrations

Use tasteful achievement cards and short confetti animations.

Do not trigger confetti repeatedly on every render.

Store earned achievement IDs and timestamps.

## Initial achievements

- First Step: first walk logged
- Iron Returned: first strength workout completed
- Week Secured: weekly minimum reached
- Strong Week: weekly target reached
- Stretch Week: weekly stretch target reached
- Three for Three: all three strength sessions completed in a week
- Ten Kilometres: 10 km total walked
- Twenty-Five Kilometres: 25 km total walked
- Fifty Kilometres: 50 km total walked
- Measurement Habit: first waist measurement
- Scale Consistency: three weight entries
- Two-Week Builder: minimum targets achieved for two consecutive weeks
- Month Secured: Month minimum achieved
- Perfect Strength Month: 12 of 12 strength sessions
- Month One Complete: reached Sunday, 26 July 2026 and completed final review

## Celebration rules

### Minimum weekly completion
- Achievement popup
- No full-screen confetti
- Warm message

### Target weekly completion
- Achievement popup
- Small confetti burst

### Stretch weekly completion
- Larger but brief confetti animation
- Distinct badge
- Never obstruct controls for more than a few seconds

Respect reduced-motion preferences.

---

# 16. Calendar

Provide a four-week calendar.

Each day may display icons or indicators for:

- Planned strength
- Completed strength
- Walk
- Weight
- Waist
- Habits completed
- Weekly review
- Pain incident

Status colors must also include icons or labels for accessibility.

Clicking a date opens a daily detail view.

---

# 17. Notifications and reminders

Version 1 should avoid push notifications unless they are easy and reliable.

Required in-app reminders:

- Strength session due today
- Walk minimum not yet reached
- Weight has not been logged recently
- Waist is due
- Weekly review is due
- Backup is overdue
- App update is available

Optional later:

- Local PWA notifications with explicit permission

Do not request notification permission on first launch.

---

# 18. Backup and restore

This is mandatory because data is local-only.

## Export

Export all app data as JSON.

Filename format:

`85kg-rebuild-month1-backup-YYYY-MM-DD-HHmm.json`

Include:

- Schema version
- Export timestamp
- App version
- Settings
- Workouts
- Exercise definitions
- Walks
- Measurements
- Habits
- Reviews
- Achievements
- Optional photos or a clear choice to exclude photos

## Import

- Validate with Zod
- Show a preview
- Support replace-all import
- Support merge import if reasonably safe
- Prevent duplicate IDs
- Create an automatic pre-import backup

## Additional exports

- CSV for walks
- CSV for weight and waist
- Printable Month 1 report

Store and display the last successful backup date.

---

# 19. IndexedDB schema

Use Dexie with explicit versioning and migrations.

Suggested tables:

```ts
settings
programs
workoutTemplates
exerciseDefinitions
plannedSessions
workoutSessions
exerciseLogs
setLogs
walks
weightEntries
waistEntries
dailyHabits
takeoutEntries
sleepEntries
readinessEntries
weeklyReviews
achievements
achievementEvents
progressPhotos
appMeta
```

Suggested key strategy:

- UUID strings for user-created records
- Stable string IDs for built-in achievements and initial templates
- Indexed date fields
- Indexed week number where useful

Every mutable record should contain:

- `id`
- `createdAt`
- `updatedAt`

Important fields should use ISO timestamps, but local calendar dates should also be stored as `YYYY-MM-DD` strings to avoid timezone drift.

---

# 20. Data integrity

The app must:

- Never duplicate seeded data
- Never erase IndexedDB during ordinary updates
- Use migrations for schema changes
- Validate imported backups
- Recalculate summaries after edits or deletes
- Recalculate achievements safely
- Avoid awarding the same achievement twice
- Avoid losing an active workout if the page reloads
- Save drafts continuously
- Recover an interrupted active workout

---

# 21. Design requirements

## Visual direction

- Dark, modern, athletic
- Strong typography
- Calm rather than aggressive
- Purple, green, and cyan accents are acceptable
- Good contrast
- Mobile-first
- Large tap targets
- Minimal typing during workouts
- Clear hierarchy
- No cluttered “military bootcamp” aesthetic

## Responsive behavior

Primary breakpoints:

- Small phone
- Large phone
- Tablet
- Desktop

The phone experience is the highest priority.

## Accessibility

- Keyboard navigation
- Visible focus states
- Semantic HTML
- Accessible labels
- Sufficient contrast
- Reduced-motion support
- Charts must have textual summaries
- Do not communicate status through color alone

---

# 22. PWA requirements

The app must:

- Be installable
- Work offline after first successful load
- Include manifest metadata
- Include application icons
- Include maskable icons
- Use standalone display mode
- Cache application shell and static assets
- Avoid caching stale IndexedDB data because data is not fetched over HTTP
- Show offline-ready status
- Show update-available status
- Let the user choose when to refresh
- Preserve active workout state through updates

Suggested name:

**85 kg Rebuild**

Suggested short name:

**85kg Rebuild**

Suggested description:

**Month 1 strength, walking, body, and adherence tracker.**

---

# 23. Testing requirements

Use:

- Vitest
- React Testing Library
- fake-indexeddb for Dexie tests
- Playwright for critical flows if practical

## Unit tests

Cover:

- Week date calculations
- Month date boundaries
- Africa/Accra date handling
- Adherence score
- Weekly tiers
- Month tiers
- Average pace calculation
- Rolling weight average
- Seed idempotency
- Achievement eligibility
- Backup validation
- Summary recalculation

## Component tests

Cover:

- Workout editor
- Set logging
- Walk form
- Weight form
- Achievement popup
- Weekly review
- Import preview
- Update prompt

## End-to-end flows

At minimum:

1. First launch seeds Month 1 and exactly one June 29 workout
2. User logs June 30 walk manually
3. User edits an exercise and rest time
4. User completes a workout
5. Weekly minimum achievement triggers once
6. User edits a completed workout
7. Summaries update after edit
8. User exports backup
9. User resets data
10. User imports backup successfully
11. App works after refresh while offline
12. GitHub Pages deep navigation works

---

# 24. Performance requirements

- First meaningful render should feel immediate on a modern phone
- Avoid large chart bundles on the initial route if code splitting is easy
- Compress icons and images
- Lazy-load progress photos
- Avoid unnecessary rerenders during timers
- Persist timer start and target timestamps instead of writing every second to IndexedDB
- Debounce free-text autosaves
- Keep the main JavaScript bundle reasonable

---

# 25. Privacy

- No analytics by default
- No ad tracking
- No external fitness APIs
- No cloud upload
- No personal account
- No hidden network transmission of health data

The settings page must clearly state:

> Your records are stored locally in this browser on this device. Export backups regularly. Clearing browser storage may erase your records.

---

# 26. Out of scope for Version 1

Do not implement:

- Social features
- Authentication
- Cloud synchronization
- Apple Health
- Google Fit
- GPS route recording
- Smartwatch integration
- Food database
- Barcode scanning
- Detailed calorie counting
- AI chat within the app
- Automatic medical advice
- Long-term Month 2+ program generation
- Multi-user support

---

# 27. Suggested project structure

```text
src/
├── app/
│   ├── App.tsx
│   ├── router.tsx
│   └── providers.tsx
├── components/
│   ├── achievements/
│   ├── calendar/
│   ├── charts/
│   ├── common/
│   ├── forms/
│   ├── strength/
│   └── timers/
├── db/
│   ├── database.ts
│   ├── migrations.ts
│   ├── seed.ts
│   └── repositories/
├── features/
│   ├── dashboard/
│   ├── strength/
│   ├── walking/
│   ├── body/
│   ├── habits/
│   ├── reviews/
│   ├── summaries/
│   ├── settings/
│   └── backup/
├── lib/
│   ├── dates.ts
│   ├── calculations.ts
│   ├── achievements.ts
│   ├── validation.ts
│   └── constants.ts
├── pages/
├── styles/
├── types/
└── main.tsx
```

---

# 28. Delivery phases

## Phase 1: Foundation

- Vite React TypeScript project
- Tailwind
- Routing
- Dexie
- Month 1 seed
- Dashboard shell
- GitHub Pages workflow
- PWA shell

## Phase 2: Core logging

- Strength templates
- Session logging
- Set-level logs
- Timers
- Walk logging
- Weight and waist

## Phase 3: Adherence

- Habits
- Weekly review
- Calendar
- Progress calculations
- Reminders

## Phase 4: Analytics and delight

- Summaries
- Charts
- Achievements
- Confetti
- End-of-month report

## Phase 5: Reliability

- Export/import
- Migrations
- Offline testing
- GitHub Pages testing
- Accessibility
- Responsive polish
- Automated tests

---

# 29. Definition of done

The project is complete when:

- It deploys successfully to GitHub Pages
- It installs as a PWA
- It opens without the user running a server
- It works offline after first load
- It seeds the four-week Month 1 calendar
- It contains exactly one seeded June 29 workout
- It does not seed the June 30 walk
- The user can edit all workout programming values
- The user can log sets, walks, weight, waist, habits, and reviews
- Completed records can be edited and deleted
- Weekly and Month 1 summaries are accurate
- Achievements trigger exactly once
- Backup export and import work
- Data survives deployment updates
- Core tests pass
- The phone experience is polished
- No backend exists

---

# 30. Agent execution instructions

You are implementing this project autonomously.

## Working style

1. Read this specification fully before writing code.
2. Create an implementation plan.
3. Identify ambiguities and choose sensible defaults unless the ambiguity risks data loss.
4. Build incrementally.
5. Run lint, type-check, tests, and production builds after meaningful milestones.
6. Do not claim a feature works without testing it.
7. Keep architecture maintainable without overengineering.
8. Prefer pure calculation functions for dates, summaries, and achievements.
9. Use Cursor rather than nano or vim in any human-facing terminal instructions.
10. Never add a backend unless explicitly instructed later.

## Required final report

At completion, provide:

- Implemented features
- Architecture
- Database schema
- Seed behavior
- Test coverage
- Commands run
- Build result
- GitHub Pages configuration
- Known limitations
- Manual testing checklist
- Future recommendations

## Critical product constraints

- Month 1 starts Monday, 29 June 2026
- Month 1 ends Sunday, 26 July 2026
- Seed one completed strength session on June 29
- Do not seed the June 30 walk
- Three strength sessions per week
- Walking minimum is three per week
- No loaded Romanian deadlift in the initial active program
- Heavy compounds default to 2–3 minutes rest
- Data remains local
- No normal-use server
- GitHub Pages and PWA support are mandatory
