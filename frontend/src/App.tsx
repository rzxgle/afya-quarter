import { Routes, Route } from "react-router-dom";
import { FiltersProvider, useFilters } from "./state/filters";
import TopBar from "./components/TopBar";
import Sidebar from "./components/Sidebar";
import TrackingPage from "./pages/TrackingPage";

function Layout() {
  const { optionsError } = useFilters();

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
          <Sidebar />
          <main className="main">
            <Routes>
              <Route path="/" element={<TrackingPage />} />
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
