import Link from "next/link";
import { ClipboardPlus, Search } from "lucide-react";
import { requirePatient } from "@/lib/auth";
import { getTimeline } from "@/lib/queries";
import { EntryCard } from "@/components/tracker";
import { Banner, Card, EmptyState, SectionHeading, inputClass } from "@/components/ui";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { KIND_META, type EntryKind } from "@/components/severity";

export const metadata = { title: "My tracker" };

type Search = { q?: string; kind?: string; saved?: string };

export default async function TrackerPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { patient } = await requirePatient();
  const { q = "", kind = "", saved } = await searchParams;

  const all = await getTimeline(patient.id, 200);
  const needle = q.trim().toLowerCase();
  const entries = all.filter((entry) => {
    const matchesKind = !kind || entry.kind === kind;
    const matchesText =
      !needle ||
      entry.title.toLowerCase().includes(needle) ||
      (entry.description ?? "").toLowerCase().includes(needle) ||
      (entry.bodyArea ?? "").toLowerCase().includes(needle);
    return matchesKind && matchesText;
  });

  // History stays grouped by month so a long record is still readable.
  const months = new Map<string, typeof entries>();
  for (const entry of entries) {
    const key = entry.occurredOn.slice(0, 7);
    months.set(key, [...(months.get(key) ?? []), entry]);
  }

  return (
    <div className="space-y-6">
      {saved ? <Banner tone="success">Entry saved to your tracker.</Banner> : null}

      <SectionHeading
        title="My tracker history"
        hint={`${all.length} entr${all.length === 1 ? "y" : "ies"} on your medical record`}
        action={
          <Link
            href="/tracker/new"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700"
          >
            <ClipboardPlus className="h-4 w-4" />
            New entry
          </Link>
        }
      />

      <Card className="p-4">
        <form className="flex flex-wrap items-end gap-3">
          <div className="min-w-56 flex-1">
            <label htmlFor="q" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-muted">
              Search
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input id="q" name="q" defaultValue={q} placeholder="headache, ankle, fever…" className={`${inputClass} pl-9`} />
            </div>
          </div>
          <div>
            <label htmlFor="kind" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-muted">
              Type
            </label>
            <select id="kind" name="kind" defaultValue={kind} className={inputClass}>
              <option value="">All types</option>
              {(Object.keys(KIND_META) as EntryKind[]).map((option) => (
                <option key={option} value={option}>
                  {KIND_META[option].label}
                </option>
              ))}
            </select>
          </div>
          <button className="rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-bold text-brand-700 transition hover:bg-brand-50">
            Filter
          </button>
          {q || kind ? (
            <Link href="/tracker" className="px-2 py-2.5 text-sm font-bold text-ink-muted hover:underline">
              Clear
            </Link>
          ) : null}
        </form>
      </Card>

      {entries.length === 0 ? (
        <EmptyState
          title={all.length === 0 ? "Your tracker is empty" : "Nothing matches that filter"}
          body={
            all.length === 0
              ? "Record a symptom, a body change or a reading and it will appear here permanently."
              : "Try a different word, or clear the filter to see the whole history."
          }
          action={
            <Link
              href="/tracker/new"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white"
            >
              <ClipboardPlus className="h-4 w-4" />
              Record an entry
            </Link>
          }
        />
      ) : (
        <div className="space-y-8">
          {[...months.entries()].map(([month, monthEntries]) => (
            <Reveal key={month}>
              <div className="space-y-3">
                <h2 className="text-sm font-extrabold uppercase tracking-[0.14em] text-ink-muted">
                  {new Date(`${month}-01T00:00:00`).toLocaleDateString("en-NG", {
                    month: "long",
                    year: "numeric",
                  })}
                  <span className="ml-2 font-bold text-brand-600">{monthEntries.length}</span>
                </h2>
                <Stagger className="grid gap-3 sm:grid-cols-2">
                  {monthEntries.map((entry) => (
                    <StaggerItem key={entry.id}>
                      <EntryCard entry={entry} />
                    </StaggerItem>
                  ))}
                </Stagger>
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
