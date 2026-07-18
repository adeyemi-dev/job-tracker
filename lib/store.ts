import { createClient } from "./supabase/client";
import { Application, Interview, InterviewType, InterviewOutcome, Status, Currency, WorkType, ContractType, StatusHistoryEntry } from "./types";

// ─── localStorage helpers (preferences only) ────────────────────────────────

function lsRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { return JSON.parse(localStorage.getItem(key) ?? "") as T; }
  catch { return fallback; }
}
function lsWrite(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ─── Row → Application ───────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapApp(row: any): Application {
  return {
    id: row.id,
    company: row.company,
    role: row.role,
    job_url: row.job_url ?? null,
    status: row.status as Status,
    platform: row.platform ?? null,
    applied_date: row.applied_date,
    followup_date: row.followup_date ?? null,
    notes: row.notes ?? null,
    cv_file: row.cv_file ?? null,
    cv_url: row.cv_url ?? null,
    cl_file: row.cl_file ?? null,
    cl_url: row.cl_url ?? null,
    salary_min: row.salary_min ?? null,
    salary_max: row.salary_max ?? null,
    currency: (row.currency ?? null) as Currency | null,
    work_type: (row.work_type ?? null) as WorkType | null,
    contract_type: (row.contract_type ?? null) as ContractType | null,
    starred: row.starred ?? false,
    tags: (row.tags ?? []) as string[],
    status_history: (row.status_history ?? []) as StatusHistoryEntry[],
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapInterview(row: any): Interview {
  return {
    id: row.id,
    application_id: row.application_id,
    round: row.round,
    type: row.type as InterviewType,
    date: row.date,
    interviewer: row.interviewer ?? null,
    notes: row.notes ?? null,
    outcome: (row.outcome ?? "Pending") as InterviewOutcome,
    created_at: row.created_at,
  };
}

// ─── Applications ────────────────────────────────────────────────────────────

export async function getApps(): Promise<Application[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapApp);
}

export async function getApp(id: string): Promise<Application | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return mapApp(data);
}

export async function createApp(data: Partial<Application>): Promise<Application> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const now = new Date().toISOString();
  const status = (data.status as Status) ?? "Saved";

  const { data: row, error } = await supabase
    .from("applications")
    .insert({
      user_id: user.id,
      company: data.company ?? "",
      role: data.role ?? "",
      job_url: data.job_url ?? null,
      status,
      platform: data.platform ?? null,
      applied_date: data.applied_date ?? now.slice(0, 10),
      followup_date: data.followup_date ?? null,
      notes: data.notes ?? null,
      cv_file: data.cv_file ?? null,
      cv_url: data.cv_url ?? null,
      cl_file: data.cl_file ?? null,
      cl_url: data.cl_url ?? null,
      salary_min: data.salary_min ?? null,
      salary_max: data.salary_max ?? null,
      currency: data.currency ?? null,
      work_type: data.work_type ?? null,
      contract_type: data.contract_type ?? null,
      starred: data.starred ?? false,
      tags: data.tags ?? [],
      status_history: [{ status, changed_at: now }],
    })
    .select()
    .single();

  if (error) throw error;
  return mapApp(row);
}

export async function updateApp(id: string, data: Partial<Application>): Promise<Application> {
  const supabase = createClient();
  const now = new Date().toISOString();

  const { data: current, error: fetchError } = await supabase
    .from("applications")
    .select("status, status_history")
    .eq("id", id)
    .single();
  if (fetchError) throw fetchError;

  const updates: Record<string, unknown> = { ...data, updated_at: now };

  if (data.status && data.status !== current.status) {
    const existing: StatusHistoryEntry[] = current.status_history?.length
      ? current.status_history
      : [{ status: current.status, changed_at: now }];
    updates.status_history = [...existing, { status: data.status, changed_at: now }];
  }

  const { data: row, error } = await supabase
    .from("applications")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return mapApp(row);
}

export async function deleteApp(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("applications").delete().eq("id", id);
  if (error) throw error;
}

// ─── Interviews ──────────────────────────────────────────────────────────────

export async function getInterviews(applicationId: string): Promise<Interview[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("interviews")
    .select("*")
    .eq("application_id", applicationId)
    .order("date", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapInterview);
}

export async function getAllInterviews(): Promise<Record<string, Interview[]>> {
  const supabase = createClient();
  const { data, error } = await supabase.from("interviews").select("*");
  if (error) throw error;
  const result: Record<string, Interview[]> = {};
  for (const row of data ?? []) {
    const iv = mapInterview(row);
    if (!result[iv.application_id]) result[iv.application_id] = [];
    result[iv.application_id].push(iv);
  }
  return result;
}

export async function addInterview(
  applicationId: string,
  data: { type: InterviewType; date: string; interviewer: string | null; notes: string | null; outcome?: InterviewOutcome }
): Promise<Interview> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const existing = await getInterviews(applicationId);
  const now = new Date().toISOString();

  const { data: row, error } = await supabase
    .from("interviews")
    .insert({
      user_id: user.id,
      application_id: applicationId,
      round: existing.length + 1,
      type: data.type,
      date: data.date,
      interviewer: data.interviewer,
      notes: data.notes,
      outcome: data.outcome ?? "Pending",
      created_at: now,
    })
    .select()
    .single();

  if (error) throw error;
  return mapInterview(row);
}

export async function updateInterview(
  applicationId: string,
  id: string,
  data: Partial<Interview>
): Promise<Interview> {
  const supabase = createClient();
  const { data: row, error } = await supabase
    .from("interviews")
    .update({
      type: data.type,
      date: data.date,
      interviewer: data.interviewer,
      notes: data.notes,
      outcome: data.outcome,
    })
    .eq("id", id)
    .eq("application_id", applicationId)
    .select()
    .single();
  if (error) throw error;
  return mapInterview(row);
}

export async function deleteInterview(applicationId: string, id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("interviews")
    .delete()
    .eq("id", id)
    .eq("application_id", applicationId);
  if (error) throw error;
}

// ─── Export / Import ─────────────────────────────────────────────────────────

export async function exportJSON(): Promise<string> {
  const apps = await getApps();
  const interviews = await getAllInterviews();
  return JSON.stringify({ apps, interviews, exported_at: new Date().toISOString() }, null, 2);
}

export async function exportCSV(): Promise<string> {
  const apps = await getApps();
  const headers: (keyof Application)[] = [
    "id", "company", "role", "status", "platform", "applied_date", "followup_date",
    "job_url", "notes", "cv_url", "cl_url",
    "salary_min", "salary_max", "currency", "work_type", "contract_type",
    "created_at", "updated_at",
  ];
  const escape = (v: unknown) => {
    if (v == null) return "";
    const s = String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = apps.map((a) => headers.map((h) => escape(a[h])).join(","));
  return [headers.join(","), ...rows].join("\n");
}

export async function importJSON(json: string): Promise<{ count: number }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const parsed = JSON.parse(json) as { apps?: Application[]; interviews?: Record<string, Interview[]> };
  if (!parsed.apps || !Array.isArray(parsed.apps)) throw new Error("Invalid backup file");

  const appsToInsert = parsed.apps.map((a) => ({
    id: a.id,
    user_id: user.id,
    company: a.company,
    role: a.role,
    job_url: a.job_url,
    status: a.status,
    platform: a.platform,
    applied_date: a.applied_date,
    followup_date: a.followup_date,
    notes: a.notes,
    cv_file: a.cv_file,
    cv_url: a.cv_url,
    cl_file: a.cl_file,
    cl_url: a.cl_url,
    salary_min: a.salary_min,
    salary_max: a.salary_max,
    currency: a.currency,
    work_type: a.work_type,
    contract_type: a.contract_type,
    starred: a.starred ?? false,
    status_history: a.status_history ?? [],
    created_at: a.created_at,
    updated_at: a.updated_at,
  }));

  const { error: appsError } = await supabase
    .from("applications")
    .upsert(appsToInsert, { onConflict: "id" });
  if (appsError) throw appsError;

  if (parsed.interviews) {
    const ivsToInsert = Object.entries(parsed.interviews).flatMap(([appId, ivs]) =>
      ivs.map((iv) => ({
        id: iv.id,
        user_id: user.id,
        application_id: appId,
        round: iv.round,
        type: iv.type,
        date: iv.date,
        interviewer: iv.interviewer,
        notes: iv.notes,
        outcome: iv.outcome ?? "Pending",
        created_at: iv.created_at,
      }))
    );
    if (ivsToInsert.length > 0) {
      const { error: ivsError } = await supabase
        .from("interviews")
        .upsert(ivsToInsert, { onConflict: "id" });
      if (ivsError) throw ivsError;
    }
  }

  return { count: parsed.apps.length };
}

// ─── Daily goal & streak (preferences stay in localStorage) ─────────────────

const GOAL_KEY = "jt-goal";
const REMINDER_TIME_KEY = "jt-reminder-time";
const NOTIF_KEY = "jt-notif-enabled";

export function getDailyGoal(): number { return lsRead<number>(GOAL_KEY, 5); }
export function saveDailyGoal(n: number) { lsWrite(GOAL_KEY, n); }
export function getReminderTime(): string { return lsRead<string>(REMINDER_TIME_KEY, "09:00"); }
export function saveReminderTime(t: string) { lsWrite(REMINDER_TIME_KEY, t); }
export function getNotifEnabled(): boolean { return lsRead<boolean>(NOTIF_KEY, false); }
export function saveNotifEnabled(v: boolean) { lsWrite(NOTIF_KEY, v); }

export async function getTodayCount(): Promise<number> {
  const apps = await getApps();
  const today = new Date().toISOString().slice(0, 10);
  return apps.filter(
    (a) => a.applied_date === today && !["Saved", "In Progress"].includes(a.status)
  ).length;
}

export async function getStreakData(): Promise<{ current: number; best: number }> {
  const apps = await getApps();
  const goal = getDailyGoal();
  if (goal === 0 || apps.length === 0) return { current: 0, best: 0 };

  const countByDay: Record<string, number> = {};
  for (const a of apps) {
    if (!["Saved", "In Progress"].includes(a.status)) {
      countByDay[a.applied_date] = (countByDay[a.applied_date] || 0) + 1;
    }
  }

  const metGoal = (d: string) => (countByDay[d] || 0) >= goal;

  function prevDay(dateStr: string): string {
    const d = new Date(dateStr + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
  }

  const today = new Date().toISOString().slice(0, 10);
  let current = 0;
  let cursor = metGoal(today) ? today : prevDay(today);
  if (metGoal(today)) current = 1;
  cursor = prevDay(cursor);
  while (metGoal(cursor) && current <= 3650) { current++; cursor = prevDay(cursor); }

  const metDays = Object.keys(countByDay).filter(metGoal).sort();
  let best = current;
  let run = 0;
  let prev: string | null = null;
  for (const d of metDays) {
    if (prev === null) {
      run = 1;
    } else {
      const diff = Math.round((new Date(d + "T12:00:00Z").getTime() - new Date(prev + "T12:00:00Z").getTime()) / 86400000);
      run = diff === 1 ? run + 1 : 1;
    }
    if (run > best) best = run;
    prev = d;
  }

  return { current, best };
}

// ─── Sign out ────────────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
}
