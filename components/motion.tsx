"use client";

import { motion, useInView, useReducedMotion, type Variants } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

export const riseIn: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.55, delay, ease } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({
  children,
  className,
  gap = 0.07,
}: {
  children: ReactNode;
  className?: string;
  gap?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: gap } } }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={riseIn}>
      {children}
    </motion.div>
  );
}

/** Counts up to `value` once the tile scrolls into view; static if motion is reduced. */
export function AnimatedNumber({
  value,
  decimals = 0,
  suffix = "",
}: {
  value: number;
  decimals?: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduced = useReducedMotion();
  const [progress, setProgress] = useState<number | null>(null);

  useEffect(() => {
    if (!inView || reduced) return;

    let frame = 0;
    let raf = 0;
    const steps = 28;
    const tick = () => {
      frame += 1;
      const eased = 1 - Math.pow(1 - frame / steps, 3);
      setProgress(frame < steps ? Number((value * eased).toFixed(decimals)) : value);
      if (frame < steps) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, decimals, reduced]);

  const shown = reduced ? value : inView ? (progress ?? 0) : 0;

  return (
    <span ref={ref}>
      {shown.toFixed(decimals)}
      {suffix}
    </span>
  );
}

export function GrowBar({
  fraction,
  color,
  delay = 0,
}: {
  fraction: number;
  color: string;
  delay?: number;
}) {
  return (
    <motion.span
      className="block h-full rounded-full"
      style={{ background: color }}
      initial={{ width: 0 }}
      animate={{ width: `${Math.min(100, Math.max(0, fraction * 100))}%` }}
      transition={{ duration: 0.8, delay, ease }}
    />
  );
}

export { motion };
