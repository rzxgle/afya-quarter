import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { useFetch } from "../lib/useFetch";
import { useFilters } from "../state/filters";
import { pct } from "../lib/format";
import { Kpi } from "../components/Kpi";
import Gantt from "../components/Gantt";
import TeamsView from "../components/TeamsView";
import KpiDrawer from "../components/KpiDrawer";
import type { RoadmapRow } from "../lib/types";

const NEUTRAL = "#DCDCE0";

type KpiSelection = "completed-rate" | "delayed" | "completed" | "in-progress" | "not-started" | "total";

const DRAWER_TITLES: Record<KpiSelection, string> = {
  "completed-rate": "Épicos concluídos",
  delayed: "Épicos atrasados",
  completed: "Concluídos",
  "in-progress": "Em andamento",
  "not-started": "Não iniciados (pendentes)",
  total: "Total de épicos",
};

function matchesKpi(row: RoadmapRow, selection: KpiSelection) {
  if (selection === "total") return true;
  if (selection === "completed" || selection === "completed-rate") return row.epic_status_kind === "done";
  if (selection === "delayed") return row.temporal_status === "Prazo passou" && row.epic_status_kind !== "done";
  if (selection === "not-started") return row.epic_status_kind !== "done" && row.epic_status_kind !== "inprogress";
  return row.epic_status_kind === "inprogress";
}

export default function RoadmapPage() {
  const f = useFilters();
  const [selectedKpi, setSelectedKpi] = useState<KpiSelection | null>(null);
  const closeDrawer = useCallback(() => setSelectedKpi(null), []);

  const { data, loading, error } = useFetch(
    () =>
      api.roadmap({
        product: f.product,
        cycle: f.cycle,
        project_view: f.projectView,
        teams: f.selectedTeams,
        only_with_dates: f.onlyWithDates,
      }),
    [
      f.product,
      f.cycle,
      f.projectView,
      JSON.stringify(f.selectedTeams),
      f.onlyWithDates,
      f.refreshNonce,
    ],
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

  if (error) return <div className="state err">Erro ao carregar: {error}</div>;
  if (!data) return <div className="state">Carregando roadmap…</div>;

  const k = data.kpis;
  const drawerRows = selectedKpi
    ? uniqueRows.filter((row) => matchesKpi(row, selectedKpi))
    : [];

  return (
    <>
      <p className="crumb">
        Filtro aplicado: <b>{data.filters.product}</b> · <b>{data.period.label}</b>
      </p>

      <section className="kpis k6">
        <Kpi label="% Épicos concluídos" value={pct(k.completion_rate)} accent="var(--brand)" onClick={() => setSelectedKpi("completed-rate")} />
        <Kpi label="Épicos atrasados" value={k.delayed} accent={k.delayed > 0 ? "var(--rm-risco)" : NEUTRAL} onClick={() => setSelectedKpi("delayed")} />
        <Kpi label="Concluídos" value={k.completed} accent={NEUTRAL} onClick={() => setSelectedKpi("completed")} />
        <Kpi label="Em andamento" value={k.in_progress} accent={NEUTRAL} onClick={() => setSelectedKpi("in-progress")} />
        <Kpi label="Não iniciado (pendente)" value={k.not_started} accent={NEUTRAL} onClick={() => setSelectedKpi("not-started")} />
        <Kpi label="Total de épicos" value={k.total_epics} accent={NEUTRAL} onClick={() => setSelectedKpi("total")} />
      </section>

      <div className="section-title">Roadmap do quarter</div>
      <div className="legend">
        <span><i className="sw" style={{ background: "var(--rm-concluido)" }} /> Concluído</span>
        <span><i className="sw" style={{ background: "var(--rm-andamento)" }} /> Em andamento</span>
        <span><i className="sw" style={{ background: "var(--rm-pendente)" }} /> Pendente</span>
        <span>
          <i className="sw" style={{ background: "transparent", boxShadow: "inset 0 0 0 1.6px var(--rm-risco)" }} />{" "}
          Em risco <span style={{ color: "var(--ink-3)" }}>(contorno · detalhe no tooltip)</span>
        </span>
      </div>

      <div style={{ opacity: loading ? 0.6 : 1, transition: "opacity .15s" }}>
        <Gantt rows={data.roadmap} period={data.period} sprints={data.sprints} />
      </div>

      <div className="divider" />
      <div className="section-title">
        Visão operacional{" "}
        <span className="muted">
          ({data.teams.reduce((a, t) => a + t.epics.length, 0)} épicos)
        </span>
      </div>
      <TeamsView teams={data.teams} />

      <p className="foot">Dados atualizados a cada 5 minutos</p>

      {selectedKpi && (
        <KpiDrawer title={DRAWER_TITLES[selectedKpi]} rows={drawerRows} onClose={closeDrawer} />
      )}
    </>
  );
}
