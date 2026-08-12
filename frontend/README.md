# Epic Quarter — Frontend (React + Vite + Tailwind + TS)

As duas telas (**Quarter Tracking** e **Quarter Roadmap**) consumindo a API.

## Rodar em desenvolvimento
Suba o backend primeiro (em `../backend`, porta 8000). Depois:
```bash
cd frontend
npm install
npm run dev
# abre em http://localhost:5173
```
Em dev o Vite faz **proxy** de `/api` para `http://localhost:8000` — não precisa configurar nada.

## Build de produção
```bash
npm run build      # typecheck + bundle em dist/
npm run preview    # serve o dist localmente para conferir
```
Em produção, aponte o front para o backend com a variável **`VITE_API_URL`**
(ex.: `VITE_API_URL=https://afya-quarter-api.onrender.com`). Sem ela, o front
usa caminho relativo `/api` (útil se front e API ficarem atrás do mesmo domínio).

## Estrutura
```
src/
  lib/        api.ts (cliente) · types.ts (contrato) · format.ts · useFetch.ts
  state/      filters.tsx (contexto de filtros compartilhado entre as telas)
  components/ TopBar · Sidebar · Kpi/CompositionBar · EpicCard · TeamsView · Gantt
  pages/      TrackingPage · RoadmapPage
  index.css   design tokens + estilos dos componentes (identidade Afya)
```

## Notas de design (do protótipo aprovado)
- Paleta de tracking dessaturada; magenta/azul só como acentos.
- Sinais do épico em **texto** (sem badges coloridas).
- Gantt em **3 estados** (Concluído / Em andamento / Pendente); atrasado e
  transbordo se leem pelas datas; **em risco** = contorno + detalhe no tooltip.
- Fonte **Afya Sans Pro** com reserva Arial. Para ativar a primária, coloque os
  arquivos da fonte em `public/fonts/` e adicione o `@font-face` no `index.css`.
```css
/* exemplo de @font-face a adicionar quando tiver o arquivo da fonte */
@font-face{
  font-family:"Afya Sans Pro";
  src:url("/fonts/AfyaSansPro.woff2") format("woff2");
  font-weight:100 900; font-display:swap;
}
```
