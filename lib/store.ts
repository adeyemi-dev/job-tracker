import { Application, Interview, InterviewType, Status } from "./types";
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
