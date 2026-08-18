import { useState } from "react";
import type { RoadmapRow, Sprint, Period } from "../lib/types";
import { pct, fmtShort, fmtFull, toDate, todayISO } from "../lib/format";

const HEADER_H = 44;
const EPIC_H = 46;

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

interface Group {
  team: string;
  epics: RoadmapRow[];
  done: number;
  total: number;
}

interface TipState {
  x: number;
  y: number;
  row: RoadmapRow;
}

function groupByTeam(rows: RoadmapRow[]): Group[] {
  const order: string[] = [];
  const map = new Map<string, RoadmapRow[]>();
  for (const r of rows) {
    const team = r.team ?? "Sem squad";
    if (!map.has(team)) {
      map.set(team, []);
      order.push(team);
    }
    map.get(team)!.push(r);
  }
  return order.map((team) => {
    const epics = map.get(team)!;
    return {
      team,
      epics,
      done: epics.filter((e) => e.progress >= 100).length,
      total: epics.length,
    };
  });
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
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});
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

  const groups = groupByTeam(rows);
  const singleGroup = groups.length === 1; // filtrou 1 squad -> já abre
  const isOpen = (team: string) => openMap[team] ?? singleGroup;
  const toggle = (team: string) =>
    setOpenMap((m) => ({ ...m, [team]: !(m[team] ?? singleGroup) }));

  // Monta as linhas visíveis (header + épicos das squads abertas) com offsets
  interface HeaderRow { kind: "header"; group: Group; y: number; h: number }
  interface EpicRow { kind: "epic"; row: RoadmapRow; y: number; h: number }
  const display: (HeaderRow | EpicRow)[] = [];
  let y = 0;
  for (const g of groups) {
    display.push({ kind: "header", group: g, y, h: HEADER_H });
    y += HEADER_H;
    if (isOpen(g.team)) {
      for (const r of g.epics) {
        display.push({ kind: "epic", row: r, y, h: EPIC_H });
        y += EPIC_H;
      }
    }
  }
  const totalH = y;
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

          {/* Labels (grupos + épicos) */}
          <div className="g-labels">
            {display.map((d) =>
              d.kind === "header" ? (
                <button
                  key={`h-${d.group.team}`}
                  className="g-group"
                  style={{ height: d.h }}
                  aria-expanded={isOpen(d.group.team)}
                  onClick={() => toggle(d.group.team)}
                >
                  <span className="g-grow1">
                    <span className="g-caret" aria-hidden="true">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </span>
                    <span className="g-gname" title={d.group.team}>
                      {d.group.team}
                    </span>
                  </span>
                  <span className="g-gmeta">
                    {d.group.total} épico{d.group.total === 1 ? "" : "s"} · {d.group.done}/
                    {d.group.total} concl.
                  </span>
                </button>
              ) : (
                <div className="g-epic" style={{ height: d.h }} key={`e-${d.row.team}-${d.row.epic}`}>
                  <a className="g-ekey" href={d.row.epic_url ?? "#"} target="_blank" rel="noopener noreferrer">
                    {d.row.epic}
                  </a>
                  <span className="g-ename" title={d.row.epic_name}>
                    {d.row.epic_name}
                    {(!d.row.start_date || !d.row.end_date) && (
                      <span className="nodate"> · sem datas</span>
                    )}
                  </span>
                </div>
              ),
            )}
          </div>

          {/* Plot */}
          <div className="g-plot" style={{ height: totalH }}>
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

            {/* faixas de grupo + linhas-guia */}
            {display.map((d) =>
              d.kind === "header" ? (
                <div className="grpband" key={`b-${d.group.team}`} style={{ top: d.y, height: d.h }} />
              ) : (
                <div className="rowline" key={`l-${d.row.team}-${d.row.epic}`} style={{ top: d.y + d.h }} />
              ),
            )}

            {/* barras (só épicos com datas) */}
            {display.map((d) => {
              if (d.kind !== "epic") return null;
              const r = d.row;
              if (!r.start_date || !r.end_date) return null;
              const left = xp(r.start_date);
              const width = Math.max(xp(r.end_date) - left, 0);
              const cls = `g-bar bar-${bucket(r.epic_status_kind)}${r.epic_risk ? " risk" : ""}`;
              const narrow = width < 7;
              const barH = d.h - 18;
              const top = d.y + (d.h - barH) / 2;
              return (
                <div
                  key={`bar-${r.team}-${r.epic}`}
                  className={cls}
                  style={{
                    top,
                    left: `${left}%`,
                    width: `${width}%`,
                    height: barH,
                    minWidth: narrow ? 10 : undefined,
                  }}
                  onMouseMove={(e) => setTip({ x: e.clientX, y: e.clientY, row: r })}
                  onMouseLeave={() => setTip(null)}
                >
                  {narrow ? <span className="outlabel">{pct(r.progress)}</span> : pct(r.progress)}
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
