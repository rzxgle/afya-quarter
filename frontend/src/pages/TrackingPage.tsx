import { useEffect } from "react";
import { api } from "../lib/api";
import { useFetch } from "../lib/useFetch";
import { useFilters } from "../state/filters";
import { pct } from "../lib/format";
import { Kpi } from "../components/Kpi";
import TeamsView from "../components/TeamsView";

export default function TrackingPage() {
  const f = useFilters();

  const { data, loading, error } = useFetch(
    () =>
      api.tracking({
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

  if (error) return <div className="state err">Erro ao carregar: {error}</div>;
  if (!data) return <LoadingKpis />;

  const k = data.kpis;

  return (
    <>
      <p className="crumb">
        Filtro aplicado: <b>{data.filters.product}</b> · <b>{data.period.label}</b>
      </p>

      <section className="kpis k3">
        <Kpi
          label="Progresso · total de histórias"
          value={pct(k.cluster_progress)}
          track={k.cluster_progress}
          sub={`${k.total_completed} de ${k.total_items} histórias concluídas`}
        />
        <Kpi
          label="% tempo decorrido"
          value={pct(k.quarter_time_progress)}
          accent="var(--blue)"
          track={k.quarter_time_progress}
          sub={`${data.period.label} · até hoje`}
        />
        <Kpi
          label="Épicos com risco sinalizado"
          value={
            <>
              {k.epics_at_risk} <small>/ {k.total_epics}</small>
            </>
          }
          accent={k.epics_at_risk ? "var(--rm-risco)" : "#DCDCE0"}
          sub={k.epics_at_risk ? "Requer atenção da liderança" : "Nenhum risco aberto"}
        />
      </section>

      <div className="legend">
        <span><i className="sw" style={{ background: "var(--st-done)" }} /> Concluído</span>
        <span><i className="sw" style={{ background: "var(--st-approval)" }} /> Em homologação</span>
        <span><i className="sw" style={{ background: "var(--st-progress)" }} /> Em andamento</span>
        <span><i className="sw" style={{ background: "var(--st-todo)" }} /> A fazer</span>
        <span><i className="sw" style={{ background: "var(--st-cancel)" }} /> Cancelado</span>
      </div>

      <div style={{ opacity: loading ? 0.6 : 1, transition: "opacity .15s" }}>
        <TeamsView teams={data.teams} />
      </div>

      <p className="foot">⏱️ Dados atualizados a cada 5 minutos</p>
    </>
  );
}

function LoadingKpis() {
  return (
    <>
      <p className="crumb">Carregando…</p>
      <section className="kpis k3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton" style={{ height: 108 }} />
        ))}
      </section>
    </>
  );
}
