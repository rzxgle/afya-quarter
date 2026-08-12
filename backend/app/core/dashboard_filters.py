def get_available_teams(team_progress):
    return sorted(team_progress["team"].dropna().unique())


def filter_by_teams(epic_progress, team_progress, selected_teams):
    filtered_epic_progress = epic_progress[
        epic_progress["team"].isin(selected_teams)
    ]

    filtered_team_progress = team_progress[
        team_progress["team"].isin(selected_teams)
    ]

    return filtered_epic_progress, filtered_team_progress

def filter_by_projects(epic_progress, selected_projects):

    if not selected_projects:
        return epic_progress.copy()

    return epic_progress[
        epic_progress["project"].isin(selected_projects)
    ].copy()


def get_available_projects(epic_progress):
    if "project" not in epic_progress.columns:
        return []

    return sorted(
        epic_progress["project"]
        .dropna()
        .unique()
        .tolist()
    )
