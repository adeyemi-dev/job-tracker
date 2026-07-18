"use client";

import { useState, useEffect } from "react";
import { Phone, Video, Building2, Code2, Users, FileText, Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { Interview, INTERVIEW_TYPES, InterviewType, INTERVIEW_OUTCOMES, InterviewOutcome, OUTCOME_STYLES } from "@/lib/types";
import { addInterview, updateInterview, deleteInterview } from "@/lib/store";
import { useConfirm } from "@/components/ConfirmModal";

const TYPE_ICON: Record<InterviewType, React.ElementType> = {
  Phone: Phone,
  Video: Video,
  Onsite: Building2,
  Technical: Code2,
  HR: Users,
  Other: FileText,
};

const TYPE_COLOR: Record<InterviewType, string> = {
  Phone:     "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400",
  Video:     "bg-blue-100   dark:bg-blue-900/40   text-blue-600   dark:text-blue-400",
  Onsite:    "bg-amber-100  dark:bg-amber-900/40  text-amber-600  dark:text-amber-400",
  Technical: "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400",
  HR:        "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400",
  Other:     "bg-slate-100  dark:bg-slate-800     text-slate-600  dark:text-slate-400",
};

interface FormState { type: InterviewType; date: string; interviewer: string; notes: string; outcome: InterviewOutcome; }
const EMPTY: FormState = { type: "Phone", date: "", interviewer: "", notes: "", outcome: "Pending" };

const inputCls = "w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-500 dark:[color-scheme:dark]";

export function InterviewTimeline({ applicationId, initial }: { applicationId: string; initial: Interview[] }) {
  const [interviews, setInterviews] = useState<Interview[]>(initial);
  useEffect(() => { setInterviews(initial); }, [initial]);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY);
  const confirm = useConfirm();

  async function handleAdd() {
    if (!form.date) return;
    const iv = await addInterview(applicationId, {
      type: form.type,
      date: form.date,
      interviewer: form.interviewer || null,
      notes: form.notes || null,
      outcome: form.outcome,
    });
    setInterviews((prev) => [...prev, iv].sort((a, b) => a.date.localeCompare(b.date)));
    setForm(EMPTY);
    setShowForm(false);
  }

  async function handleSaveEdit(id: string) {
    const updated = await updateInterview(applicationId, id, {
      type: editForm.type,
      date: editForm.date,
      interviewer: editForm.interviewer || null,
      notes: editForm.notes || null,
      outcome: editForm.outcome,
    });
    setInterviews((prev) => prev.map((i) => (i.id === id ? updated : i)));
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    const ok = await confirm({ message: "Remove this interview round?", danger: true, confirmLabel: "Remove" });
    if (!ok) return;
    await deleteInterview(applicationId, id);
    setInterviews((prev) => prev.filter((i) => i.id !== id));
  }

  const passedCount = interviews.filter((i) => i.outcome === "Passed").length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Interview rounds</p>
          {interviews.length > 0 && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {interviews.length} round{interviews.length !== 1 ? "s" : ""}
              {passedCount > 0 && ` · ${passedCount} passed`}
            </p>
          )}
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30">
            <Plus className="w-3.5 h-3.5" />
            Add round
          </button>
        )}
      </div>

      {interviews.length > 0 && (
        <div className="relative mb-4">
          <div className="absolute left-[18px] top-0 bottom-0 w-px bg-slate-100 dark:bg-slate-800" />
          <div className="space-y-2">
            {interviews.map((iv, idx) => {
              const Icon = TYPE_ICON[iv.type];
              const iconColor = TYPE_COLOR[iv.type];
              return (
                <div key={iv.id} className="relative pl-11">
                  <div className={`absolute left-2.5 top-2.5 w-7 h-7 rounded-xl flex items-center justify-center z-10 ${iconColor}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>

                  {editingId === iv.id ? (
                    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 space-y-2.5">
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
                      <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Outcome</p>
                        <div className="flex gap-2">
                          {INTERVIEW_OUTCOMES.map((o) => (
                            <button key={o} type="button"
                              onClick={() => setEditForm({ ...editForm, outcome: o })}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${editForm.outcome === o ? `${OUTCOME_STYLES[o]} border-transparent` : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"}`}>
                              {editForm.outcome === o && <Check className="w-3 h-3" />}
                              {o}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => handleSaveEdit(iv.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                          <Check className="w-3 h-3" /> Save
                        </button>
                        <button onClick={() => setEditingId(null)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                          <X className="w-3 h-3" /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="group bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                              Round {iv.round} — {iv.type}
                            </span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${OUTCOME_STYLES[iv.outcome]}`}>
                              {iv.outcome}
                            </span>
                            <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
                              {new Date(iv.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          </div>
                          {iv.interviewer && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                              <Users className="w-3 h-3 shrink-0" /> with {iv.interviewer}
                            </p>
                          )}
                          {iv.notes && (
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 whitespace-pre-wrap leading-relaxed">{iv.notes}</p>
                          )}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => { setEditingId(iv.id); setEditForm({ type: iv.type, date: iv.date, interviewer: iv.interviewer ?? "", notes: iv.notes ?? "", outcome: iv.outcome }); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(iv.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-white dark:hover:bg-slate-700 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {interviews.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
            <Users className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">No interview rounds logged yet.</p>
          <button onClick={() => setShowForm(true)}
            className="mt-3 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
            Log your first round
          </button>
        </div>
      )}

      {showForm && (
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">New round</p>
          <div className="grid grid-cols-2 gap-2">
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as InterviewType })} className={inputCls}>
              {INTERVIEW_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputCls} />
          </div>
          <input type="text" placeholder="Interviewer name (optional)" value={form.interviewer}
            onChange={(e) => setForm({ ...form, interviewer: e.target.value })} className={inputCls} />
          <textarea rows={2} placeholder="Notes… (optional)" value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })} className={`${inputCls} resize-none`} />
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Outcome</p>
            <div className="flex gap-2">
              {INTERVIEW_OUTCOMES.map((o) => (
                <button key={o} type="button"
                  onClick={() => setForm({ ...form, outcome: o })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${form.outcome === o ? `${OUTCOME_STYLES[o]} border-transparent` : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"}`}>
                  {form.outcome === o && <Check className="w-3 h-3" />}
                  {o}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleAdd} disabled={!form.date}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              <Plus className="w-3 h-3" /> Add round
            </button>
            <button onClick={() => { setShowForm(false); setForm(EMPTY); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors">
              <X className="w-3 h-3" /> Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
