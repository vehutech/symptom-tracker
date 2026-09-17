import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePatient } from "@/lib/auth";
import { TrackerForm } from "@/components/tracker-form";
import { Reveal } from "@/components/motion";

export const metadata = { title: "Record an entry" };

export default async function NewEntryPage() {
  await requirePatient();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/tracker"
        className="inline-flex items-center gap-2 text-sm font-bold text-brand-600 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to my tracker
      </Link>

      <Reveal>
        <div>
          <h1 className="text-2xl font-extrabold text-brand-900">Record what you noticed</h1>
          <p className="mt-1 text-sm text-ink-muted">
            One entry per symptom, body change or reading. Everything you save is stored on your
            medical record and shown to the clinician at your next appointment.
          </p>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <TrackerForm />
      </Reveal>
    </div>
  );
}
