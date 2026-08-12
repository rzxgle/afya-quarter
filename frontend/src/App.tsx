import { Routes, Route } from "react-router-dom";
import { FiltersProvider, useFilters } from "./state/filters";
import TopBar from "./components/TopBar";
import Sidebar from "./components/Sidebar";
import TrackingPage from "./pages/TrackingPage";
import RoadmapPage from "./pages/RoadmapPage";
import { useLocation } from "react-router-dom";

function Layout() {
  const { optionsError } = useFilters();
  const isRoadmap = useLocation().pathname.startsWith("/roadmap");

  return (
    <>
      <TopBar />
      {optionsError ? (
        <div className="state err" style={{ padding: 30 }}>
          Não foi possível conectar à API: {optionsError}
          <br />
          Verifique se o backend está no ar (padrão: http://localhost:8000).
        </div>
      ) : (
        <div className="shell">
          <Sidebar showOnlyDates={isRoadmap} />
          <main className="main">
            <Routes>
              <Route path="/" element={<TrackingPage />} />
              <Route path="/roadmap" element={<RoadmapPage />} />
            </Routes>
          </main>
        </div>
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
