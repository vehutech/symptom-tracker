"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  CalendarDays,
  ClipboardPlus,
  LayoutDashboard,
  LineChart,
  LogOut,
  Menu,
  Stethoscope,
  Users,
  X,
} from "lucide-react";
import { Wordmark } from "./brand";

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard };

const patientNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tracker/new", label: "Record entry", icon: ClipboardPlus },
  { href: "/tracker", label: "My tracker", icon: LineChart },
  { href: "/appointments", label: "Appointments", icon: CalendarDays },
];

const staffNav: NavItem[] = [
  { href: "/staff", label: "Patients", icon: Users },
  { href: "/staff/schedule", label: "Clinic schedule", icon: CalendarDays },
];

export function AppShell({
  children,
  role,
  fullName,
  subtitle,
  logout,
}: {
  children: ReactNode;
  role: string;
  fullName: string;
  subtitle: string;
  logout: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = role === "patient" ? patientNav : staffNav;

  const isActive = (href: string) =>
    href === "/staff" || href === "/tracker"
      ? pathname === href || (href === "/staff" && pathname.startsWith("/staff/patients"))
      : pathname.startsWith(href);

  const nav = (
    <nav className="space-y-1.5">
      {items.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={`relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition ${
              active ? "text-white" : "text-brand-700 hover:bg-brand-50"
            }`}
          >
            {active ? (
              <motion.span
                layoutId="nav-active"
                className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            ) : null}
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-5 lg:px-6">
        <aside className="sticky top-5 hidden h-[calc(100vh-2.5rem)] w-64 shrink-0 flex-col rounded-2xl border border-brand-200/70 bg-white p-4 shadow-[var(--shadow-card)] lg:flex">
          <Wordmark href={role === "patient" ? "/dashboard" : "/staff"} compact />
          <div className="mt-6 flex-1">{nav}</div>
          <div className="rounded-xl bg-brand-50 p-3">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">Signed in</p>
            <p className="truncate text-sm font-extrabold text-brand-800">{fullName}</p>
            <p className="truncate text-xs text-ink-muted">{subtitle}</p>
            <form action={logout} className="mt-3">
              <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-brand-200 bg-white px-3 py-2 text-xs font-bold text-brand-700 transition hover:bg-brand-100">
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </form>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-brand-200/70 bg-white px-4 py-3 shadow-[var(--shadow-card)] lg:hidden">
            <Wordmark href={role === "patient" ? "/dashboard" : "/staff"} compact />
            <button
              onClick={() => setOpen((value) => !value)}
              aria-label={open ? "Close menu" : "Open menu"}
              className="grid h-10 w-10 place-items-center rounded-xl border border-brand-200 text-brand-700"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </header>

          <AnimatePresence>
            {open ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 overflow-hidden rounded-2xl border border-brand-200/70 bg-white p-4 shadow-[var(--shadow-card)] lg:hidden"
              >
                {nav}
                <form action={logout} className="mt-3">
                  <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-brand-200 px-3 py-2 text-xs font-bold text-brand-700">
                    <LogOut className="h-3.5 w-3.5" />
                    Sign out — {fullName}
                  </button>
                </form>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <motion.main
            key={pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="pb-12"
          >
            {children}
          </motion.main>

          <footer className="flex items-center gap-2 border-t border-brand-200/70 pb-8 pt-4 text-xs text-ink-muted">
            <Stethoscope className="h-3.5 w-3.5" />
            Federal University Lokoja · University Health Services
          </footer>
        </div>
      </div>
    </div>
  );
}
