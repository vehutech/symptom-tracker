import Link from "next/link";
import { ArrowRight, Activity, CalendarCheck, ClipboardList, ShieldCheck, Stethoscope, Thermometer } from "lucide-react";
import { Crest, Motto, Wordmark } from "@/components/brand";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { getSession } from "@/lib/auth";

const features = [
  {
    icon: ClipboardList,
    title: "Record what you notice",
    body: "Log a symptom or body change with severity, date and a short description the moment you notice it — not weeks later in the consulting room.",
  },
  {
    icon: Thermometer,
    title: "Track measurements",
    body: "Add temperature and weight readings where they apply. The tracker keeps the trend so a fever or weight shift is visible at a glance.",
  },
  {
    icon: Activity,
    title: "See your own history",
    body: "Every entry stays on your timeline, searchable and grouped, so nothing is forgotten between appointments.",
  },
  {
    icon: Stethoscope,
    title: "Ready for consultation",
    body: "Your doctor or nurse opens a summary of everything recorded since your last visit — rising severity, fevers, recurring complaints.",
  },
  {
    icon: CalendarCheck,
    title: "Appointments in one place",
    body: "Request a clinic appointment, see what is scheduled and keep the visit history beside your tracker.",
  },
  {
    icon: ShieldCheck,
    title: "Access is audited",
    body: "Only authorised clinical staff can open a tracker, and every access is written to the patient's record.",
  },
];

export default async function Home() {
  const session = await getSession();
  const primaryHref = session ? (session.role === "patient" ? "/dashboard" : "/staff") : "/register";

  return (
    <main className="min-h-screen brand-aurora">
      <div className="mx-auto max-w-6xl px-5 pb-20">
        <header className="flex flex-wrap items-center justify-between gap-4 py-6">
          <Wordmark />
          <nav className="flex items-center gap-2 text-sm font-bold">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2.5 text-brand-700 transition hover:bg-white/70"
            >
              Sign in
            </Link>
            <Link
              href={primaryHref}
              className="rounded-xl bg-brand-600 px-4 py-2.5 text-white shadow-[0_10px_24px_-12px_rgba(38,55,79,0.9)] transition hover:bg-brand-700"
            >
              {session ? "Open portal" : "Create patient account"}
            </Link>
          </nav>
        </header>

        <section className="relative grid items-center gap-10 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
          <div className="absolute inset-0 -z-10 brand-grid" aria-hidden />
          <Reveal>
            <p className="inline-flex items-center gap-2 rounded-full border border-teal-300 bg-white/80 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-teal-700">
              University Health Services
            </p>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] text-brand-900 sm:text-5xl lg:text-6xl">
              Health records that keep up with{" "}
              <span className="bg-gradient-to-r from-brand-600 via-teal-600 to-gold-500 bg-clip-text text-transparent">
                every student
              </span>
              .
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg">
              The Federal University Lokoja hospital management system, built around a Patient
              Health &amp; Symptom Tracker: students record symptoms and body changes between
              visits, and the clinic sees a clear summary the moment consultation starts.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={primaryHref}
                className="group inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-[0_16px_34px_-16px_rgba(38,55,79,0.95)] transition hover:bg-brand-700"
              >
                {session ? "Go to my portal" : "Register as a patient"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-white/80 px-5 py-3 text-sm font-bold text-brand-700 transition hover:bg-white"
              >
                Staff sign in
              </Link>
            </div>
            <p className="mt-6 text-sm text-ink-muted">
              <Motto className="font-bold" /> — to the stars, in good health.
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="relative mx-auto w-full max-w-md">
              <div className="glass rounded-3xl p-6 shadow-[var(--shadow-lift)]">
                <div className="flex items-center gap-3">
                  <Crest size={48} />
                  <div>
                    <p className="text-sm font-extrabold text-brand-800">Tracker summary</p>
                    <p className="text-xs text-ink-muted">since last appointment · 12 Sep</p>
                  </div>
                </div>
                <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  {[
                    ["Entries", "9"],
                    ["Active days", "6"],
                    ["Peak temp", "38.6°C"],
                    ["Avg severity", "3.2 / 5"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-brand-200/70 bg-white/80 p-3">
                      <dt className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                        {label}
                      </dt>
                      <dd className="mt-1 text-xl font-extrabold text-brand-800">{value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-4 space-y-2">
                  {[
                    ["Persistent headache", 4],
                    ["Swelling on left ankle", 3],
                    ["Morning vitals", 0],
                  ].map(([title, severity]) => (
                    <div
                      key={title as string}
                      className="flex items-center justify-between rounded-xl border border-brand-200/70 bg-white px-3 py-2"
                    >
                      <span className="text-sm font-semibold text-brand-800">{title}</span>
                      {severity ? (
                        <span
                          className="grid h-6 w-6 place-items-center rounded-lg text-[11px] font-extrabold text-white"
                          style={{ background: `var(--color-sev-${severity})` }}
                        >
                          {severity}
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600">
                          reading
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="pointer-events-none absolute -bottom-6 -left-6 -z-10 h-32 w-32 rounded-full bg-teal-300/40 blur-2xl" />
              <div className="pointer-events-none absolute -right-8 -top-8 -z-10 h-32 w-32 rounded-full bg-gold-400/30 blur-2xl" />
            </div>
          </Reveal>
        </section>

        <section id="tracker" className="pt-10">
          <Reveal>
            <h2 className="text-2xl font-extrabold text-brand-900 sm:text-3xl">
              What the tracker does
            </h2>
            <p className="mt-2 max-w-2xl text-ink-muted">
              Eight things the clinic asked for, each one built into the patient and clinician
              views.
            </p>
          </Reveal>

          <Stagger className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, body }) => (
              <StaggerItem key={title}>
                <article className="h-full rounded-2xl border border-brand-200/70 bg-white p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-extrabold text-brand-800">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{body}</p>
                </article>
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      </div>

      <footer className="border-t border-brand-200/70 bg-white/70 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 text-sm text-ink-muted">
          <Wordmark compact />
          <p>© {new Date().getFullYear()} Federal University Lokoja · University Health Services</p>
        </div>
      </footer>
    </main>
  );
}
