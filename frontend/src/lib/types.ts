// Tipos espelhando o contrato da API (ver docs/DATA_CONTRACT.md)

export type ItemKind = "done" | "approval" | "inprogress" | "todo" | "cancelled";

export interface Breakdown {
  done: number;
  approval: number;
  inprogress: number;
  todo: number;
  cancelled: number;
}

export interface Item {
  issue: string;
  summary: string;
  status: string;
  team: string;
  blocked: boolean;
  kind: ItemKind;
  url: string;
}

export interface Epic {
  epic: string;
  epic_name: string;
  epic_status: string;
  owner_team: string;
  completed_items: number;
  total_items: number;
  progress: number;
  is_completed: boolean;
  is_empty: boolean;
  start_date: string | null;
  end_date: string | null;
  epic_risk: boolean;
  epic_risk_reason: string;
  is_transbordo: boolean;
  blocked_count: number;
  shared_activities: boolean;
  breakdown: Breakdown | null;
  url: string;
  items: Item[];
}

export interface Team {
  team: string;
  completed_items: number;
  total_items: number;
  progress: number;
  epics: Epic[];
}

export interface Period {
  quarter: string;
  year: number;
  label: string;
  start_date: string | null;
  end_date: string | null;
  quarter_time_progress?: number;
}

export interface TrackingResponse {
  filters: {
    product: string;
    cycle: string;
    project_view: string;
    available_teams: string[];
    selected_teams: string[];
  };
  period: Period;
  kpis: {
    cluster_progress: number;
    total_completed: number;
    total_items: number;
    quarter_time_progress: number;
    epics_at_risk: number;
    squads_at_risk: number;
    total_epics: number;
  };
  teams: Team[];
}

export interface Sprint {
  name: string;
  start: string | null;
  end: string | null;
}

export interface RoadmapRow {
  team: string | null;
  epic: string | null;
  epic_name: string;
  progress: number;
  start_date: string | null;
  end_date: string | null;
  epic_status: string;
  epic_status_kind: ItemKind;
  temporal_status: string | null;
  epic_risk: boolean;
  epic_risk_reason: string;
  is_transbordo: boolean;
  progress_label: string | null;
  display_name: string | null;
  epic_url: string | null;
}

export interface RoadmapResponse {
  filters: {
    product: string;
    cycle: string;
    project_view: string;
    available_teams: string[];
    selected_teams: string[];
    only_with_dates: boolean;
  };
  period: Period;
  sprints: Sprint[];
  kpis: {
    completion_rate: number;
    delayed: number;
    completed: number;
    in_progress: number;
    not_started: number;
    total_epics: number;
  };
  roadmap: RoadmapRow[];
  teams: Team[];
}

export interface CycleOption {
  cycle: string;
  display_name: string;
  quarter: string;
  year: number;
}

export interface ProductOption {
  product: string;
  default_cycle: string;
  cycles: CycleOption[];
}

export interface OptionsResponse {
  products: ProductOption[];
  project_views: string[];
}
