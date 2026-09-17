"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { getDb } from "./db";
import {
  appointments,
  consultationNotes,
  patients,
  trackerEntries,
  users,
} from "./schema";
import {
  appointmentSchema,
  consultationNoteSchema,
  formToObject,
  loginSchema,
  registerSchema,
  trackerEntrySchema,
} from "./validation";
import {
  createSession,
  destroySession,
  hashPassword,
  isClinician,
  requireClinician,
  requirePatient,
  requireUser,
  verifyPassword,
} from "./auth";
import { getPatientByUserId, logRecordAccess } from "./queries";
import { summarise, type SummaryEntry } from "./summary";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: string;
};

function fieldErrorsOf(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error.issues) };

  const [user] = await getDb()
    .select()
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);

  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "That email and password combination does not match any account." };
  }

  await createSession({ userId: user.id, role: user.role, fullName: user.fullName });
  redirect(isClinician(user.role) ? "/staff" : "/dashboard");
}

export async function register(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error.issues) };

  const data = parsed.data;
  const db = getDb();

  const [existingEmail] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1);
  if (existingEmail) {
    return { fieldErrors: { email: "An account already exists with this email. Sign in instead." } };
  }

  const [existingId] = await db
    .select({ id: patients.id })
    .from(patients)
    .where(eq(patients.identifier, data.identifier))
    .limit(1);
  if (existingId) {
    return {
      fieldErrors: {
        identifier: "This matriculation / staff number is already registered at the clinic.",
      },
    };
  }

  const passwordHash = await hashPassword(data.password);
  const created = await db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({
        email: data.email,
        passwordHash,
        fullName: data.fullName,
        phone: data.phone,
        role: "patient",
      })
      .returning({ id: users.id, fullName: users.fullName, role: users.role });

    await tx.insert(patients).values({
      userId: user.id,
      identifier: data.identifier,
      faculty: data.faculty,
      department: data.department,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      bloodGroup: data.bloodGroup,
      genotype: data.genotype,
    });

    return user;
  });

  await createSession({ userId: created.id, role: created.role, fullName: created.fullName });
  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}

/** Features 1–3: patient records a symptom, body change, or measurement. */
export async function addTrackerEntry(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { patient } = await requirePatient();
  const parsed = trackerEntrySchema.safeParse(formToObject(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error.issues) };

  const data = parsed.data;
  await getDb()
    .insert(trackerEntries)
    .values({
      patientId: patient.id,
      kind: data.kind,
      title: data.title,
      bodyArea: data.bodyArea,
      severity: data.kind === "measurement" ? null : data.severity,
      description: data.description,
      occurredOn: data.occurredOn,
      temperatureC: data.temperatureC === undefined ? null : String(data.temperatureC),
      weightKg: data.weightKg === undefined ? null : String(data.weightKg),
    });

  revalidatePath("/dashboard");
  revalidatePath("/tracker");
  redirect("/tracker?saved=1");
}

export async function bookAppointment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { patient } = await requirePatient();
  const parsed = appointmentSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error.issues) };

  await getDb().insert(appointments).values({
    patientId: patient.id,
    reason: parsed.data.reason,
    clinic: parsed.data.clinic,
    scheduledFor: new Date(parsed.data.scheduledFor),
  });

  revalidatePath("/appointments");
  revalidatePath("/dashboard");
  return { success: "Appointment requested. The clinic will confirm it." };
}

/** Destructive: guarded so only a future, still-scheduled, own appointment cancels. */
export async function cancelAppointment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { patient } = await requirePatient();
  const id = String(formData.get("appointmentId") ?? "");
  if (!id) return { error: "No appointment was selected." };

  const db = getDb();
  const [existing] = await db
    .select()
    .from(appointments)
    .where(and(eq(appointments.id, id), eq(appointments.patientId, patient.id)))
    .limit(1);

  if (!existing) return { error: "That appointment is not on your record." };
  if (existing.status !== "scheduled") {
    return { error: `This appointment is already ${existing.status} and cannot be cancelled.` };
  }
  if (existing.scheduledFor.getTime() < Date.now()) {
    return { error: "This appointment time has passed. Contact the clinic desk instead." };
  }

  await db.update(appointments).set({ status: "cancelled" }).where(eq(appointments.id, id));
  revalidatePath("/appointments");
  return { success: "Appointment cancelled." };
}

/** Feature 6: clinician opens a tracker; the read itself is audited. */
export async function recordConsultationAccess(patientId: string, context: string) {
  const session = await requireClinician();
  await logRecordAccess(patientId, session.userId, "viewed_tracker", context);
}

/** Feature 8: the consultation note stores the tracker window it was based on. */
export async function saveConsultationNote(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireClinician();
  const parsed = consultationNoteSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error.issues) };

  const data = parsed.data;
  const db = getDb();

  const [patient] = await db
    .select({ id: patients.id })
    .from(patients)
    .where(eq(patients.id, data.patientId))
    .limit(1);
  if (!patient) return { error: "That patient record no longer exists." };

  const reviewed = await db
    .select({
      id: trackerEntries.id,
      kind: trackerEntries.kind,
      title: trackerEntries.title,
      severity: trackerEntries.severity,
      description: trackerEntries.description,
      occurredOn: trackerEntries.occurredOn,
      temperatureC: trackerEntries.temperatureC,
      weightKg: trackerEntries.weightKg,
    })
    .from(trackerEntries)
    .where(eq(trackerEntries.patientId, patient.id))
    .orderBy(trackerEntries.occurredOn);

  const window = summarise(reviewed as SummaryEntry[], reviewed[0]?.occurredOn ?? null);

  await db.insert(consultationNotes).values({
    patientId: patient.id,
    appointmentId: data.appointmentId,
    authorUserId: session.userId,
    findings: data.findings,
    diagnosis: data.diagnosis,
    treatment: data.treatment,
    reviewedFrom: window.windowStart,
    reviewedTo: window.windowEnd,
    reviewedEntryCount: window.total,
  });

  if (data.appointmentId) {
    await db
      .update(appointments)
      .set({ status: "completed", completedAt: new Date(), staffUserId: session.userId })
      .where(
        and(eq(appointments.id, data.appointmentId), eq(appointments.status, "scheduled")),
      );
  }

  await logRecordAccess(patient.id, session.userId, "wrote_note", data.diagnosis ?? "consultation");
  revalidatePath(`/staff/patients/${patient.id}`);
  revalidatePath("/staff");
  return { success: "Consultation note saved to the patient's medical record." };
}

/** Used by the clinic schedule to close out a visit without a full note. */
export async function completeAppointment(formData: FormData): Promise<void> {
  const session = await requireClinician();
  const id = String(formData.get("appointmentId") ?? "");
  if (!id) return;

  const db = getDb();
  const [existing] = await db
    .select()
    .from(appointments)
    .where(eq(appointments.id, id))
    .limit(1);
  if (!existing || existing.status !== "scheduled") return;

  await db
    .update(appointments)
    .set({ status: "completed", completedAt: new Date(), staffUserId: session.userId })
    .where(eq(appointments.id, id));

  await logRecordAccess(existing.patientId, session.userId, "closed_appointment", existing.reason);
  revalidatePath("/staff/schedule");
}

/** Patients may only ever read their own tracker; used by the API route. */
export async function assertOwnPatient(patientId: string): Promise<boolean> {
  const session = await requireUser();
  if (isClinician(session.role)) return true;
  const own = await getPatientByUserId(session.userId);
  return own?.id === patientId;
}
