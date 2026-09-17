import { AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, Thermometer, Weight } from "lucide-react";
import { Card, Pill, SectionHeading } from "./ui";
import { SeverityBars, Sparkline, StatTile } from "./charts";
import { Stagger, StaggerItem } from "./motion";
import { KIND_META, formatDate, relativeDay, severityOf, type EntryKind } from "./severity";
import type { TimelineEntry } from "@/lib/queries";
import type { TrackerSummary } from "@/lib/summary";

export function EntryCard({ entry }: { entry: TimelineEntry }) {
  const severity = severityOf(entry.severity);
  const kind = KIND_META[entry.kind as EntryKind];

  return (
    <article className="rounded-2xl border border-brand-200/70 bg-white p-4 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-extrabold text-brand-800">{entry.title}</h3>
            <Pill tone={entry.kind === "measurement" ? "teal" : "brand"}>{kind.label}</Pill>
            {entry.bodyArea ? <Pill tone="muted">{entry.bodyArea}</Pill> : null}
          </div>
          <p className="mt-1 text-xs font-semibold text-ink-muted">
            {relativeDay(entry.occurredOn)} · {formatDate(entry.occurredOn)}
          </p>
        </div>

        {severity && entry.severity ? (
          <div className="flex shrink-0 flex-col items-center">
            <span
              className="grid h-9 w-9 place-items-center rounded-xl text-sm font-extrabold"
              style={{ background: severity.color, color: severity.ink }}
            >
              {entry.severity}
            </span>
            <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
              {severity.label}
            </span>
          </div>
        ) : null}
      </div>

      {entry.description ? (
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-muted">
          {entry.description}
        </p>
      ) : null}

      {entry.temperatureC || entry.weightKg ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {entry.temperatureC ? (
            <Pill tone={Number(entry.temperatureC) >= 38 ? "alert" : "teal"}>
              <Thermometer className="h-3.5 w-3.5" />
              {Number(entry.temperatureC).toFixed(1)}°C
            </Pill>
          ) : null}
          {entry.weightKg ? (
            <Pill tone="gold">
              <Weight className="h-3.5 w-3.5" />
              {Number(entry.weightKg).toFixed(1)} kg
            </Pill>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export function EntryList({ entries }: { entries: TimelineEntry[] }) {
  return (
    <Stagger className="grid gap-3 sm:grid-cols-2">
      {entries.map((entry) => (
        <StaggerItem key={entry.id}>
          <EntryCard entry={entry} />
        </StaggerItem>
      ))}
    </Stagger>
  );
}

const TREND_COPY = {
  improving: { label: "Easing off", icon: ArrowDownRight, tone: "teal" as const },
  worsening: { label: "Getting worse", icon: ArrowUpRight, tone: "alert" as const },
  steady: { label: "Holding steady", icon: ArrowRight, tone: "brand" as const },
  insufficient: { label: "Not enough entries yet", icon: ArrowRight, tone: "muted" as const },
};

/**
 * Feature 7 — the summary a patient sees on their dashboard and a clinician
 * sees at the top of a consultation.
 */
export function SummaryPanel({
  summary,
  entries,
  heading = "Since your last appointment",
  lastVisitLabel,
}: {
  summary: TrackerSummary;
  entries: TimelineEntry[];
  heading?: string;
  lastVisitLabel: string;
}) {
  const trend = TREND_COPY[summary.trend];
  const TrendIcon = trend.icon;

  const temperaturePoints = entries
    .filter((entry) => entry.temperatureC)
    .map((entry) => ({ date: entry.occurredOn, value: Number(entry.temperatureC) }));
  const weightPoints = entries
    .filter((entry) => entry.weightKg)
    .map((entry) => ({ date: entry.occurredOn, value: Number(entry.weightKg) }));

  return (
    <div className="space-y-4">
      <SectionHeading
        title={heading}
        hint={lastVisitLabel}
        action={
          <Pill tone={trend.tone}>
            <TrendIcon className="h-3.5 w-3.5" />
            {trend.label}
          </Pill>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Entries" value={summary.total} caption={`across ${summary.activeDays} day(s)`} />
        <StatTile
          label="Average severity"
          value={summary.averageSeverity ?? 0}
          decimals={1}
          suffix=" / 5"
          caption={summary.worst ? `worst: ${summary.worst.title}` : "no severity recorded"}
          tone="teal"
        />
        <StatTile
          label="Peak temperature"
          value={summary.temperature?.peak ?? 0}
          decimals={1}
          suffix="°C"
          caption={summary.temperature ? `${summary.temperature.count} reading(s)` : "no readings"}
          tone={summary.temperature && summary.temperature.peak >= 38 ? "alert" : "gold"}
        />
        <StatTile
          label="Weight change"
          value={summary.weight?.delta ?? 0}
          decimals={1}
          suffix=" kg"
          caption={
            summary.weight ? `now ${summary.weight.latest.toFixed(1)} kg` : "no weight recorded"
          }
          tone="brand"
        />
      </div>

      {summary.flags.length > 0 ? (
        <Card className="border-[#f6c7b8] bg-[#fdeceb] p-4">
          <p className="flex items-center gap-2 text-sm font-extrabold text-[#a92f26]">
            <AlertTriangle className="h-4 w-4" />
            Needs attention
          </p>
          <ul className="mt-2 space-y-1 text-sm font-semibold text-[#a92f26]">
            {summary.flags.map((flag) => (
              <li key={flag}>• {flag}</li>
            ))}
          </ul>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="text-sm font-extrabold text-brand-800">Severity distribution</h3>
          <p className="mb-4 text-xs text-ink-muted">How the recorded entries were rated.</p>
          <SeverityBars counts={summary.severityCounts} />
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-extrabold text-brand-800">Recurring complaints</h3>
          <p className="mb-3 text-xs text-ink-muted">Recorded more than once in this window.</p>
          {summary.recurring.length === 0 ? (
            <p className="text-sm text-ink-muted">Nothing has repeated so far.</p>
          ) : (
            <ul className="space-y-2">
              {summary.recurring.map((item) => (
                <li
                  key={item.title}
                  className="flex items-center justify-between gap-3 rounded-xl border border-brand-200/70 px-3 py-2"
                >
                  <span className="truncate text-sm font-bold text-brand-800">{item.title}</span>
                  <span className="flex shrink-0 items-center gap-2 text-xs font-semibold text-ink-muted">
                    ×{item.count}
                    <span
                      className="grid h-6 w-6 place-items-center rounded-lg text-[11px] font-extrabold"
                      style={{
                        background: severityOf(item.maxSeverity)?.color ?? "var(--color-brand-100)",
                        color: severityOf(item.maxSeverity)?.ink ?? "var(--color-brand-700)",
                      }}
                      title={`Worst rating ${item.maxSeverity}`}
                    >
                      {item.maxSeverity || "–"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {temperaturePoints.length > 0 ? (
          <Card className="p-5">
            <h3 className="text-sm font-extrabold text-brand-800">Temperature trend (°C)</h3>
            <Sparkline points={temperaturePoints} unit="°C" label="Temperature" domain={[35, 41]} />
          </Card>
        ) : null}

        {weightPoints.length > 0 ? (
          <Card className="p-5">
            <h3 className="text-sm font-extrabold text-brand-800">Weight trend (kg)</h3>
            <Sparkline points={weightPoints} unit="kg" label="Weight" />
          </Card>
        ) : null}
      </div>
    </div>
  );
}
