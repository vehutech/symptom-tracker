import "server-only";
import { and, count, desc, eq, gte, max, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  appointments,
  consultationNotes,
  patients,
  recordAccessLog,
  trackerEntries,
  users,
} from "./schema";
import { summarise, type SummaryEntry } from "./summary";

const entryColumns = {
  id: trackerEntries.id,
  kind: trackerEntries.kind,
  title: trackerEntries.title,
  bodyArea: trackerEntries.bodyArea,
  severity: trackerEntries.severity,
  description: trackerEntries.description,
  occurredOn: trackerEntries.occurredOn,
  temperatureC: trackerEntries.temperatureC,
  weightKg: trackerEntries.weightKg,
  createdAt: trackerEntries.createdAt,
};

export type TimelineEntry = {
  id: string;
  kind: "symptom" | "body_change" | "measurement";
  title: string;
  bodyArea: string | null;
  severity: number | null;
  description: string | null;
  occurredOn: string;
  temperatureC: string | null;
  weightKg: string | null;
  createdAt: Date;
};

export async function getTimeline(patientId: string, limit = 100): Promise<TimelineEntry[]> {
  return getDb()
    .select(entryColumns)
    .from(trackerEntries)
    .where(eq(trackerEntries.patientId, patientId))
    .orderBy(desc(trackerEntries.occurredOn), desc(trackerEntries.createdAt))
    .limit(limit);
}

export async function getLastCompletedAppointment(patientId: string) {
  const [last] = await getDb()
    .select({
      id: appointments.id,
      scheduledFor: appointments.scheduledFor,
      completedAt: appointments.completedAt,
      clinic: appointments.clinic,
      reason: appointments.reason,
      staffName: users.fullName,
    })
    .from(appointments)
    .leftJoin(users, eq(users.id, appointments.staffUserId))
    .where(and(eq(appointments.patientId, patientId), eq(appointments.status, "completed")))
    .orderBy(desc(appointments.scheduledFor))
    .limit(1);
  return last ?? null;
}

export async function getNextAppointment(patientId: string) {
  const [next] = await getDb()
    .select({
      id: appointments.id,
      scheduledFor: appointments.scheduledFor,
      clinic: appointments.clinic,
      reason: appointments.reason,
      staffName: users.fullName,
    })
    .from(appointments)
    .leftJoin(users, eq(users.id, appointments.staffUserId))
    .where(
      and(
        eq(appointments.patientId, patientId),
        eq(appointments.status, "scheduled"),
        gte(appointments.scheduledFor, new Date()),
      ),
    )
    .orderBy(appointments.scheduledFor)
    .limit(1);
  return next ?? null;
}

export async function listAppointments(patientId: string) {
  const rows = await getDb()
    .select({
      id: appointments.id,
      scheduledFor: appointments.scheduledFor,
      clinic: appointments.clinic,
      reason: appointments.reason,
      status: appointments.status,
      staffName: users.fullName,
    })
    .from(appointments)
    .leftJoin(users, eq(users.id, appointments.staffUserId))
    .where(eq(appointments.patientId, patientId))
    .orderBy(desc(appointments.scheduledFor))
    .limit(50);

  // Cancellable state is decided here, not during render.
  const now = Date.now();
  return rows.map((row) => ({
    ...row,
    cancellable: row.status === "scheduled" && row.scheduledFor.getTime() > now,
  }));
}

/**
 * Feature 7: everything the patient recorded since their last completed
 * appointment, condensed. Falls back to the whole history for a first visit.
 */
export async function getSummarySinceLastVisit(patientId: string) {
  const lastVisit = await getLastCompletedAppointment(patientId);
  const windowStart = lastVisit
    ? (lastVisit.completedAt ?? lastVisit.scheduledFor).toISOString().slice(0, 10)
    : null;

  const rows = await getDb()
    .select(entryColumns)
    .from(trackerEntries)
    .where(
      windowStart
        ? and(eq(trackerEntries.patientId, patientId), gte(trackerEntries.occurredOn, windowStart))
        : eq(trackerEntries.patientId, patientId),
    )
    .orderBy(trackerEntries.occurredOn);

  return {
    lastVisit,
    entries: rows as TimelineEntry[],
    summary: summarise(rows as SummaryEntry[], windowStart),
  };
}

export async function getPatientByUserId(userId: string) {
  const [record] = await getDb()
    .select({ id: patients.id })
    .from(patients)
    .where(eq(patients.userId, userId))
    .limit(1);
  return record ?? null;
}

export async function getPatientProfile(patientId: string) {
  const [record] = await getDb()
    .select({
      id: patients.id,
      identifier: patients.identifier,
      faculty: patients.faculty,
      department: patients.department,
      dateOfBirth: patients.dateOfBirth,
      gender: patients.gender,
      bloodGroup: patients.bloodGroup,
      genotype: patients.genotype,
      allergies: patients.allergies,
      fullName: users.fullName,
      email: users.email,
      phone: users.phone,
    })
    .from(patients)
    .innerJoin(users, eq(users.id, patients.userId))
    .where(eq(patients.id, patientId))
    .limit(1);
  return record ?? null;
}

/** Clinician-facing patient list with tracker activity, newest activity first. */
export async function listPatientsForClinician(search?: string) {
  const db = getDb();
  const pattern = search?.trim() ? `%${search.trim().toLowerCase()}%` : null;

  return db
    .select({
      id: patients.id,
      identifier: patients.identifier,
      fullName: users.fullName,
      department: patients.department,
      entryCount: count(trackerEntries.id),
      lastEntryOn: max(trackerEntries.occurredOn),
      peakSeverity: max(trackerEntries.severity),
    })
    .from(patients)
    .innerJoin(users, eq(users.id, patients.userId))
    .leftJoin(trackerEntries, eq(trackerEntries.patientId, patients.id))
    .where(
      pattern
        ? sql`lower(${users.fullName}) like ${pattern} or lower(${patients.identifier}) like ${pattern}`
        : undefined,
    )
    .groupBy(patients.id, patients.identifier, users.fullName, patients.department)
    .orderBy(desc(max(trackerEntries.occurredOn)))
    .limit(60);
}

export async function listConsultationNotes(patientId: string) {
  return getDb()
    .select({
      id: consultationNotes.id,
      findings: consultationNotes.findings,
      diagnosis: consultationNotes.diagnosis,
      treatment: consultationNotes.treatment,
      reviewedFrom: consultationNotes.reviewedFrom,
      reviewedTo: consultationNotes.reviewedTo,
      reviewedEntryCount: consultationNotes.reviewedEntryCount,
      createdAt: consultationNotes.createdAt,
      authorName: users.fullName,
      authorRole: users.role,
    })
    .from(consultationNotes)
    .innerJoin(users, eq(users.id, consultationNotes.authorUserId))
    .where(eq(consultationNotes.patientId, patientId))
    .orderBy(desc(consultationNotes.createdAt))
    .limit(30);
}

/** Feature 6 + audit trail: record that a clinician opened a patient tracker. */
export async function logRecordAccess(
  patientId: string,
  actorUserId: string,
  action: string,
  context?: string,
) {
  await getDb().insert(recordAccessLog).values({ patientId, actorUserId, action, context });
}

export async function listRecordAccess(patientId: string) {
  return getDb()
    .select({
      id: recordAccessLog.id,
      action: recordAccessLog.action,
      context: recordAccessLog.context,
      createdAt: recordAccessLog.createdAt,
      actorName: users.fullName,
      actorRole: users.role,
    })
    .from(recordAccessLog)
    .innerJoin(users, eq(users.id, recordAccessLog.actorUserId))
    .where(eq(recordAccessLog.patientId, patientId))
    .orderBy(desc(recordAccessLog.createdAt))
    .limit(10);
}

export async function clinicStats() {
  const db = getDb();
  const [patientTotal] = await db.select({ value: count() }).from(patients);
  const [entryTotal] = await db.select({ value: count() }).from(trackerEntries);
  const [upcoming] = await db
    .select({ value: count() })
    .from(appointments)
    .where(and(eq(appointments.status, "scheduled"), gte(appointments.scheduledFor, new Date())));
  const [flagged] = await db
    .select({ value: count() })
    .from(trackerEntries)
    .where(gte(trackerEntries.severity, 4));

  return {
    patients: patientTotal?.value ?? 0,
    entries: entryTotal?.value ?? 0,
    upcoming: upcoming?.value ?? 0,
    flagged: flagged?.value ?? 0,
  };
}

export async function todaysSchedule() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  return getDb()
    .select({
      id: appointments.id,
      scheduledFor: appointments.scheduledFor,
      clinic: appointments.clinic,
      reason: appointments.reason,
      status: appointments.status,
      patientId: patients.id,
      patientName: users.fullName,
      identifier: patients.identifier,
    })
    .from(appointments)
    .innerJoin(patients, eq(patients.id, appointments.patientId))
    .innerJoin(users, eq(users.id, patients.userId))
    .where(gte(appointments.scheduledFor, start))
    .orderBy(appointments.scheduledFor)
    .limit(40);
}
