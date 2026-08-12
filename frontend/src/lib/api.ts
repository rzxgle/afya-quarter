import type {
  OptionsResponse,
  TrackingResponse,
  RoadmapResponse,
} from "./types";

// Dev: vazio -> usa o proxy do Vite (/api -> :8000).
// Prod: defina VITE_API_URL (ex.: https://afya-quarter-api.onrender.com).
const BASE = import.meta.env.VITE_API_URL ?? "";

export interface QueryParams {
  product: string;
  cycle?: string;
  project_view?: string;
  teams?: string[] | null;
  only_with_dates?: boolean;
}

function buildQuery(params: QueryParams): string {
  const q = new URLSearchParams();
  q.set("product", params.product);
  if (params.cycle) q.set("cycle", params.cycle);
  if (params.project_view && params.project_view !== "Todos os projetos") {
    q.set("project_view", params.project_view);
  }
  if (params.teams && params.teams.length > 0) {
    params.teams.forEach((t) => q.append("teams", t));
  }
  if (params.only_with_dates) q.set("only_with_dates", "true");
  return q.toString();
}

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {
      /* ignore */
    }
    throw new Error(`${res.status} — ${detail}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  options: () => getJSON<OptionsResponse>(`${BASE}/api/options`),

  tracking: (p: QueryParams) =>
    getJSON<TrackingResponse>(`${BASE}/api/tracking?${buildQuery(p)}`),

  roadmap: (p: QueryParams) =>
    getJSON<RoadmapResponse>(`${BASE}/api/roadmap?${buildQuery(p)}`),

  refresh: async () => {
    const res = await fetch(`${BASE}/api/refresh`, { method: "POST" });
    if (!res.ok) throw new Error("Falha ao atualizar dados");
    return res.json();
  },
};
