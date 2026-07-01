import confetti from "canvas-confetti";
import { useLiveQuery } from "dexie-react-hooks";
import { addSeconds, differenceInSeconds, format } from "date-fns";
import { CalendarDays, Check, DatabaseBackup, Dumbbell, Footprints, Home, Moon, Pencil, Plus, RotateCcw, Save, Scale, TimerReset, Trash2, Trophy, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { HashRouter, Link, NavLink, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { registerSW } from "virtual:pwa-register";
import type { AchievementRecord, DailyHabit, ExerciseDefinition, ExerciseLog, PainStatus, PlannedSession, ReadinessEntry, SetLog, TimerState, WaistEntry, Walk, WeeklyReview, WeightEntry, WorkoutSession, WorkoutTemplate } from "./types";
import { db, makeId, nowIso } from "./db/database";
import { seedInitialData } from "./db/seed";
import { eligibleAchievements, newAchievementIds } from "./lib/achievements";
import { backupFilename, downloadText, exportBackup, importBackup, toCsv } from "./lib/backup";
import { durationPartsToMinutes, formatDuration, formatPace, habitAdherence, minutesToDurationParts, monthSummary, paceMinutesPerKm, parsePace, speedKmPerHour, summarizeWeek } from "./lib/calculations";
import { ACHIEVEMENTS, HABITS, MONTH_END, MONTH_START } from "./lib/constants";
import { dateRange, formatDisplayDate, monthDay, todayLocalDate, weekDates, weekNumber } from "./lib/dates";

type AppData = {
  templates: WorkoutTemplate[];
  exercises: ExerciseDefinition[];
  planned: PlannedSession[];
  sessions: WorkoutSession[];
  exerciseLogs: ExerciseLog[];
  setLogs: SetLog[];
  walks: Walk[];
  weights: WeightEntry[];
  waists: WaistEntry[];
  habits: DailyHabit[];
  reviews: WeeklyReview[];
  achievements: AchievementRecord[];
};

const emptyData: AppData = { templates: [], exercises: [], planned: [], sessions: [], exerciseLogs: [], setLogs: [], walks: [], weights: [], waists: [], habits: [], reviews: [], achievements: [] };

function useData() {
  return useLiveQuery(async () => ({
    templates: await db.workoutTemplates.orderBy("order").toArray(),
    exercises: await db.exerciseDefinitions.orderBy("order").toArray(),
    planned: await db.plannedSessions.orderBy("date").toArray(),
    sessions: await db.workoutSessions.orderBy("date").toArray(),
    exerciseLogs: await db.exerciseLogs.orderBy("order").toArray(),
    setLogs: await db.setLogs.toArray(),
    walks: await db.walks.orderBy("date").toArray(),
    weights: await db.weightEntries.orderBy("date").toArray(),
    waists: await db.waistEntries.orderBy("date").toArray(),
    habits: await db.dailyHabits.orderBy("date").toArray(),
    reviews: await db.weeklyReviews.orderBy("week").toArray(),
    achievements: await db.achievements.orderBy("earnedAt").toArray(),
  }), []) ?? emptyData;
}

const achievementName = (id: string) => ACHIEVEMENTS.find((item) => item[0] === id)?.[1] ?? id;
const card = "rounded-3xl border border-white/10 bg-white/[0.06] p-4 shadow-xl shadow-black/20";
const input = "w-full rounded-2xl border border-white/10 bg-slate-950/80 px-3 py-3 text-sm text-white outline-none ring-emerald-300/40 focus:ring-2";
const button = "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:opacity-50 motion-reduce:transition-none";
const ghost = "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-200";

function App() {
  const [seeded, setSeeded] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [needRefresh, setNeedRefresh] = useState(false);
  const [updateServiceWorker, setUpdateServiceWorker] = useState<{ run: () => Promise<void> } | undefined>();

  useEffect(() => {
    seedInitialData().then(() => setSeeded(true));
    if (import.meta.env.PROD) {
      const update = registerSW({ onOfflineReady: () => setOfflineReady(true), onNeedRefresh: () => setNeedRefresh(true) });
      queueMicrotask(() => setUpdateServiceWorker({ run: update }));
    }
  }, []);

  if (!seeded) return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">Preparing Month 1...</div>;

  return (
    <HashRouter>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#312e81,transparent_34rem),linear-gradient(160deg,#020617,#111827_55%,#052e2b)] text-slate-100">
        <SkipLink />
        <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link to="/" className="flex items-center gap-3 font-black tracking-tight"><span className="rounded-2xl bg-emerald-400 p-2 text-slate-950"><Dumbbell size={20} /></span>85 kg Rebuild</Link>
            <span className="hidden text-xs text-slate-300 sm:block">Month 1: {MONTH_START} to {MONTH_END}</span>
          </div>
        </header>
        <main id="main" className="mx-auto max-w-6xl px-4 pb-28 pt-5">
          {(offlineReady || needRefresh) && <div className={`${card} mb-4 flex items-center justify-between gap-3`}><span>{needRefresh ? "App update available. Refresh when no workout is active." : "Offline-ready after first load."}</span>{needRefresh && <button className={button} onClick={() => updateServiceWorker?.run()}>Refresh</button>}</div>}
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/strength" element={<Strength />} />
            <Route path="/strength/:sessionId" element={<WorkoutLogger />} />
            <Route path="/walks" element={<Walks />} />
            <Route path="/body" element={<Body />} />
            <Route path="/habits" element={<Habits />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/summaries" element={<Summaries />} />
            <Route path="/backup" element={<Backup />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </HashRouter>
  );
}

function SkipLink() {
  return <a className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-xl focus:bg-white focus:px-3 focus:py-2 focus:text-slate-950" href="#main">Skip to content</a>;
}

function BottomNav() {
  const items = [["/", Home, "Home"], ["/strength", Dumbbell, "Lift"], ["/walks", Footprints, "Walk"], ["/body", Scale, "Body"], ["/habits", Check, "Habits"], ["/summaries", Trophy, "Stats"], ["/backup", DatabaseBackup, "Backup"]] as const;
  return <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-slate-950/95 px-2 py-2 backdrop-blur"><div className="mx-auto grid max-w-3xl grid-cols-7 gap-1">{items.map(([to, Icon, label]) => <NavLink key={to} to={to} className={({ isActive }) => `flex min-h-14 flex-col items-center justify-center rounded-2xl text-[11px] ${isActive ? "bg-emerald-400 text-slate-950" : "text-slate-300"}`}><Icon size={19} /><span>{label}</span></NavLink>)}</div></nav>;
}

function Dashboard() {
  const data = useData();
  useAchievementSync(data);
  const today = todayLocalDate();
  const shownDate = today < MONTH_START || today > MONTH_END ? MONTH_START : today;
  const week = weekNumber(shownDate);
  const weekSummary = summarizeWeek(week, data.sessions, data.walks, data.weights, data.waists, data.habits, data.reviews);
  const month = monthSummary(data.sessions, data.walks, data.weights, data.waists, data.habits, data.reviews);
  const next = data.planned.find((session) => session.status !== "completed" && session.date >= shownDate) ?? data.planned.find((session) => session.status !== "completed");
  const latestAchievement = data.achievements.at(-1);
  const reminders = [weekSummary.walks < 3 ? `${3 - weekSummary.walks} walk(s) secure your weekly minimum` : "Walk minimum secured", weekSummary.strength < 3 ? `${3 - weekSummary.strength} strength session(s) remain this week` : "Three strength sessions complete", data.weights.at(-1) ? "Weight trend is being tracked" : "No bodyweight recorded yet", data.waists.some((entry) => weekDates(week).includes(entry.date)) ? "Waist recorded this week" : "Waist measurement is due", data.reviews.some((review) => review.week === week) ? "Weekly review complete" : "Weekly review is ready"];
  return <Page title="Dashboard" subtitle="Useful in three seconds: today, targets, reminders, and fast logging.">
    <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
      <section className={`${card} bg-gradient-to-br from-white/10 to-emerald-400/10`}>
        <p className="text-sm text-slate-300">{formatDisplayDate(shownDate)} · Week {week} · Day {monthDay(shownDate)} of 28</p>
        <h2 className="mt-2 text-3xl font-black">{weekSummary.tier.message}</h2>
        <Progress label="Time progress" value={(monthDay(shownDate) / 28) * 100} text={`${monthDay(shownDate)}/28 days`} />
        <Progress label="Adherence progress" value={month.adherenceScore} text={`${month.adherenceScore}% score`} />
      </section>
      <section className={card}>
        <h2 className="text-xl font-bold">Quick log</h2>
        <div className="mt-3 grid grid-cols-2 gap-2"><Link className={button} to="/strength">Start strength</Link><Link className={button} to="/walks">Log walk</Link><Link className={ghost} to="/body">Weight/waist</Link><Link className={ghost} to="/habits">Daily habits</Link><Link className={ghost} to="/reviews">Weekly review</Link><Link className={ghost} to="/backup">Backup</Link></div>
      </section>
    </div>
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Strength this week" value={`${weekSummary.strength}/3`} /><Metric label="Walks this week" value={`${weekSummary.walks}/3`} /><Metric label="Current weight" value={data.weights.at(-1)?.weightKg ? `${data.weights.at(-1)?.weightKg} kg` : "-"} /><Metric label="Latest waist" value={data.waists.at(-1)?.waistCm ? `${data.waists.at(-1)?.waistCm} cm` : "-"} /></div>
    <div className="mt-4 grid gap-4 lg:grid-cols-2"><CalendarPanel data={data} /><section className={card}><h2 className="text-xl font-bold">Reminders</h2><ul className="mt-3 space-y-2">{reminders.map((item) => <li key={item} className="rounded-2xl bg-white/5 p-3 text-sm">{item}</li>)}</ul><p className="mt-4 text-sm text-slate-300">Next strength: {next ? `${formatDisplayDate(next.date)} · ${data.templates.find((template) => template.id === next.templateId)?.name}` : "All planned sessions complete"}</p><p className="mt-2 text-sm text-slate-300">Latest achievement: {latestAchievement ? achievementName(latestAchievement.achievementId) : "None yet"}</p></section></div>
  </Page>;
}

function Page({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return <><div className="mb-5"><h1 className="text-3xl font-black tracking-tight sm:text-4xl">{title}</h1><p className="mt-1 max-w-2xl text-sm text-slate-300">{subtitle}</p></div>{children}</>;
}

function Progress({ label, value, text }: { label: string; value: number; text: string }) {
  return <div className="mt-5"><div className="mb-2 flex justify-between text-sm"><span>{label}</span><span>{text}</span></div><div className="h-3 rounded-full bg-slate-950/70"><div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div></div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className={card}><p className="text-sm text-slate-400">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></div>;
}

function CalendarPanel({ data }: { data: AppData }) {
  return <section className={card}><h2 className="mb-3 flex items-center gap-2 text-xl font-bold"><CalendarDays size={20} /> Month 1 calendar</h2><div className="grid grid-cols-7 gap-2 text-center text-xs">{["M", "T", "W", "T", "F", "S", "S"].map((day, index) => <div key={`${day}-${index}`} className="text-slate-400">{day}</div>)}{dateRange().map((date) => { const labels = [data.planned.some((item) => item.date === date) ? "planned strength" : "", data.sessions.some((item) => item.date === date && item.status === "completed") ? "completed strength" : "", data.walks.some((item) => item.date === date) ? "walk" : "", data.weights.some((item) => item.date === date) ? "weight" : "", data.waists.some((item) => item.date === date) ? "waist" : "", data.habits.some((item) => item.date === date) ? "habits" : ""].filter(Boolean); return <Link to={`/summaries?date=${date}`} key={date} className="min-h-20 rounded-2xl border border-white/10 bg-slate-950/40 p-2 text-left focus:ring-2 focus:ring-cyan-200"><span className="font-bold">{date.slice(-2)}</span><span className="mt-1 block text-[10px] text-slate-300">{labels.join(", ") || "open"}</span></Link>; })}</div></section>;
}

function Strength() {
  const data = useData();
  const [editorOpen, setEditorOpen] = useState(false);
  const active = data.sessions.find((session) => session.status === "in-progress");
  const completed = data.sessions.filter((session) => session.status === "completed").sort((a, b) => b.date.localeCompare(a.date));
  return <Page title="Strength" subtitle="Schedule first, workout history second, program editing only when you need it.">
    <div className="mb-4 flex flex-wrap gap-2"><button className={ghost} onClick={() => setEditorOpen(true)}><Pencil size={16} /> Edit program</button>{active && <Link className={button} to={`/strength/${active.id}`}>Resume active workout</Link>}</div>
    {active && <section className={`${card} mb-4 border-emerald-300/40 bg-emerald-400/10`}><p className="text-sm font-bold uppercase tracking-wide text-emerald-200">Active workout</p><div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-2xl font-black">{active.workoutName}</h2><p className="text-sm text-slate-300">Started {active.date}. Your logged sets are saved locally.</p></div><Link className={button} to={`/strength/${active.id}`}>Resume workout</Link></div></section>}
    <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]"><section className={card}><h2 className="text-xl font-bold">Month 1 schedule</h2><div className="mt-3 space-y-3">{data.planned.map((planned) => <PlannedSessionRow key={planned.id} planned={planned} templates={data.templates} sessions={data.sessions} />)}</div></section><section className={card}><h2 className="text-xl font-bold">Completed workouts</h2><p className="mt-1 text-sm text-slate-400">Completed sessions stay editable and deletable.</p><div className="mt-3 space-y-3">{completed.length ? completed.map((session) => <SessionCard key={session.id} session={session} />) : <p className="rounded-2xl bg-white/5 p-3 text-sm text-slate-300">No completed workouts yet.</p>}</div></section></div>
    {editorOpen && <div className="fixed inset-0 z-50 bg-slate-950/80 p-3 backdrop-blur" role="dialog" aria-modal="true" aria-label="Workout editor"><div className="mx-auto max-h-[calc(100vh-1.5rem)] max-w-4xl overflow-auto rounded-3xl border border-white/10 bg-slate-950 p-4 shadow-2xl"><div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-2xl font-black">Edit program</h2><button className={ghost} onClick={() => setEditorOpen(false)}>Close</button></div><WorkoutEditor data={data} /></div></div>}
  </Page>;
}

function SessionCard({ session }: { session: WorkoutSession }) {
  return <div className="flex flex-col justify-between gap-3 rounded-2xl bg-white/5 p-3 sm:flex-row sm:items-center"><div><p className="font-bold">{session.workoutName}</p><p className="text-sm text-slate-300">{session.date} · <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-emerald-100">{session.status}</span></p></div><div className="flex gap-2"><Link className={ghost} to={`/strength/${session.id}`}><Pencil size={16} /> Open / Edit</Link><button className={ghost} onClick={() => deleteSession(session.id)}><Trash2 size={16} /> Delete</button></div></div>;
}

function PlannedSessionRow({ planned, templates, sessions }: { planned: PlannedSession; templates: WorkoutTemplate[]; sessions: WorkoutSession[] }) {
  const navigate = useNavigate();
  const [date, setDate] = useState(planned.date);
  const [status, setStatus] = useState(planned.status);
  async function save() { await db.plannedSessions.update(planned.id, { date, status, week: weekNumber(date), updatedAt: nowIso() }); }
  async function start() { const sessionId = await createWorkoutSession(planned); localStorage.setItem("activeWorkoutSessionId", sessionId); navigate(`/strength/${sessionId}`); }
  const existing = sessions.find((session) => session.plannedSessionId === planned.id && session.status === "in-progress");
  return <div className="rounded-2xl bg-white/5 p-3"><p className="font-bold">Week {planned.week} slot {planned.slot}: {templates.find((template) => template.id === planned.templateId)?.name}</p>{existing && <p className="mt-1 text-sm text-emerald-200">In progress. Use Resume to keep your saved sets.</p>}<div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto]"><input aria-label="Session date" className={input} type="date" value={date} onChange={(event) => setDate(event.target.value)} /><select aria-label="Session status" className={input} value={status} onChange={(event) => setStatus(event.target.value as PlannedSession["status"])}><option value="planned">Planned</option><option value="in-progress">In progress</option><option value="completed">Completed</option><option value="missed">Missed</option><option value="rescheduled">Rescheduled</option><option value="skipped-pain">Skipped due to pain</option><option value="skipped-recovery">Skipped due to recovery</option></select><button className={ghost} onClick={save}><Save size={16} /> Save</button>{existing ? <Link className={button} to={`/strength/${existing.id}`}>Resume</Link> : <button className={button} onClick={start}>Start</button>}</div></div>;
}

async function createWorkoutSession(planned: PlannedSession) {
  const existing = await db.workoutSessions.where("plannedSessionId").equals(planned.id).and((session) => session.status === "in-progress").first();
  if (existing) return existing.id;
  const template = await db.workoutTemplates.get(planned.templateId);
  const id = makeId("session");
  await db.transaction("rw", db.workoutSessions, db.exerciseDefinitions, db.exerciseLogs, db.setLogs, db.plannedSessions, async () => {
    await db.workoutSessions.add({ id, date: planned.date, week: weekNumber(planned.date), templateId: planned.templateId, workoutName: template?.name ?? "Workout", status: "in-progress", plannedSessionId: planned.id, startedAt: nowIso(), pausedSeconds: 0, notes: "", createdAt: nowIso(), updatedAt: nowIso() });
    await db.plannedSessions.update(planned.id, { status: "in-progress", updatedAt: nowIso() });
    const exercises = await db.exerciseDefinitions.where("templateId").equals(planned.templateId).and((exercise) => exercise.enabled).sortBy("order");
    for (const exercise of exercises) {
      const exerciseLogId = makeId("exercise-log");
      await db.exerciseLogs.add({ id: exerciseLogId, sessionId: id, exerciseDefinitionId: exercise.id, name: exercise.name, order: exercise.order, category: exercise.category, type: exercise.type, restSeconds: exercise.restSeconds, instructions: exercise.instructions, createdAt: nowIso(), updatedAt: nowIso() });
      for (let set = 1; set <= exercise.sets; set += 1) await db.setLogs.add({ id: makeId("set"), sessionId: id, exerciseLogId, setNumber: set, weight: exercise.defaultWeight, reps: "", rir: "", completed: false, note: "", painStatus: "none", createdAt: nowIso(), updatedAt: nowIso() });
    }
  });
  return id;
}

async function deleteSession(id: string) {
  if (!confirm("Delete this workout and all set logs?")) return;
  await db.transaction("rw", db.workoutSessions, db.exerciseLogs, db.setLogs, async () => { await db.workoutSessions.delete(id); await db.exerciseLogs.where("sessionId").equals(id).delete(); await db.setLogs.where("sessionId").equals(id).delete(); });
  if (localStorage.getItem("activeWorkoutSessionId") === id) localStorage.removeItem("activeWorkoutSessionId");
}

function WorkoutEditor({ data }: { data: AppData }) {
  const [selected, setSelected] = useState("template-workout-a");
  const template = data.templates.find((item) => item.id === selected);
  const exercises = data.exercises.filter((exercise) => exercise.templateId === selected);
  async function addExercise() { await db.exerciseDefinitions.add({ id: makeId("exercise"), templateId: selected, name: "New exercise", order: exercises.length + 1, sets: 2, repRange: "8-12", defaultWeight: "bodyweight", restSeconds: 90, instructions: "", category: "general", type: "compound", enabled: true, createdAt: nowIso(), updatedAt: nowIso() }); }
  return <section className={card}><h2 className="text-xl font-bold">Workout editor</h2><select aria-label="Workout template" className={`${input} mt-3`} value={selected} onChange={(event) => setSelected(event.target.value)}>{data.templates.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>{template && <input aria-label="Workout name" className={`${input} mt-2`} value={template.name} onChange={(event) => db.workoutTemplates.update(template.id, { name: event.target.value, updatedAt: nowIso() })} />}<div className="mt-3 space-y-3">{exercises.map((exercise) => <ExerciseEdit key={exercise.id} exercise={exercise} />)}</div><button className={`${button} mt-3`} onClick={addExercise}><Plus size={16} /> Add exercise</button></section>;
}

function ExerciseEdit({ exercise }: { exercise: ExerciseDefinition }) {
  const update = (patch: Partial<ExerciseDefinition>) => db.exerciseDefinitions.update(exercise.id, { ...patch, updatedAt: nowIso() });
  return <div className="rounded-2xl bg-slate-950/50 p-3"><div className="grid gap-2 sm:grid-cols-2"><input aria-label="Exercise name" className={input} value={exercise.name} onChange={(event) => update({ name: event.target.value })} /><input aria-label="Category" className={input} value={exercise.category} onChange={(event) => update({ category: event.target.value })} /><input aria-label="Sets" className={input} type="number" value={exercise.sets} onChange={(event) => update({ sets: Number(event.target.value) })} /><input aria-label="Rep range" className={input} value={exercise.repRange} onChange={(event) => update({ repRange: event.target.value })} /><input aria-label="Default weight" className={input} value={exercise.defaultWeight} onChange={(event) => update({ defaultWeight: event.target.value })} /><input aria-label="Rest seconds" className={input} type="number" value={exercise.restSeconds} onChange={(event) => update({ restSeconds: Number(event.target.value) })} /><select aria-label="Exercise type" className={input} value={exercise.type} onChange={(event) => update({ type: event.target.value as ExerciseDefinition["type"] })}><option value="compound">Compound</option><option value="isolation">Isolation</option><option value="core">Core</option><option value="loaded carry">Loaded carry</option></select><label className="flex items-center gap-2 rounded-2xl bg-white/5 px-3"><input type="checkbox" checked={exercise.enabled} onChange={(event) => update({ enabled: event.target.checked })} /> Enabled</label></div><textarea aria-label="Instructions" className={`${input} mt-2`} value={exercise.instructions} onChange={(event) => update({ instructions: event.target.value })} /><button className={`${ghost} mt-2`} onClick={() => db.exerciseDefinitions.delete(exercise.id)}><Trash2 size={16} /> Remove</button></div>;
}

function WorkoutLogger() {
  const { sessionId = "" } = useParams();
  const data = useData();
  const session = data.sessions.find((item) => item.id === sessionId);
  const logs = data.exerciseLogs.filter((log) => log.sessionId === sessionId).sort((a, b) => a.order - b.order);
  const [timer, setTimer] = usePersistentTimer();
  const [savedMessage, setSavedMessage] = useState("");
  useEffect(() => { if (session?.status === "in-progress") localStorage.setItem("activeWorkoutSessionId", session.id); }, [session?.id, session?.status]);
  if (!session) return <Page title="Workout not found" subtitle="The session may have been deleted."><Link className={button} to="/strength">Back to strength</Link></Page>;
  const sets = data.setLogs.filter((set) => set.sessionId === sessionId);
  const completion = sets.length ? Math.round((sets.filter((set) => set.completed).length / sets.length) * 100) : 0;
  async function complete() { const sessionIdToUpdate = session!.id; const plannedSessionId = session!.plannedSessionId; await db.workoutSessions.update(sessionIdToUpdate, { status: "completed", endedAt: nowIso(), updatedAt: nowIso() }); if (plannedSessionId) await db.plannedSessions.update(plannedSessionId, { status: "completed", updatedAt: nowIso() }); localStorage.removeItem("activeWorkoutSessionId"); setSavedMessage("Workout saved. Nice work."); }
  return <Page title={session.workoutName} subtitle={`${session.date} · ${completion}% complete · completed workouts remain editable.`}>
    {savedMessage && <div className={`${card} mb-4 border-emerald-300/40 bg-emerald-400/10`}><p className="font-bold text-emerald-100">{savedMessage}</p><div className="mt-3 flex gap-2"><Link className={button} to="/strength">Back to Strength</Link><button className={ghost} onClick={() => setSavedMessage("")}>Keep editing</button></div></div>}
    <div className="grid gap-4 lg:grid-cols-[1fr_20rem]"><aside className="lg:order-2 lg:sticky lg:top-20 lg:self-start"><div className="sticky top-16 z-10 space-y-4 lg:static"><TimerPanel timer={timer} setTimer={setTimer} /><section className={card}><div className="mb-3 flex items-center justify-between gap-2"><span className={`rounded-full px-3 py-1 text-xs font-bold ${session.status === "completed" ? "bg-emerald-400/20 text-emerald-100" : "bg-cyan-400/20 text-cyan-100"}`}>{session.status}</span><span className="text-sm text-slate-300">{completion}% complete</span></div><label className="text-sm text-slate-300">Workout date</label><input className={`${input} mt-1`} type="date" value={session.date} onChange={(event) => db.workoutSessions.update(session.id, { date: event.target.value, week: weekNumber(event.target.value), updatedAt: nowIso() })} /><label className="mt-3 block text-sm text-slate-300">Notes</label><textarea className={`${input} mt-1`} value={session.notes} onChange={(event) => db.workoutSessions.update(session.id, { notes: event.target.value, updatedAt: nowIso() })} /><button className={`${button} mt-3 w-full`} onClick={complete} disabled={session.status === "completed"}>{session.status === "completed" ? "Workout completed" : "Complete workout"}</button>{session.status === "completed" && <Link className={`${ghost} mt-2 w-full`} to="/strength">Back to Strength</Link>}</section><ReadinessForm sessionId={session.id} date={session.date} /></div></aside><section className="space-y-4 lg:order-1">{logs.map((log) => <ExerciseLogCard key={log.id} log={log} sets={sets.filter((set) => set.exerciseLogId === log.id)} onRest={(seconds) => setTimer({ id: makeId("timer"), label: `${log.name} rest`, durationSeconds: seconds, startedAt: nowIso(), pausedSeconds: 0 })} />)}</section></div>
  </Page>;
}

function ExerciseLogCard({ log, sets, onRest }: { log: ExerciseLog; sets: SetLog[]; onRest: (seconds: number) => void }) {
  const painCount = useLiveQuery(() => db.setLogs.where("painStatus").notEqual("none").and((set) => set.exerciseLogId === log.id || set.sessionId === log.sessionId).count(), [log.id, log.sessionId]) ?? 0;
  const [expanded, setExpanded] = useState(false);
  const allComplete = sets.length > 0 && sets.every((set) => set.completed);
  const shouldShowSets = expanded || !allComplete;
  const lastSet = [...sets].sort((a, b) => b.setNumber - a.setNumber).find((set) => set.completed);
  return <section className={card}><div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-bold">{log.name}</h2><p className="text-sm text-slate-300">{log.category} · {log.type} · rest {log.restSeconds}s</p></div>{allComplete && <button className={ghost} onClick={() => setExpanded(!expanded)}>{shouldShowSets ? "Collapse" : "Expand to edit"}</button>}</div>{allComplete && !shouldShowSets && <p className="mt-2 rounded-2xl bg-emerald-400/10 p-3 text-sm text-emerald-100">{sets.filter((set) => set.completed).length}/{sets.length} sets complete{lastSet ? ` · last: ${lastSet.weight} x ${lastSet.reps || "?"}` : ""}</p>}{shouldShowSets && <><p className="mt-1 text-sm text-slate-400">{log.instructions}</p>{painCount >= 2 && <p className="mt-2 rounded-2xl border border-amber-300/40 bg-amber-400/10 p-3 text-sm text-amber-100">This exercise has caused discomfort more than once. Replace or review it before repeating.</p>}<div className="mt-3 space-y-2">{sets.sort((a, b) => a.setNumber - b.setNumber).map((set) => <SetRow key={set.id} set={set} restSeconds={log.restSeconds} onRest={onRest} />)}</div></>}</section>;
}

function SetRow({ set, restSeconds, onRest }: { set: SetLog; restSeconds: number; onRest: (seconds: number) => void }) {
  async function update(patch: Partial<SetLog>) { await db.setLogs.update(set.id, { ...patch, updatedAt: nowIso() }); }
  async function toggle() { const completed = !set.completed; await update({ completed }); if (completed) onRest(restSeconds); }
  return <div className="grid gap-2 rounded-2xl bg-white/5 p-2 sm:grid-cols-[3rem_1fr_1fr_1fr_1fr_auto]"><span className="self-center font-bold">Set {set.setNumber}</span><input aria-label="Weight" className={input} value={set.weight} onChange={(event) => update({ weight: event.target.value })} /><input aria-label="Reps" className={input} value={set.reps} placeholder="reps" onChange={(event) => update({ reps: event.target.value })} /><label className="text-xs text-slate-300"><span>RIR</span><input aria-label="RIR" className={`${input} mt-1`} value={set.rir} placeholder="RIR (0-5)" onChange={(event) => update({ rir: event.target.value })} /></label><select aria-label="Pain status" className={input} value={set.painStatus} onChange={(event) => update({ painStatus: event.target.value as PainStatus })}><option value="none">No pain</option><option value="mild">Mild discomfort</option><option value="stopped-set">Pain, stopped set</option><option value="stopped-exercise">Pain, stopped exercise</option><option value="stopped-workout">Pain, stopped workout</option></select><button className={set.completed ? ghost : button} onClick={toggle}>{set.completed ? "Done" : "Complete"}</button><p className="text-xs text-slate-400 sm:col-span-6">RIR = reps in reserve. 2 means you could have done about 2 more good reps.</p><input aria-label="Set note" className={`${input} sm:col-span-6`} value={set.note} placeholder="Optional set note" onChange={(event) => update({ note: event.target.value })} /></div>;
}

function usePersistentTimer(): [TimerState | undefined, (timer?: TimerState) => void] {
  const [timer, setTimerState] = useState<TimerState | undefined>(() => { const raw = localStorage.getItem("active-rest-timer"); return raw ? JSON.parse(raw) as TimerState : undefined; });
  const setTimer = (next?: TimerState) => { setTimerState(next); if (next) localStorage.setItem("active-rest-timer", JSON.stringify(next)); else localStorage.removeItem("active-rest-timer"); };
  return [timer, setTimer];
}

function TimerPanel({ timer, setTimer }: { timer?: TimerState; setTimer: (timer?: TimerState) => void }) {
  const [tick, setTick] = useState(0);
  const alertedTimer = useRef<string>("");
  useEffect(() => { const id = window.setInterval(() => setTick((value) => value + 1), 1000); return () => window.clearInterval(id); }, []);
  const elapsed = timer ? timer.pausedAt ? differenceInSeconds(new Date(timer.pausedAt), new Date(timer.startedAt)) - timer.pausedSeconds : differenceInSeconds(new Date(), new Date(timer.startedAt)) - timer.pausedSeconds : 0;
  const remaining = timer ? Math.max(0, timer.durationSeconds - elapsed + tick * 0) : 0;
  useEffect(() => { if (timer && remaining === 0 && !timer.skipped && alertedTimer.current !== timer.id) { alertedTimer.current = timer.id; navigator.vibrate?.(120); playTimerBeep(); } }, [remaining, timer]);
  if (!timer) return <section className={card}><h2 className="flex items-center gap-2 text-xl font-bold"><TimerReset /> Rest timer</h2><p className="mt-2 text-sm text-slate-300">Completing a set starts a timestamp-based rest timer.</p></section>;
  return <section className={card}><h2 className="text-xl font-bold">{timer.label}</h2><p className="mt-2 text-5xl font-black tabular-nums">{Math.floor(remaining / 60)}:{(remaining % 60).toString().padStart(2, "0")}</p><p className="text-xs text-slate-400">Ends around {format(addSeconds(new Date(timer.startedAt), timer.durationSeconds + timer.pausedSeconds), "HH:mm:ss")}</p><div className="mt-3 grid grid-cols-2 gap-2"><button className={ghost} onClick={() => setTimer(timer.pausedAt ? { ...timer, pausedSeconds: timer.pausedSeconds + differenceInSeconds(new Date(), new Date(timer.pausedAt)), pausedAt: undefined } : { ...timer, pausedAt: nowIso() })}>{timer.pausedAt ? "Resume" : "Pause"}</button><button className={ghost} onClick={() => setTimer({ ...timer, durationSeconds: timer.durationSeconds + 15 })}>+15 sec</button><button className={ghost} onClick={() => setTimer({ ...timer, durationSeconds: Math.max(15, timer.durationSeconds - 15) })}>-15 sec</button><button className={button} onClick={() => setTimer(undefined)}>Skip</button></div></section>;
}

function playTimerBeep() {
  const AudioContextClass = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = 880;
  gain.gain.value = 0.05;
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.18);
}

function Walks() {
  const data = useData();
  const [editing, setEditing] = useState<Walk | undefined>();
  const summary = monthSummary(data.sessions, data.walks, data.weights, data.waists, data.habits, data.reviews);
  return <Page title="Walks" subtitle="Fast phone logging with edit, duplicate, delete, pace, and shin monitoring."><WalkForm editing={editing} done={() => setEditing(undefined)} /><div className="mt-4 grid gap-4 sm:grid-cols-3"><Metric label="Walks this month" value={String(summary.walkCount)} /><Metric label="Distance" value={`${summary.distance.toFixed(1)} km`} /><Metric label="Average pace" value={formatPace(summary.averagePace)} /></div><RecordList records={data.walks} render={(walk) => { const shownPace = walk.averagePace ?? paceMinutesPerKm(walk.distanceKm, walk.durationMinutes); return <><p className="font-bold">{walk.date} · {walk.distanceKm} km · {formatPace(shownPace)}</p><p className="text-sm text-slate-300">{formatDuration(walk.durationMinutes)} · {speedKmPerHour(walk.distanceKm, walk.durationMinutes).toFixed(1)} km/h · fastest split {walk.fastestSplit ? formatPace(walk.fastestSplit) : "-"} · shin: {walk.shinDiscomfort}</p>{["moderate", "severe"].includes(walk.shinDiscomfort) && <p className="mt-1 text-sm text-amber-200">Reduce impact and review footwear, surface, distance, and recovery.</p>}<div className="mt-2 flex gap-2"><button className={ghost} onClick={() => setEditing(walk)}>Edit</button><button className={ghost} onClick={() => duplicateWalk(walk)}>Duplicate</button><button className={ghost} onClick={() => confirm("Delete this walk?") && db.walks.delete(walk.id)}>Delete</button></div></>; }} /></Page>;
}

function WalkForm({ editing, done }: { editing?: Walk; done: () => void }) {
  return <WalkFormInner key={editing?.id ?? "new"} editing={editing} done={done} />;
}

function WalkFormInner({ editing, done }: { editing?: Walk; done: () => void }) {
  const durationParts = minutesToDurationParts(editing?.durationMinutes ?? 35);
  const [form, setForm] = useState({ date: editing?.date ?? todayLocalDate(), time: editing?.time ?? "07:00", distanceKm: editing?.distanceKm ?? 3, hours: durationParts.hours, minutes: durationParts.minutes, seconds: durationParts.seconds, averagePace: editing?.averagePace ? formatPace(editing.averagePace).replace("/km", "") : "", fastestSplit: editing?.fastestSplit ? formatPace(editing.fastestSplit).replace("/km", "") : "", route: editing?.route ?? "", dayPart: editing?.dayPart ?? "morning", setting: editing?.setting ?? "outside", effort: editing?.effort ?? 5, shinDiscomfort: editing?.shinDiscomfort ?? "none", notes: editing?.notes ?? "" });
  async function save() { const durationMinutes = durationPartsToMinutes(Number(form.hours), Number(form.minutes), Number(form.seconds)); const averagePace = parsePace(form.averagePace) ?? paceMinutesPerKm(form.distanceKm, durationMinutes); const fastestSplit = parsePace(form.fastestSplit); const payload = { date: form.date, time: form.time, distanceKm: form.distanceKm, durationMinutes, averagePace: averagePace || undefined, fastestSplit, route: form.route, dayPart: form.dayPart, setting: form.setting, effort: form.effort || undefined, shinDiscomfort: form.shinDiscomfort as Walk["shinDiscomfort"], notes: form.notes, updatedAt: nowIso() }; if (editing) await db.walks.update(editing.id, payload); else await db.walks.add({ id: makeId("walk"), ...payload, createdAt: nowIso() }); done(); }
  return <section className={card}><h2 className="text-xl font-bold">{editing ? "Edit walk" : "Log walk"}</h2><div className="mt-3 grid gap-2 sm:grid-cols-2"><FormInput label="Date" type="date" value={form.date} set={(value) => setForm({ ...form, date: value })} /><FormInput label="Time" type="time" value={form.time} set={(value) => setForm({ ...form, time: value })} /><FormInput label="Distance km" type="number" value={form.distanceKm} set={(value) => setForm({ ...form, distanceKm: Number(value) })} /><div className="grid grid-cols-3 gap-2"><FormInput label="Hours" type="number" value={form.hours} set={(value) => setForm({ ...form, hours: Number(value) })} /><FormInput label="Minutes" type="number" value={form.minutes} set={(value) => setForm({ ...form, minutes: Number(value) })} /><FormInput label="Seconds" type="number" value={form.seconds} set={(value) => setForm({ ...form, seconds: Number(value) })} /></div><FormInput label="Average pace" placeholder="11:03/km" value={form.averagePace} set={(value) => setForm({ ...form, averagePace: value })} /><FormInput label="Fastest split" placeholder="10:30/km" value={form.fastestSplit} set={(value) => setForm({ ...form, fastestSplit: value })} /><FormInput label="Route" value={form.route} set={(value) => setForm({ ...form, route: value })} /><select className={input} aria-label="Shin discomfort" value={form.shinDiscomfort} onChange={(event) => setForm({ ...form, shinDiscomfort: event.target.value as Walk["shinDiscomfort"] })}><option value="none">No shin discomfort</option><option value="mild">Mild</option><option value="moderate">Moderate</option><option value="severe">Severe</option></select></div><p className="mt-2 text-xs text-slate-400">Leave average pace blank to calculate it from distance and duration. Weekly/month summaries still use total distance and total duration.</p><button className={`${button} mt-3`} onClick={save}>Save walk</button></section>;
}

async function duplicateWalk(walk: Walk) { await db.walks.add({ ...walk, id: makeId("walk"), createdAt: nowIso(), updatedAt: nowIso() }); }

function Body() {
  const data = useData();
  return <Page title="Body" subtitle="Morning bodyweight and weekly waist tracking without overreacting to one reading."><div className="grid gap-4 lg:grid-cols-2"><WeightForm /><WaistForm /></div><div className="mt-4 grid gap-4 sm:grid-cols-4"><Metric label="Starting weight" value={data.weights.at(0)?.weightKg ? `${data.weights.at(0)?.weightKg} kg` : "-"} /><Metric label="Latest weight" value={data.weights.at(-1)?.weightKg ? `${data.weights.at(-1)?.weightKg} kg` : "-"} /><Metric label="Starting waist" value={data.waists.at(0)?.waistCm ? `${data.waists.at(0)?.waistCm} cm` : "-"} /><Metric label="Latest waist" value={data.waists.at(-1)?.waistCm ? `${data.waists.at(-1)?.waistCm} cm` : "-"} /></div><RecordList records={[...data.weights, ...data.waists].sort((a, b) => a.date.localeCompare(b.date))} render={(record) => <><p className="font-bold">{record.date}</p><p className="text-sm text-slate-300">{"weightKg" in record ? `${record.weightKg} kg` : `${record.waistCm} cm`}</p><button className={ghost} onClick={() => confirm("Delete this record?") && ("weightKg" in record ? db.weightEntries.delete(record.id) : db.waistEntries.delete(record.id))}>Delete</button></>} /></Page>;
}

function WeightForm() { const [form, setForm] = useState({ date: todayLocalDate(), time: "06:30", weightKg: 110, morning: true, notes: "" }); async function save() { await db.weightEntries.add({ id: makeId("weight"), ...form, createdAt: nowIso(), updatedAt: nowIso() }); } return <section className={card}><h2 className="text-xl font-bold">Log weight</h2><div className="mt-3 grid gap-2"><FormInput label="Date" type="date" value={form.date} set={(value) => setForm({ ...form, date: value })} /><FormInput label="Time" type="time" value={form.time} set={(value) => setForm({ ...form, time: value })} /><FormInput label="Weight kg" type="number" value={form.weightKg} set={(value) => setForm({ ...form, weightKg: Number(value) })} /><label className="flex gap-2"><input type="checkbox" checked={form.morning} onChange={(event) => setForm({ ...form, morning: event.target.checked })} /> Morning measurement</label><textarea className={input} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></div><button className={`${button} mt-3`} onClick={save}>Save weight</button></section>; }
function WaistForm() { const [form, setForm] = useState({ date: todayLocalDate(), waistCm: 0, location: "Around navel, relaxed, after normal exhale", notes: "" }); async function save() { await db.waistEntries.add({ id: makeId("waist"), ...form, createdAt: nowIso(), updatedAt: nowIso() }); } return <section className={card}><h2 className="text-xl font-bold">Log waist</h2><div className="mt-3 grid gap-2"><FormInput label="Date" type="date" value={form.date} set={(value) => setForm({ ...form, date: value })} /><FormInput label="Waist cm" type="number" value={form.waistCm} set={(value) => setForm({ ...form, waistCm: Number(value) })} /><FormInput label="Location" value={form.location} set={(value) => setForm({ ...form, location: value })} /><textarea className={input} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></div><button className={`${button} mt-3`} onClick={save}>Save waist</button></section>; }

function Habits() {
  const data = useData();
  const [date, setDate] = useState(todayLocalDate());
  const existing = data.habits.find((habit) => habit.date === date);
  const week = weekNumber(date);
  const weekHabitEntries = data.habits.filter((habit) => weekDates(week).includes(habit.date));
  const todayDone = existing ? HABITS.filter((habit) => !existing.disabled.includes(habit) && existing.values[habit]).length : 0;
  const todayPossible = existing ? HABITS.filter((habit) => !existing.disabled.includes(habit)).length : HABITS.length;
  return <Page title="Habits & sleep" subtitle="Habits feed dashboard adherence, weekly reviews, and Month 1 nutrition adherence."><div className="grid gap-4 sm:grid-cols-3"><Metric label="Today" value={`${todayDone}/${todayPossible}`} /><Metric label="Week adherence" value={`${Math.round(habitAdherence(weekHabitEntries))}%`} /><Metric label="Month adherence" value={`${Math.round(habitAdherence(data.habits))}%`} /></div><div className="mt-4 grid gap-4 lg:grid-cols-[1fr_.8fr]"><HabitsInner key={existing?.id ?? date} date={date} setDate={setDate} existing={existing} /><section className={card}><h2 className="text-xl font-bold">Saved habit days</h2><p className="mt-1 text-sm text-slate-400">Tap a day to review or edit it.</p><div className="mt-3 space-y-2">{data.habits.length ? [...data.habits].sort((a, b) => b.date.localeCompare(a.date)).map((habit) => { const done = HABITS.filter((name) => !habit.disabled.includes(name) && habit.values[name]).length; const possible = HABITS.filter((name) => !habit.disabled.includes(name)).length; return <button key={habit.id} className="w-full rounded-2xl bg-white/5 p-3 text-left hover:bg-white/10" onClick={() => setDate(habit.date)}><span className="font-bold">{habit.date}</span><span className="block text-sm text-slate-300">{done}/{possible} habits complete</span></button>; }) : <p className="rounded-2xl bg-white/5 p-3 text-sm text-slate-300">No habit days saved yet.</p>}</div></section></div><SleepAndTakeout /></Page>;
}

function HabitsInner({ date, setDate, existing }: { date: string; setDate: (date: string) => void; existing?: DailyHabit }) {
  const [values, setValues] = useState<Record<string, boolean>>(existing?.values ?? {});
  const [disabled, setDisabled] = useState<string[]>(existing?.disabled ?? []);
  const [saved, setSaved] = useState(false);
  async function save() { const payload = { date, values, disabled, notes: "", updatedAt: nowIso() }; if (existing) await db.dailyHabits.update(existing.id, payload); else await db.dailyHabits.add({ id: makeId("habit"), ...payload, createdAt: nowIso() }); setSaved(true); }
  return <section className={card}><h2 className="text-xl font-bold">Daily checklist</h2>{saved && <p className="mt-2 rounded-2xl bg-emerald-400/10 p-3 text-sm text-emerald-100">Habits saved for {date}.</p>}<input className={`${input} mt-3`} type="date" value={date} onChange={(event) => { setSaved(false); setDate(event.target.value); }} /><div className="mt-3 space-y-2">{HABITS.map((habit) => <div key={habit} className="rounded-2xl bg-white/5 p-3"><label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(values[habit])} disabled={disabled.includes(habit)} onChange={(event) => { setSaved(false); setValues({ ...values, [habit]: event.target.checked }); }} /> {habit}</label><button className="mt-1 text-xs text-slate-300" onClick={() => { setSaved(false); setDisabled(disabled.includes(habit) ? disabled.filter((item) => item !== habit) : [...disabled, habit]); }}>{disabled.includes(habit) ? "Enable" : "Disable"}</button></div>)}</div><button className={`${button} mt-3`} onClick={save}>{saved ? "Saved" : "Save habits"}</button></section>;
}

function SleepAndTakeout() { const [sleep, setSleep] = useState({ date: todayLocalDate(), bedtime: "23:00", wakeTime: "06:30", hours: 6.5, quality: 3 }); async function saveSleep() { await db.sleepEntries.add({ id: makeId("sleep"), ...sleep, createdAt: nowIso(), updatedAt: nowIso() }); } return <section className={`${card} mt-4`}><h2 className="flex items-center gap-2 text-xl font-bold"><Moon /> Sleep</h2><div className="mt-3 grid gap-2 sm:grid-cols-5"><FormInput label="Date" type="date" value={sleep.date} set={(value) => setSleep({ ...sleep, date: value })} /><FormInput label="Bedtime" type="time" value={sleep.bedtime} set={(value) => setSleep({ ...sleep, bedtime: value })} /><FormInput label="Wake" type="time" value={sleep.wakeTime} set={(value) => setSleep({ ...sleep, wakeTime: value })} /><FormInput label="Hours" type="number" value={sleep.hours} set={(value) => setSleep({ ...sleep, hours: Number(value) })} /><FormInput label="Quality" type="number" value={sleep.quality} set={(value) => setSleep({ ...sleep, quality: Number(value) })} /></div><button className={`${button} mt-3`} onClick={saveSleep}>Save sleep</button></section>; }

function ReadinessForm({ sessionId, date }: { sessionId: string; date: string }) {
  const existing = useLiveQuery(() => db.readinessEntries.where("sessionId").equals(sessionId).first(), [sessionId]);
  return <ReadinessFormInner key={existing?.id ?? sessionId} sessionId={sessionId} date={date} existing={existing} />;
}

function ReadinessFormInner({ sessionId, date, existing }: { sessionId: string; date: string; existing?: ReadinessEntry }) {
  const [form, setForm] = useState({ sleepHours: existing?.sleepHours ?? 6.5, energy: existing?.energy ?? "medium", motivation: existing?.motivation ?? "medium", soreness: existing?.soreness ?? "mild", currentPain: existing?.currentPain ?? "none", notes: existing?.notes ?? "" });
  const [saved, setSaved] = useState(false);
  const updateForm = (patch: Partial<typeof form>) => { setSaved(false); setForm({ ...form, ...patch }); };
  async function save() { const payload = { date, sessionId, ...form, updatedAt: nowIso() }; if (existing) await db.readinessEntries.update(existing.id, payload); else await db.readinessEntries.add({ id: makeId("ready"), ...payload, createdAt: nowIso() }); setSaved(true); }
  return <section className={card}><h2 className="text-xl font-bold">Readiness</h2>{saved && <p className="mt-2 rounded-2xl bg-emerald-400/10 p-3 text-sm text-emerald-100">Readiness saved.</p>}<div className="mt-3 grid gap-2"><FormInput label="Sleep hours" type="number" value={form.sleepHours} set={(value) => updateForm({ sleepHours: Number(value) })} /><select className={input} value={form.energy} onChange={(event) => updateForm({ energy: event.target.value })}><option>low</option><option>medium</option><option>high</option></select><FormInput label="Current pain" value={form.currentPain} set={(value) => updateForm({ currentPain: value })} /></div>{form.currentPain !== "none" && <p className="mt-2 text-sm text-amber-200">Train only through pain-free movements. Stop or modify any exercise that reproduces the pain.</p>}<button className={`${ghost} mt-3`} onClick={save}>{saved ? "Saved" : "Save readiness"}</button></section>;
}

function Reviews() { const data = useData(); return <Page title="Weekly reviews" subtitle="Calculated fields are prefilled and comments remain editable."><div className="grid gap-4 lg:grid-cols-2">{[1, 2, 3, 4].map((week) => <ReviewForm key={week} week={week} data={data} />)}</div></Page>; }
function ReviewForm({ week, data }: { week: number; data: AppData }) { const summary = summarizeWeek(week, data.sessions, data.walks, data.weights, data.waists, data.habits, data.reviews); const existing = data.reviews.find((review) => review.week === week); const [form, setForm] = useState({ anyPain: existing?.anyPain ?? "", averageEnergy: existing?.averageEnergy ?? "medium", nutritionAdherence: existing?.nutritionAdherence ?? Math.round(summary.habitAdherence), biggestObstacle: existing?.biggestObstacle ?? "", workedWell: existing?.workedWell ?? "", adjustment: existing?.adjustment ?? "" }); async function save() { const payload = { week, strengthCompleted: summary.strength, walksCompleted: summary.walks, averageBodyweight: summary.weightAverage, waistMeasurement: summary.waist, averageSleep: undefined, ...form, updatedAt: nowIso() }; if (existing) await db.weeklyReviews.update(existing.id, payload); else await db.weeklyReviews.add({ id: makeId("review"), ...payload, createdAt: nowIso() }); } return <section className={card}><h2 className="text-xl font-bold">Week {week}</h2><p className="text-sm text-slate-300">Strength {summary.strength}/3 · walks {summary.walks} · {summary.tier.tier}</p><textarea className={`${input} mt-3`} placeholder="Biggest obstacle" value={form.biggestObstacle} onChange={(event) => setForm({ ...form, biggestObstacle: event.target.value })} /><textarea className={`${input} mt-2`} placeholder="What worked well?" value={form.workedWell} onChange={(event) => setForm({ ...form, workedWell: event.target.value })} /><textarea className={`${input} mt-2`} placeholder="One adjustment" value={form.adjustment} onChange={(event) => setForm({ ...form, adjustment: event.target.value })} /><button className={`${button} mt-3`} onClick={save}>Save review</button></section>; }

function Summaries() { const data = useData(); const month = monthSummary(data.sessions, data.walks, data.weights, data.waists, data.habits, data.reviews); const chartData = [1, 2, 3, 4].map((week) => { const summary = summarizeWeek(week, data.sessions, data.walks, data.weights, data.waists, data.habits, data.reviews); return { week: `W${week}`, distance: Number(summary.distance.toFixed(1)), walks: summary.walks }; }); return <Page title="Summaries" subtitle="Daily, weekly, and Month 1 summaries recalculate after edits and deletes."><div className="grid gap-4 sm:grid-cols-3"><Metric label="Month tier" value={month.tier} /><Metric label="Strength" value={`${month.completedStrength}/12`} /><Metric label="Walks" value={String(month.walkCount)} /></div><section className={`${card} mt-4`}><h2 className="text-xl font-bold">Month 1 report</h2><p className="mt-2 text-sm text-slate-300">Total distance {month.distance.toFixed(1)} km · walking time {formatDuration(month.duration)} · average pace {formatPace(month.averagePace)} · best average pace {formatPace(month.bestPace)} · fastest split {formatPace(month.fastestSplit)} · longest walk {month.longestWalk.toFixed(1)} km.</p><p className="mt-2 text-sm text-slate-300">Weight {month.startingWeight ?? "-"} to {month.latestWeight ?? "-"} kg. Waist {month.startingWaist ?? "-"} to {month.latestWaist ?? "-"} cm. Nutrition adherence {Math.round(month.habitAdherence)}%.</p><p className="mt-4 text-sm text-slate-300">Walking distance chart by week: {chartData.map((item) => `${item.week} ${item.distance} km`).join(", ")}.</p><div className="mt-3 h-56" aria-hidden="true"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData}><CartesianGrid stroke="#334155" strokeDasharray="3 3" /><XAxis dataKey="week" stroke="#cbd5e1" /><YAxis stroke="#cbd5e1" /><Tooltip contentStyle={{ background: "#020617", border: "1px solid #334155", borderRadius: "12px" }} /><Line type="monotone" dataKey="distance" stroke="#34d399" strokeWidth={3} dot /></LineChart></ResponsiveContainer></div></section><div className="mt-4 grid gap-4 lg:grid-cols-2">{[1, 2, 3, 4].map((week) => { const summary = summarizeWeek(week, data.sessions, data.walks, data.weights, data.waists, data.habits, data.reviews); return <section className={card} key={week}><h2 className="text-xl font-bold">Week {week}</h2><p className="mt-2 text-sm text-slate-300">Strength {summary.strength}/3 · walks {summary.walks} · distance {summary.distance.toFixed(1)} km · tier {summary.tier.tier}.</p></section>; })}</div></Page>; }

function Backup() {
  const [preview, setPreview] = useState<string>("");
  const data = useData();
  const walkRows = data.walks.map((walk) => ({
    date: walk.date,
    time: walk.time,
    distanceKm: walk.distanceKm,
    duration: formatDuration(walk.durationMinutes),
    durationMinutes: walk.durationMinutes,
    averagePace: formatPace(walk.averagePace ?? paceMinutesPerKm(walk.distanceKm, walk.durationMinutes)),
    fastestSplit: walk.fastestSplit ? formatPace(walk.fastestSplit) : "",
    shinDiscomfort: walk.shinDiscomfort,
    notes: walk.notes,
  }));
  const measurementRows = [
    ...data.weights.map((entry) => ({ type: "weight", date: entry.date, value: entry.weightKg, unit: "kg", notes: entry.notes })),
    ...data.waists.map((entry) => ({ type: "waist", date: entry.date, value: entry.waistCm, unit: "cm", notes: entry.notes })),
  ];
  async function exportJson() {
    const payload = await exportBackup(db);
    await db.settings.update("settings", { lastBackupAt: nowIso(), updatedAt: nowIso() });
    downloadText(backupFilename(), JSON.stringify(payload, null, 2));
  }
  async function importFile(file?: File) {
    if (!file) return;
    const text = await file.text();
    const parsed = JSON.parse(text) as unknown;
    setPreview(`Backup preview ready. Replace import includes ${Object.keys((parsed as { data?: object }).data ?? {}).length} tables.`);
    await exportBackup(db).then((backup) => localStorage.setItem("pre-import-backup", JSON.stringify(backup)));
    await importBackup(db, parsed, "replace");
  }
  return <Page title="Backup & exports" subtitle="Local-only data needs regular backups. Imports are Zod-validated and create a pre-import backup in localStorage."><section className={card}><p className="text-sm text-slate-300">Your records are stored locally in this browser on this device. Export backups regularly. Clearing browser storage may erase your records.</p><div className="mt-3 grid gap-2 sm:grid-cols-2"><button className={button} onClick={exportJson}><DatabaseBackup size={16} /> Export JSON backup</button><label className={ghost}><Upload size={16} /> Import JSON<input className="sr-only" type="file" accept="application/json" onChange={(event) => importFile(event.target.files?.[0])} /></label><button className={ghost} onClick={() => downloadText("walks.csv", toCsv(walkRows), "text/csv")}>CSV walks</button><button className={ghost} onClick={() => downloadText("measurements.csv", toCsv(measurementRows), "text/csv")}>CSV measurements</button><button className={ghost} onClick={() => confirm("Reset all local records? Export a backup first.") && db.delete().then(() => location.reload())}><RotateCcw size={16} /> Reset local data</button></div>{preview && <p className="mt-3 text-sm text-emerald-200">{preview}</p>}</section></Page>;
}

function FormInput({ label, value, set, type = "text", placeholder }: { label: string; value: string | number; set: (value: string) => void; type?: string; placeholder?: string }) { return <label className="text-sm text-slate-300">{label}<input className={`${input} mt-1`} type={type} value={value} placeholder={placeholder} onChange={(event) => set(event.target.value)} /></label>; }
function RecordList<T extends { id: string }>({ records, render }: { records: T[]; render: (record: T) => ReactNode }) { return <section className={`${card} mt-4`}><h2 className="text-xl font-bold">Records</h2><div className="mt-3 space-y-3">{records.map((record) => <div key={record.id} className="rounded-2xl bg-white/5 p-3">{render(record)}</div>)}</div></section>; }

function useAchievementSync(data: AppData) {
  useEffect(() => {
    const eligible = eligibleAchievements({ ...data, today: todayLocalDate() });
    const fresh = newAchievementIds(eligible, data.achievements);
    if (!fresh.length) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    db.achievements.bulkAdd(fresh.map((achievementId) => ({ id: `achievement-${achievementId}`, achievementId, earnedAt: nowIso(), createdAt: nowIso(), updatedAt: nowIso() }))).catch(() => undefined);
    if (!reduced && fresh.some((id) => ["strong-week", "stretch-week"].includes(id))) confetti({ particleCount: fresh.includes("stretch-week") ? 90 : 35, spread: 55, origin: { y: 0.8 } });
  }, [data]);
}

export default App;
