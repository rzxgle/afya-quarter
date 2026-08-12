from datetime import date

SPRINTS = {
    ("Q2", 2026): [
        {
            "name": "Sprint 1",
            "start": date(2026, 4, 13),
            "end": date(2026, 4, 24)
        },
        {
            "name": "Sprint 2",
            "start": date(2026, 4, 27),
            "end": date(2026, 5, 8)
        },
        {
            "name": "Sprint 3",
            "start": date(2026, 5, 11),
            "end": date(2026, 5, 22)
        },
        {
            "name": "Sprint 4",
            "start": date(2026, 5, 25),
            "end": date(2026, 6, 5)
        },
        {
            "name": "Sprint 5",
            "start": date(2026, 6, 8),
            "end": date(2026, 6, 20)
        }
    ]
}


def get_sprints(quarter, year):
    return SPRINTS.get((quarter, year), [])
