import { Routes, Route, NavLink, useLocation } from "react-router-dom";
import { useStore } from "./store";
import { Home } from "./screens/Home";
import { Drafter } from "./screens/Drafter";
import { FaraidResult } from "./screens/FaraidResult";
import { FamilyTree } from "./screens/FamilyTree";
import { Assets } from "./screens/Assets";
import { Vault } from "./screens/Vault";
import { HibahWaqf } from "./screens/HibahWaqf";
import { ESign } from "./screens/ESign";
import { Education } from "./screens/Education";

const NAV = [
  { to: "/", icon: "🏠", label: "Home" },
  { to: "/assets", icon: "💰", label: "Assets" },
  { to: "/heirs", icon: "👨‍👩‍👧", label: "Heirs" },
  { to: "/vault", icon: "🔗", label: "Vault" },
  { to: "/learn", icon: "📖", label: "Learn" },
];

const HIDE_NAV = ["/draft", "/sign"];

export function App() {
  const { loading, error } = useStore();
  const location = useLocation();
  const showNav = !HIDE_NAV.includes(location.pathname);

  return (
    <div className="stage">
      <aside className="aside">
        <span className="badge">University Prototype</span>
        <h2 style={{ marginTop: 14 }}>WarisanKita</h2>
        <p>
          AI-powered Islamic estate planning — draft a Shariah-compliant wasiyyah, auto-calculate
          Faraid per Qurʾan An-Nisaʾ 11–12, and anchor it on a tamper-evident blockchain vault.
        </p>
        <p style={{ marginTop: 6 }}><b>Try it:</b></p>
        <ul>
          <li>Open <b>Faraid Calc</b> to see exact share maths</li>
          <li>Edit heirs in <b>Family Tree</b> — exclusions auto-detect</li>
          <li>Visit the <b>Vault</b> and run “Simulate tamper”</li>
          <li>Finish at <b>Witness &amp; Sign</b> to register on-chain</li>
        </ul>
        <p className="small muted" style={{ marginTop: 14 }}>
          Government &amp; blockchain integrations are simulated for this prototype. Always verify a
          real distribution with a certified faraidh practitioner.
        </p>
      </aside>

      <div className="phone">
        <div className="notch" />
        <div className="statusbar">
          <span>9:41</span>
          <span>WarisanKita</span>
          <span>📶 🔋</span>
        </div>

        {loading ? (
          <div className="loading">Loading WarisanKita…</div>
        ) : error ? (
          <div className="loading">
            <div className="center pad">
              <p style={{ fontSize: 30 }}>⚠️</p>
              <p>{error}</p>
              <p className="small muted mt8">Is the API running on port 4000?</p>
            </div>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/draft" element={<Drafter />} />
            <Route path="/faraid" element={<FaraidResult />} />
            <Route path="/heirs" element={<FamilyTree />} />
            <Route path="/assets" element={<Assets />} />
            <Route path="/vault" element={<Vault />} />
            <Route path="/hibah-waqf" element={<HibahWaqf />} />
            <Route path="/sign" element={<ESign />} />
            <Route path="/learn" element={<Education />} />
          </Routes>
        )}

        {showNav && !loading && !error && (
          <nav className="bottomnav">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === "/"}
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <span className="dot" />
                <span className="ni">{n.icon}</span>
                {n.label}
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
