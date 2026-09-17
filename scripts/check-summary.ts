/** Runnable check for the tracker summary maths: npm run check */
import assert from "node:assert/strict";
import { summarise, type SummaryEntry } from "../lib/summary";

const entry = (over: Partial<SummaryEntry> & { id: string; occurredOn: string }): SummaryEntry => ({
  kind: "symptom",
  title: "Headache",
  severity: 2,
  description: null,
  temperatureC: null,
  weightKg: null,
  ...over,
});

const entries: SummaryEntry[] = [
  entry({ id: "1", occurredOn: "2026-09-01", severity: 1, weightKg: "70.00" }),
  entry({ id: "2", occurredOn: "2026-09-03", severity: 2 }),
  entry({ id: "3", occurredOn: "2026-09-05", severity: 4, title: "headache" }),
  entry({ id: "4", occurredOn: "2026-09-07", severity: 5, title: "Chest pain" }),
  entry({
    id: "5",
    occurredOn: "2026-09-08",
    kind: "measurement",
    title: "Morning vitals",
    severity: null,
    temperatureC: "38.6",
    weightKg: "65.00",
  }),
];

const summary = summarise(entries, "2026-08-30", "2026-09-09");

assert.equal(summary.total, 5);
assert.equal(summary.byKind.symptom, 4);
assert.equal(summary.byKind.measurement, 1);
assert.equal(summary.activeDays, 5);
assert.equal(summary.averageSeverity, 3); // (1+2+4+5)/4
assert.equal(summary.worst?.id, "4");
assert.equal(summary.trend, "worsening"); // mean 1.5 -> 4.5
assert.deepEqual(summary.severityCounts, { 1: 1, 2: 1, 3: 0, 4: 1, 5: 1 });
assert.equal(summary.recurring[0].title, "Headache");
assert.equal(summary.recurring[0].count, 3); // case-insensitive grouping
assert.equal(summary.temperature?.peak, 38.6);
assert.equal(summary.weight?.delta, -5); // 70kg -> 65kg
assert.ok(summary.flags.some((flag) => flag.startsWith("Fever recorded")));
assert.ok(summary.flags.some((flag) => flag.includes("Weight loss of 5.0kg (7.1%)")));

// Empty window must not throw and must report nothing rather than guessing.
const empty = summarise([], null, "2026-09-09");
assert.equal(empty.total, 0);
assert.equal(empty.trend, "insufficient");
assert.equal(empty.averageSeverity, null);
assert.deepEqual(empty.flags, []);

console.log("summary checks passed");
