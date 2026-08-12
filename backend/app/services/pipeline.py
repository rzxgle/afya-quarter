"""Orquestração das telas — porta fiel de `app.py` (tracking) e
`pages/management_view.py` (roadmap) para funções puras que devolvem
dicionários JSON-serializáveis. Nenhuma regra de cálculo é alterada:
todas as funções de `app.core` são usadas exatamente como no original.
"""

import math
import pandas as pd

from app.core.config import JIRA_BROWSE_BASE
from app.core.label_options import (
    get_label_options, get_products, get_cycles, get_selection,
)
from app.core.period_utils import (
    get_quarter_dates, get_default_cycle,
)
from app.core.project_options import (
    get_project_options, get_project_views, get_projects_for_view,
)
from app.core.sprint_config import get_sprints
from app.core.data_processing import issues_to_dataframe
from app.core.roadmap_processing import build_roadmap_dataframe
from app.core.dashboard_filters import (
    get_available_teams, filter_by_teams, filter_by_projects,
)
from app.core.workflow_rules import (
    is_in_approval, is_in_progress, is_ignored,
)
from app.core.safe_metrics import (
    calculate_epic_progress, calculate_team_progress,
    calculate_cluster_progress, calculate_quarter_time_progress,
    calculate_risk_metrics,
)
from app.providers import fetch_issues


# ---------------------------------------------------------------- helpers
def _i(v):
    return int(v) if v is not None and not (isinstance(v, float) and math.isnan(v)) else 0


def _f(v):
    try:
        f = float(v)
        return 0.0 if math.isnan(f) else f
    except (TypeError, ValueError):
        return 0.0


def _iso(v):
    """Serializa data (str ISO, Timestamp ou None) como 'YYYY-MM-DD' | None."""
    if v is None:
        return None
    if isinstance(v, str):
        return v or None
    if isinstance(v, pd.Timestamp):
        return None if pd.isna(v) else v.strftime("%Y-%m-%d")
    if pd.isna(v):
        return None
    return str(v)


def _item_kind(row):
    if row["done"]:
        return "done"
    if is_in_approval(row["status"]):
        return "approval"
    if is_in_progress(row["status"]):
        return "inprogress"
    if is_ignored(row["status"]):
        return "cancelled"
    return "todo"


# ---------------------------------------------------------------- options
def get_options():
    """Espelha os filtros disponíveis (produto, ciclos, VS/projeto)."""
    label_options = get_label_options()
    project_options = get_project_options()
    products = []
    for product in get_products(label_options):
        cycles = get_cycles(label_options, product)
        products.append({
            "product": product,
            "default_cycle": get_default_cycle(cycles),
            "cycles": [
                {
                    "cycle": c,
                    "display_name": label_options[product][c].get("display_name", c),
                    "quarter": label_options[product][c]["quarter"],
                    "year": label_options[product][c]["year"],
                }
                for c in cycles
            ],
        })
    return {
        "products": products,
        "project_views": get_project_views(project_options),
    }


# ---------------------------------------------------- base (comum às telas)
def _assemble(product, cycle):
    """Prefixo compartilhado por app.py e management_view.py."""
    label_options = get_label_options()
    selection = get_selection(label_options, product, cycle)

    labels = selection["labels"]
    quarter = selection["quarter"]
    year = selection["year"]

    start_date, end_date = get_quarter_dates(year, quarter)

    labels_jql = ", ".join(labels)
    jql = (
        f'\nlabels in ({labels_jql}) AND '
        f'issuetype in (Epic,"Enabler Epic")\n'
    )

    issues, epic_map, epic_df = fetch_issues(jql)
    df = issues_to_dataframe(issues)

    epic_progress = calculate_epic_progress(df)
    epic_progress = epic_df.merge(epic_progress, on="epic", how="left")

    epics_with_children = set(epic_progress["epic"].unique())
    empty_epics = epic_df[~epic_df["epic"].isin(epics_with_children)].copy()

    if not empty_epics.empty:
        empty_epics["epic_owner_team"] = empty_epics["team"]
        empty_epics["completed_items"] = 0
        empty_epics["total_items"] = 0
        empty_epics["progress"] = 0.0
        epic_progress = pd.concat(
            [epic_progress, empty_epics], ignore_index=True, sort=False
        )

    epic_progress["completed_items"] = epic_progress["completed_items"].fillna(0).astype(int)
    epic_progress["total_items"] = epic_progress["total_items"].fillna(0).astype(int)
    epic_progress["progress"] = epic_progress["progress"].fillna(0.0)

    return {
        "df": df, "epic_map": epic_map, "epic_df": epic_df,
        "epic_progress": epic_progress, "selection": selection,
        "quarter": quarter, "year": year,
        "start_date": start_date, "end_date": end_date,
    }


def _resolve_projects(project_view):
    project_options = get_project_options()
    view = project_view or "Todos os projetos"
    return get_projects_for_view(project_options, view)


# ------------------------------------------------- payload de itens/épicos
def _epic_items_payload(all_epic_items):
    rows = all_epic_items.sort_values("priority")
    out = []
    for _, item in rows.iterrows():
        out.append({
            "issue": item["issue"],
            "summary": item["summary"],
            "status": item["status"],
            "team": item.get("team", "Sem squad"),
            "blocked": bool(item.get("flagged", False)),
            "kind": _item_kind(item),
            "url": f"{JIRA_BROWSE_BASE}{item['issue']}",
        })
    return out


def _teams_payload(team_progress, epic_progress, epic_map, df):
    """Porta fiel de ui.team_view.render_teams -> dados estruturados."""
    valid_items = df[df["ignored"] == 0]
    teams_out = []

    for _, team in team_progress.iterrows():
        team_name = team["team"]
        team_epics = epic_progress[epic_progress["team"] == team_name].sort_values("progress")

        epics_out = []
        for _, epic in team_epics.iterrows():
            epic_key = epic["epic"]
            done = int(epic["completed_items"])
            total = int(epic["total_items"])
            progress = float(epic["progress"])

            all_epic_items = df[df["epic"] == epic_key]
            epic_items = df[(df["epic"] == epic_key) & (df["team"] == team_name)]

            is_empty = total == 0
            blocked_count = int(epic_items[epic_items["flagged"] == True].shape[0])

            if is_empty:
                breakdown = None
            else:
                done_count = int(all_epic_items[all_epic_items["done"] == 1].shape[0])
                in_approval = int(all_epic_items[all_epic_items["status"].apply(is_in_approval)].shape[0])
                in_progress = int(all_epic_items[all_epic_items["status"].apply(is_in_progress)].shape[0])
                cancelled = int(all_epic_items[all_epic_items["ignored"] == 1].shape[0])
                todo = int(all_epic_items.shape[0] - done_count - in_progress - in_approval - cancelled)
                breakdown = {
                    "done": done_count, "approval": in_approval,
                    "inprogress": in_progress, "todo": todo, "cancelled": cancelled,
                }

            epic_total_valid = int(valid_items[valid_items["epic"] == epic_key].shape[0])
            shared = bool(epic_total_valid != total and total > 0)

            epics_out.append({
                "epic": epic_key,
                "epic_name": epic_map.get(epic_key, ""),
                "owner_team": epic.get("epic_owner_team", team_name),
                "completed_items": done,
                "total_items": total,
                "progress": progress,
                "is_completed": bool(done == total and total > 0),
                "is_empty": is_empty,
                "start_date": _iso(epic.get("start_date")),
                "end_date": _iso(epic.get("end_date")),
                "epic_risk": bool(epic.get("epic_risk", False)),
                "epic_risk_reason": epic.get("epic_risk_reason", "") or "",
                "is_transbordo": bool(epic.get("is_transbordo", False)),
                "blocked_count": blocked_count,
                "shared_activities": shared,
                "breakdown": breakdown,
                "url": f"{JIRA_BROWSE_BASE}{epic_key}",
                "items": [] if epic_items.empty else _epic_items_payload(all_epic_items),
            })

        teams_out.append({
            "team": team_name,
            "completed_items": int(team["completed_items"]),
            "total_items": int(team["total_items"]),
            "progress": float(team["progress"]),
            "epics": epics_out,
        })

    return teams_out


# --------------------------------------------------------------- TRACKING
def build_tracking(product, cycle, project_view=None, teams=None):
    base = _assemble(product, cycle)
    epic_progress = base["epic_progress"]
    start_date, end_date = base["start_date"], base["end_date"]

    selected_projects = _resolve_projects(project_view)
    project_filtered = filter_by_projects(epic_progress, selected_projects)

    team_progress = calculate_team_progress(project_filtered)
    available = get_available_teams(team_progress)
    selected_teams = available if teams is None else teams

    f_epic, f_team = filter_by_teams(project_filtered, team_progress, selected_teams)

    total_completed = int(f_team["completed_items"].sum())
    total_items = int(f_team["total_items"].sum())
    cluster_progress = float(calculate_cluster_progress(f_team))
    quarter_time_progress = float(calculate_quarter_time_progress(start_date, end_date))
    squads_at_risk, epics_at_risk, total_epics = calculate_risk_metrics(
        f_epic, f_team, quarter_time_progress
    )

    return {
        "filters": {
            "product": product, "cycle": cycle,
            "project_view": project_view or "Todos os projetos",
            "available_teams": available,
            "selected_teams": list(selected_teams),
        },
        "period": {
            "quarter": base["quarter"], "year": base["year"],
            "label": f"{base['quarter']}/{base['year']}",
            "start_date": _iso(str(start_date)), "end_date": _iso(str(end_date)),
        },
        "kpis": {
            "cluster_progress": cluster_progress,
            "total_completed": total_completed,
            "total_items": total_items,
            "quarter_time_progress": quarter_time_progress,
            "epics_at_risk": int(epics_at_risk),
            "squads_at_risk": int(squads_at_risk),
            "total_epics": int(total_epics),
        },
        "teams": _teams_payload(f_team, f_epic, base["epic_map"], base["df"]),
    }


# ---------------------------------------------------------------- ROADMAP
def _roadmap_rows_payload(roadmap_df):
    cols = [
        "team", "epic", "epic_name", "progress", "start_date", "end_date",
        "roadmap_status", "temporal_status", "epic_risk", "epic_risk_reason",
        "is_transbordo", "progress_label", "display_name", "epic_url",
    ]
    out = []
    for _, r in roadmap_df.iterrows():
        out.append({
            "team": r.get("team"),
            "epic": r.get("epic"),
            "epic_name": r.get("epic_name") or "",
            "progress": _f(r.get("progress")),
            "start_date": _iso(r.get("start_date")),
            "end_date": _iso(r.get("end_date")),
            "roadmap_status": r.get("roadmap_status"),
            "temporal_status": r.get("temporal_status"),
            "epic_risk": bool(r.get("epic_risk", False)),
            "epic_risk_reason": r.get("epic_risk_reason", "") or "",
            "is_transbordo": bool(r.get("is_transbordo", False)),
            "progress_label": r.get("progress_label"),
            "display_name": r.get("display_name"),
            "epic_url": r.get("epic_url"),
        })
    return out


def build_roadmap(product, cycle, project_view=None, teams=None, only_with_dates=False):
    base = _assemble(product, cycle)
    epic_progress = base["epic_progress"]
    epic_df, epic_map, df = base["epic_df"], base["epic_map"], base["df"]
    start_date, end_date = base["start_date"], base["end_date"]
    quarter, year = base["quarter"], base["year"]

    selected_projects = _resolve_projects(project_view)
    project_filtered = filter_by_projects(epic_progress, selected_projects)

    team_progress = calculate_team_progress(project_filtered)
    roadmap_df = build_roadmap_dataframe(project_filtered, epic_df, epic_map)

    available = get_available_teams(team_progress)
    selected_teams = available if teams is None else teams

    f_epic, f_team = filter_by_teams(project_filtered, team_progress, selected_teams)

    roadmap_df = roadmap_df[roadmap_df["team"].isin(selected_teams)]
    if only_with_dates:
        roadmap_df = roadmap_df.dropna(subset=["start_date", "end_date"])

    # ---- KPIs idênticos ao management_view.py ----
    summary_df = roadmap_df.drop_duplicates(subset=["epic"]).copy()
    total_epics = int(summary_df["epic"].nunique())
    completed_count = int(summary_df[summary_df["progress"] >= 100]["epic"].nunique())
    delayed_count = int(summary_df[summary_df["roadmap_status"] == "Atrasado"]["epic"].nunique())
    not_started_count = int(summary_df[
        (summary_df["progress"] == 0) & (summary_df["roadmap_status"] != "Atrasado")
    ]["epic"].nunique())
    in_progress_count = int(summary_df[
        (summary_df["progress"] > 0) & (summary_df["progress"] < 100)
        & (summary_df["roadmap_status"] != "Atrasado")
    ]["epic"].nunique())
    completion_rate = (completed_count / total_epics * 100) if total_epics > 0 else 0.0

    quarter_time_progress = float(calculate_quarter_time_progress(start_date, end_date))
    sprints = [
        {"name": s["name"], "start": _iso(str(s["start"])), "end": _iso(str(s["end"]))}
        for s in get_sprints(quarter, year)
    ]

    return {
        "filters": {
            "product": product, "cycle": cycle,
            "project_view": project_view or "Todos os projetos",
            "available_teams": available,
            "selected_teams": list(selected_teams),
            "only_with_dates": bool(only_with_dates),
        },
        "period": {
            "quarter": quarter, "year": year, "label": f"{quarter}/{year}",
            "start_date": _iso(str(start_date)), "end_date": _iso(str(end_date)),
            "quarter_time_progress": quarter_time_progress,
        },
        "sprints": sprints,
        "kpis": {
            "completion_rate": float(completion_rate),
            "delayed": delayed_count,
            "completed": completed_count,
            "in_progress": in_progress_count,
            "not_started": not_started_count,
            "total_epics": total_epics,
        },
        "roadmap": _roadmap_rows_payload(roadmap_df),
        "teams": _teams_payload(f_team, f_epic, epic_map, df),
    }
