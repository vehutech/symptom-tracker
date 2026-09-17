"use client";

import { AnimatedNumber, GrowBar, motion } from "./motion";
import { SEVERITY, formatDate } from "./severity";
import type { ReactNode } from "react";

export function StatTile({
  label,
  value,
  suffix = "",
  decimals = 0,
  caption,
  icon,
  tone = "brand",
}: {
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
  caption?: string;
  icon?: ReactNode;
  tone?: "brand" | "teal" | "gold" | "alert";
}) {
  const tones = {
    brand: "from-brand-600 to-brand-800 text-white",
    teal: "from-teal-500 to-teal-700 text-white",
    gold: "from-gold-500 to-gold-600 text-white",
    alert: "from-[#cf4f34] to-[#a92f26] text-white",
  } as const;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br p-5 shadow-[var(--shadow-card)] ${tones[tone]}`}
    >
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
      <div className="relative flex items-start justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/80">{label}</p>
        {icon ? <span className="text-white/80">{icon}</span> : null}
      </div>
      <p className="relative mt-3 text-3xl font-extrabold tabular-nums">
        <AnimatedNumber value={value} decimals={decimals} suffix={suffix} />
      </p>
      {caption ? <p className="relative mt-1 text-xs text-white/75">{caption}</p> : null}
    </motion.div>
  );
}

/**
 * Ordinal severity distribution. One hue, monotonic lightness, and every bar
 * carries its number, label and count, so identity never rests on colour.
 */
export function SeverityBars({ counts }: { counts: Record<1 | 2 | 3 | 4 | 5, number> }) {
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

  return (
    <ul className="space-y-2.5">
      {([1, 2, 3, 4, 5] as const).map((level, index) => {
        const value = counts[level];
        return (
          <li key={level} className="flex items-center gap-3 text-sm">
            <span
              className="grid h-6 w-6 shrink-0 place-items-center rounded-lg text-xs font-extrabold"
              style={{ background: SEVERITY[level].color, color: SEVERITY[level].ink }}
            >
              {level}
            </span>
            <span className="w-28 shrink-0 text-xs font-semibold text-ink-muted">
              {SEVERITY[level].label}
            </span>
            <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-brand-100">
              <GrowBar
                fraction={total ? value / total : 0}
                color={SEVERITY[level].color}
                delay={index * 0.06}
              />
            </span>
            <span className="w-8 shrink-0 text-right font-bold tabular-nums text-brand-800">
              {value}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

type Point = { date: string; value: number };

/** Single-series trend line: no legend needed, the heading names the series. */
export function Sparkline({
  points,
  unit = "",
  domain,
  label,
}: {
  points: Point[];
  unit?: string;
  domain?: [number, number];
  label: string;
}) {
  if (points.length === 0) {
    return <p className="text-sm text-ink-muted">No readings recorded yet.</p>;
  }

  const width = 320;
  const height = 92;
  const pad = 10;
  const values = points.map((p) => p.value);
  const [min, max] = domain ?? [Math.min(...values), Math.max(...values)];
  const span = max - min || 1;

  const x = (i: number) =>
    points.length === 1 ? width / 2 : pad + (i * (width - pad * 2)) / (points.length - 1);
  const y = (v: number) => height - pad - ((v - min) / span) * (height - pad * 2);

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p.value)}`).join(" ");
  const area = `${path} L ${x(points.length - 1)} ${height} L ${x(0)} ${height} Z`;

  return (
    <figure className="space-y-1">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-24 w-full"
        role="img"
        aria-label={`${label}: ${points.map((p) => `${formatDate(p.date)} ${p.value}${unit}`).join(", ")}`}
      >
        <motion.path
          d={area}
          fill="var(--color-teal-500)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.14 }}
          transition={{ duration: 0.8 }}
        />
        <motion.path
          d={path}
          fill="none"
          stroke="var(--color-teal-600)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
        {points.map((p, i) => (
          <g key={`${p.date}-${i}`}>
            <circle cx={x(i)} cy={y(p.value)} r={3.5} fill="#fff" stroke="var(--color-teal-600)" strokeWidth={2} />
            {/* Wider transparent hit target so the native tooltip is reachable. */}
            <circle cx={x(i)} cy={y(p.value)} r={11} fill="transparent">
              <title>{`${formatDate(p.date)} — ${p.value}${unit}`}</title>
            </circle>
          </g>
        ))}
      </svg>
      <figcaption className="flex justify-between text-[11px] font-semibold text-ink-muted">
        <span>{formatDate(points[0].date, { day: "numeric", month: "short" })}</span>
        <span className="text-brand-700">
          latest {points[points.length - 1].value}
          {unit}
        </span>
        <span>{formatDate(points[points.length - 1].date, { day: "numeric", month: "short" })}</span>
      </figcaption>
    </figure>
  );
}
