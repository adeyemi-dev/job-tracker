"use client";

import { useState } from "react";
import { Application, ALL_STATUSES, Status, PLATFORMS, WORK_TYPES, CONTRACT_TYPES, CURRENCIES, WorkType, ContractType, Currency } from "@/lib/types";
import { FileOrLinkInput } from "./FileOrLinkInput";

interface Props {
  initial?: Partial<Application>;
  onSubmit: (data: Partial<Application>) => void;
  submitLabel: string;
}

const PLATFORM_VALUES = PLATFORMS as readonly string[];

export function ApplicationForm({ initial, onSubmit, submitLabel }: Props) {
  const [company, setCompany] = useState(initial?.company ?? "");
  const [role, setRole] = useState(initial?.role ?? "");
  const [jobUrl, setJobUrl] = useState(initial?.job_url ?? "");
  const [status, setStatus] = useState<Status>(initial?.status ?? "Saved");
  const [appliedDate, setAppliedDate] = useState(initial?.applied_date ?? new Date().toISOString().slice(0, 10));
  const [followupDate, setFollowupDate] = useState(initial?.followup_date ?? "");

  // Platform: detect if stored value is a known platform or a custom "Other" entry
  const storedPlatform = initial?.platform ?? "";
  const isStoredCustom = storedPlatform !== "" && !PLATFORM_VALUES.includes(storedPlatform);
  const [platformSelect, setPlatformSelect] = useState(isStoredCustom ? "Other" : storedPlatform);
  const [platformCustom, setPlatformCustom] = useState(isStoredCustom ? storedPlatform : "");

  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [cvUrl, setCvUrl] = useState<string | null>(initial?.cv_url ?? null);
  const [clUrl, setClUrl] = useState<string | null>(initial?.cl_url ?? null);
  const [workType, setWorkType] = useState<WorkType | "">(initial?.work_type ?? "");
  const [contractType, setContractType] = useState<ContractType | "">(initial?.contract_type ?? "");
  const [currency, setCurrency] = useState<Currency | "">(initial?.currency ?? "GBP");
  const [salaryMin, setSalaryMin] = useState(initial?.salary_min != null ? String(initial.salary_min) : "");
  const [salaryMax, setSalaryMax] = useState(initial?.salary_max != null ? String(initial.salary_max) : "");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!company.trim() || !role.trim()) {
      setError("Company and role are required.");
      return;
    }
    const resolvedPlatform =
      platformSelect === "Other" ? (platformCustom.trim() || null) :
      platformSelect || null;
    setError(null);
    onSubmit({
      company: company.trim(),
      role: role.trim(),
      job_url: jobUrl.trim() || null,
      status,
      platform: resolvedPlatform,
      applied_date: appliedDate,
      followup_date: followupDate || null,
      notes: notes.trim() || null,
      cv_url: cvUrl,
      cl_url: clUrl,
      work_type: workType || null,
      contract_type: contractType || null,
      currency: (salaryMin || salaryMax) ? (currency || "GBP") as Currency : null,
      salary_min: salaryMin ? Number(salaryMin) : null,
      salary_max: salaryMax ? Number(salaryMax) : null,
    });
  }

  const inputCls = "w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow bg-white dark:bg-slate-800 dark:[color-scheme:dark]";
  const labelCls = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Company <span className="text-indigo-500">*</span></label>
          <input type="text" required value={company} onChange={(e) => setCompany(e.target.value)}
            className={inputCls} placeholder="Acme Corp" />
        </div>
        <div>
          <label className={labelCls}>Role <span className="text-indigo-500">*</span></label>
          <input type="text" required value={role} onChange={(e) => setRole(e.target.value)}
            className={inputCls} placeholder="Software Engineer" />
        </div>
      </div>

      <div>
        <label className={labelCls}>Job posting URL</label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </span>
          <input type="url" value={jobUrl} onChange={(e) => setJobUrl(e.target.value)}
            className={`${inputCls} pl-10`} placeholder="https://company.com/jobs/role" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className={inputCls}>
            {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Platform <span className="ml-1 text-slate-400 font-normal">(optional)</span></label>
          <select value={platformSelect} onChange={(e) => { setPlatformSelect(e.target.value); if (e.target.value !== "Other") setPlatformCustom(""); }} className={inputCls}>
            <option value="">— Select platform —</option>
            {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          {platformSelect === "Other" && (
            <input
              type="text"
              value={platformCustom}
              onChange={(e) => setPlatformCustom(e.target.value)}
              placeholder="Where did you see the job?"
              className={`${inputCls} mt-2`}
            />
          )}
        </div>
        <div>
          <label className={labelCls}>Applied date</label>
          <input type="date" value={appliedDate} onChange={(e) => setAppliedDate(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Follow-up date <span className="ml-1 text-slate-400 font-normal">(optional)</span></label>
          <input type="date" value={followupDate} onChange={(e) => setFollowupDate(e.target.value)} className={inputCls} />
        </div>
      </div>

      {/* Compensation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Work type <span className="ml-1 text-slate-400 font-normal">(optional)</span></label>
          <select value={workType} onChange={(e) => setWorkType(e.target.value as WorkType | "")} className={inputCls}>
            <option value="">— Select —</option>
            {WORK_TYPES.map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Contract type <span className="ml-1 text-slate-400 font-normal">(optional)</span></label>
          <select value={contractType} onChange={(e) => setContractType(e.target.value as ContractType | "")} className={inputCls}>
            <option value="">— Select —</option>
            {CONTRACT_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>Salary range <span className="ml-1 text-slate-400 font-normal">(optional)</span></label>
        <div className="flex items-center gap-2">
          <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className={`${inputCls} w-24 shrink-0`}>
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="number" min={0} value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)}
            className={inputCls} placeholder="Min" />
          <span className="text-slate-400 shrink-0">–</span>
          <input type="number" min={0} value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)}
            className={inputCls} placeholder="Max" />
        </div>
      </div>

      <div>
        <label className={labelCls}>Notes</label>
        <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
          className={`${inputCls} resize-none`} placeholder="Recruiter name, interview tips…" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        <FileOrLinkInput label="CV link" currentUrl={cvUrl} onUrlChange={setCvUrl} />
        <FileOrLinkInput label="Cover letter link" currentUrl={clUrl} onUrlChange={setClUrl} />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3.5 py-2.5">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <div className="pt-1">
        <button type="submit"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-all active:scale-95 shadow-sm shadow-indigo-200">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
