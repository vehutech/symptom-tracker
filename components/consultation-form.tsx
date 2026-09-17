"use client";

import { useActionState } from "react";
import { saveConsultationNote, type ActionState } from "@/lib/actions";
import { Banner, Card, Field, SubmitButton, inputClass } from "./ui";

export function ConsultationForm({
  patientId,
  appointmentId,
  appointmentLabel,
}: {
  patientId: string;
  appointmentId?: string;
  appointmentLabel?: string;
}) {
  const [state, action] = useActionState(saveConsultationNote, {} as ActionState);

  return (
    <Card className="p-5">
      <h2 className="text-sm font-extrabold text-brand-800">Consultation note</h2>
      <p className="mb-4 text-xs text-ink-muted">
        Saved to the patient&apos;s medical record together with the tracker window it was based on.
        {appointmentLabel ? ` Closes the appointment on ${appointmentLabel}.` : ""}
      </p>

      <form action={action} className="space-y-4">
        {state.error ? <Banner tone="error">{state.error}</Banner> : null}
        {state.success ? <Banner tone="success">{state.success}</Banner> : null}

        <input type="hidden" name="patientId" value={patientId} />
        {appointmentId ? <input type="hidden" name="appointmentId" value={appointmentId} /> : null}

        <Field label="Findings" name="findings" error={state.fieldErrors?.findings} required>
          <textarea
            id="findings"
            name="findings"
            rows={4}
            required
            minLength={5}
            maxLength={4000}
            className={inputClass}
            placeholder="Observations, examination, vitals taken in clinic…"
          />
        </Field>

        <Field label="Diagnosis" name="diagnosis" error={state.fieldErrors?.diagnosis}>
          <input id="diagnosis" name="diagnosis" maxLength={200} className={inputClass} placeholder="Tension headache" />
        </Field>

        <Field label="Treatment / plan" name="treatment" error={state.fieldErrors?.treatment}>
          <textarea
            id="treatment"
            name="treatment"
            rows={3}
            maxLength={4000}
            className={inputClass}
            placeholder="Medication, tests ordered, review date…"
          />
        </Field>

        <SubmitButton pendingLabel="Saving note…">Save to medical record</SubmitButton>
      </form>
    </Card>
  );
}
