import { z } from "zod";

export const SEVERITY_LABELS: Record<number, string> = {
  1: "Barely noticeable",
  2: "Mild",
  3: "Moderate",
  4: "Severe",
  5: "Very severe",
};

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : undefined));

const optionalNumber = (min: number, max: number, unit: string) =>
  z
    .union([z.literal(""), z.coerce.number()])
    .optional()
    .transform((value) => (value === "" || value === undefined ? undefined : Number(value)))
    .refine((value) => value === undefined || (value >= min && value <= max), {
      message: `Enter a ${unit} between ${min} and ${max}, or leave it blank.`,
    });

export const trackerEntrySchema = z
  .object({
    kind: z.enum(["symptom", "body_change", "measurement"]),
    title: z
      .string()
      .trim()
      .min(2, "Describe the symptom or change in at least 2 characters.")
      .max(120, "Keep the title under 120 characters."),
    bodyArea: optionalText(60),
    severity: z
      .union([z.literal(""), z.coerce.number().int().min(1).max(5)])
      .optional()
      .transform((value) => (value === "" || value === undefined ? undefined : Number(value))),
    description: optionalText(1000),
    occurredOn: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date.")
      .refine((value) => value <= new Date().toISOString().slice(0, 10), {
        message: "The date cannot be in the future.",
      }),
    temperatureC: optionalNumber(30, 45, "temperature in °C"),
    weightKg: optionalNumber(20, 300, "weight in kg"),
  })
  .refine((data) => data.kind === "measurement" || data.severity !== undefined, {
    message: "Select how severe it feels.",
    path: ["severity"],
  })
  .refine(
    (data) =>
      data.kind !== "measurement" ||
      data.temperatureC !== undefined ||
      data.weightKg !== undefined,
    {
      message: "A measurement entry needs a temperature or a weight.",
      path: ["temperatureC"],
    },
  );

export type TrackerEntryInput = z.infer<typeof trackerEntrySchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export const registerSchema = z.object({
  fullName: z.string().trim().min(3, "Enter your full name.").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  identifier: z
    .string()
    .trim()
    .min(3, "Enter your matriculation or staff number.")
    .max(40)
    .transform((value) => value.toUpperCase()),
  phone: optionalText(32),
  faculty: optionalText(120),
  department: optionalText(120),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date of birth.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  gender: optionalText(16),
  bloodGroup: optionalText(8),
  genotype: optionalText(8),
  password: z.string().min(8, "Use at least 8 characters."),
});

export const appointmentSchema = z.object({
  reason: z.string().trim().min(3, "Say briefly why you need the appointment.").max(200),
  clinic: z.string().trim().min(2).max(120),
  scheduledFor: z
    .string()
    .min(1, "Pick a date and time.")
    .refine((value) => new Date(value).getTime() > Date.now(), {
      message: "Choose a time in the future.",
    }),
});

export const consultationNoteSchema = z.object({
  patientId: z.string().uuid(),
  appointmentId: z
    .string()
    .optional()
    .transform((value) => (value ? value : undefined)),
  findings: z.string().trim().min(5, "Record what you observed.").max(4000),
  diagnosis: optionalText(200),
  treatment: optionalText(4000),
});

/** FormData -> plain object, so zod (not the UI) owns every boundary check. */
export function formToObject(formData: FormData): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") result[key] = value;
  }
  return result;
}
