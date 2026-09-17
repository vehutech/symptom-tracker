"use client";

import { useActionState, useState } from "react";
import { motion } from "motion/react";
import { addTrackerEntry, type ActionState } from "@/lib/actions";
import { Banner, Card, Field, SubmitButton, inputClass } from "./ui";
import { KIND_META, SEVERITY, type EntryKind } from "./severity";

const today = () => new Date().toISOString().slice(0, 10);

const SUGGESTIONS = [
  "Headache",
  "Fever",
  "Cough",
  "Sore throat",
  "Abdominal pain",
  "Dizziness",
  "Rash",
  "Swelling",
  "Fatigue",
  "Loss of appetite",
];

export function TrackerForm() {
  const [state, action] = useActionState(addTrackerEntry, {} as ActionState);
  const [kind, setKind] = useState<EntryKind>("symptom");
  const [severity, setSeverity] = useState<number | "">(3);
  const [title, setTitle] = useState("");
  const [temperature, setTemperature] = useState("");
  const [weight, setWeight] = useState("");

  const needsSeverity = kind !== "measurement";
  // Mirrors the server rule: a measurement entry needs at least one reading.
  const missingReading = kind === "measurement" && !temperature && !weight;

  return (
    <form action={action} className="space-y-5">
      {state.error ? <Banner tone="error">{state.error}</Banner> : null}

      <Card className="p-5">
        <fieldset>
          <legend className="text-sm font-extrabold text-brand-800">What are you recording?</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {(Object.keys(KIND_META) as EntryKind[]).map((option) => {
              const active = kind === option;
              return (
                <label
                  key={option}
                  className={`cursor-pointer rounded-xl border p-3 transition ${
                    active
                      ? "border-teal-500 bg-teal-50 ring-4 ring-teal-500/10"
                      : "border-brand-200 bg-white hover:border-brand-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="kind"
                    value={option}
                    checked={active}
                    onChange={() => setKind(option)}
                    className="sr-only"
                  />
                  <span className="block text-sm font-extrabold text-brand-800">
                    {KIND_META[option].label}
                  </span>
                  <span className="mt-1 block text-xs text-ink-muted">{KIND_META[option].hint}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      </Card>

      <Card className="space-y-4 p-5">
        <Field
          label={kind === "measurement" ? "Label for this reading" : "Symptom or change"}
          name="title"
          error={state.fieldErrors?.title}
          required
          hint={kind === "measurement" ? "e.g. Morning vitals" : "Say it in your own words."}
        >
          <input
            id="title"
            name="title"
            required
            minLength={2}
            maxLength={120}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            list="symptom-suggestions"
            className={inputClass}
            placeholder={kind === "measurement" ? "Morning vitals" : "Persistent headache"}
          />
          <datalist id="symptom-suggestions">
            {SUGGESTIONS.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="When did you notice it?"
            name="occurredOn"
            error={state.fieldErrors?.occurredOn}
            required
          >
            <input
              id="occurredOn"
              name="occurredOn"
              type="date"
              required
              max={today()}
              defaultValue={today()}
              className={inputClass}
            />
          </Field>

          <Field
            label="Body area"
            name="bodyArea"
            error={state.fieldErrors?.bodyArea}
            hint="Optional — where on your body?"
          >
            <input id="bodyArea" name="bodyArea" maxLength={60} className={inputClass} placeholder="Left ankle" />
          </Field>
        </div>

        {needsSeverity ? (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
            <Field
              label="How severe does it feel?"
              name="severity"
              error={state.fieldErrors?.severity}
              required
            >
              <div className="grid grid-cols-5 gap-2">
                {([1, 2, 3, 4, 5] as const).map((level) => {
                  const active = severity === level;
                  return (
                    <motion.label
                      key={level}
                      whileTap={{ scale: 0.96 }}
                      className={`cursor-pointer rounded-xl border p-2.5 text-center transition ${
                        active ? "border-brand-600 ring-4 ring-brand-600/10" : "border-brand-200"
                      }`}
                      style={active ? { background: SEVERITY[level].color } : undefined}
                    >
                      <input
                        type="radio"
                        name="severity"
                        value={level}
                        checked={active}
                        onChange={() => setSeverity(level)}
                        className="sr-only"
                        required
                      />
                      <span
                        className="block text-base font-extrabold"
                        style={{ color: active ? SEVERITY[level].ink : "var(--color-brand-800)" }}
                      >
                        {level}
                      </span>
                      <span
                        className="mt-0.5 block text-[10px] font-bold leading-tight"
                        style={{ color: active ? SEVERITY[level].ink : "var(--color-ink-muted)" }}
                      >
                        {SEVERITY[level].label}
                      </span>
                    </motion.label>
                  );
                })}
              </div>
            </Field>
          </motion.div>
        ) : (
          <input type="hidden" name="severity" value="" />
        )}

        <Field
          label="Short description"
          name="description"
          error={state.fieldErrors?.description}
          hint="What makes it better or worse? Anything the doctor should know."
        >
          <textarea
            id="description"
            name="description"
            rows={4}
            maxLength={1000}
            className={inputClass}
            placeholder="Started after lectures, throbbing behind the eyes, worse in sunlight."
          />
        </Field>
      </Card>

      <Card className="space-y-4 p-5">
        <div>
          <h2 className="text-sm font-extrabold text-brand-800">Measurements</h2>
          <p className="text-xs text-ink-muted">
            {kind === "measurement"
              ? "Enter at least one reading for a measurement entry."
              : "Optional — add them if you took a reading."}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Temperature (°C)" name="temperatureC" error={state.fieldErrors?.temperatureC}>
            <input
              id="temperatureC"
              name="temperatureC"
              type="number"
              step="0.1"
              min={30}
              max={45}
              value={temperature}
              onChange={(event) => setTemperature(event.target.value)}
              className={inputClass}
              placeholder="36.8"
            />
          </Field>

          <Field label="Weight (kg)" name="weightKg" error={state.fieldErrors?.weightKg}>
            <input
              id="weightKg"
              name="weightKg"
              type="number"
              step="0.1"
              min={20}
              max={300}
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
              className={inputClass}
              placeholder="64.5"
            />
          </Field>
        </div>
        {missingReading ? (
          <p className="text-xs font-bold text-[#a92f26]">
            Add a temperature or a weight before saving this measurement.
          </p>
        ) : null}
      </Card>

      <div className="flex justify-end gap-3">
        <SubmitButton pendingLabel="Saving entry…" disabled={missingReading}>
          Save to my tracker
        </SubmitButton>
      </div>
    </form>
  );
}
