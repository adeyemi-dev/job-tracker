"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  getDailyGoal, saveDailyGoal,
  getReminderTime, saveReminderTime,
  getNotifEnabled, saveNotifEnabled,
  getTodayCount, getStreakData,
} from "@/lib/store";
import { ConfettiCelebration } from "./ConfettiCelebration";

// iOS Safari does not support the Notification API outside of an installed PWA
function getNotifSupport(): "supported" | "ios-browser" | "unsupported" {
  if (typeof window === "undefined") return "unsupported";
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = (navigator as unknown as { standalone?: boolean }).standalone === true;
  if (isIOS && !isStandalone) return "ios-browser";
  if (typeof Notification === "undefined") return "unsupported";
  return "supported";
}

async function getSwRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch {
    return null;
  }
}

async function sendSwMessage(msg: object) {
  if (!("serviceWorker" in navigator)) return;
  const reg = await navigator.serviceWorker.ready.catch(() => null);
  reg?.active?.postMessage(msg);
}

export function DailyGoalBanner() {
  const [todayCount, setTodayCount] = useState(0);
  const [goal, setGoal] = useState(5);
  const [streak, setStreak] = useState({ current: 0, best: 0 });
  const [showConfetti, setShowConfetti] = useState(false);
  const [reminderTime, setReminderTime] = useState("09:00");
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [showSettings, setShowSettings] = useState(false);
  const [flashSaved, setFlashSaved] = useState(false);
  const support = useRef<"supported" | "ios-browser" | "unsupported">("unsupported");

  useEffect(() => {
    support.current = getNotifSupport();
    const count = getTodayCount();
    const g = getDailyGoal();
    setTodayCount(count);
    setGoal(g);
    setStreak(getStreakData());
    setReminderTime(getReminderTime());
    setNotifEnabled(getNotifEnabled());
    if (support.current === "supported") {
      setPermission(Notification.permission);
      getSwRegistration();
    }

    // Fire confetti once per day when goal is met, with bonus on streak milestones
    if (count >= g && g > 0) {
      const today = new Date().toISOString().slice(0, 10);
      const key = `jt-confetti-${today}-${g}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        setTimeout(() => setShowConfetti(true), 400);
      }
    }
  }, []);

  // Re-schedule with SW whenever settings change
  useEffect(() => {
    if (!notifEnabled || support.current !== "supported" || Notification.permission !== "granted") {
      sendSwMessage({ type: "CANCEL" });
      return;
    }
    const [h, m] = reminderTime.split(":").map(Number);
    const now = new Date();
    const fire = new Date();
    fire.setHours(h, m, 0, 0);
    if (fire <= now) return;

    const count = getTodayCount();
    const g = getDailyGoal();
    sendSwMessage({
      type: "SCHEDULE",
      delayMs: fire.getTime() - now.getTime(),
      title: "JobTracker — Daily reminder 🎯",
      body: `You've applied to ${count} of ${g} jobs today. ${g - count} more to go!`,
    });
  }, [notifEnabled, reminderTime, goal]);

  async function handleEnableNotifications() {
    if (support.current !== "supported") return;
    // Ensure SW is registered before requesting permission
    await getSwRegistration();
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

            {/* Streak */}
            <div className="flex items-center gap-3 mt-2">
              {streak.current > 0 ? (
                <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                  streak.current >= 30 ? "text-amber-500 dark:text-amber-400" :
                  streak.current >= 7  ? "text-orange-500 dark:text-orange-400" :
                  streak.current >= 3  ? "text-amber-500 dark:text-amber-400" :
                  "text-slate-500 dark:text-slate-400"
                }`}>
                  🔥 {streak.current} day{streak.current !== 1 ? "s" : ""} streak
                  {streak.current >= 7 && <span className="ml-0.5">·  keep it up!</span>}
                </span>
              ) : (
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  Hit your goal today to start a streak 🔥
                </span>
              )}
              {streak.best > streak.current && streak.best > 1 && (
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  Best: {streak.best}d
                </span>
              )}
            </div>
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

      {showConfetti && <ConfettiCelebration onDone={() => setShowConfetti(false)} />}

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
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                {support.current === "ios-browser"
                  ? "Add to Home Screen to enable reminders on iOS"
                  : support.current === "unsupported"
                  ? "Not supported in this browser"
                  : permission === "denied"
                  ? "Blocked — allow in browser site settings"
                  : permission === "granted"
                  ? notifEnabled ? `Will remind you at ${reminderTime}` : "Notifications off"
                  : "Tap Enable to allow daily reminders"}
              </p>
            </div>

            {support.current !== "supported" ? (
              <span className="text-xs px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 shrink-0 cursor-not-allowed">
                {support.current === "ios-browser" ? "iOS only" : "N/A"}
              </span>
            ) : permission === "granted" ? (
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
