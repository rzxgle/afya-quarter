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

function SquadCard({ team }: { team: Team }) {
  return (
    <section className="squad">
      <div className="squad-head">
        <div>
          <div className="s-name">{team.team}</div>
          <div className="s-count">
            {team.completed_items}/{team.total_items} histórias
          </div>
        </div>
        <div className="s-spacer" />
        <div className="s-pct">{pct(team.progress)}</div>
      </div>
      <div className="squad-comp">
        <CompositionBar bd={aggBreakdown(team)} />
      </div>
      <div className="epics">
        {team.epics.map((ep) => (
          <EpicCard key={ep.epic} epic={ep} />
        ))}
      </div>
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
  return (
    <div>
      {teams.map((t) => (
        <SquadCard key={t.team} team={t} />
      ))}
    </div>
  );
}
