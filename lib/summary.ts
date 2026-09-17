import type { TrackerEntry } from "./schema";

export type SummaryEntry = Pick<
  TrackerEntry,
  "id" | "kind" | "title" | "severity" | "occurredOn" | "temperatureC" | "weightKg" | "description"
>;

export type Reading = { first: number; latest: number; delta: number; peak: number; count: number };

export type TrackerSummary = {
  windowStart: string | null;
  windowEnd: string;
  windowLabel: string;
  total: number;
  byKind: { symptom: number; body_change: number; measurement: number };
  severityCounts: Record<1 | 2 | 3 | 4 | 5, number>;
  averageSeverity: number | null;
  worst: SummaryEntry | null;
  recurring: { title: string; count: number; maxSeverity: number; lastSeen: string }[];
  activeDays: number;
  temperature: Reading | null;
  weight: Reading | null;
  trend: "improving" | "worsening" | "steady" | "insufficient";
  flags: string[];
};

const FEVER_C = 38;
const WEIGHT_SHIFT_PCT = 5;

function toNumber(value: string | null): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function readingFrom(entries: SummaryEntry[], field: "temperatureC" | "weightKg"): Reading | null {
  const values = entries
    .map((entry) => toNumber(entry[field]))
    .filter((value): value is number => value !== null);
  if (values.length === 0) return null;

  const first = values[0];
  const latest = values[values.length - 1];
  return {
    first,
    latest,
    delta: Number((latest - first).toFixed(2)),
    peak: Math.max(...values),
    count: values.length,
  };
}

function meanSeverity(entries: SummaryEntry[]): number | null {
  const scored = entries.filter((entry) => typeof entry.severity === "number");
  if (scored.length === 0) return null;
  return scored.reduce((sum, entry) => sum + (entry.severity as number), 0) / scored.length;
}

/**
 * Summarises what a patient recorded since a reference point — normally the
 * last completed appointment. `entries` must belong to one patient and are
 * sorted here by the date the patient said the change happened.
 */
export function summarise(
  entries: SummaryEntry[],
  windowStart: string | null,
  windowEnd = new Date().toISOString().slice(0, 10),
): TrackerSummary {
  const ordered = [...entries].sort((a, b) => a.occurredOn.localeCompare(b.occurredOn));

  const byKind = { symptom: 0, body_change: 0, measurement: 0 };
  const severityCounts: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const byTitle = new Map<string, { title: string; count: number; maxSeverity: number; lastSeen: string }>();
  const days = new Set<string>();
  let worst: SummaryEntry | null = null;

  for (const entry of ordered) {
    byKind[entry.kind] += 1;
    days.add(entry.occurredOn);

    if (typeof entry.severity === "number") {
      severityCounts[entry.severity as 1 | 2 | 3 | 4 | 5] += 1;
      if (!worst || entry.severity > (worst.severity ?? 0)) worst = entry;
    }

    if (entry.kind !== "measurement") {
      const key = entry.title.trim().toLowerCase();
      const seen = byTitle.get(key);
      byTitle.set(key, {
        title: seen?.title ?? entry.title.trim(), // keep the first spelling the patient used
        count: (seen?.count ?? 0) + 1,
        maxSeverity: Math.max(seen?.maxSeverity ?? 0, entry.severity ?? 0),
        lastSeen: entry.occurredOn,
      });
    }
  }

  const scored = ordered.filter((entry) => typeof entry.severity === "number");
  let trend: TrackerSummary["trend"] = "insufficient";
  if (scored.length >= 4) {
    const mid = Math.floor(scored.length / 2);
    const early = meanSeverity(scored.slice(0, mid)) ?? 0;
    const late = meanSeverity(scored.slice(mid)) ?? 0;
    const shift = late - early;
    trend = shift >= 0.5 ? "worsening" : shift <= -0.5 ? "improving" : "steady";
  }

  const temperature = readingFrom(ordered, "temperatureC");
  const weight = readingFrom(ordered, "weightKg");

  const flags: string[] = [];
  if (temperature && temperature.peak >= FEVER_C) {
    flags.push(`Fever recorded — peak ${temperature.peak.toFixed(1)}°C`);
  }
  if (severityCounts[5] > 0) {
    flags.push(`${severityCounts[5]} entry(ies) rated very severe`);
  }
  if (weight && weight.first > 0) {
    const pct = (Math.abs(weight.delta) / weight.first) * 100;
    if (pct >= WEIGHT_SHIFT_PCT) {
      flags.push(
        `Weight ${weight.delta < 0 ? "loss" : "gain"} of ${Math.abs(weight.delta).toFixed(1)}kg (${pct.toFixed(1)}%)`,
      );
    }
  }
  if (trend === "worsening") flags.push("Symptom severity is rising across the window");

  const average = meanSeverity(ordered);

  return {
    windowStart,
    windowEnd,
    windowLabel: windowStart ? `since ${windowStart}` : "since registration",
    total: ordered.length,
    byKind,
    severityCounts,
    averageSeverity: average === null ? null : Number(average.toFixed(1)),
    worst,
    recurring: [...byTitle.values()]
      .filter((item) => item.count > 1)
      .sort((a, b) => b.count - a.count || b.maxSeverity - a.maxSeverity)
      .slice(0, 5),
    activeDays: days.size,
    temperature,
    weight,
    trend,
    flags,
  };
}
