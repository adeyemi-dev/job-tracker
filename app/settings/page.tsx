"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import { signOut } from "@/lib/store";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const supabase = createClient();
  const { showToast } = useToast();
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loadingName, setLoadingName] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setDisplayName(user?.user_metadata?.full_name ?? "");
    });
  }, []);

  async function handleNameChange(e: React.FormEvent) {
    e.preventDefault();
    setLoadingName(true);
    const { error } = await supabase.auth.updateUser({ data: { full_name: displayName.trim() } });
    if (error) showToast(error.message, "error");
    else showToast("Name updated", "success");
    setLoadingName(false);
  }

  async function handleEmailChange(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail) return;
    setLoadingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) showToast(error.message, "error");
    else { showToast("Confirmation sent to new email address", "success"); setNewEmail(""); }
    setLoadingEmail(false);
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) { showToast("Passwords don't match", "error"); return; }
    if (newPassword.length < 6) { showToast("Password must be at least 6 characters", "error"); return; }
    setLoadingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) showToast(error.message, "error");
    else { showToast("Password updated", "success"); setNewPassword(""); setConfirmPassword(""); }
    setLoadingPassword(false);
  }

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  const inputCls = "w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-800";
  const labelCls = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5";

  return (
    <div className="max-w-lg pb-24 sm:pb-8">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Account settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your profile and account</p>
      </div>

      <div className="space-y-4">
        {/* Display name */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">Your name</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">This is how we'll greet you on the dashboard.</p>
          <form onSubmit={handleNameChange} className="flex gap-3">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={`${inputCls} flex-1`}
              placeholder="e.g. Afeez"
            />
            <button type="submit" disabled={loadingName} className="shrink-0 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60">
              {loadingName ? "Saving…" : "Save"}
            </button>
          </form>
        </div>

        {/* Change email */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">Change email</h2>
          <form onSubmit={handleEmailChange} className="space-y-4">
            <div>
              <label className={labelCls}>New email address</label>
              <input type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className={inputCls} placeholder="new@example.com" />
            </div>
            <button type="submit" disabled={loadingEmail} className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60">
              {loadingEmail ? "Updating…" : "Update email"}
            </button>
          </form>
        </div>

        {/* Change password */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">Change password</h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className={labelCls}>New password</label>
              <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputCls} placeholder="At least 6 characters" />
            </div>
            <div>
              <label className={labelCls}>Confirm new password</label>
              <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputCls} placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loadingPassword} className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60">
              {loadingPassword ? "Updating…" : "Update password"}
            </button>
          </form>
        </div>

        {/* Sign out */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">Sign out</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Sign out of your account on this device.</p>
          <button onClick={handleSignOut} className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
