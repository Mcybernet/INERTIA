import type { ReactNode } from "react";

export function PageIntro({
  kicker,
  title,
  description,
  right,
}: {
  kicker: string;
  title: string;
  description?: string;
  right?: ReactNode;
}) {
  return (
    <header className="mb-3 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
      <div className="min-w-0">
        <div className="label">{kicker}</div>
        <h1 className="mt-1.5 text-[20px] font-medium leading-tight tracking-tight text-fg">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-[70ch] text-[11px] leading-relaxed text-muted">
            {description}
          </p>
        ) : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </header>
  );
}

export function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-ink-1 px-4 py-3">
      <div className="label">{label}</div>
      <div
        className={`mono mt-1.5 truncate text-[16px] leading-none ${
          accent ? "text-gold" : "text-fg"
        }`}
        title={value}
      >
        {value}
      </div>
      {sub ? (
        <div className="mt-1.5 truncate text-[10px] text-dim">{sub}</div>
      ) : null}
    </div>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-3 xl:grid-cols-4">
      {children}
    </div>
  );
}
