"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, register, type ActionState } from "@/lib/actions";
import { Banner, Field, SubmitButton, inputClass } from "./ui";

const empty: ActionState = {};

export function LoginForm() {
  const [state, action] = useActionState(login, empty);

  return (
    <form action={action} className="space-y-4">
      {state.error ? <Banner tone="error">{state.error}</Banner> : null}

      <Field label="Email address" name="email" error={state.fieldErrors?.email} required>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@fulokoja.edu.ng"
          className={inputClass}
        />
      </Field>

      <Field label="Password" name="password" error={state.fieldErrors?.password} required>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={1}
          className={inputClass}
        />
      </Field>

      <SubmitButton className="w-full" pendingLabel="Signing in…">
        Sign in
      </SubmitButton>

      <p className="text-center text-sm text-ink-muted">
        New patient?{" "}
        <Link href="/register" className="font-bold text-brand-600 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const [state, action] = useActionState(register, empty);

  return (
    <form action={action} className="space-y-4">
      {state.error ? <Banner tone="error">{state.error}</Banner> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" name="fullName" error={state.fieldErrors?.fullName} required>
          <input id="fullName" name="fullName" required minLength={3} maxLength={120} className={inputClass} />
        </Field>

        <Field
          label="Matric / staff number"
          name="identifier"
          error={state.fieldErrors?.identifier}
          required
          hint="e.g. FUL/21/CSC/1043"
        >
          <input id="identifier" name="identifier" required minLength={3} maxLength={40} className={inputClass} />
        </Field>

        <Field label="Email address" name="email" error={state.fieldErrors?.email} required>
          <input id="email" name="email" type="email" required autoComplete="email" className={inputClass} />
        </Field>

        <Field label="Phone number" name="phone" error={state.fieldErrors?.phone}>
          <input id="phone" name="phone" maxLength={32} className={inputClass} placeholder="0803…" />
        </Field>

        <Field label="Faculty" name="faculty" error={state.fieldErrors?.faculty}>
          <input id="faculty" name="faculty" maxLength={120} className={inputClass} />
        </Field>

        <Field label="Department" name="department" error={state.fieldErrors?.department}>
          <input id="department" name="department" maxLength={120} className={inputClass} />
        </Field>

        <Field label="Date of birth" name="dateOfBirth" error={state.fieldErrors?.dateOfBirth}>
          <input id="dateOfBirth" name="dateOfBirth" type="date" max={new Date().toISOString().slice(0, 10)} className={inputClass} />
        </Field>

        <Field label="Gender" name="gender" error={state.fieldErrors?.gender}>
          <select id="gender" name="gender" defaultValue="" className={inputClass}>
            <option value="">Prefer not to say</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
          </select>
        </Field>

        <Field label="Blood group" name="bloodGroup" error={state.fieldErrors?.bloodGroup}>
          <select id="bloodGroup" name="bloodGroup" defaultValue="" className={inputClass}>
            <option value="">Unknown</option>
            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Genotype" name="genotype" error={state.fieldErrors?.genotype}>
          <select id="genotype" name="genotype" defaultValue="" className={inputClass}>
            <option value="">Unknown</option>
            {["AA", "AS", "SS", "AC", "SC"].map((genotype) => (
              <option key={genotype} value={genotype}>
                {genotype}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field
        label="Password"
        name="password"
        error={state.fieldErrors?.password}
        hint="At least 8 characters."
        required
      >
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
        />
      </Field>

      <SubmitButton className="w-full" pendingLabel="Creating account…">
        Create my patient account
      </SubmitButton>

      <p className="text-center text-sm text-ink-muted">
        Already registered?{" "}
        <Link href="/login" className="font-bold text-brand-600 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
