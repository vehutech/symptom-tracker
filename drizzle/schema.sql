-- Federal University Lokoja — University Health Services
-- Idempotent schema DDL. Run this against the cloud database BEFORE deploying,
-- then verify with the queries at the bottom. Safe to run more than once.

DO $$ BEGIN
  CREATE TYPE "public"."appointment_status" AS ENUM('scheduled', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."entry_kind" AS ENUM('symptom', 'body_change', 'measurement');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."user_role" AS ENUM('patient', 'doctor', 'nurse', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"staff_user_id" uuid,
	"scheduled_for" timestamp with time zone NOT NULL,
	"reason" varchar(200) NOT NULL,
	"clinic" varchar(120) DEFAULT 'General Outpatient' NOT NULL,
	"status" "appointment_status" DEFAULT 'scheduled' NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "consultation_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"appointment_id" uuid,
	"author_user_id" uuid NOT NULL,
	"findings" text NOT NULL,
	"diagnosis" varchar(200),
	"treatment" text,
	"reviewed_from" date,
	"reviewed_to" date,
	"reviewed_entry_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "patients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"identifier" varchar(40) NOT NULL,
	"faculty" varchar(120),
	"department" varchar(120),
	"date_of_birth" date,
	"gender" varchar(16),
	"blood_group" varchar(8),
	"genotype" varchar(8),
	"allergies" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "record_access_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"actor_user_id" uuid NOT NULL,
	"action" varchar(60) NOT NULL,
	"context" varchar(200),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "staff_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"staff_number" varchar(40) NOT NULL,
	"specialty" varchar(120),
	"unit" varchar(120),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "tracker_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"kind" "entry_kind" DEFAULT 'symptom' NOT NULL,
	"title" varchar(120) NOT NULL,
	"body_area" varchar(60),
	"severity" integer,
	"description" text,
	"occurred_on" date NOT NULL,
	"temperature_c" numeric(4, 1),
	"weight_kg" numeric(5, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(160) NOT NULL,
	"password_hash" text NOT NULL,
	"full_name" varchar(120) NOT NULL,
	"phone" varchar(32),
	"role" "user_role" DEFAULT 'patient' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "appointments" ADD CONSTRAINT "appointments_staff_user_id_users_id_fk" FOREIGN KEY ("staff_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "consultation_notes" ADD CONSTRAINT "consultation_notes_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "consultation_notes" ADD CONSTRAINT "consultation_notes_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "consultation_notes" ADD CONSTRAINT "consultation_notes_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "patients" ADD CONSTRAINT "patients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "record_access_log" ADD CONSTRAINT "record_access_log_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "record_access_log" ADD CONSTRAINT "record_access_log_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "tracker_entries" ADD CONSTRAINT "tracker_entries_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "appointments_patient_idx" ON "appointments" USING btree ("patient_id","scheduled_for");

CREATE INDEX IF NOT EXISTS "appointments_schedule_idx" ON "appointments" USING btree ("scheduled_for");

CREATE INDEX IF NOT EXISTS "notes_patient_idx" ON "consultation_notes" USING btree ("patient_id","created_at");

CREATE UNIQUE INDEX IF NOT EXISTS "patients_user_unique" ON "patients" USING btree ("user_id");

CREATE UNIQUE INDEX IF NOT EXISTS "patients_identifier_unique" ON "patients" USING btree ("identifier");

CREATE INDEX IF NOT EXISTS "access_log_patient_idx" ON "record_access_log" USING btree ("patient_id","created_at");

CREATE UNIQUE INDEX IF NOT EXISTS "staff_user_unique" ON "staff_profiles" USING btree ("user_id");

CREATE UNIQUE INDEX IF NOT EXISTS "staff_number_unique" ON "staff_profiles" USING btree ("staff_number");

CREATE INDEX IF NOT EXISTS "tracker_patient_idx" ON "tracker_entries" USING btree ("patient_id","occurred_on");

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_unique" ON "users" USING btree ("email");

-- Verification: every object below must exist before the app is deployed.
-- SELECT table_name FROM information_schema.tables
--  WHERE table_schema = 'public' ORDER BY table_name;
-- Expect: appointments, consultation_notes, patients, record_access_log,
--         staff_profiles, tracker_entries, users
