/** Shared severity vocabulary: colour never travels without its number and label. */
export const SEVERITY = {
  1: { label: "Barely noticeable", color: "var(--color-sev-1)", ink: "#7a2b1c" },
  2: { label: "Mild", color: "var(--color-sev-2)", ink: "#7a2b1c" },
  3: { label: "Moderate", color: "var(--color-sev-3)", ink: "#ffffff" },
  4: { label: "Severe", color: "var(--color-sev-4)", ink: "#ffffff" },
  5: { label: "Very severe", color: "var(--color-sev-5)", ink: "#ffffff" },
} as const;

export type SeverityLevel = keyof typeof SEVERITY;

export const KIND_META = {
  symptom: { label: "Symptom", hint: "Something you feel — pain, cough, dizziness" },
  body_change: { label: "Body change", hint: "Something you notice — rash, swelling, weight" },
  measurement: { label: "Measurement", hint: "A reading — temperature or weight" },
} as const;

export type EntryKind = keyof typeof KIND_META;

export function severityOf(level: number | null) {
  if (!level || !(level in SEVERITY)) return null;
  return SEVERITY[level as SeverityLevel];
}

export function formatDate(value: string | Date, opts?: Intl.DateTimeFormatOptions): string {
  const date = typeof value === "string" ? new Date(`${value}T00:00:00`) : value;
  return date.toLocaleDateString("en-NG", opts ?? { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(value: Date): string {
  return value.toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function daysAgo(value: string): number {
  const then = new Date(`${value}T00:00:00`).getTime();
  return Math.max(0, Math.round((Date.now() - then) / 86_400_000));
}

export function relativeDay(value: string): string {
  const days = daysAgo(value);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return formatDate(value);
}
