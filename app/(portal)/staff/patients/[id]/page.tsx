import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { requireClinician } from "@/lib/auth";
import {
  getNextAppointment,
  getSummarySinceLastVisit,
  getPatientProfile,
  getTimeline,
  listConsultationNotes,
  listRecordAccess,
  logRecordAccess,
} from "@/lib/queries";
import { EntryCard, SummaryPanel } from "@/components/tracker";
import { ConsultationForm } from "@/components/consultation-form";
import { Card, EmptyState, Pill, SectionHeading } from "@/components/ui";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { formatDate, formatDateTime } from "@/components/severity";

export const metadata = { title: "Consultation" };

export default async function PatientRecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireClinician();
  const { id } = await params;

  const patient = await getPatientProfile(id);
  if (!patient) notFound();

  // Feature 6: the clinician read is itself part of the record.
  await logRecordAccess(patient.id, session.userId, "viewed_tracker", "consultation view");

  const [{ summary, entries, lastVisit }, timeline, notes, nextAppointment, accessLog] =
    await Promise.all([
      getSummarySinceLastVisit(patient.id),
      getTimeline(patient.id, 60),
      listConsultationNotes(patient.id),
      getNextAppointment(patient.id),
      listRecordAccess(patient.id),
    ]);

  return (
    <div className="space-y-7">
      <Link
        href="/staff"
        className="inline-flex items-center gap-2 text-sm font-bold text-brand-600 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        All patients
      </Link>

      <Reveal>
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-brand-700 via-brand-600 to-teal-600 p-6 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/75">
              {patient.identifier}
            </p>
            <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">{patient.fullName}</h1>
            <p className="mt-1 text-sm text-white/85">
              {[patient.department, patient.faculty].filter(Boolean).join(" · ") ||
                "Department not recorded"}
            </p>
          </div>

          <dl className="grid gap-4 p-5 sm:grid-cols-4">
            {[
              ["Date of birth", patient.dateOfBirth ? formatDate(patient.dateOfBirth) : "—"],
              ["Gender", patient.gender || "—"],
              ["Blood group", patient.bloodGroup || "—"],
              ["Genotype", patient.genotype || "—"],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-bold uppercase tracking-wider text-ink-muted">{label}</dt>
                <dd className="mt-1 text-sm font-extrabold text-brand-800">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-wrap items-center gap-2 border-t border-brand-200/70 px-5 py-4">
            {patient.allergies ? <Pill tone="alert">Allergies: {patient.allergies}</Pill> : null}
            {nextAppointment ? (
              <Pill tone="teal">Next visit {formatDateTime(nextAppointment.scheduledFor)}</Pill>
            ) : (
              <Pill tone="muted">No upcoming appointment</Pill>
            )}
            {patient.phone ? <Pill tone="brand">{patient.phone}</Pill> : null}
            <Pill tone="brand">{patient.email}</Pill>
          </div>
        </Card>
      </Reveal>

      <Reveal>
        <SummaryPanel
          summary={summary}
          entries={entries}
          heading="Tracker summary since last appointment"
          lastVisitLabel={
            lastVisit
              ? `Last completed visit ${formatDateTime(lastVisit.completedAt ?? lastVisit.scheduledFor)}${
                  lastVisit.staffName ? ` · ${lastVisit.staffName}` : ""
                }`
              : "First consultation — showing the patient's whole tracker"
          }
        />
      </Reveal>

      <Reveal>
        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-3">
            <SectionHeading
              title="Tracker history"
              hint="Everything the patient recorded, newest first."
            />
            {timeline.length === 0 ? (
              <EmptyState
                title="No tracker entries"
                body="This patient has not recorded any symptoms or measurements yet."
              />
            ) : (
              <Stagger className="grid gap-3 sm:grid-cols-2">
                {timeline.map((entry) => (
                  <StaggerItem key={entry.id}>
                    <EntryCard entry={entry} />
                  </StaggerItem>
                ))}
              </Stagger>
            )}
          </div>

          <div className="space-y-5">
            <ConsultationForm
              patientId={patient.id}
              appointmentId={nextAppointment?.id}
              appointmentLabel={
                nextAppointment ? formatDateTime(nextAppointment.scheduledFor) : undefined
              }
            />

            <Card className="p-5">
              <h2 className="text-sm font-extrabold text-brand-800">Medical record — notes</h2>
              {notes.length === 0 ? (
                <p className="mt-2 text-sm text-ink-muted">No consultation notes recorded yet.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {notes.map((note) => (
                    <li key={note.id} className="rounded-xl border border-brand-200/70 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                          {formatDateTime(note.createdAt)}
                        </p>
                        <Pill tone="muted">
                          {note.authorRole} · {note.authorName}
                        </Pill>
                      </div>
                      {note.diagnosis ? (
                        <p className="mt-2 text-sm font-extrabold text-brand-800">{note.diagnosis}</p>
                      ) : null}
                      <p className="mt-1 whitespace-pre-line text-sm text-ink-muted">{note.findings}</p>
                      {note.treatment ? (
                        <p className="mt-2 whitespace-pre-line text-sm text-brand-700">
                          <span className="font-bold">Plan:</span> {note.treatment}
                        </p>
                      ) : null}
                      <p className="mt-2 text-[11px] font-semibold text-ink-muted">
                        Reviewed {note.reviewedEntryCount} tracker entr
                        {note.reviewedEntryCount === 1 ? "y" : "ies"}
                        {note.reviewedFrom ? ` from ${formatDate(note.reviewedFrom)}` : ""}
                        {note.reviewedTo ? ` to ${formatDate(note.reviewedTo)}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="p-5">
              <h2 className="flex items-center gap-2 text-sm font-extrabold text-brand-800">
                <ShieldCheck className="h-4 w-4 text-teal-600" />
                Record access log
              </h2>
              <ul className="mt-3 space-y-2 text-xs text-ink-muted">
                {accessLog.map((event) => (
                  <li key={event.id} className="flex justify-between gap-3">
                    <span className="font-semibold text-brand-700">
                      {event.actorName} · {event.action.replace(/_/g, " ")}
                    </span>
                    <span className="shrink-0">{formatDateTime(event.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
