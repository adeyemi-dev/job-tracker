"use client";

import { useState, useEffect, useRef } from "react";
import {
  getDailyGoal, saveDailyGoal,
  getReminderTime, saveReminderTime,
  getNotifEnabled, saveNotifEnabled,
  getTodayCount,
} from "@/lib/store";

export function DailyGoalBanner() {
  const [todayCount, setTodayCount] = useState(0);
  const [goal, setGoal] = useState(5);
  const [reminderTime, setReminderTime] = useState("09:00");
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [showSettings, setShowSettings] = useState(false);
  const [flashSaved, setFlashSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTodayCount(getTodayCount());
    setGoal(getDailyGoal());
    setReminderTime(getReminderTime());
    setNotifEnabled(getNotifEnabled());
    if (typeof Notification !== "undefined") setPermission(Notification.permission);
  }, []);

  // Schedule the daily notification whenever goal/time/enabled changes
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!notifEnabled || typeof Notification === "undefined" || Notification.permission !== "granted") return;

    const [h, m] = reminderTime.split(":").map(Number);
    const now = new Date();
    const fire = new Date();
    fire.setHours(h, m, 0, 0);
    if (fire <= now) return; // time already passed today

    timerRef.current = setTimeout(() => {
      const count = getTodayCount();
      const g = getDailyGoal();
      if (count < g) {
        new Notification("JobTracker — Daily reminder 🎯", {
          body: `You've applied to ${count} of ${g} jobs today. ${g - count} more to go!`,
          icon: "/favicon.ico",
          tag: "jt-daily",
        });
      }
    }, fire.getTime() - now.getTime());

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [notifEnabled, reminderTime, goal]);

  async function handleEnableNotifications() {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") {
      setNotifEnabled(true);
      saveNotifEnabled(true);
    }
  }

  function handleSave() {
    saveDailyGoal(goal);
    saveReminderTime(reminderTime);
    saveNotifEnabled(notifEnabled);
    setShowSettings(false);
    setFlashSaved(true);
    setTimeout(() => setFlashSaved(false), 2000);
  }

  const pct = Math.min((todayCount / goal) * 100, 100);
  const done = todayCount >= goal;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${done ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-indigo-50 dark:bg-indigo-900/30"}`}>
            {done ? (
              <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
          </div>

          {/* Progress */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {done ? "Daily goal reached! 🎉" : `${todayCount} of ${goal} applications today`}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums ml-2 shrink-0">{todayCount}/{goal}</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${done ? "bg-emerald-500" : "bg-indigo-500"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {!done && goal - todayCount > 0 && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                {goal - todayCount} more to hit your daily goal
              </p>
            )}
          </div>

          {/* Gear button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            title="Goal settings"
            className={`p-1.5 rounded-lg transition-colors shrink-0 ${showSettings ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="border-t border-slate-100 dark:border-slate-800 p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Goal counter */}
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Daily goal</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setGoal(Math.max(1, goal - 1))}
                  className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold flex items-center justify-center transition-colors"
                >−</button>
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 w-8 text-center tabular-nums">{goal}</span>
                <button
                  onClick={() => setGoal(Math.min(50, goal + 1))}
                  className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold flex items-center justify-center transition-colors"
                >+</button>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">jobs per day</p>
            </div>

            {/* Reminder time */}
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Remind me at</label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:[color-scheme:dark]"
              />
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">if goal not met</p>
            </div>
          </div>

          {/* Notification toggle */}
          <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Browser notifications</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                {permission === "denied"
                  ? "Blocked in browser — allow in site settings"
                  : permission === "granted"
                  ? notifEnabled ? `Will remind you at ${reminderTime}` : "Notifications off"
                  : "Click Enable to allow daily reminders"}
              </p>
            </div>

            {permission === "granted" ? (
              <button
                onClick={() => setNotifEnabled(!notifEnabled)}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${notifEnabled ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifEnabled ? "translate-x-5" : ""}`} />
              </button>
            ) : (
              <button
                onClick={handleEnableNotifications}
                disabled={permission === "denied"}
                className="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                {permission === "denied" ? "Blocked" : "Enable"}
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {flashSaved ? "Saved ✓" : "Save"}
            </button>
            <button
              onClick={() => setShowSettings(false)}
              className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
