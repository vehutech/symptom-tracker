import {
  pgEnum,
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  date,
  integer,
  numeric,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["patient", "doctor", "nurse", "admin"]);
export const appointmentStatus = pgEnum("appointment_status", [
  "scheduled",
  "completed",
  "cancelled",
]);
/** A tracker entry is one of three distinct clinical events, never collapsed. */
export const entryKind = pgEnum("entry_kind", ["symptom", "body_change", "measurement"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 160 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    fullName: varchar("full_name", { length: 120 }).notNull(),
    phone: varchar("phone", { length: 32 }),
    role: userRole("role").notNull().default("patient"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_unique").on(t.email)],
);

export const patients = pgTable(
  "patients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Matriculation number for students, staff number for staff patients. */
    identifier: varchar("identifier", { length: 40 }).notNull(),
    faculty: varchar("faculty", { length: 120 }),
    department: varchar("department", { length: 120 }),
    dateOfBirth: date("date_of_birth"),
    gender: varchar("gender", { length: 16 }),
    bloodGroup: varchar("blood_group", { length: 8 }),
    genotype: varchar("genotype", { length: 8 }),
    allergies: text("allergies"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("patients_user_unique").on(t.userId),
    uniqueIndex("patients_identifier_unique").on(t.identifier),
  ],
);

export const staffProfiles = pgTable(
  "staff_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    staffNumber: varchar("staff_number", { length: 40 }).notNull(),
    specialty: varchar("specialty", { length: 120 }),
    unit: varchar("unit", { length: 120 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("staff_user_unique").on(t.userId),
    uniqueIndex("staff_number_unique").on(t.staffNumber),
  ],
);

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    staffUserId: uuid("staff_user_id").references(() => users.id, { onDelete: "set null" }),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }).notNull(),
    reason: varchar("reason", { length: 200 }).notNull(),
    clinic: varchar("clinic", { length: 120 }).notNull().default("General Outpatient"),
    status: appointmentStatus("status").notNull().default("scheduled"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("appointments_patient_idx").on(t.patientId, t.scheduledFor),
    index("appointments_schedule_idx").on(t.scheduledFor),
  ],
);

/**
 * Patient-authored record of a symptom, a noticeable body change, or a basic
 * measurement taken between appointments. Severity applies to symptoms and body
 * changes; temperature and weight apply wherever the patient recorded them.
 */
export const trackerEntries = pgTable(
  "tracker_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    kind: entryKind("kind").notNull().default("symptom"),
    title: varchar("title", { length: 120 }).notNull(),
    bodyArea: varchar("body_area", { length: 60 }),
    /** 1 = barely noticeable, 5 = severe. Null for measurement-only entries. */
    severity: integer("severity"),
    description: text("description"),
    occurredOn: date("occurred_on").notNull(),
    temperatureC: numeric("temperature_c", { precision: 4, scale: 1 }),
    weightKg: numeric("weight_kg", { precision: 5, scale: 2 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("tracker_patient_idx").on(t.patientId, t.occurredOn)],
);

/** Clinician write-up produced during a consultation; part of the medical record. */
export const consultationNotes = pgTable(
  "consultation_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    appointmentId: uuid("appointment_id").references(() => appointments.id, {
      onDelete: "set null",
    }),
    authorUserId: uuid("author_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    findings: text("findings").notNull(),
    diagnosis: varchar("diagnosis", { length: 200 }),
    treatment: text("treatment"),
    /** Tracker window the clinician reviewed, stored so the note is reproducible. */
    reviewedFrom: date("reviewed_from"),
    reviewedTo: date("reviewed_to"),
    reviewedEntryCount: integer("reviewed_entry_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notes_patient_idx").on(t.patientId, t.createdAt)],
);

/** Audit trail: every clinician read of a patient tracker is recorded. */
export const recordAccessLog = pgTable(
  "record_access_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    actorUserId: uuid("actor_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    action: varchar("action", { length: 60 }).notNull(),
    context: varchar("context", { length: 200 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("access_log_patient_idx").on(t.patientId, t.createdAt)],
);

export type User = typeof users.$inferSelect;
export type Patient = typeof patients.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
export type TrackerEntry = typeof trackerEntries.$inferSelect;
export type ConsultationNote = typeof consultationNotes.$inferSelect;
