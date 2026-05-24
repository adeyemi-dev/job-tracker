"use client";

import { useState } from "react";
import { Interview, INTERVIEW_TYPES, InterviewType } from "@/lib/types";

const TYPE_ICON: Record<InterviewType, string> = {
  Phone: "📞",
  Video: "💻",
  Onsite: "🏢",
  Technical: "⚙️",
  HR: "🤝",
  Other: "📋",
};

interface Props {
  applicationId: string;
  initial: Interview[];
}

interface FormState {
  type: InterviewType;
  date: string;
  interviewer: string;
  notes: string;
}

const EMPTY_FORM: FormState = { type: "Phone", date: "", interviewer: "", notes: "" };

export function InterviewTimeline({ applicationId, initial }: Props) {
  const [interviews, setInterviews] = useState<Interview[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);

  async function addInterview() {
    if (!form.date) return;
    setSaving(true);
    const res = await fetch(`/api/applications/${applicationId}/interviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: form.type,
        date: form.date,
        interviewer: form.interviewer || null,
        notes: form.notes || null,
      }),
    });
    const created: Interview = await res.json();
    setInterviews((prev) => [...prev, created].sort((a, b) => a.date.localeCompare(b.date)));
    setForm(EMPTY_FORM);
    setShowForm(false);
    setSaving(false);
  }

  async function saveEdit(id: string) {
    setSaving(true);
    const res = await fetch(`/api/applications/${applicationId}/interviews/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: editForm.type,
        date: editForm.date,
        interviewer: editForm.interviewer || null,
        notes: editForm.notes || null,
      }),
    });
    const updated: Interview = await res.json();
    setInterviews((prev) => prev.map((i) => (i.id === id ? updated : i)));
    setEditingId(null);
    setSaving(false);
  }

  async function deleteInterview(id: string) {
    if (!confirm("Remove this interview?")) return;
    await fetch(`/api/applications/${applicationId}/interviews/${id}`, { method: "DELETE" });
    setInterviews((prev) => prev.filter((i) => i.id !== id));
  }

  const inputCls = "w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-500 dark:[color-scheme:dark]";

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Interview rounds</p>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Add round
          </button>
        )}
      </div>

      {/* Timeline */}
      {interviews.length > 0 && (
        <div className="relative mb-4">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />
          <div className="space-y-3">
            {interviews.map((iv) => (
              <div key={iv.id} className="relative pl-10">
                {/* dot */}
                <div className="absolute left-2.5 top-2 w-3 h-3 rounded-full bg-white dark:bg-slate-900 border-2 border-indigo-400 dark:border-indigo-500 z-10" />

                {editingId === iv.id ? (
                  <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value as InterviewType })} className={inputCls}>
                        {INTERVIEW_TYPES.map((t) => <option key={t}>{t}</option>)}
                      </select>
                      <input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} className={inputCls} />
                    </div>
                    <input type="text" placeholder="Interviewer name" value={editForm.interviewer}
                      onChange={(e) => setEditForm({ ...editForm, interviewer: e.target.value })} className={inputCls} />
                    <textarea rows={2} placeholder="Notes…" value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      className={`${inputCls} resize-none`} />
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => saveEdit(iv.id)} disabled={saving}
                        className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
                        Save
                      </button>
                      <button onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="group bg-slate-50 dark:bg-slate-800 rounded-xl p-3 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-base leading-none">{TYPE_ICON[iv.type]}</span>
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Round {iv.round} · {iv.type}</span>
                          <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
                            {new Date(iv.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                        {iv.interviewer && (
                          <p className="text-xs text-slate-500 mt-1">with {iv.interviewer}</p>
                        )}
                        {iv.notes && (
                          <p className="text-xs text-slate-600 mt-1.5 whitespace-pre-wrap leading-relaxed">{iv.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button onClick={() => { setEditingId(iv.id); setEditForm({ type: iv.type, date: iv.date, interviewer: iv.interviewer ?? "", notes: iv.notes ?? "" }); }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-600 transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => deleteInterview(iv.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-white transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {interviews.length === 0 && !showForm && (
        <p className="text-sm text-slate-400 dark:text-slate-500 mb-3">No interviews logged yet.</p>
      )}

      {/* Add form */}
      {showForm && (
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">New round</p>
          <div className="grid grid-cols-2 gap-2">
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as InterviewType })} className={inputCls}>
              {INTERVIEW_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
              className={inputCls} />
          </div>
          <input type="text" placeholder="Interviewer name (optional)" value={form.interviewer}
            onChange={(e) => setForm({ ...form, interviewer: e.target.value })} className={inputCls} />
          <textarea rows={2} placeholder="Notes… (optional)" value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className={`${inputCls} resize-none`} />
          <div className="flex gap-2 pt-1">
            <button onClick={addInterview} disabled={!form.date || saving}
              className="px-4 py-1.5 text-xs bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {saving ? "Saving…" : "Add round"}
            </button>
            <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
              className="px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
