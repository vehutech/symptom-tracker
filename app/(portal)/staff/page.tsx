import Link from "next/link";
import { Activity, CalendarClock, Search, TriangleAlert, Users } from "lucide-react";
import { requireClinician } from "@/lib/auth";
import { clinicStats, listPatientsForClinician } from "@/lib/queries";
import { StatTile } from "@/components/charts";
import { Card, EmptyState, Pill, SectionHeading, inputClass } from "@/components/ui";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { relativeDay, severityOf } from "@/components/severity";

export const metadata = { title: "Patients" };

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireClinician();
  const { q = "" } = await searchParams;
  const [stats, patients] = await Promise.all([clinicStats(), listPatientsForClinician(q)]);

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Clinic patients"
        hint="Open a patient to see their tracker and write a consultation note."
        action={
          <Link
            href="/staff/schedule"
            className="inline-flex items-center gap-2 rounded-xl border border-brand-200 px-4 py-2.5 text-sm font-bold text-brand-700 transition hover:bg-brand-50"
          >
            <CalendarClock className="h-4 w-4" />
            Clinic schedule
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Registered patients" value={stats.patients} icon={<Users className="h-4 w-4" />} />
        <StatTile label="Tracker entries" value={stats.entries} tone="teal" icon={<Activity className="h-4 w-4" />} />
        <StatTile
          label="Upcoming appointments"
          value={stats.upcoming}
          tone="gold"
          icon={<CalendarClock className="h-4 w-4" />}
        />
        <StatTile
          label="Severe entries (4–5)"
          value={stats.flagged}
          tone="alert"
          icon={<TriangleAlert className="h-4 w-4" />}
          caption="needs review"
        />
      </div>

      <Card className="p-4">
        <form className="flex flex-wrap items-end gap-3">
          <div className="min-w-56 flex-1">
            <label htmlFor="q" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-muted">
              Find a patient
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="q"
                name="q"
                defaultValue={q}
                placeholder="Name or matric number"
                className={`${inputClass} pl-9`}
              />
            </div>
          </div>
          <button className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700">
            Search
          </button>
          {q ? (
            <Link href="/staff" className="px-2 py-2.5 text-sm font-bold text-ink-muted hover:underline">
              Clear
            </Link>
          ) : null}
        </form>
      </Card>

      {patients.length === 0 ? (
        <EmptyState
          title="No patient matches that search"
          body="Try the matriculation number, or clear the search to list everyone registered at the clinic."
        />
      ) : (
        <Reveal>
          <Stagger className="grid gap-3 md:grid-cols-2">
            {patients.map((patient) => {
              const peak = severityOf(Number(patient.peakSeverity ?? 0));
              return (
                <StaggerItem key={patient.id}>
                  <Link
                    href={`/staff/patients/${patient.id}`}
                    className="block rounded-2xl border border-brand-200/70 bg-white p-4 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-[var(--shadow-lift)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-base font-extrabold text-brand-800">
                          {patient.fullName}
                        </p>
                        <p className="text-xs font-semibold text-ink-muted">{patient.identifier}</p>
                        {patient.department ? (
                          <p className="mt-1 text-xs text-ink-muted">{patient.department}</p>
                        ) : null}
                      </div>
                      {peak && Number(patient.peakSeverity) >= 4 ? (
                        <span
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-xs font-extrabold"
                          style={{ background: peak.color, color: peak.ink }}
                          title={`Worst recorded severity: ${patient.peakSeverity} (${peak.label})`}
                        >
                          {patient.peakSeverity}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Pill tone="brand">{patient.entryCount} tracker entr{patient.entryCount === 1 ? "y" : "ies"}</Pill>
                      {patient.lastEntryOn ? (
                        <Pill tone="teal">last {relativeDay(patient.lastEntryOn)}</Pill>
                      ) : (
                        <Pill tone="muted">no entries yet</Pill>
                      )}
                    </div>
                  </Link>
                </StaggerItem>
              );
            })}
          </Stagger>
        </Reveal>
      )}
    </div>
  );
}
