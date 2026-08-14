import { useState } from "react";
import type { Team, Breakdown } from "../lib/types";
import { pct } from "../lib/format";
import { CompositionBar } from "./Kpi";
import EpicCard from "./EpicCard";

function aggBreakdown(team: Team): Breakdown {
  const a: Breakdown = { done: 0, approval: 0, inprogress: 0, todo: 0, cancelled: 0 };
  for (const ep of team.epics) {
    if (ep.breakdown) {
      a.done += ep.breakdown.done;
      a.approval += ep.breakdown.approval;
      a.inprogress += ep.breakdown.inprogress;
      a.todo += ep.breakdown.todo;
      a.cancelled += ep.breakdown.cancelled;
    }
  }
  return a;
}

function SquadCard({ team, defaultOpen }: { team: Team; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const epicCount = team.epics.length;
  const bodyId = `squad-${team.team.replace(/\s+/g, "-")}`;

  return (
    <section className="squad">
      <button
        className="squad-head"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="squad-caret" aria-hidden="true">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </span>
        <span className="s-headtext">
          <span className="s-name">{team.team}</span>
          <span className="s-count">
            {team.completed_items}/{team.total_items} histórias · {epicCount} épico
            {epicCount === 1 ? "" : "s"}
          </span>
        </span>
        <span className="s-spacer" />
        <span className="s-pct">{pct(team.progress)}</span>
      </button>

      <div className="squad-comp">
        <CompositionBar bd={aggBreakdown(team)} />
      </div>

      {open && (
        <div className="epics" id={bodyId}>
          {team.epics.map((ep) => (
            <EpicCard key={ep.epic} epic={ep} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function TeamsView({ teams }: { teams: Team[] }) {
  if (teams.length === 0) {
    return (
      <div className="e-empty" style={{ maxWidth: 480 }}>
        Nenhuma squad selecionada. Escolha ao menos uma no filtro à esquerda.
      </div>
    );
  }
  // Uma única squad no filtro -> já abre; caso contrário, colapsado.
  const singleOpen = teams.length === 1;
  return (
    <div>
      {teams.map((t) => (
        <SquadCard key={t.team} team={t} defaultOpen={singleOpen} />
      ))}
    </div>
  );
}
