import { useEffect, useRef } from "react";

export interface KpiDrawerRow {
  key: string;
  summary: string;
  status: string;
  url?: string;
}

export default function KpiDrawer({
  title,
  rows,
  itemLabel = "épico",
  onClose,
}: {
  title: string;
  rows: KpiDrawerRow[];
  itemLabel?: "épico" | "história";
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
            <p>{rows.length} {rows.length === 1 ? itemLabel : `${itemLabel}s`}</p>
          </div>
          <button ref={closeRef} type="button" className="drawer-close" onClick={onClose} aria-label="Fechar detalhes" title="Fechar">
            ×
          </button>
        </header>

        <div className="drawer-body">
          {rows.length === 0 ? (
            <p className="drawer-empty">Nenhuma informação encontrada para este indicador.</p>
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
                    <tr key={row.key}>
                      <td data-label="KEY">
                        {row.url ? (
                          <a href={row.url} target="_blank" rel="noopener noreferrer">{row.key}</a>
                        ) : row.key}
                      </td>
                      <td data-label="SUMMARY">{row.summary || "-"}</td>
                      <td data-label="STATUS"><span className="drawer-status">{row.status || "-"}</span></td>
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
