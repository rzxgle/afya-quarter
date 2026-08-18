import type { ReactNode } from "react";
import type { Breakdown } from "../lib/types";

export function Kpi({
  label,
  value,
  accent = "var(--brand)",
  sub,
  track,
  onClick,
}: {
  label: string;
  value: ReactNode;
  accent?: string;
  sub?: ReactNode;
  track?: number; // 0..100
  onClick?: () => void;
}) {
  const content = (
    <>
      <div className="k-label">{label}</div>
      <div className="k-value">{value}</div>
      {track !== undefined && (
        <div className="track">
          <span style={{ width: `${Math.max(0, Math.min(track, 100))}%` }} />
        </div>
      )}
      {sub !== undefined && <div className="k-sub">{sub}</div>}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className="kpi kpi-clickable"
        style={{ ["--accent" as string]: accent }}
        onClick={onClick}
        aria-label={`${label}: ver detalhes`}
      >
        {content}
      </button>
    );
  }

  return <div className="kpi" style={{ ["--accent" as string]: accent }}>{content}</div>;
}

export function CompositionBar({ bd }: { bd: Breakdown }) {
  // 3 categorias: Concluído / Em andamento / A fazer.
  // "Em homologação" já entra em `done` (regra do workflow); cancelado é ignorado.
  const tot = bd.done + bd.inprogress + bd.todo || 1;
  const seg = (n: number, cls: string) =>
    n > 0 ? <i className={cls} style={{ width: `${(n / tot) * 100}%` }} /> : null;
  return (
    <div className="compbar">
      {seg(bd.done, "seg-done")}
      {seg(bd.inprogress, "seg-progress")}
      {seg(bd.todo, "seg-todo")}
    </div>
  );
}
