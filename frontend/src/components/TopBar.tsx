import { NavLink } from "react-router-dom";
import { useFilters } from "../state/filters";

export default function TopBar() {
  const { doRefresh, refreshing } = useFilters();

  return (
    <header className="topbar">
      <img className="logo" src="/afya-logo.png" alt="Afya" />
      <div className="sep" />
      <div className="title">
        Quarter
        <small>Progresso e roadmap dos épicos</small>
      </div>
      <nav className="nav" style={{ marginLeft: 8 }}>
        <NavLink to="/" end>
          Tracking
        </NavLink>
        <NavLink to="/roadmap">Roadmap</NavLink>
      </nav>
      <div className="spacer" />
      <div className="updated">
        <span className="dot" /> Cache de 5 min
      </div>
      <button
        className={`btn-refresh${refreshing ? " spin" : ""}`}
        onClick={() => void doRefresh()}
        disabled={refreshing}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a9 9 0 1 1-2.64-6.36" />
          <path d="M21 3v6h-6" />
        </svg>
        Atualizar dados
      </button>
    </header>
  );
}
