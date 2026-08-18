import { useState } from "react";
import type { RoadmapRow, Sprint, Period } from "../lib/types";
import { pct, fmtShort, fmtFull, toDate, todayISO } from "../lib/format";

const ROW_H = 38;

type Bucket = "concluido" | "andamento" | "pendente";
function bucket(statusKind: RoadmapRow["epic_status_kind"]): Bucket {
  if (statusKind === "done") return "concluido";
  if (statusKind === "inprogress") return "andamento";
  return "pendente";
}
const BUCKET_LABEL: Record<Bucket, string> = {
  concluido: "Concluído",
  andamento: "Em andamento",
  pendente: "Pendente",
};

interface TipState {
  x: number;
  y: number;
  row: RoadmapRow;
}

export default function Gantt({
  rows,
  period,
  sprints,
}: {
  rows: RoadmapRow[];
  period: Period;
  sprints: Sprint[];
}) {
  const [tip, setTip] = useState<TipState | null>(null);
  const today = todayISO();

  if (!period.start_date || !period.end_date) return null;
  const qStart = toDate(period.start_date);
  const qEnd = toDate(period.end_date);
  const span = qEnd.getTime() - qStart.getTime() || 1;
  const xp = (iso: string) => ((toDate(iso).getTime() - qStart.getTime()) / span) * 100;
  const clamp = (n: number) => Math.max(0, Math.min(n, 100));

  if (rows.length === 0) {
    return (
      <div className="gantt-wrap">
        <div className="e-empty" style={{ maxWidth: 480, margin: 8 }}>
          Nenhum épico para exibir com os filtros atuais.
        </div>
      </div>
    );
  }

  const plotH = rows.length * ROW_H;
  const todayX = xp(today);

  return (
    <div className="gantt-wrap">
      <div className="gantt">
        <div className="gantt-grid">
          <div />
          {/* Ruler */}
          <div className="g-ruler">
            <div className="qbound" style={{ left: 0 }}>
              Início {fmtShort(period.start_date)}
            </div>
            <div className="qbound" style={{ right: 0 }}>
              Fim {fmtShort(period.end_date)}
            </div>
            {todayX >= 0 && todayX <= 100 && (
              <div className="today-lbl" style={{ left: `${todayX}%` }}>
                Hoje
              </div>
            )}
            {sprints.map(
              (s) =>
                s.start && (
                  <div key={s.name} className="sprint" style={{ left: `${xp(s.start)}%` }}>
                    {s.name}
                  </div>
                ),
            )}
          </div>

          {/* Labels */}
          <div className="g-labels">
            {rows.map((r) => {
              const noDate = !r.start_date || !r.end_date;
              return (
                <div className="g-lab" key={`${r.team}-${r.epic}`}>
                  <span className="team">{(r.team ?? "").replace("Squad ", "")}</span>
                  <a className="key" href={r.epic_url ?? "#"} target="_blank" rel="noopener noreferrer">
                    {r.epic}
                  </a>
                  {noDate && <span className="nodate">sem datas</span>}
                </div>
              );
            })}
          </div>

          {/* Plot */}
          <div className="g-plot" style={{ height: plotH }}>
            <div className="g-shade" style={{ left: 0, width: `${clamp(todayX)}%` }} />
            <div className="g-vline qb" style={{ left: 0 }} />
            <div className="g-vline qb" style={{ left: "100%" }} />
            {sprints.map(
              (s) =>
                s.start && (
                  <div key={s.name} className="g-vline" style={{ left: `${xp(s.start)}%` }} />
                ),
            )}
            {todayX >= 0 && todayX <= 100 && (
              <div className="g-today" style={{ left: `${todayX}%` }} />
            )}
            {rows.map((_, i) => (
              <div className="rowline" key={`line-${i}`} style={{ top: (i + 1) * ROW_H }} />
            ))}
            {rows.map((r, i) => {
              if (!r.start_date || !r.end_date) return null;
              const left = xp(r.start_date);
              const width = Math.max(xp(r.end_date) - left, 0);
              const cls = `g-bar bar-${bucket(r.epic_status_kind)}${r.epic_risk ? " risk" : ""}`;
              const narrow = width < 7;
              const top = i * ROW_H + 7;
              return (
                <div
                  key={`bar-${i}`}
                  className={cls}
                  style={{
                    top,
                    left: `${left}%`,
                    width: `${width}%`,
                    minWidth: narrow ? 10 : undefined,
                  }}
                  onMouseMove={(e) => setTip({ x: e.clientX, y: e.clientY, row: r })}
                  onMouseLeave={() => setTip(null)}
                >
                  {narrow ? (
                    <span className="outlabel">{pct(r.progress)}</span>
                  ) : (
                    pct(r.progress)
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {tip && <GanttTip tip={tip} />}
    </div>
  );
}

function GanttTip({ tip }: { tip: TipState }) {
  const r = tip.row;
  const st = r.epic_status || BUCKET_LABEL[bucket(r.epic_status_kind)];
  const ts = r.temporal_status || "Sem datas";
  const late = ts === "Prazo passou";
  let x = tip.x + 14;
  const y = tip.y + 14;
  if (typeof window !== "undefined" && x + 280 > window.innerWidth) x = tip.x - 294;

  return (
    <div className="tip" style={{ left: x, top: y }}>
      <b>
        {r.epic} — {r.epic_name}
      </b>
      <br />
      <span className="row2">
        <span className="k">Squad:</span> {r.team}
      </span>
      <br />
      <span className="row2">
        <span className="k">Progresso:</span> {pct(r.progress)}
      </span>
      <br />
      <span className="row2">
        <span className="k">Período:</span> {fmtFull(r.start_date)} → {fmtFull(r.end_date)}
      </span>
      <br />
      <span className="row2">
        <span className="k">Status:</span> {st}
        {late && <span style={{ color: "#F3B0B0" }}> · prazo passou</span>}
      </span>
      {r.epic_risk && (
        <>
          <br />
          <span className="row2" style={{ color: "#F3B0B0" }}>
            <span className="k" style={{ color: "#F3B0B0" }}>
              Em risco:
            </span>{" "}
            {r.epic_risk_reason || "sinalizado"}
          </span>
        </>
      )}
    </div>
  );
}
