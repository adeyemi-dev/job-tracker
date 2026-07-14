"use client";

import { useRef } from "react";

interface Props {
  label: string;
  currentFile: string | null;
  currentUrl: string | null;
  onChange: (file: string | null, url: string | null) => void;
}

export function FileOrLinkInput({ label, currentFile, currentUrl, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(file.name, reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function handleRemove() {
    onChange(null, null);
  }

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
      {currentFile && currentUrl ? (
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
          <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <a
            href={currentUrl}
            download={currentFile}
            className="flex-1 truncate text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-medium"
          >
            {currentFile}
          </a>
          <button
            type="button"
            onClick={handleRemove}
            className="text-slate-400 hover:text-red-500 transition-colors shrink-0"
            aria-label="Remove file"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 text-sm text-slate-500 dark:text-slate-400 hover:border-indigo-400 hover:text-indigo-600 dark:hover:border-indigo-500 dark:hover:text-indigo-400 transition-colors bg-white dark:bg-slate-800"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload file
        </button>
      )}
      <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFileChange} />
    </div>
  );
}
