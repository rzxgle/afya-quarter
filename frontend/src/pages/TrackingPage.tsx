import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { useFetch } from "../lib/useFetch";
import { useFilters } from "../state/filters";
import { pct } from "../lib/format";
import TeamsView from "../components/TeamsView";
import KpiDrawer from "../components/KpiDrawer";
import type { RoadmapRow } from "../lib/types";

// Página única. Usa /api/roadmap (traz KPIs de épico, linhas p/ o drawer e as
// squads). Os números de "histórias" são derivados da lista de squads.
type KpiSelection =
  | "stories" | "completed-rate" | "delayed" | "completed" | "in-progress" | "not-started" | "total" | "risk";

const DRAWER_TITLES: Record<KpiSelection, string> = {
  stories: "Histórias do quarter",
  "completed-rate": "Épicos concluídos",
  delayed: "Épicos atrasados",
  completed: "Épicos concluídos",
  "in-progress": "Épicos em andamento",
  "not-started": "Épicos pendentes",
  total: "Todos os épicos",
  risk: "Épicos em risco",
};

function matchesKpi(row: RoadmapRow, selection: KpiSelection) {
  if (selection === "total") return true;
  if (selection === "risk") return row.epic_risk === true;
  if (selection === "completed" || selection === "completed-rate") return row.epic_status_kind === "done";
  if (selection === "delayed") return row.temporal_status === "Prazo passou" && row.epic_status_kind !== "done";
  if (selection === "not-started") return row.epic_status_kind !== "done" && row.epic_status_kind !== "inprogress";
  return row.epic_status_kind === "inprogress";
}

export default function TrackingPage() {
  const f = useFilters();
  const [selectedKpi, setSelectedKpi] = useState<KpiSelection | null>(null);
  const closeDrawer = useCallback(() => setSelectedKpi(null), []);
  const open = (s: KpiSelection) => setSelectedKpi(s);

  const { data, loading, error } = useFetch(
    () =>
      api.roadmap({
        product: f.product,
        cycle: f.cycle,
        project_view: f.projectView,
        teams: f.selectedTeams,
      }),
    [f.product, f.cycle, f.projectView, JSON.stringify(f.selectedTeams), f.refreshNonce],
    Boolean(f.product),
  );

  useEffect(() => {
    if (data) f.setAvailableTeams(data.filters.available_teams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const uniqueRows = useMemo(() => {
    const byEpic = new Map<string, RoadmapRow>();
    for (const row of data?.roadmap ?? []) {
      if (row.epic && !byEpic.has(row.epic)) byEpic.set(row.epic, row);
    }
    return Array.from(byEpic.values());
  }, [data?.roadmap]);

  const storyRows = useMemo(() => {
    const byIssue = new Map<string, { key: string; summary: string; status: string; url: string }>();
    for (const team of data?.teams ?? []) {
      for (const epic of team.epics) {
        for (const item of epic.items) {
          if (item.kind !== "cancelled" && !byIssue.has(item.issue)) {
            byIssue.set(item.issue, {
              key: item.issue,
              summary: item.summary,
              status: item.status,
              url: item.url,
            });
          }
        }
      }
    }
    return Array.from(byIssue.values());
  }, [data?.teams]);

  if (error) return <div className="state err">Erro ao carregar: {error}</div>;
  if (!data) return <LoadingIndicators />;

  const k = data.kpis;

  // ---- histórias (derivado das squads) ----
  const totalCompleted = data.teams.reduce((a, t) => a + t.completed_items, 0);
  const totalItems = data.teams.reduce((a, t) => a + t.total_items, 0);
  const clusterProgress = totalItems ? (totalCompleted / totalItems) * 100 : 0;
  const timeProgress = data.period.quarter_time_progress ?? 0;
  const riskCount = uniqueRows.filter((r) => r.epic_risk).length;

  // ---- épicos: composição da barra ----
  const epTot = k.completed + k.in_progress + k.not_started || 1;
  const w = (n: number) => `${(n / epTot) * 100}%`;

  const drawerRows = selectedKpi && selectedKpi !== "stories"
    ? uniqueRows.filter((r) => matchesKpi(r, selectedKpi)).map((row) => ({
        key: row.epic ?? "",
        summary: row.epic_name,
        status: row.epic_status,
        url: row.epic_url ?? undefined,
      }))
    : storyRows;

  return (
    <>
      <p className="crumb">
        Filtro aplicado: <b>{data.filters.product}</b> · <b>{data.period.label}</b>
      </p>

      <section className="indicators">
        {/* -------- Histórias -------- */}
        <div className="ind-panel" style={{ ["--accent" as string]: "var(--brand)" }}>
          <div className="ind-label">Histórias</div>
          <button className="ind-bigbtn" onClick={() => open("stories")} aria-label="Ver histórias do quarter">
            <span className="ind-big">{pct(clusterProgress)}</span>
          </button>
          <div className="ind-mut">Progresso · {totalCompleted} de {totalItems} histórias concluídas</div>
          <div className="ind-track"><span style={{ width: `${clusterProgress}%` }} /></div>
          <div className="ind-sep" />
          <div className="ind-sub">
            <div className="col"><small>% tempo decorrido</small><span className="n">{pct(timeProgress)}</span></div>
            <div className="col" style={{ flex: 1 }}>
              <small>ritmo do quarter · {data.period.label} até hoje</small>
              <div className="ind-track" style={{ marginTop: 4 }}>
                <span style={{ width: `${timeProgress}%`, background: "var(--blue)" }} />
              </div>
            </div>
          </div>
        </div>

        {/* -------- Épicos -------- */}
        <div className="ind-panel" style={{ ["--accent" as string]: "var(--st-done)" }}>
          <div className="ind-label">
            Épicos
            <button className="epi-click cnt" onClick={() => open("total")}>{k.total_epics} no total</button>
          </div>
          <button className="ind-bigbtn" onClick={() => open("completed-rate")}>
            <span className="ind-big">{pct(k.completion_rate)} <small>concluídos</small></span>
          </button>
          <div className="ind-compbar">
            {k.completed > 0 && <i className="seg-done" style={{ width: w(k.completed) }} />}
            {k.in_progress > 0 && <i className="seg-progress" style={{ width: w(k.in_progress) }} />}
            {k.not_started > 0 && <i className="seg-todo" style={{ width: w(k.not_started) }} />}
          </div>
          <div className="ind-legend">
            <button className="epi-click" onClick={() => open("completed")}>
              <i style={{ background: "var(--st-done)" }} /> <b>{k.completed}</b>&nbsp;Concluídos
            </button>
            <button className="epi-click" onClick={() => open("in-progress")}>
              <i style={{ background: "var(--st-progress)" }} /> <b>{k.in_progress}</b>&nbsp;Em andamento
            </button>
            <button className="epi-click" onClick={() => open("not-started")}>
              <i style={{ background: "var(--st-todo)" }} /> <b>{k.not_started}</b>&nbsp;Pendentes
            </button>
          </div>
          <div className="ind-flags">
            <button className={`epi-click epi-flag ${k.delayed > 0 ? "on" : "off"}`} onClick={() => open("delayed")}>
              ⏰ <b>{k.delayed}</b>&nbsp;atrasados
            </button>
            <button className={`epi-click epi-flag ${riskCount > 0 ? "on" : "off"}`} onClick={() => open("risk")}>
              ⚑ <b>{riskCount}</b>&nbsp;em risco
            </button>
          </div>
        </div>
      </section>

      <div className="legend">
        <span><i className="sw" style={{ background: "var(--st-done)" }} /> Concluído</span>
        <span><i className="sw" style={{ background: "var(--st-progress)" }} /> Em andamento</span>
        <span><i className="sw" style={{ background: "var(--st-todo)" }} /> A fazer</span>
      </div>

      <div style={{ opacity: loading ? 0.6 : 1, transition: "opacity .15s" }}>
        <TeamsView teams={data.teams} />
      </div>

      <p className="foot">Dados atualizados a cada 5 minutos</p>

      {selectedKpi && (
        <KpiDrawer
          title={DRAWER_TITLES[selectedKpi]}
          rows={drawerRows}
          itemLabel={selectedKpi === "stories" ? "história" : "épico"}
          onClose={closeDrawer}
        />
      )}
    </>
  );
}

function LoadingIndicators() {
  return (
    <>
      <p className="crumb">Carregando…</p>
      <section className="indicators">
        <div className="skeleton" style={{ height: 168 }} />
        <div className="skeleton" style={{ height: 168 }} />
      </section>
    </>
  );
}
