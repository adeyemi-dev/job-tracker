"use client";

interface Props {
  label: string;
  currentUrl: string | null;
  onUrlChange: (url: string | null) => void;
}

export function FileOrLinkInput({ label, currentUrl, onUrlChange }: Props) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
      <input
        type="url"
        placeholder="https://drive.google.com/…"
        value={currentUrl || ""}
        onChange={(e) => onUrlChange(e.target.value || null)}
        className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-800"
      />
      {currentUrl && (
        <a href={currentUrl} target="_blank" rel="noopener noreferrer"
          className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 transition-colors">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Open link
        </a>
      )}
    </div>
  );
}
