/**
 * Seeds the clinic with staff accounts and one demo patient whose tracker
 * already has history. Idempotent: existing emails are skipped, not duplicated.
 *
 * Run: npm run seed   (reads DATABASE_URL and SEED_PASSWORD from .env)
 */
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import * as schema from "../lib/schema";
import { databaseUrl } from "../lib/db";
import { hashPassword } from "../lib/password";

const { users, patients, staffProfiles, appointments, trackerEntries, consultationNotes } = schema;

const password = process.env.SEED_PASSWORD ?? "ChangeMe123!";
const client = postgres(databaseUrl(), { max: 1, prepare: false });
const db = drizzle(client, { schema });

const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};
const dateOnly = (days: number) => daysAgo(days).toISOString().slice(0, 10);

async function upsertUser(input: {
  email: string;
  fullName: string;
  role: "patient" | "doctor" | "nurse" | "admin";
  phone?: string;
}) {
  const [existing] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
  if (existing) return { id: existing.id, created: false };

  const [created] = await db
    .insert(users)
    .values({ ...input, passwordHash: await hashPassword(password) })
    .returning({ id: users.id });
  return { id: created.id, created: true };
}

async function main() {
  const doctor = await upsertUser({
    email: "doctor@fulokoja.edu.ng",
    fullName: "Dr. Amina Yusuf",
    role: "doctor",
    phone: "08030000001",
  });
  if (doctor.created) {
    await db.insert(staffProfiles).values({
      userId: doctor.id,
      staffNumber: "FUL/HS/DOC/001",
      specialty: "General Practice",
      unit: "General Outpatient",
    });
  }

  const nurse = await upsertUser({
    email: "nurse@fulokoja.edu.ng",
    fullName: "Nurse Grace Ocheje",
    role: "nurse",
    phone: "08030000002",
  });
  if (nurse.created) {
    await db.insert(staffProfiles).values({
      userId: nurse.id,
      staffNumber: "FUL/HS/NUR/014",
      specialty: "Triage",
      unit: "Nurse Triage",
    });
  }

  const patientUser = await upsertUser({
    email: "student@fulokoja.edu.ng",
    fullName: "Ibrahim Adeyemi",
    role: "patient",
    phone: "08030000003",
  });

  let [patient] = await db
    .select()
    .from(patients)
    .where(eq(patients.userId, patientUser.id))
    .limit(1);

  if (!patient) {
    [patient] = await db
      .insert(patients)
      .values({
        userId: patientUser.id,
        identifier: "FUL/21/CSC/1043",
        faculty: "Faculty of Science",
        department: "Computer Science",
        dateOfBirth: "2003-04-17",
        gender: "Male",
        bloodGroup: "O+",
        genotype: "AA",
        allergies: "Penicillin",
      })
      .returning();
  }

  const existingEntries = await db
    .select({ id: trackerEntries.id })
    .from(trackerEntries)
    .where(eq(trackerEntries.patientId, patient.id))
    .limit(1);

  if (existingEntries.length === 0) {
    const [lastVisit] = await db
      .insert(appointments)
      .values({
        patientId: patient.id,
        staffUserId: doctor.id,
        scheduledFor: daysAgo(21),
        completedAt: daysAgo(21),
        reason: "Routine review",
        clinic: "General Outpatient",
        status: "completed",
      })
      .returning();

    await db.insert(appointments).values({
      patientId: patient.id,
      scheduledFor: daysAgo(-3),
      reason: "Recurring headaches and swelling",
      clinic: "Medical Consultation",
      status: "scheduled",
    });

    await db.insert(trackerEntries).values([
      {
        patientId: patient.id,
        kind: "symptom",
        title: "Headache",
        bodyArea: "Forehead",
        severity: 2,
        description: "Dull ache after evening lectures. Eased with rest.",
        occurredOn: dateOnly(14),
      },
      {
        patientId: patient.id,
        kind: "measurement",
        title: "Morning vitals",
        occurredOn: dateOnly(12),
        temperatureC: "36.9",
        weightKg: "70.00",
      },
      {
        patientId: patient.id,
        kind: "symptom",
        title: "Headache",
        bodyArea: "Behind the eyes",
        severity: 3,
        description: "Throbbing, worse in sunlight. Took paracetamol.",
        occurredOn: dateOnly(9),
      },
      {
        patientId: patient.id,
        kind: "body_change",
        title: "Swelling on left ankle",
        bodyArea: "Left ankle",
        severity: 3,
        description: "Noticed after football. Slight warmth, no bruise.",
        occurredOn: dateOnly(7),
      },
      {
        patientId: patient.id,
        kind: "measurement",
        title: "Evening temperature",
        occurredOn: dateOnly(5),
        temperatureC: "38.4",
      },
      {
        patientId: patient.id,
        kind: "symptom",
        title: "Headache",
        bodyArea: "Whole head",
        severity: 4,
        description: "Woke me up at night. Light hurts my eyes.",
        occurredOn: dateOnly(4),
      },
      {
        patientId: patient.id,
        kind: "symptom",
        title: "Loss of appetite",
        severity: 3,
        description: "Skipped lunch three days running.",
        occurredOn: dateOnly(2),
      },
      {
        patientId: patient.id,
        kind: "measurement",
        title: "Weekly weigh-in",
        occurredOn: dateOnly(1),
        temperatureC: "37.8",
        weightKg: "66.50",
      },
    ]);

    await db.insert(consultationNotes).values({
      patientId: patient.id,
      appointmentId: lastVisit.id,
      authorUserId: doctor.id,
      findings: "Routine review. No complaints at the time. Advised to log symptoms in the tracker.",
      diagnosis: "Fit for academic duties",
      treatment: "No medication. Review if symptoms appear.",
      reviewedFrom: dateOnly(30),
      reviewedTo: dateOnly(21),
      reviewedEntryCount: 0,
    });
  }

  console.log("Seed complete.");
  console.log(`  doctor@fulokoja.edu.ng  / ${password}`);
  console.log(`  nurse@fulokoja.edu.ng   / ${password}`);
  console.log(`  student@fulokoja.edu.ng / ${password}`);
}

main()
  .then(() => client.end())
  .catch(async (error) => {
    console.error(error);
    await client.end();
    process.exit(1);
  });
