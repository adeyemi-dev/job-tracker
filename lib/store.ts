import { Application, Interview, InterviewType, Status, Currency, WorkType, ContractType } from "./types";
import { v4 as uuidv4 } from "uuid";

const APPS_KEY = "jt-apps";
const IVS_KEY = "jt-interviews";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { return JSON.parse(localStorage.getItem(key) ?? "") as T; }
  catch { return fallback; }
}

function write(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Applications

export function getApps(): Application[] {
  return read<Application[]>(APPS_KEY, []);
}

export function getApp(id: string): Application | null {
  return getApps().find((a) => a.id === id) ?? null;
}

export function createApp(data: Partial<Application>): Application {
  const now = new Date().toISOString();
  const app: Application = {
    id: uuidv4(),
    company: data.company ?? "",
    role: data.role ?? "",
    job_url: data.job_url ?? null,
    status: (data.status as Status) ?? "Saved",
    platform: data.platform ?? null,
    applied_date: data.applied_date ?? now.slice(0, 10),
    followup_date: data.followup_date ?? null,
    notes: data.notes ?? null,
    cv_file: null,
    cv_url: data.cv_url ?? null,
    cl_file: null,
    cl_url: data.cl_url ?? null,
    salary_min: data.salary_min ?? null,
    salary_max: data.salary_max ?? null,
    currency: (data.currency as Currency) ?? null,
    work_type: (data.work_type as WorkType) ?? null,
    contract_type: (data.contract_type as ContractType) ?? null,
    created_at: now,
    updated_at: now,
  };
  write(APPS_KEY, [app, ...getApps()]);
  return app;
}

export function updateApp(id: string, data: Partial<Application>): Application {
  const now = new Date().toISOString();
  const apps = getApps().map((a) =>
    a.id === id ? { ...a, ...data, id, updated_at: now } : a
  );
  write(APPS_KEY, apps);
  return apps.find((a) => a.id === id)!;
}

export function deleteApp(id: string) {
  write(APPS_KEY, getApps().filter((a) => a.id !== id));
  const ivs = read<Record<string, Interview[]>>(IVS_KEY, {});
  delete ivs[id];
  write(IVS_KEY, ivs);
}

// Interviews

export function getInterviews(applicationId: string): Interview[] {
  const ivs = read<Record<string, Interview[]>>(IVS_KEY, {});
  return (ivs[applicationId] ?? []).sort((a, b) => a.date.localeCompare(b.date));
}

export function addInterview(applicationId: string, data: { type: InterviewType; date: string; interviewer: string | null; notes: string | null }): Interview {
  const now = new Date().toISOString();
  const existing = getInterviews(applicationId);
  const iv: Interview = {
    id: uuidv4(),
    application_id: applicationId,
    round: existing.length + 1,
    type: data.type,
    date: data.date,
    interviewer: data.interviewer,
    notes: data.notes,
    created_at: now,
  };
  const ivs = read<Record<string, Interview[]>>(IVS_KEY, {});
  ivs[applicationId] = [...(ivs[applicationId] ?? []), iv];
  write(IVS_KEY, ivs);
  return iv;
}

export function updateInterview(applicationId: string, id: string, data: Partial<Interview>): Interview {
  const ivs = read<Record<string, Interview[]>>(IVS_KEY, {});
  ivs[applicationId] = (ivs[applicationId] ?? []).map((iv) =>
    iv.id === id ? { ...iv, ...data } : iv
  );
  write(IVS_KEY, ivs);
  return ivs[applicationId].find((iv) => iv.id === id)!;
}

export function deleteInterview(applicationId: string, id: string) {
  const ivs = read<Record<string, Interview[]>>(IVS_KEY, {});
  ivs[applicationId] = (ivs[applicationId] ?? []).filter((iv) => iv.id !== id);
  write(IVS_KEY, ivs);
}

// Daily goal & reminder settings

const GOAL_KEY = "jt-goal";
const REMINDER_TIME_KEY = "jt-reminder-time";
const NOTIF_KEY = "jt-notif-enabled";

export function getDailyGoal(): number { return read<number>(GOAL_KEY, 5); }
export function saveDailyGoal(n: number) { write(GOAL_KEY, n); }

export function getReminderTime(): string { return read<string>(REMINDER_TIME_KEY, "09:00"); }
export function saveReminderTime(t: string) { write(REMINDER_TIME_KEY, t); }

export function getNotifEnabled(): boolean { return read<boolean>(NOTIF_KEY, false); }
export function saveNotifEnabled(v: boolean) { write(NOTIF_KEY, v); }

// Export / Import

export function exportJSON(): string {
  const apps = getApps();
  const ivs = read<Record<string, Interview[]>>(IVS_KEY, {});
  return JSON.stringify({ apps, interviews: ivs, exported_at: new Date().toISOString() }, null, 2);
}

export function exportCSV(): string {
  const apps = getApps();
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

export function importJSON(json: string): { count: number } {
  const data = JSON.parse(json) as { apps?: Application[]; interviews?: Record<string, Interview[]> };
  if (!data.apps || !Array.isArray(data.apps)) throw new Error("Invalid backup file");
  write(APPS_KEY, data.apps);
  if (data.interviews) write(IVS_KEY, data.interviews);
  return { count: data.apps.length };
}

export function getTodayCount(): number {
  const today = new Date().toISOString().slice(0, 10);
  return getApps().filter(
    (a) => a.applied_date === today && !["Saved", "In Progress"].includes(a.status)
  ).length;
}
