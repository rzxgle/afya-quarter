"""Provider Jira — MESMA lógica de busca do `services/jira_client.py`
original, apenas sem Streamlit. O `@st.cache_data(ttl=300)` foi trocado
por um `TTLCache` (mesmos 300s), preservando o comportamento de cache.
"""

from jira import JIRA
import pandas as pd
from cachetools import TTLCache

from app.core.config import (
    JIRA_URL,
    JIRA_EMAIL,
    JIRA_TOKEN,
    TEAM_FIELD,
    TRANSBORDO_LABELS,
    CACHE_TTL_SECONDS,
    require_jira_creds,
)

# Cache neutro equivalente ao st.cache_data(ttl=300, show_spinner=False)
_cache = TTLCache(maxsize=64, ttl=CACHE_TTL_SECONDS)


def get_jira_client():
    require_jira_creds()
    return JIRA(server=JIRA_URL, basic_auth=(JIRA_EMAIL, JIRA_TOKEN))


def clear_cache():
    """Equivalente ao st.cache_data.clear() do botão 'Atualizar dados'."""
    _cache.clear()


def fetch_issues(jql):
    if jql in _cache:
        return _cache[jql]
    result = _fetch_issues_uncached(jql)
    _cache[jql] = result
    return result


def _fetch_issues_uncached(jql):
    jira = get_jira_client()

    epics = jira.search_issues(
        jql,
        maxResults=False,
        fields=[
            "summary",
            "labels",
            "project",
            TEAM_FIELD,          # campo team
            "customfield_11806",  # Épico em risco
            "customfield_11839",  # Motivo do risco
            "customfield_10505",  # data inicio do épico
            "duedate",            # data fim do épico
        ],
    )

    epic_map = {epic.key: epic.fields.summary for epic in epics}

    epic_data = []

    for epic in epics:
        team_obj = getattr(epic.fields, TEAM_FIELD, None)
        team = team_obj.name if team_obj else "Team Desconhecido"
        project_obj = getattr(epic.fields, "project", None)
        project = project_obj.key if project_obj else "Projeto Desconhecido"
        risk_obj = getattr(epic.fields, "customfield_11806", None)
        risk_value = getattr(risk_obj, "value", None) if risk_obj else None
        risk_reason = getattr(epic.fields, "customfield_11839", None)
        epic_labels = getattr(epic.fields, "labels", []) or []
        is_transbordo = any(
            label in TRANSBORDO_LABELS for label in epic_labels
        )
        start_date = getattr(epic.fields, "customfield_10505", None)
        end_date = getattr(epic.fields, "duedate", None)

        epic_data.append({
            "epic": epic.key,
            "team": team,
            "project": project,
            "epic_risk": risk_value == "Sim",
            "epic_risk_reason": risk_reason if risk_reason else "",
            "is_transbordo": is_transbordo,
            "start_date": start_date,
            "end_date": end_date,
        })

    epic_df = pd.DataFrame(
        epic_data,
        columns=[
            "epic", "team", "project", "epic_risk",
            "epic_risk_reason", "is_transbordo", "start_date", "end_date",
        ],
    )

    epic_keys = list(epic_map.keys())
    if not epic_keys:
        return [], {}, epic_df

    epic_string = ",".join(epic_keys)

    issues = jira.search_issues(
        f'parent in ({epic_string}) and issuetype not in '
        f'(Design, "Tarefa épico", Epic, "Enabler Epic", '
        f'Dependência, subtaskWorkTypes(), Tarefa)',
        maxResults=False,
    )

    return issues, epic_map, epic_df
