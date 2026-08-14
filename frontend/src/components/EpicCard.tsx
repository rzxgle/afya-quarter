import { useState, type KeyboardEvent } from "react";
import type { Epic, ItemKind } from "../lib/types";
import { pct, fmtShort } from "../lib/format";
import { CompositionBar } from "./Kpi";

const DOT: Record<ItemKind, string> = {
  done: "var(--st-done)",
  approval: "var(--st-approval)",
  inprogress: "var(--st-progress)",
  todo: "var(--st-todo)",
  cancelled: "var(--st-cancel)",
};

export default function EpicCard({ epic }: { epic: Epic }) {
  const [open, setOpen] = useState(false);
  const expandable = epic.items.length > 0;

  const meta: React.ReactNode[] = [];
  if (epic.end_date) meta.push(<span key="fim">Fim {fmtShort(epic.end_date)}</span>);
  if (epic.is_completed)
    meta.push(
      <span key="ok" style={{ color: "var(--st-done)", fontWeight: 600 }}>
        Concluído
      </span>,
    );
  if (epic.epic_risk)
    meta.push(
      <span key="risk" className="risk">
        Risco sinalizado
      </span>,
    );
  if (epic.blocked_count > 0)
    meta.push(
      <span key="blk">
        {epic.blocked_count} bloqueado{epic.blocked_count > 1 ? "s" : ""}
      </span>,
    );
  if (epic.is_transbordo) meta.push(<span key="trans">Transbordo</span>);

  const bd = epic.breakdown;
  const barTitle = bd
    ? `Concluído: ${bd.done} · Em homologação: ${bd.approval} · Em andamento: ${bd.inprogress} · A fazer: ${bd.todo} · Cancelados: ${bd.cancelled}`
    : undefined;

  const toggle = () => expandable && setOpen((o) => !o);
  const onKey = (e: KeyboardEvent) => {
    if (expandable && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      setOpen((o) => !o);
    }
  };

  return (
    <div className={`epic${epic.is_completed ? " done" : ""}`}>
      <div
        className="epic-main"
        role={expandable ? "button" : undefined}
        tabIndex={expandable ? 0 : undefined}
        aria-expanded={expandable ? open : undefined}
        onClick={toggle}
        onKeyDown={onKey}
      >
        <div className="e-titlerow">
          {expandable && (
            <span className="e-caret" aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </span>
          )}
          <div className="e-title">
            <a
              className="e-key"
              href={epic.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              {epic.epic}
            </a>{" "}
            — {epic.epic_name}{" "}
            <span style={{ color: "var(--ink-3)" }}>
              ({epic.completed_items}/{epic.total_items})
            </span>
          </div>
          <div className="e-pct">
            {pct(epic.progress)}
            <span
              className="info"
              title="O cálculo de progresso não contabiliza cancelados ou inválidos."
            >
              ⓘ
            </span>
          </div>
        </div>

        {meta.length > 0 && (
          <div className="e-meta">
            {meta.map((m, i) => (
              <span key={i}>
                {i > 0 && <span className="sepdot">·</span>}
                {m}
              </span>
            ))}
          </div>
        )}

        {epic.is_empty ? (
          <div className="e-empty">
            📝 Este épico ainda não possui histórias válidas cadastradas
          </div>
        ) : (
          bd && (
            <div className="e-cbar" title={barTitle}>
              <CompositionBar bd={bd} />
            </div>
          )
        )}
      </div>

      {open && expandable && (
        <div className="e-detail">
          {epic.epic_risk && epic.epic_risk_reason && (
            <div className="e-note risk">Motivo do risco: {epic.epic_risk_reason}</div>
          )}
          {epic.shared_activities && (
            <div className="e-note">📎 Épico com atividades compartilhadas</div>
          )}
          <div className="items">
            {epic.items.map((it) => (
              <div className="item" key={it.issue}>
                <span
                  className="dot"
                  style={{ background: it.blocked ? "var(--rm-risco)" : DOT[it.kind] }}
                />
                <div className="txt">
                  <div>
                    <a className="k" href={it.url} target="_blank" rel="noopener noreferrer">
                      {it.issue}
                    </a>
                    <span> — {it.summary}</span>
                    {it.team && <span className="meta"> · {it.team}</span>}
                    {it.blocked && <span className="meta blk"> · bloqueado</span>}
                  </div>
                  <div className="st">Status: {it.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
