"use client";

import { useEffect, useRef, useState } from "react";
import { Application, ALL_STATUSES, Status, STATUS_DOT, isOverdue } from "@/lib/types";
import { ApplicationCard } from "@/components/ApplicationCard";
import { DailyGoalBanner } from "@/components/DailyGoalBanner";
import { KanbanBoard } from "@/components/KanbanBoard";
import { SkeletonList, LoadingBar } from "@/components/Skeleton";
import { useToast } from "@/components/Toast";
import { useConfirm } from "@/components/ConfirmModal";
import { getApps, getAllInterviews, deleteApp, updateApp, exportJSON, exportCSV, importJSON } from "@/lib/store";
import { Interview } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { Search, X, Star, Download, Upload, LayoutList, Columns, Trash2, Clock, Zap, Users, BadgeCheck, XCircle, ChevronUp, ChevronDown } from "lucide-react";

type SortKey = "newest" | "oldest" | "company-az" | "company-za" | "salary-high" | "status";

function sortApps(apps: Application[], sort: SortKey): Application[] {
  const s = [...apps];
  switch (sort) {
    case "newest":     return s.sort((a, b) => b.applied_date.localeCompare(a.applied_date));
    case "oldest":     return s.sort((a, b) => a.applied_date.localeCompare(b.applied_date));
    case "company-az": return s.sort((a, b) => a.company.localeCompare(b.company));
    case "company-za": return s.sort((a, b) => b.company.localeCompare(a.company));
    case "salary-high":return s.sort((a, b) => (b.salary_max ?? b.salary_min ?? 0) - (a.salary_max ?? a.salary_min ?? 0));
    case "status":     return s.sort((a, b) => ALL_STATUSES.indexOf(a.status) - ALL_STATUSES.indexOf(b.status));
  }
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: "Good morning", sub: "Let's land that dream role today." };
  if (h < 17) return { text: "Good afternoon", sub: "Keep pushing — the right opportunity is out there." };
  return { text: "Good evening", sub: "Great time to review and reflect on your progress." };
}

const STAT_STATUSES = [
  { label: "In progress", key: "Active"    as const, accent: "#6366f1", light: "bg-indigo-50  dark:bg-indigo-900/30",  text: "text-indigo-700 dark:text-indigo-300",  Icon: Zap },
  { label: "Interviews",  key: "Interview" as const, accent: "#f59e0b", light: "bg-amber-50   dark:bg-amber-900/30",   text: "text-amber-700  dark:text-amber-300",   Icon: Users },
  { label: "Offers",      key: "Offer"     as const, accent: "#10b981", light: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300", Icon: BadgeCheck },
  { label: "Rejected",    key: "Rejected"  as const, accent: "#ef4444", light: "bg-red-50    dark:bg-red-900/30",     text: "text-red-700    dark:text-red-300",     Icon: XCircle },
];

type ViewMode = "list" | "board";

function readView(): ViewMode {
  if (typeof window === "undefined") return "list";
  return (localStorage.getItem("jt-view") as ViewMode) ?? "list";
}

export default function Dashboard() {
  const [allApps, setAllApps] = useState<Application[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<Status | "All">("All");
  const [starredOnly, setStarredOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [view, setView] = useState<ViewMode>("list");
  const [localDataCount, setLocalDataCount] = useState(0);
  const [migrating, setMigrating] = useState(false);
  const [allInterviews, setAllInterviews] = useState<Record<string, Interview[]>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const importRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const name = user?.user_metadata?.full_name || "";
      setUserName(name.trim());
      const [apps, ivs] = await Promise.all([getApps(), getAllInterviews()]);
      setAllApps(apps);
      setAllInterviews(ivs);
      setView(readView());
      setLoaded(true);
      // Check for old localStorage data to migrate
      try {
        const old = JSON.parse(localStorage.getItem("jt-apps") ?? "[]");
        if (Array.isArray(old) && old.length > 0) setLocalDataCount(old.length);
      } catch { /* no local data */ }
    }
    load();
  }, []);

  async function handleMigrateLocal() {
    setMigrating(true);
    try {
      const apps = JSON.parse(localStorage.getItem("jt-apps") ?? "[]");
      const interviews = JSON.parse(localStorage.getItem("jt-interviews") ?? "{}");
      const json = JSON.stringify({ apps, interviews });
      const { count } = await importJSON(json);
      setAllApps(await getApps());
      localStorage.removeItem("jt-apps");
      localStorage.removeItem("jt-interviews");
      setLocalDataCount(0);
      showToast(`Migrated ${count} application${count !== 1 ? "s" : ""} from this device`, "success");
    } catch {
      showToast("Migration failed — try the JSON import instead", "error");
    }
    setMigrating(false);
  }

  function switchView(v: ViewMode) {
    setView(v);
    localStorage.setItem("jt-view", v);
  }

  async function handleExportJSON() {
    const blob = new Blob([await exportJSON()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `jobtracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  }

  async function handleExportCSV() {
    const blob = new Blob([await exportCSV()], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `jobtracker-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const { count } = await importJSON(ev.target?.result as string);
        setAllApps(await getApps());
        showToast(`Imported ${count} application${count !== 1 ? "s" : ""}`, "success");
      } catch {
        showToast("Invalid file — import failed", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  async function handleDelete(id: string) {
    const ok = await confirm({ message: "Delete this application? This cannot be undone.", danger: true, confirmLabel: "Delete" });
    if (!ok) return;
    await deleteApp(id);
    setAllApps((prev) => prev.filter((a) => a.id !== id));
    setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    showToast("Application deleted", "info");
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    const ok = await confirm({ message: `Delete ${selectedIds.size} application${selectedIds.size !== 1 ? "s" : ""}? This cannot be undone.`, danger: true, confirmLabel: "Delete all" });
    if (!ok) return;
    await Promise.all([...selectedIds].map((id) => deleteApp(id)));
    setAllApps((prev) => prev.filter((a) => !selectedIds.has(a.id)));
    showToast(`Deleted ${selectedIds.size} application${selectedIds.size !== 1 ? "s" : ""}`, "info");
    setSelectedIds(new Set());
  }

  function handleSelect(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  }

  function handleSelectAll() {
    if (selectedIds.size === displayed.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayed.map((a) => a.id)));
    }
  }

  async function handleStatusChange(id: string, status: Status) {
    const updated = await updateApp(id, { status });
    setAllApps((prev) => prev.map((a) => a.id === id ? updated : a));
  }

  async function handleStarToggle(id: string) {
    const app = allApps.find((a) => a.id === id);
    if (!app) return;
    await updateApp(id, { starred: !app.starred });
    setAllApps((prev) => prev.map((a) => a.id === id ? { ...a, starred: !a.starred } : a));
  }

  const q = search.toLowerCase().trim();
  const displayed = sortApps(
    allApps
      .filter((a) => !starredOnly || a.starred)
      .filter((a) => filter === "All" || a.status === filter)
      .filter((a) => !tagFilter || (a.tags ?? []).includes(tagFilter))
      .filter((a) => !q || a.company.toLowerCase().includes(q) || a.role.toLowerCase().includes(q)),
    sort
  );

  const allTags = [...new Set(allApps.flatMap((a) => a.tags ?? []))].sort();

  const overdueApps = allApps.filter(
    (a) => isOverdue(a.followup_date) && !["Saved", "In Progress", "Rejected", "Withdrawn", "Ghosted"].includes(a.status)
  );

  const activeCount = allApps.filter((a) => !["Rejected", "Withdrawn", "Offer", "Ghosted"].includes(a.status)).length;
  const countFor = (s: Status) => allApps.filter((a) => a.status === s).length;

  const greeting = getGreeting();

  return (
    <div>
      {!loaded && <LoadingBar />}
      {/* Greeting banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 p-6 sm:p-8 mb-6 sm:mb-8 shadow-xl shadow-indigo-200/60 dark:shadow-indigo-950/60">
        {/* Blurred blob decorations */}
        <div className="absolute -top-12 -right-12 w-56 h-56 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-6 w-40 h-40 bg-violet-400/20 rounded-full blur-2xl pointer-events-none" />
        {/* Subtle dot grid */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.07]">
          <defs>
            <pattern id="grid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        <div className="relative flex items-end justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-indigo-200/60 text-xs font-semibold uppercase tracking-widest mb-3">
              {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
            <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
              {greeting.text}{userName ? `, ${userName.split(" ")[0]}` : ""}!
            </h1>
            <p className="text-indigo-200/70 mt-2.5 text-sm max-w-sm">{greeting.sub}</p>
          </div>
          {loaded && allApps.length > 0 && (
            <div className="shrink-0 bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl px-5 py-3.5 text-center hidden sm:block">
              <p className="text-3xl font-bold text-white tabular-nums">{allApps.length}</p>
              <p className="text-indigo-200/60 text-xs mt-0.5 font-medium">apps tracked</p>
            </div>
          )}
        </div>
      </div>

      {localDataCount > 0 && (
        <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              Found {localDataCount} application{localDataCount !== 1 ? "s" : ""} saved on this device
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
              Click to migrate them to your account so they show up everywhere.
            </p>
          </div>
          <button
            onClick={handleMigrateLocal}
            disabled={migrating}
            className="shrink-0 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
          >
            {migrating ? "Migrating…" : "Migrate now"}
          </button>
        </div>
      )}

      <DailyGoalBanner />

      {/* Stat cards */}
      {loaded && allApps.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {STAT_STATUSES.map(({ label, key, accent, light, text, Icon }) => {
            const count = key === "Active" ? activeCount : countFor(key as Status);
            const clickable = key !== "Active";
            const isActive = filter === key;
            return (
              <button
                key={key}
                onClick={() => { if (clickable) { setFilter(isActive ? "All" : key as Status); if (view === "board") switchView("list"); } }}
                className={`${light} rounded-2xl p-4 sm:p-5 text-left transition-all duration-200 shadow-sm ${clickable ? "hover:scale-[1.03] hover:shadow-lg active:scale-[0.97] cursor-pointer" : "cursor-default"}`}
                style={isActive ? { outline: `2px solid ${accent}`, outlineOffset: "2px" } : {}}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: accent + "20" }}>
                    <Icon className="w-4 h-4" style={{ color: accent }} strokeWidth={2} />
                  </div>
                  {isActive && <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: accent }}>active</span>}
                </div>
                <p className={`text-2xl sm:text-3xl font-bold tabular-nums ${text}`}>{count}</p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">{label}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Toolbar: view toggle + export/import */}
      {loaded && allApps.length > 0 && (
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          {/* View toggle */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => switchView("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === "list" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
            >
              <LayoutList className="w-4 h-4" />
              List
            </button>
            <button
              onClick={() => switchView("board")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === "board" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
            >
              <Columns className="w-4 h-4" />
              Board
            </button>
          </div>

          {/* Export / Import */}
          <div className="flex items-center gap-2">
              <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
            <button onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <Download className="w-3.5 h-3.5" />
              JSON
            </button>
            <button onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
            <button onClick={() => importRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
              <Upload className="w-3.5 h-3.5" />
              Import
            </button>
          </div>
        </div>
      )}

      {/* Kanban board */}
      {loaded && view === "board" && allApps.length > 0 && (
        <KanbanBoard apps={allApps} onAppsChange={setAllApps} />
      )}

      {/* List-view content */}
      {loaded && view === "list" && (<>

      {/* Overdue follow-ups banner */}
      {overdueApps.length > 0 && (
        <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2.5">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-sm font-semibold text-amber-800">
              {overdueApps.length} follow-up{overdueApps.length > 1 ? "s" : ""} overdue
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            {overdueApps.map((a) => (
              <a key={a.id} href={`/applications/${a.id}`}
                className="flex items-center justify-between text-sm text-amber-700 hover:text-amber-900 hover:underline">
                <span>{a.company} — {a.role}</span>
                <span className="text-xs text-amber-500 tabular-nums">{a.followup_date}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Search + Sort */}
      {allApps.length > 0 && (
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by company or role…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-900 shadow-sm"
            />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm shrink-0"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="company-az">Company A–Z</option>
            <option value="company-za">Company Z–A</option>
            <option value="salary-high">Salary high–low</option>
            <option value="status">By status</option>
          </select>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        <button
          onClick={() => setStarredOnly((v) => !v)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${
            starredOnly
              ? "bg-amber-400 text-white shadow-sm"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700"
          }`}
        >
          <Star className="w-3.5 h-3.5" fill={starredOnly ? "currentColor" : "none"} />
          Starred
        </button>
        {(["All", ...ALL_STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${
              filter === s
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            {s !== "All" && (
              <span className={`w-1.5 h-1.5 rounded-full ${filter === s ? "bg-white/70" : STATUS_DOT[s as Status]}`} />
            )}
            {s}
            {s !== "All" && (
              <span className={`text-xs rounded-md px-1.5 py-0.5 font-semibold tabular-nums ${filter === s ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"}`}>
                {countFor(s as Status)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tag filter pills */}
      {allTags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-4">
          <button
            onClick={() => setTagFilter(null)}
            className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${tagFilter === null ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"}`}
          >
            All tags
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${tagFilter === tag ? "bg-indigo-500 text-white" : "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"}`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Bulk actions toolbar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl shadow-xl shadow-slate-900/30 px-5 py-3">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <div className="w-px h-4 bg-slate-600" />
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Deselect
          </button>
          <button
            onClick={handleBulkDelete}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete {selectedIds.size}
          </button>
        </div>
      )}

      {/* List */}
      {!loaded ? <SkeletonList count={4} /> : displayed.length === 0 && allApps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          {/* Illustrated empty state SVG */}
          <div className="relative mb-6">
            <svg width="220" height="160" viewBox="0 0 220 160" fill="none" className="opacity-90 dark:opacity-70">
              {/* Ground shadow */}
              <ellipse cx="110" cy="148" rx="70" ry="8" fill="#e0e7ff" className="dark:opacity-20" />
              {/* Briefcase body */}
              <rect x="55" y="68" width="110" height="72" rx="10" fill="#6366f1" />
              <rect x="55" y="68" width="110" height="72" rx="10" fill="url(#briefcaseGrad)" />
              {/* Briefcase handle */}
              <path d="M85 68 Q85 52 110 52 Q135 52 135 68" stroke="#818cf8" strokeWidth="5" fill="none" strokeLinecap="round" />
              {/* Briefcase latch */}
              <rect x="97" y="98" width="26" height="14" rx="4" fill="#4f46e5" />
              <rect x="103" y="103" width="14" height="4" rx="2" fill="#818cf8" />
              {/* Center divider line */}
              <line x1="55" y1="102" x2="165" y2="102" stroke="#4f46e5" strokeWidth="2" />
              {/* Floating document 1 */}
              <g className="animate-float-slow" style={{ transformOrigin: "170px 45px" }}>
                <rect x="150" y="20" width="40" height="50" rx="5" fill="white" stroke="#c7d2fe" strokeWidth="1.5" />
                <line x1="158" y1="32" x2="182" y2="32" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" />
                <line x1="158" y1="39" x2="182" y2="39" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" />
                <line x1="158" y1="46" x2="175" y2="46" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" />
                <line x1="158" y1="53" x2="178" y2="53" stroke="#c7d2fe" strokeWidth="1.5" strokeLinecap="round" />
              </g>
              {/* Floating document 2 */}
              <g className="animate-float" style={{ transformOrigin: "32px 55px" }}>
                <rect x="12" y="30" width="40" height="50" rx="5" fill="white" stroke="#c7d2fe" strokeWidth="1.5" />
                <line x1="20" y1="42" x2="44" y2="42" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" />
                <line x1="20" y1="49" x2="44" y2="49" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" />
                <line x1="20" y1="56" x2="37" y2="56" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" />
                <circle cx="40" cy="34" r="5" fill="#818cf8" />
                <path d="M37.5 34 L39.5 36 L42.5 31.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </g>
              {/* Star sparkles */}
              <circle cx="195" cy="90" r="3" fill="#a5b4fc" opacity="0.8" />
              <circle cx="20" cy="110" r="2.5" fill="#818cf8" opacity="0.6" />
              <circle cx="185" cy="130" r="2" fill="#6366f1" opacity="0.5" />
              <path d="M200 60 L202 55 L204 60 L209 62 L204 64 L202 69 L200 64 L195 62 Z" fill="#e0e7ff" opacity="0.9" />
              <path d="M10 75 L11.5 71 L13 75 L17 76.5 L13 78 L11.5 82 L10 78 L6 76.5 Z" fill="#c7d2fe" opacity="0.8" />
              <defs>
                <linearGradient id="briefcaseGrad" x1="55" y1="68" x2="165" y2="140" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1.5">No applications yet</h3>
          <p className="text-sm text-slate-400 dark:text-slate-500 mb-6 max-w-xs">Start tracking your job search by adding your first application. It only takes a few seconds.</p>
          <a href="/applications/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 dark:shadow-indigo-950">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Add first application
          </a>
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-slate-400 dark:text-slate-500">
            {q ? `No results for "${search}".` : <>No <span className="font-medium">{filter}</span> applications.</>}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {/* Select all row */}
          {displayed.length > 0 && (
            <div className="flex items-center gap-2 px-1 mb-1">
              <input
                type="checkbox"
                checked={selectedIds.size === displayed.length && displayed.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Select all</span>
            </div>
          )}
          {displayed.map((app) => (
            <ApplicationCard key={app.id} app={app} onDelete={handleDelete} onStatusChange={handleStatusChange} onStarToggle={handleStarToggle} selected={selectedIds.has(app.id)} onSelect={handleSelect} interviews={allInterviews[app.id] ?? []} />
          ))}
        </div>
      )}

      </>)}
    </div>
  );
}
