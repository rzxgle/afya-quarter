"""Seletor de fonte de dados. A interface é sempre a mesma do original:
`fetch_issues(jql) -> (issues, epic_map, epic_df)`.
"""

from app.core.config import DATA_SOURCE


def get_provider():
    if DATA_SOURCE == "jira":
        from app.providers import jira_provider as p
        return p
    from app.providers import mock_provider as p
    return p


def fetch_issues(jql):
    return get_provider().fetch_issues(jql)


def clear_cache():
    prov = get_provider()
    if hasattr(prov, "clear_cache"):
        prov.clear_cache()
