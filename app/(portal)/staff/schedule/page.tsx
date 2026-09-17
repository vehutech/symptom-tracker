import Link from "next/link";
import { CalendarClock, CheckCircle2 } from "lucide-react";
import { requireClinician } from "@/lib/auth";
import { todaysSchedule } from "@/lib/queries";
import { completeAppointment } from "@/lib/actions";
import { Card, EmptyState, Pill, SectionHeading } from "@/components/ui";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { formatDateTime } from "@/components/severity";

export const metadata = { title: "Clinic schedule" };

export default async function SchedulePage() {
  await requireClinician();
  const schedule = await todaysSchedule();

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Clinic schedule"
        hint="Appointments from today onward. Closing a visit sets the tracker summary window for the next one."
        action={
          <Link
            href="/staff"
            className="inline-flex items-center gap-2 rounded-xl border border-brand-200 px-4 py-2.5 text-sm font-bold text-brand-700 transition hover:bg-brand-50"
          >
            <CalendarClock className="h-4 w-4" />
            All patients
          </Link>
        }
      />

      {schedule.length === 0 ? (
        <EmptyState title="Nothing on the schedule" body="No appointments are booked from today onward." />
      ) : (
        <Reveal>
          <Stagger className="space-y-3">
            {schedule.map((appointment) => (
              <StaggerItem key={appointment.id}>
                <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/staff/patients/${appointment.patientId}`}
                        className="text-base font-extrabold text-brand-800 hover:underline"
                      >
                        {appointment.patientName}
                      </Link>
                      <Pill tone="muted">{appointment.identifier}</Pill>
                      <Pill tone={appointment.status === "scheduled" ? "teal" : "brand"}>
                        {appointment.status}
                      </Pill>
                    </div>
                    <p className="mt-1 text-sm text-ink-muted">
                      {formatDateTime(appointment.scheduledFor)} · {appointment.clinic} ·{" "}
                      {appointment.reason}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/staff/patients/${appointment.patientId}`}
                      className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700"
                    >
                      Open tracker
                    </Link>
                    {appointment.status === "scheduled" ? (
                      <form action={completeAppointment}>
                        <input type="hidden" name="appointmentId" value={appointment.id} />
                        <button className="inline-flex items-center gap-2 rounded-xl border border-brand-200 px-4 py-2.5 text-sm font-bold text-brand-700 transition hover:bg-brand-50">
                          <CheckCircle2 className="h-4 w-4" />
                          Mark seen
                        </button>
                      </form>
                    ) : null}
                  </div>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </Reveal>
      )}
    </div>
  );
}
