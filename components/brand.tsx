import Image from "next/image";
import Link from "next/link";

export function Crest({ size = 44, className = "" }: { size?: number; className?: string }) {
  return (
    <Image
      src="/ful-logo.png"
      alt="Federal University Lokoja crest"
      width={size}
      height={size}
      priority
      className={className}
      style={{ width: size, height: "auto" }}
    />
  );
}

export function Wordmark({ href = "/", compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-3 group">
      <Crest size={compact ? 34 : 42} className="transition-transform group-hover:scale-105" />
      <span className="leading-tight">
        <span className="block text-[13px] font-extrabold tracking-wide text-brand-800">
          FEDERAL UNIVERSITY LOKOJA
        </span>
        <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-600">
          {compact ? "Health Services" : "University Health Services"}
        </span>
      </span>
    </Link>
  );
}

export function Motto({ className = "" }: { className?: string }) {
  return (
    <span className={`italic text-brand-500 ${className}`}>
      ad astra
    </span>
  );
}
