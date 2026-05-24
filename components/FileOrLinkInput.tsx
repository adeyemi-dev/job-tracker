"use client";

import { useState } from "react";

interface Props {
  label: string;
  field: "cv" | "cl";
  applicationId?: string;
  currentFile: string | null;
  currentUrl: string | null;
  onFileChange: (path: string | null) => void;
  onUrlChange: (url: string | null) => void;
}

export function FileOrLinkInput({
  label,
  field,
  applicationId,
  currentFile,
  currentUrl,
  onFileChange,
  onUrlChange,
}: Props) {
  const [mode, setMode] = useState<"file" | "url">(currentFile ? "file" : "url");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !applicationId) return;

    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("field", field);

      const res = await fetch(`/api/applications/${applicationId}/upload`, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) throw new Error("Upload failed");
      const { path } = await res.json();
      onFileChange(path);
      onUrlChange(null);
    } catch {
      setError("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>

      <div className="flex gap-1 mb-2.5 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
        {(["url", "file"] as const).map((m) => (
          <button key={m} type="button" onClick={() => setMode(m)}
            className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${mode === m ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}>
            {m === "url" ? "Paste URL" : "Upload file"}
          </button>
        ))}
      </div>

      {mode === "url" && (
        <input type="url" placeholder="https://drive.google.com/…" value={currentUrl || ""}
          onChange={(e) => { onUrlChange(e.target.value || null); onFileChange(null); }}
          className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-800"
        />
      )}

      {mode === "file" && (
        <div>
          {!applicationId && (
            <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 mb-2">
              Save the application first to enable file uploads.
            </p>
          )}
          <label className={`flex items-center gap-2 px-3.5 py-2.5 border border-dashed rounded-lg cursor-pointer transition-colors text-sm ${!applicationId || uploading ? "opacity-50 cursor-not-allowed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50" : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600"}`}>
            <svg className="w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="text-slate-500 dark:text-slate-400">{uploading ? "Uploading…" : "Click to upload PDF or DOCX"}</span>
            <input type="file" accept=".pdf,.doc,.docx" disabled={!applicationId || uploading}
              onChange={handleFileUpload} className="sr-only" />
          </label>
          {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
        </div>
      )}

      {(currentFile || currentUrl) && (
        <a href={currentFile ? `/api/files/${currentFile}` : currentUrl!}
          target="_blank" rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          {currentFile ? currentFile.split("/").pop() : "Open link"}
        </a>
      )}
    </div>
  );
}
