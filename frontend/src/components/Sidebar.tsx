import { useFilters, isTeamSelected } from "../state/filters";

export default function Sidebar({ showOnlyDates = false }: { showOnlyDates?: boolean }) {
  const f = useFilters();
  const prod = f.options?.products.find((p) => p.product === f.product);

  return (
    <aside className="sidebar">
      <div className="filters">
        <h2>Filtros</h2>

        <div className="field">
          <label htmlFor="f-product">Produto</label>
          <div className="select">
            <select
              id="f-product"
              value={f.product}
              onChange={(e) => f.setProduct(e.target.value)}
            >
              {f.options?.products.map((p) => (
                <option key={p.product} value={p.product}>
                  {p.product}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="f-cycle">Quarter / PI</label>
          <div className="select">
            <select
              id="f-cycle"
              value={f.cycle}
              onChange={(e) => f.setCycle(e.target.value)}
            >
              {prod?.cycles.map((c) => (
                <option key={c.cycle} value={c.cycle}>
                  {c.display_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="f-project">Filtrar por projeto</label>
          <div className="select">
            <select
              id="f-project"
              value={f.projectView}
              onChange={(e) => f.setProjectView(e.target.value)}
            >
              {f.options?.project_views.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label>Filtrar squads</label>
          <div className="squadlist">
            {f.availableTeams.length === 0 && (
              <div className="row" style={{ color: "var(--ink-3)" }}>
                Carregando…
              </div>
            )}
            {f.availableTeams.map((t) => (
              <label className="row" key={t}>
                <input
                  type="checkbox"
                  checked={isTeamSelected(f.selectedTeams, t)}
                  onChange={() => f.toggleTeam(t)}
                />
                <span className="checkbox">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                <span>{t}</span>
              </label>
            ))}
          </div>
          <div className="squad-toggle">
            <button className="linkbtn" onClick={f.setAllTeams}>
              Todas
            </button>
            <button className="linkbtn" onClick={f.setNoTeams}>
              Nenhuma
            </button>
          </div>
        </div>

        {showOnlyDates && (
          <div className="field">
            <label className="switch">
              <input
                type="checkbox"
                checked={f.onlyWithDates}
                onChange={(e) => f.setOnlyWithDates(e.target.checked)}
              />
              <span className="track-sw" />
              Somente épicos com datas
            </label>
          </div>
        )}
      </div>
    </aside>
  );
}
