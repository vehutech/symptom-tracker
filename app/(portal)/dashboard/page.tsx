import Link from "next/link";
import { CalendarDays, ClipboardPlus, LineChart } from "lucide-react";
import { requirePatient } from "@/lib/auth";
import { getNextAppointment, getSummarySinceLastVisit, getTimeline } from "@/lib/queries";
import { SummaryPanel, EntryList } from "@/components/tracker";
import { Card, EmptyState, Pill, SectionHeading } from "@/components/ui";
import { Reveal } from "@/components/motion";
import { formatDate, formatDateTime } from "@/components/severity";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { patient } = await requirePatient();
  const [{ summary, entries, lastVisit }, recent, nextAppointment] = await Promise.all([
    getSummarySinceLastVisit(patient.id),
    getTimeline(patient.id, 4),
    getNextAppointment(patient.id),
  ]);

  const firstName = patient.fullName.split(" ")[0];

  return (
    <div className="space-y-7">
      <Reveal>
        <Card className="overflow-hidden">
          <div className="relative bg-gradient-to-br from-brand-700 via-brand-600 to-teal-600 p-6 text-white">
            <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10" />
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/75">
              {patient.identifier}
            </p>
            <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">Hello, {firstName}</h1>
            <p className="mt-1 max-w-xl text-sm text-white/85">
              Record anything you notice before your next appointment — the clinic sees it the
              moment your consultation starts.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/tracker/new"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-brand-700 transition hover:bg-brand-50"
              >
                <ClipboardPlus className="h-4 w-4" />
                Record a new entry
              </Link>
              <Link
                href="/tracker"
                className="inline-flex items-center gap-2 rounded-xl border border-white/40 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
              >
                <LineChart className="h-4 w-4" />
                My tracker history
              </Link>
            </div>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                Next appointment
              </p>
              {nextAppointment ? (
                <>
                  <p className="mt-1 text-sm font-extrabold text-brand-800">
                    {formatDateTime(nextAppointment.scheduledFor)}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {nextAppointment.clinic} · {nextAppointment.reason}
                  </p>
                </>
              ) : (
                <Link href="/appointments" className="mt-1 block text-sm font-bold text-brand-600 hover:underline">
                  Request one →
                </Link>
              )}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">Last visit</p>
              <p className="mt-1 text-sm font-extrabold text-brand-800">
                {lastVisit
                  ? formatDateTime(lastVisit.completedAt ?? lastVisit.scheduledFor)
                  : "No completed visit yet"}
              </p>
              {lastVisit?.staffName ? (
                <p className="text-xs text-ink-muted">seen by {lastVisit.staffName}</p>
              ) : null}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">Record</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {patient.bloodGroup ? <Pill tone="teal">Blood {patient.bloodGroup}</Pill> : null}
                {patient.genotype ? <Pill tone="gold">{patient.genotype}</Pill> : null}
                {patient.department ? <Pill tone="muted">{patient.department}</Pill> : null}
              </div>
            </div>
          </div>
        </Card>
      </Reveal>

      <Reveal>
        <SummaryPanel
          summary={summary}
          entries={entries}
          lastVisitLabel={
            lastVisit
              ? `Everything recorded since ${formatDate(
                  (lastVisit.completedAt ?? lastVisit.scheduledFor).toISOString().slice(0, 10),
                )}`
              : "Everything you have recorded so far"
          }
        />
      </Reveal>

      <Reveal>
        <div className="space-y-3">
          <SectionHeading
            title="Latest entries"
            hint="The four most recent things you recorded."
            action={
              <Link href="/tracker" className="text-sm font-bold text-brand-600 hover:underline">
                View full history →
              </Link>
            }
          />
          {recent.length === 0 ? (
            <EmptyState
              title="Nothing recorded yet"
              body="Add the first symptom, body change or reading you notice. It takes less than a minute."
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
            <EntryList entries={recent} />
          )}
        </div>
      </Reveal>

      <Reveal>
        <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <h2 className="text-sm font-extrabold text-brand-800">Appointments</h2>
            <p className="text-xs text-ink-muted">Request a clinic slot or review past visits.</p>
          </div>
          <Link
            href="/appointments"
            className="inline-flex items-center gap-2 rounded-xl border border-brand-200 px-4 py-2.5 text-sm font-bold text-brand-700 transition hover:bg-brand-50"
          >
            <CalendarDays className="h-4 w-4" />
            Open appointments
          </Link>
        </Card>
      </Reveal>
    </div>
  );
}
