import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { patients, users } from "./schema";

export { hashPassword, verifyPassword } from "./password";

export const SESSION_COOKIE = "ful_hms_session";
const SESSION_DAYS = 7;

export type SessionUser = {
  userId: string;
  role: (typeof users.$inferSelect)["role"];
  fullName: string;
};

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 16) {
    throw new Error(
      "SESSION_SECRET is missing or too short. Set a random string of at least 16 characters.",
    );
  }
  return value;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export async function createSession(user: SessionUser): Promise<void> {
  const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ ...user, expires })).toString("base64url");
  const store = await cookies();
  store.set(SESSION_COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const [payload, signature] = raw.split(".");
  if (!payload || !signature) return null;

  const expectedSignature = Buffer.from(sign(payload));
  const provided = Buffer.from(signature);
  if (expectedSignature.length !== provided.length || !timingSafeEqual(expectedSignature, provided)) {
    return null;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as SessionUser & {
      expires: number;
    };
    if (data.expires < Date.now()) return null;
    return { userId: data.userId, role: data.role, fullName: data.fullName };
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export const CLINICAL_ROLES = ["doctor", "nurse", "admin"] as const;

export function isClinician(role: SessionUser["role"]): boolean {
  return (CLINICAL_ROLES as readonly string[]).includes(role);
}

/** Staff-only guard: patients must never reach clinician screens. */
export async function requireClinician(): Promise<SessionUser> {
  const session = await requireUser();
  if (!isClinician(session.role)) redirect("/dashboard");
  return session;
}

/** Patient-only guard that also resolves the patient record for the session. */
export async function requirePatient() {
  const session = await requireUser();
  if (session.role !== "patient") redirect("/staff");

  const [record] = await getDb()
    .select({
      id: patients.id,
      identifier: patients.identifier,
      faculty: patients.faculty,
      department: patients.department,
      bloodGroup: patients.bloodGroup,
      genotype: patients.genotype,
      allergies: patients.allergies,
      dateOfBirth: patients.dateOfBirth,
      fullName: users.fullName,
      email: users.email,
    })
    .from(patients)
    .innerJoin(users, eq(users.id, patients.userId))
    .where(eq(patients.userId, session.userId))
    .limit(1);

  if (!record) redirect("/login?error=no-patient-record");
  return { session, patient: record };
}
