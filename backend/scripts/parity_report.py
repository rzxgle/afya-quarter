"""Relatório de paridade (Fase 5).

Imprime os números calculados pela API para um produto/ciclo, no mesmo formato
das telas, para comparar lado a lado com o app Streamlit rodando na mesma data.

Uso:
    DATA_SOURCE=mock python scripts/parity_report.py "Afya Bridge" Q2
    DATA_SOURCE=jira python scripts/parity_report.py "Afya Bridge" Q2
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.services import pipeline


def main():
    product = sys.argv[1] if len(sys.argv) > 1 else "Afya Bridge"
    cycle = sys.argv[2] if len(sys.argv) > 2 else "Q2"

    t = pipeline.build_tracking(product, cycle)
    k = t["kpis"]
    print(f"\n=== TRACKING · {product} / {cycle} ===")
    print(f"Progresso (histórias): {k['cluster_progress']:.1f}%  "
          f"({k['total_completed']}/{k['total_items']})")
    print(f"% tempo decorrido:     {k['quarter_time_progress']:.1f}%")
    print(f"Épicos com risco:      {k['epics_at_risk']} / {k['total_epics']}")
    print("Squads:")
    for tm in t["teams"]:
        print(f"  - {tm['team']:<22} {tm['completed_items']}/{tm['total_items']}"
              f"  {tm['progress']:.1f}%")

    r = pipeline.build_roadmap(product, cycle)
    rk = r["kpis"]
    print(f"\n=== ROADMAP · {product} / {cycle} ===")
    print(f"% concluídos: {rk['completion_rate']:.1f}%  | atrasados: {rk['delayed']}  "
          f"| concluídos: {rk['completed']}  | andamento: {rk['in_progress']}  "
          f"| não iniciado: {rk['not_started']}  | total: {rk['total_epics']}")


if __name__ == "__main__":
    main()
