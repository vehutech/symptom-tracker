import { CalendarCheck, CalendarX, Clock } from "lucide-react";
import { requirePatient } from "@/lib/auth";
import { listAppointments } from "@/lib/queries";
import { BookingForm, CancelAppointmentForm } from "@/components/appointment-forms";
import { Card, EmptyState, Pill, SectionHeading } from "@/components/ui";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { formatDateTime } from "@/components/severity";

export const metadata = { title: "Appointments" };

const STATUS = {
  scheduled: { tone: "teal" as const, icon: Clock, label: "Scheduled" },
  completed: { tone: "brand" as const, icon: CalendarCheck, label: "Completed" },
  cancelled: { tone: "muted" as const, icon: CalendarX, label: "Cancelled" },
};

export default async function AppointmentsPage() {
  const { patient } = await requirePatient();
  const appointments = await listAppointments(patient.id);

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Appointments"
        hint="Request a slot at the university health centre and keep your visit history."
      />

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal>
          <BookingForm />
        </Reveal>

        <Reveal delay={0.05}>
          <div className="space-y-3">
            <h2 className="text-sm font-extrabold text-brand-800">Your appointments</h2>
            {appointments.length === 0 ? (
              <EmptyState
                title="No appointments yet"
                body="Request one on the left. Your tracker summary is ready for whoever sees you."
              />
            ) : (
              <Stagger className="space-y-3">
                {appointments.map((appointment) => {
                  const meta = STATUS[appointment.status];
                  const Icon = meta.icon;
                  return (
                    <StaggerItem key={appointment.id}>
                      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-extrabold text-brand-800">
                              {formatDateTime(appointment.scheduledFor)}
                            </p>
                            <Pill tone={meta.tone}>
                              <Icon className="h-3.5 w-3.5" />
                              {meta.label}
                            </Pill>
                          </div>
                          <p className="mt-1 text-sm text-ink-muted">
                            {appointment.clinic} · {appointment.reason}
                          </p>
                          {appointment.staffName ? (
                            <p className="text-xs text-ink-muted">seen by {appointment.staffName}</p>
                          ) : null}
                        </div>
                        {appointment.cancellable ? <CancelAppointmentForm appointmentId={appointment.id} /> : null}
                      </Card>
                    </StaggerItem>
                  );
                })}
              </Stagger>
            )}
          </div>
        </Reveal>
      </div>
    </div>
  );
}
