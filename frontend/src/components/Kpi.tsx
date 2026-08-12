import type { ReactNode } from "react";
import type { Breakdown } from "../lib/types";

export function Kpi({
  label,
  value,
  accent = "var(--brand)",
  sub,
  track,
}: {
  label: string;
  value: ReactNode;
  accent?: string;
  sub?: ReactNode;
  track?: number; // 0..100
}) {
  return (
    <div className="kpi" style={{ ["--accent" as string]: accent }}>
      <div className="k-label">{label}</div>
      <div className="k-value">{value}</div>
      {track !== undefined && (
        <div className="track">
          <span style={{ width: `${Math.max(0, Math.min(track, 100))}%` }} />
        </div>
      )}
      {sub !== undefined && <div className="k-sub">{sub}</div>}
    </div>
  );
}

export function CompositionBar({ bd }: { bd: Breakdown }) {
  const tot =
    bd.done + bd.approval + bd.inprogress + bd.todo + bd.cancelled || 1;
  const seg = (n: number, cls: string) =>
    n > 0 ? <i className={cls} style={{ width: `${(n / tot) * 100}%` }} /> : null;
  return (
    <div className="compbar">
      {seg(bd.done, "seg-done")}
      {seg(bd.approval, "seg-approval")}
      {seg(bd.inprogress, "seg-progress")}
      {seg(bd.todo, "seg-todo")}
      {seg(bd.cancelled, "seg-cancel")}
    </div>
  );
}
