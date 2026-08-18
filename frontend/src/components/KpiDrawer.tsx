import { useEffect, useRef } from "react";
import type { RoadmapRow } from "../lib/types";

export default function KpiDrawer({
  title,
  rows,
  onClose,
}: {
  title: string;
  rows: RoadmapRow[];
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [onClose]);

  return (
    <div className="drawer-layer" role="presentation" onMouseDown={onClose}>
      <aside
        className="kpi-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kpi-drawer-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="drawer-head">
          <div>
            <h2 id="kpi-drawer-title">{title}</h2>
            <p>{rows.length} {rows.length === 1 ? "épico" : "épicos"}</p>
          </div>
          <button ref={closeRef} type="button" className="drawer-close" onClick={onClose} aria-label="Fechar detalhes" title="Fechar">
            ×
          </button>
        </header>

        <div className="drawer-body">
          {rows.length === 0 ? (
            <p className="drawer-empty">Nenhum épico encontrado para este indicador.</p>
          ) : (
            <div className="drawer-table-wrap">
              <table className="drawer-table">
                <thead>
                  <tr>
                    <th>KEY</th>
                    <th>SUMMARY</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.epic}>
                      <td data-label="KEY">
                        {row.epic_url ? (
                          <a href={row.epic_url} target="_blank" rel="noopener noreferrer">{row.epic}</a>
                        ) : row.epic}
                      </td>
                      <td data-label="SUMMARY">{row.epic_name || "-"}</td>
                      <td data-label="STATUS"><span className="drawer-status">{row.roadmap_status || "-"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
