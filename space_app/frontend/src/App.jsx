import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import Launches  from "./pages/Launches";
import Satellites from "./pages/Satellites";
import "./index.css";

const PAGES = [
  { id: "dashboard",  label: "Dashboard",  icon: "◈", section: "OVERVIEW" },
  { id: "launches",   label: "Launches",   icon: "🚀", section: "DATA" },
  { id: "satellites", label: "Satellites", icon: "🛰", section: "DATA" },
];

function Toast({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span>{t.type === "success" ? "✓" : "✕"}</span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [page, setPage]     = useState("dashboard");
  const [toasts, setToasts] = useState([]);

  const addToast = (msg, type = "success") => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  };

  const titles = { dashboard: "Dashboard", launches: "Launches", satellites: "Satellites" };

  let sections = [];
  PAGES.forEach(p => {
    if (!sections.includes(p.section)) sections.push(p.section);
  });

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>⬡ SPACE DB</h1>
          <p>Research Dashboard</p>
        </div>
        <nav className="sidebar-nav">
          {sections.map(sec => (
            <div key={sec}>
              <div className="nav-section-label">{sec}</div>
              {PAGES.filter(p => p.section === sec).map(p => (
                <div
                  key={p.id}
                  className={`nav-item ${page === p.id ? "active" : ""}`}
                  onClick={() => setPage(p.id)}
                >
                  <span className="icon">{p.icon}</span>
                  {p.label}
                </div>
              ))}
            </div>
          ))}
        </nav>
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)" }}>
            space_research
          </div>
          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
            MySQL · localhost
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main">
        <div className="topbar">
          <h2>{titles[page]}</h2>
          <span className="tag">LIVE</span>
        </div>
        <div className="content">
          {page === "dashboard"  && <Dashboard toast={addToast} />}
          {page === "launches"   && <Launches  toast={addToast} />}
          {page === "satellites" && <Satellites toast={addToast} />}
        </div>
      </div>

      <Toast toasts={toasts} />
    </div>
  );
}
