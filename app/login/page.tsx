import Link from "next/link";
import { redirect } from "next/navigation";
import { Crest, Motto } from "@/components/brand";
import { LoginForm } from "@/components/auth-forms";
import { Banner } from "@/components/ui";
import { Reveal } from "@/components/motion";
import { getSession, isClinician } from "@/lib/auth";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (session) redirect(isClinician(session.role) ? "/staff" : "/dashboard");
  const { error } = await searchParams;

  return (
    <main className="brand-aurora grid min-h-screen place-items-center px-5 py-12">
      <Reveal className="w-full max-w-md">
        <div className="glass rounded-3xl p-7 shadow-[var(--shadow-lift)]">
          <Link href="/" className="flex flex-col items-center gap-3 text-center">
            <Crest size={64} />
            <div>
              <p className="text-sm font-extrabold tracking-wide text-brand-800">
                FEDERAL UNIVERSITY LOKOJA
              </p>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-600">
                University Health Services
              </p>
            </div>
          </Link>

          <h1 className="mt-6 text-center text-2xl font-extrabold text-brand-900">Welcome back</h1>
          <p className="mb-6 text-center text-sm text-ink-muted">
            Sign in to your health record.
          </p>

          {error === "no-patient-record" ? (
            <div className="mb-4">
              <Banner tone="error">
                This account has no patient record at the clinic. Contact the health centre desk.
              </Banner>
            </div>
          ) : null}

          <LoginForm />
        </div>
        <p className="mt-5 text-center text-xs text-ink-muted">
          <Motto /> · Federal University Lokoja
        </p>
      </Reveal>
    </main>
  );
}
