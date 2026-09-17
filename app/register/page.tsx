import Link from "next/link";
import { redirect } from "next/navigation";
import { Crest } from "@/components/brand";
import { RegisterForm } from "@/components/auth-forms";
import { Reveal } from "@/components/motion";
import { getSession, isClinician } from "@/lib/auth";

export const metadata = { title: "Register" };

export default async function RegisterPage() {
  const session = await getSession();
  if (session) redirect(isClinician(session.role) ? "/staff" : "/dashboard");

  return (
    <main className="brand-aurora min-h-screen px-5 py-10">
      <Reveal className="mx-auto w-full max-w-2xl">
        <div className="glass rounded-3xl p-7 shadow-[var(--shadow-lift)]">
          <Link href="/" className="flex items-center gap-3">
            <Crest size={48} />
            <div>
              <p className="text-sm font-extrabold tracking-wide text-brand-800">
                FEDERAL UNIVERSITY LOKOJA
              </p>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-600">
                University Health Services
              </p>
            </div>
          </Link>

          <h1 className="mt-6 text-2xl font-extrabold text-brand-900">Open your health record</h1>
          <p className="mb-6 text-sm text-ink-muted">
            Students and staff register once. Clinic accounts are created by the health centre
            administrator.
          </p>

          <RegisterForm />
        </div>
      </Reveal>
    </main>
  );
}
