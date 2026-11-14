import type { ReactNode } from "react";

export function Panel({
  children,
  className = "",
}: {
  children?: ReactNode;
  className?: string;
}) {
  return <section className={`panel ${className}`}>{children}</section>;
}

export function PanelHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
      <div className="flex items-baseline gap-3">
        <h2 className="text-[11px] uppercase tracking-label text-fg">{title}</h2>
        {subtitle ? (
          <span className="text-[10px] tracking-wide text-dim">{subtitle}</span>
        ) : null}
      </div>
      {right}
    </header>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-3 animate-pulseSoft bg-ink-3 ${className}`}
      aria-hidden
    />
  );
}

export function Empty({ text }: { text: string }) {
  return (
    <div className="flex h-32 items-center justify-center px-4 text-center text-[11px] uppercase tracking-label text-dim">
      {text}
    </div>
  );
}
