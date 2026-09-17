"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import { motion } from "motion/react";

export function Card({
  children,
  className = "",
  as: Tag = "section",
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "article";
}) {
  return (
    <Tag
      className={`rounded-2xl border border-brand-200/70 bg-white shadow-[var(--shadow-card)] ${className}`}
    >
      {children}
    </Tag>
  );
}

export function SectionHeading({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-bold text-brand-800">{title}</h2>
        {hint ? <p className="text-sm text-ink-muted">{hint}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Pill({
  children,
  tone = "brand",
}: {
  children: ReactNode;
  tone?: "brand" | "teal" | "gold" | "muted" | "alert";
}) {
  const tones = {
    brand: "bg-brand-100 text-brand-700 border-brand-200",
    teal: "bg-teal-50 text-teal-700 border-teal-100",
    gold: "bg-gold-400/15 text-gold-600 border-gold-400/40",
    muted: "bg-slate-100 text-slate-600 border-slate-200",
    alert: "bg-[#fdeceb] text-[#a92f26] border-[#f6c7b8]",
  } as const;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Field({
  label,
  name,
  error,
  hint,
  children,
  required,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-sm font-semibold text-brand-800">
        {label}
        {required ? <span className="ml-1 text-[#cf4f34]">*</span> : null}
      </label>
      {children}
      {hint && !error ? <p className="text-xs text-ink-muted">{hint}</p> : null}
      {error ? (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
          className="text-xs font-semibold text-[#a92f26]"
        >
          {error}
        </motion.p>
      ) : null}
    </div>
  );
}

export const inputClass =
  "w-full rounded-xl border border-brand-200 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15 placeholder:text-slate-400";

export function SubmitButton({
  children,
  pendingLabel = "Saving…",
  className = "",
  variant = "primary",
  disabled = false,
}: {
  children: ReactNode;
  pendingLabel?: string;
  className?: string;
  variant?: "primary" | "ghost" | "danger";
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  const variants = {
    primary:
      "bg-brand-600 text-white hover:bg-brand-700 shadow-[0_10px_24px_-12px_rgba(38,55,79,0.9)]",
    ghost: "bg-white text-brand-700 border border-brand-200 hover:bg-brand-50",
    danger: "bg-[#fdeceb] text-[#a92f26] border border-[#f6c7b8] hover:bg-[#f9dcd8]",
  } as const;

  return (
    <motion.button
      type="submit"
      disabled={pending || disabled}
      whileHover={pending || disabled ? undefined : { scale: 1.015 }}
      whileTap={pending || disabled ? undefined : { scale: 0.985 }}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-70 ${variants[variant]} ${className}`}
    >
      {pending ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {pending ? pendingLabel : children}
    </motion.button>
  );
}

export function Banner({
  tone,
  children,
}: {
  tone: "error" | "success" | "info";
  children: ReactNode;
}) {
  const tones = {
    error: "border-[#f6c7b8] bg-[#fdeceb] text-[#a92f26]",
    success: "border-teal-300 bg-teal-50 text-teal-700",
    info: "border-brand-200 bg-brand-50 text-brand-700",
  } as const;
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-xl border px-4 py-3 text-sm font-semibold ${tones[tone]}`}
    >
      {children}
    </motion.div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/40 px-6 py-10 text-center">
      <p className="text-base font-bold text-brand-800">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">{body}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
