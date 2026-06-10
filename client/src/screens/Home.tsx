import { useNavigate } from "react-router-dom";
import { useStore } from "../store";
import { rm } from "../api";
import { AppBar } from "../components/AppBar";

const ACTIONS = [
  { to: "/draft", icon: "💬", cls: "blue", t: "Draft Wasiyyah", d: "AI-guided drafting" },
  { to: "/faraid", icon: "🧮", cls: "orange", t: "Faraid Calc", d: "Auto-distribute" },
  { to: "/heirs", icon: "👨‍👩‍👧", cls: "green", t: "Family Tree", d: "Manage heirs" },
  { to: "/hibah-waqf", icon: "🎁", cls: "purple", t: "Hibah & Waqf", d: "Lifetime giving" },
  { to: "/vault", icon: "🔗", cls: "blue", t: "Blockchain Vault", d: "Tamper-proof" },
  { to: "/learn", icon: "📖", cls: "orange", t: "Ask Ustaz", d: "Fatwa & lessons" },
];

export function Home() {
  const { wasiyyah } = useStore();
  const navigate = useNavigate();
  if (!wasiyyah) return null;

  const heirCount = Object.values(wasiyyah.heirs).reduce((s, n) => s + (n ?? 0), 0);
  const firstName = wasiyyah.ownerName.split(" ")[0];

  return (
    <div className="screen">
      <AppBar title="WarisanKita" subtitle="Smart Islamic Estate Planning" bell />

      <div className="pad col gap16">
        <div>
          <div className="greeting">
            Assalamualaikum,
            <b>{wasiyyah.ownerName}</b>
          </div>
        </div>

        <div className="status-card">
          <div className="label">Wasiyyah Status</div>
          <div className="row" style={{ alignItems: "flex-end", gap: 10 }}>
            <div className="pct">
              {wasiyyah.progress.percent}<small>%</small>
            </div>
            <div className="small" style={{ paddingBottom: 8, opacity: 0.9 }}>
              {wasiyyah.progress.remaining.length === 0
                ? "Complete ✓"
                : `${wasiyyah.progress.remaining.length} step${wasiyyah.progress.remaining.length > 1 ? "s" : ""} remaining`}
            </div>
          </div>
          <div className="progressbar mt8">
            <i style={{ width: `${wasiyyah.progress.percent}%` }} />
          </div>
          <div className="small mt8" style={{ opacity: 0.85 }}>
            {wasiyyah.status === "registered" ? "Registered on blockchain" : `Next: ${wasiyyah.progress.remaining[0] ?? "—"}`}
          </div>
        </div>

        <div className="stat-row">
          <div className="stat">
            <div className="k">Assets</div>
            <div className="v">{rm(wasiyyah.gross)}</div>
            <div className="x">{wasiyyah.assets.length} items</div>
          </div>
          <div className="stat">
            <div className="k">Heirs</div>
            <div className="v">{heirCount}</div>
            <div className="x">auto-detected</div>
          </div>
          <div className="stat">
            <div className="k">Witnesses</div>
            <div className="v">{wasiyyah.witnesses.length}/2</div>
            <div className="x">{wasiyyah.witnesses.length >= 2 ? "verified" : "pending"}</div>
          </div>
        </div>

        <div>
          <div className="section-title">Quick Actions</div>
          <div className="actions-grid">
            {ACTIONS.map((a) => (
              <button key={a.to} className="action" onClick={() => navigate(a.to)}>
                <div className={`ico ${a.cls}`}>{a.icon}</div>
                <div className="t">{a.t}</div>
                <div className="d">{a.d}</div>
              </button>
            ))}
          </div>
        </div>

        <button className="btn btn-accent btn-block" onClick={() => navigate("/draft")}>
          {wasiyyah.status === "registered" ? "Review wasiyyah" : "Continue drafting →"}
        </button>

        <p className="small muted center" style={{ lineHeight: 1.5 }}>
          Maqasid al-Shariah: protecting wealth (Māl), lineage (Nasl) &amp; preventing family fitnah.
        </p>
      </div>
    </div>
  );
}
