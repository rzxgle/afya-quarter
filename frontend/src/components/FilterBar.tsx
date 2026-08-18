import { useEffect, useRef, useState } from "react";
import { isTeamSelected, useFilters } from "../state/filters";

type FilterName = "program" | "cycle" | "value-stream" | "squads";

export default function FilterBar() {
  const f = useFilters();
  const [open, setOpen] = useState<FilterName | null>(null);
  const [teamSearch, setTeamSearch] = useState("");
  const barRef = useRef<HTMLDivElement>(null);
  const product = f.options?.products.find((item) => item.product === f.product);
  const filteredTeams = f.availableTeams.filter((team) =>
    team.toLocaleLowerCase("pt-BR").includes(teamSearch.trim().toLocaleLowerCase("pt-BR")),
  );
  const selectedTeamCount = f.selectedTeams?.length ?? 0;

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!barRef.current?.contains(event.target as Node)) setOpen(null);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(null);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const toggle = (name: FilterName) => setOpen((current) => current === name ? null : name);

  return (
    <div className="filterbar" ref={barRef}>
      <span className="filterbar-label">Filtros</span>

      <FilterDropdown label="Programa" open={open === "program"} onToggle={() => toggle("program")} count={f.product ? 1 : 0}>
        <div className="filter-options" role="listbox" aria-label="Programa">
          {f.options?.products.map((item) => (
            <button
              type="button"
              role="option"
              aria-selected={item.product === f.product}
              className={`filter-option${item.product === f.product ? " selected" : ""}`}
              key={item.product}
              onClick={() => { f.setProduct(item.product); setOpen(null); }}
            >
              {item.product}
            </button>
          ))}
        </div>
      </FilterDropdown>

      <FilterDropdown label="Quarter / PI" open={open === "cycle"} onToggle={() => toggle("cycle")} count={f.cycle ? 1 : 0}>
        <div className="filter-options" role="listbox" aria-label="Quarter / PI">
          {product?.cycles.map((cycle) => (
            <button
              type="button"
              role="option"
              aria-selected={cycle.cycle === f.cycle}
              className={`filter-option${cycle.cycle === f.cycle ? " selected" : ""}`}
              key={cycle.cycle}
              onClick={() => { f.setCycle(cycle.cycle); setOpen(null); }}
            >
              {cycle.display_name}
            </button>
          ))}
        </div>
      </FilterDropdown>

      <FilterDropdown label="Value Stream" open={open === "value-stream"} onToggle={() => toggle("value-stream")} count={f.projectView !== "Todos os projetos" ? 1 : 0}>
        <div className="filter-options" role="listbox" aria-label="Value Stream">
          {f.options?.project_views.map((view) => (
            <button
              type="button"
              role="option"
              aria-selected={view === f.projectView}
              className={`filter-option${view === f.projectView ? " selected" : ""}`}
              key={view}
              onClick={() => { f.setProjectView(view); setOpen(null); }}
            >
              {view === "Todos os projetos" ? "Todos os Value Streams" : view}
            </button>
          ))}
        </div>
      </FilterDropdown>

      <FilterDropdown label="Squads" open={open === "squads"} onToggle={() => toggle("squads")} count={selectedTeamCount} wide>
        <input
          className="filter-search"
          value={teamSearch}
          onChange={(event) => setTeamSearch(event.target.value)}
          placeholder="Buscar squad..."
          aria-label="Buscar squad"
        />
        <div className="filter-checks">
          {f.availableTeams.length === 0 && <p className="filter-empty">Carregando squads...</p>}
          {filteredTeams.map((team) => (
            <label className="filter-check" key={team}>
              <input
                type="checkbox"
                checked={isTeamSelected(f.selectedTeams, team)}
                onChange={() => f.toggleTeam(team)}
              />
              <span>{team}</span>
            </label>
          ))}
          {f.availableTeams.length > 0 && filteredTeams.length === 0 && (
            <p className="filter-empty">Nenhuma squad encontrada.</p>
          )}
        </div>
        <div className="filter-actions">
          <button type="button" onClick={f.setAllTeams}>Selecionar todas</button>
        </div>
      </FilterDropdown>

      <button type="button" className="filter-clear" onClick={() => { f.resetFilters(); setOpen(null); }}>
        Limpar todos os filtros
      </button>
    </div>
  );
}

function FilterDropdown({
  label,
  count,
  open,
  onToggle,
  wide = false,
  children,
}: {
  label: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="filter-dropdown">
      <button type="button" className="filter-trigger" onClick={onToggle} aria-expanded={open}>
        {label}
        {count > 0 && <span className="filter-count">{count}</span>}
      </button>
      {open && <div className={`filter-popover${wide ? " wide" : ""}`}>{children}</div>}
    </div>
  );
}
