"use client";

import { useActionState } from "react";
import { bookAppointment, cancelAppointment, type ActionState } from "@/lib/actions";
import { Banner, Card, Field, SubmitButton, inputClass } from "./ui";

const CLINICS = [
  "General Outpatient",
  "Medical Consultation",
  "Nurse Triage",
  "Dental",
  "Eye Clinic",
  "Mental Health",
];

function minDateTime(): string {
  const now = new Date(Date.now() + 60 * 60 * 1000);
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

export function BookingForm() {
  const [state, action] = useActionState(bookAppointment, {} as ActionState);

  return (
    <Card className="p-5">
      <h2 className="text-sm font-extrabold text-brand-800">Request an appointment</h2>
      <p className="mb-4 text-xs text-ink-muted">
        The clinic confirms the slot; your tracker entries travel with the request.
      </p>

      <form action={action} className="space-y-4">
        {state.error ? <Banner tone="error">{state.error}</Banner> : null}
        {state.success ? <Banner tone="success">{state.success}</Banner> : null}

        <Field label="Reason for visit" name="reason" error={state.fieldErrors?.reason} required>
          <input
            id="reason"
            name="reason"
            required
            minLength={3}
            maxLength={200}
            className={inputClass}
            placeholder="Recurring headaches for two weeks"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Clinic" name="clinic" error={state.fieldErrors?.clinic} required>
            <select id="clinic" name="clinic" defaultValue={CLINICS[0]} className={inputClass}>
              {CLINICS.map((clinic) => (
                <option key={clinic} value={clinic}>
                  {clinic}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Preferred date and time"
            name="scheduledFor"
            error={state.fieldErrors?.scheduledFor}
            required
            hint="At least one hour from now."
          >
            <input
              id="scheduledFor"
              name="scheduledFor"
              type="datetime-local"
              required
              min={minDateTime()}
              className={inputClass}
            />
          </Field>
        </div>

        <SubmitButton pendingLabel="Requesting…">Request appointment</SubmitButton>
      </form>
    </Card>
  );
}

export function CancelAppointmentForm({ appointmentId }: { appointmentId: string }) {
  const [state, action] = useActionState(cancelAppointment, {} as ActionState);

  return (
    <form action={action} className="flex flex-col items-end gap-1">
      <input type="hidden" name="appointmentId" value={appointmentId} />
      <SubmitButton variant="danger" pendingLabel="Cancelling…">
        Cancel
      </SubmitButton>
      {state.error ? <p className="text-xs font-bold text-[#a92f26]">{state.error}</p> : null}
      {state.success ? <p className="text-xs font-bold text-teal-700">{state.success}</p> : null}
    </form>
  );
}
