"""Testes de sanidade/paridade (modo mock).

Garantem que a orquestração continua consistente após a extração do
Streamlit: somas fecham, filtros funcionam e os KPIs são coerentes.
"""

import os
os.environ.setdefault("DATA_SOURCE", "mock")

from app.services import pipeline  # noqa: E402


def test_options():
    opts = pipeline.get_options()
    products = [p["product"] for p in opts["products"]]
    assert "Afya Bridge" in products and "Afya One" in products
    assert "Todos os projetos" in opts["project_views"]


def test_tracking_totais_fecham():
    t = pipeline.build_tracking("Afya Bridge", "Q2")
    k = t["kpis"]
    # cluster = 12/34 = 35.29...
    assert k["total_items"] == 34
    assert k["total_completed"] == 12
    assert round(k["cluster_progress"], 1) == 35.3
    assert k["total_epics"] == 10
    assert k["epics_at_risk"] == 2

    # soma dos itens das squads == total global
    soma = sum(tm["total_items"] for tm in t["teams"])
    assert soma == k["total_items"]


def test_tracking_epico_breakdown():
    t = pipeline.build_tracking("Afya Bridge", "Q2")
    ep = next(e for tm in t["teams"] for e in tm["epics"] if e["epic"] == "APR-1204")
    assert ep["progress"] == 20.0
    b = ep["breakdown"]
    assert b == {"done": 1, "approval": 1, "inprogress": 2, "todo": 1, "cancelled": 1}
    # itens ordenados por prioridade e com kind coerente
    kinds = {i["issue"]: i["kind"] for i in ep["items"]}
    assert kinds["APR-1210"] == "done"
    assert kinds["APR-1219"] == "cancelled"


def test_empty_epic():
    t = pipeline.build_tracking("Afya Bridge", "Q2")
    ep = next(e for tm in t["teams"] for e in tm["epics"] if e["epic"] == "APR-1255")
    assert ep["is_empty"] is True
    assert ep["breakdown"] is None
    assert ep["start_date"] is None and ep["end_date"] is None


def test_project_filter():
    t = pipeline.build_tracking("Afya Bridge", "Q2", project_view="VS Aprender")
    assert [tm["team"] for tm in t["teams"]] == ["Squad Aprender"]


def test_roadmap_only_with_dates():
    r_all = pipeline.build_roadmap("Afya Bridge", "Q2")
    r_dt = pipeline.build_roadmap("Afya Bridge", "Q2", only_with_dates=True)
    assert any(x["epic"] == "APR-1255" for x in r_all["roadmap"])
    assert not any(x["epic"] == "APR-1255" for x in r_dt["roadmap"])


def test_roadmap_kpis_somam_total():
    r = pipeline.build_roadmap("Afya Bridge", "Q2")
    k = r["kpis"]
    assert k["completed"] + k["delayed"] + k["in_progress"] + k["not_started"] == k["total_epics"]
    assert len(r["sprints"]) == 5
