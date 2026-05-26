export type Status =
  | "Saved"
  | "In Progress"
  | "Applied"
  | "Phone Screen"
  | "Interview"
  | "Offer"
  | "Rejected"
  | "Ghosted"
  | "Withdrawn";

export const ALL_STATUSES: Status[] = [
  "Saved",
  "In Progress",
  "Applied",
  "Phone Screen",
  "Interview",
  "Offer",
  "Rejected",
  "Ghosted",
  "Withdrawn",
];

export const STATUS_COLORS: Record<Status, string> = {
  Saved: "bg-teal-50 text-teal-700 ring-1 ring-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:ring-teal-800",
  "In Progress": "bg-purple-50 text-purple-700 ring-1 ring-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:ring-purple-800",
  Applied: "bg-sky-50 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:ring-sky-800",
  "Phone Screen": "bg-violet-50 text-violet-700 ring-1 ring-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:ring-violet-800",
  Interview: "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-800",
  Offer: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800",
  Rejected: "bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-900/30 dark:text-red-300 dark:ring-red-800",
  Ghosted: "bg-zinc-100 text-zinc-500 ring-1 ring-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-600",
  Withdrawn: "bg-gray-100 text-gray-500 ring-1 ring-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700",
};

export const STATUS_DOT: Record<Status, string> = {
  Saved: "bg-teal-400",
  "In Progress": "bg-purple-400",
  Applied: "bg-sky-500",
  "Phone Screen": "bg-violet-500",
  Interview: "bg-amber-500",
  Offer: "bg-emerald-500",
  Rejected: "bg-red-500",
  Ghosted: "bg-zinc-400",
  Withdrawn: "bg-gray-400",
};

export const AVATAR_COLORS = [
  "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300",
  "bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300",
  "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
  "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
  "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300",
  "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300",
];

export function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export type WorkType = "Remote" | "Hybrid" | "On-site";
export const WORK_TYPES: WorkType[] = ["Remote", "Hybrid", "On-site"];

export type ContractType = "Full-time" | "Part-time" | "Contract" | "Internship";
export const CONTRACT_TYPES: ContractType[] = ["Full-time", "Part-time", "Contract", "Internship"];

export const CURRENCIES = ["GBP", "USD", "EUR", "CAD", "AUD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  GBP: "£", USD: "$", EUR: "€", CAD: "CA$", AUD: "A$",
};

export const PLATFORMS = [
  "LinkedIn",
  "Indeed",
  "NHS Jobs",
  "University Jobs",
  "Glassdoor",
  "Reed",
  "Totaljobs",
  "Company Website",
  "Recruiter",
  "Referral",
  "Other",
] as const;

export type Platform = (typeof PLATFORMS)[number];

export interface Application {
  id: string;
  company: string;
  role: string;
  job_url: string | null;
  status: Status;
  platform: string | null;
  applied_date: string;
  followup_date: string | null;
  notes: string | null;
  cv_file: string | null;
  cv_url: string | null;
  cl_file: string | null;
  cl_url: string | null;
  salary_min: number | null;
  salary_max: number | null;
  currency: Currency | null;
  work_type: WorkType | null;
  contract_type: ContractType | null;
  created_at: string;
  updated_at: string;
}

export type InterviewType = "Phone" | "Video" | "Onsite" | "Technical" | "HR" | "Other";

export const INTERVIEW_TYPES: InterviewType[] = [
  "Phone", "Video", "Onsite", "Technical", "HR", "Other",
];

export interface Interview {
  id: string;
  application_id: string;
  round: number;
  type: InterviewType;
  date: string;
  interviewer: string | null;
  notes: string | null;
  created_at: string;
}

export function isOverdue(followup_date: string | null): boolean {
  if (!followup_date) return false;
  return followup_date <= new Date().toISOString().slice(0, 10);
}
