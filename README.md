# Epic Quarter — Reescrita (Opção B)

Evolução visual das telas **Quarter Tracking** e **Quarter Roadmap**, saindo do
Streamlit para **FastAPI (backend) + React/Vite/Tailwind (front)**, **sem alterar
nenhuma regra de negócio**.

## Status das fases
| Fase | Descrição | Status |
|---|---|---|
| 0 | Fundação: design tokens + contrato de dados | ✅ `docs/` |
| 1 | Isolar a lógica (remover acoplamento com Streamlit) | ✅ `backend/app/core` + provider sem `st.cache_data` |
| 2 | Camada de API (FastAPI, 2 endpoints) | ✅ `backend/` |
| 3 | Design System (tokens/tipografia/componentes) | ✅ tokens em `docs/` + `frontend/src/index.css` |
| 4 | Front novo (React + Vite + Tailwind + TS) | ✅ `frontend/` |
| 5 | Deploy no Render + regressão | ⏳ (semente: `scripts/parity_report.py`) |

## Estrutura
```
backend/   # API FastAPI (Fases 1–2). Roda em modo mock sem Jira.
frontend/  # App React + Vite + Tailwind + TS (Fase 4). Consome a API.
docs/      # DATA_CONTRACT.md, DESIGN_TOKENS.md, design-tokens.(css|json)
```

## Rodar tudo em dev (dois terminais)
```bash
# terminal 1 — backend
cd backend && pip install -r requirements.txt && DATA_SOURCE=mock uvicorn app.main:app --reload --port 8000
# terminal 2 — frontend
cd frontend && npm install && npm run dev      # http://localhost:5173
```

## Começar (backend, modo mock)
```bash
cd backend
pip install -r requirements.txt
DATA_SOURCE=mock uvicorn app.main:app --reload --port 8000
# docs: http://localhost:8000/docs
```

## Plano de deploy (Fase 5 — Render)
- **Backend**: Web Service Python. Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
  Env: `DATA_SOURCE=jira`, `JIRA_*`, `CORS_ORIGINS=https://<front>.onrender.com`.
- **Front**: Static Site (build do Vite → `dist/`), apontando `VITE_API_URL` para o backend.
- **Regressão**: rodar `scripts/parity_report.py` no mesmo dia que o Streamlit e
  conferir número a número (mesma JQL → mesmos resultados).

## Princípio
`backend/app/core` é o código de `domain/` e `utils/` do projeto original, copiado
verbatim (só imports reapontados). O que muda é a camada de apresentação.
