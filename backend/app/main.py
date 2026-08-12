"""API Afya Quarter — dois endpoints espelhando as telas atuais
(tracking e roadmap). Não altera nenhum cálculo do projeto original.
"""

from typing import Optional
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import CORS_ORIGINS, DATA_SOURCE
from app.core.label_options import get_label_options, get_cycles
from app.core.period_utils import get_default_cycle
from app.providers import clear_cache
from app.services import pipeline
from app.schemas import (
    TrackingResponse, RoadmapResponse, OptionsResponse,
)

app = FastAPI(
    title="Afya Quarter API",
    version="1.0.0",
    description="API que serve os dados das telas Quarter Tracking e Quarter Roadmap.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


def _resolve_cycle(product: str, cycle: Optional[str]) -> str:
    label_options = get_label_options()
    if product not in label_options:
        raise HTTPException(404, f"Produto desconhecido: {product}")
    cycles = get_cycles(label_options, product)
    if cycle is None:
        return get_default_cycle(cycles)
    if cycle not in cycles:
        raise HTTPException(404, f"Ciclo desconhecido para {product}: {cycle}")
    return cycle


@app.get("/api/health")
def health():
    return {"status": "ok", "data_source": DATA_SOURCE}


@app.get("/api/options", response_model=OptionsResponse)
def options():
    return pipeline.get_options()


@app.get("/api/tracking", response_model=TrackingResponse)
def tracking(
    product: str = Query(..., description="Ex.: 'Afya Bridge'"),
    cycle: Optional[str] = Query(None, description="Ex.: 'Q2' (padrão: ciclo atual)"),
    project_view: Optional[str] = Query(None, description="Ex.: 'VS Aprender'"),
    teams: Optional[list[str]] = Query(None, description="Squads (repetível). Omitir = todas."),
):
    cycle = _resolve_cycle(product, cycle)
    try:
        return pipeline.build_tracking(product, cycle, project_view, teams)
    except RuntimeError as e:
        raise HTTPException(503, str(e))


@app.get("/api/roadmap", response_model=RoadmapResponse)
def roadmap(
    product: str = Query(...),
    cycle: Optional[str] = Query(None),
    project_view: Optional[str] = Query(None),
    teams: Optional[list[str]] = Query(None),
    only_with_dates: bool = Query(False),
):
    cycle = _resolve_cycle(product, cycle)
    try:
        return pipeline.build_roadmap(product, cycle, project_view, teams, only_with_dates)
    except RuntimeError as e:
        raise HTTPException(503, str(e))


@app.post("/api/refresh")
def refresh():
    """Equivalente ao botão 'Atualizar dados' (limpa o cache)."""
    clear_cache()
    return {"status": "cache limpo"}
