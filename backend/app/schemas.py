"""Modelos de resposta (contrato da API) — servem também para o OpenAPI."""

from typing import Optional
from pydantic import BaseModel


class Breakdown(BaseModel):
    done: int
    approval: int
    inprogress: int
    todo: int
    cancelled: int


class Item(BaseModel):
    issue: str
    summary: str
    status: str
    team: str
    blocked: bool
    kind: str  # done | approval | inprogress | todo | cancelled
    url: str


class Epic(BaseModel):
    epic: str
    epic_name: str
    owner_team: str
    completed_items: int
    total_items: int
    progress: float
    is_completed: bool
    is_empty: bool
    start_date: Optional[str]
    end_date: Optional[str]
    epic_risk: bool
    epic_risk_reason: str
    is_transbordo: bool
    blocked_count: int
    shared_activities: bool
    breakdown: Optional[Breakdown]
    url: str
    items: list[Item]


class Team(BaseModel):
    team: str
    completed_items: int
    total_items: int
    progress: float
    epics: list[Epic]


class Period(BaseModel):
    quarter: str
    year: int
    label: str
    start_date: Optional[str]
    end_date: Optional[str]
    quarter_time_progress: Optional[float] = None


class TrackingKpis(BaseModel):
    cluster_progress: float
    total_completed: int
    total_items: int
    quarter_time_progress: float
    epics_at_risk: int
    squads_at_risk: int
    total_epics: int


class TrackingFilters(BaseModel):
    product: str
    cycle: str
    project_view: str
    available_teams: list[str]
    selected_teams: list[str]


class TrackingResponse(BaseModel):
    filters: TrackingFilters
    period: Period
    kpis: TrackingKpis
    teams: list[Team]


class Sprint(BaseModel):
    name: str
    start: Optional[str]
    end: Optional[str]


class RoadmapRow(BaseModel):
    team: Optional[str]
    epic: Optional[str]
    epic_name: str
    progress: float
    start_date: Optional[str]
    end_date: Optional[str]
    roadmap_status: Optional[str]
    temporal_status: Optional[str]
    epic_risk: bool
    epic_risk_reason: str
    is_transbordo: bool
    progress_label: Optional[str]
    display_name: Optional[str]
    epic_url: Optional[str]


class RoadmapKpis(BaseModel):
    completion_rate: float
    delayed: int
    completed: int
    in_progress: int
    not_started: int
    total_epics: int


class RoadmapFilters(BaseModel):
    product: str
    cycle: str
    project_view: str
    available_teams: list[str]
    selected_teams: list[str]
    only_with_dates: bool


class RoadmapResponse(BaseModel):
    filters: RoadmapFilters
    period: Period
    sprints: list[Sprint]
    kpis: RoadmapKpis
    roadmap: list[RoadmapRow]
    teams: list[Team]


class CycleOption(BaseModel):
    cycle: str
    display_name: str
    quarter: str
    year: int


class ProductOption(BaseModel):
    product: str
    default_cycle: str
    cycles: list[CycleOption]


class OptionsResponse(BaseModel):
    products: list[ProductOption]
    project_views: list[str]
