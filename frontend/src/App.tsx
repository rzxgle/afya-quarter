import { Routes, Route } from "react-router-dom";
import { FiltersProvider, useFilters } from "./state/filters";
import TopBar from "./components/TopBar";
import FilterBar from "./components/FilterBar";
import TrackingPage from "./pages/TrackingPage";

function Layout() {
  const { optionsError } = useFilters();

  return (
    <>
      <TopBar />
      <FilterBar />
      {optionsError ? (
        <div className="state err" style={{ padding: 30 }}>
          Não foi possível conectar à API: {optionsError}
          <br />
          Verifique se o backend está no ar (padrão: http://localhost:8000).
        </div>
      ) : (
        <main className="main">
          <Routes>
            <Route path="/" element={<TrackingPage />} />
          </Routes>
        </main>
      )}
    </>
  );
}

export default function App() {
  return (
    <FiltersProvider>
      <Layout />
    </FiltersProvider>
  );
}
