import { useState } from "react";
import { useStore } from "../store";
import { api, rm } from "../api";
import { AppBar } from "../components/AppBar";

const CATEGORIES = [
  { v: "property", label: "Property", icon: "🏠" },
  { v: "bank", label: "Bank savings", icon: "🏦" },
  { v: "epf", label: "EPF / KWSP", icon: "📊" },
  { v: "business", label: "Business shares", icon: "💼" },
  { v: "vehicle", label: "Vehicle", icon: "🚗" },
  { v: "investment", label: "Investment", icon: "📈" },
  { v: "other", label: "Other", icon: "📦" },
];

const ICONS = Object.fromEntries(CATEGORIES.map((c) => [c.v, c.icon]));

export function Assets() {
  const { wasiyyah, reload } = useStore();
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("property");
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  if (!wasiyyah) return null;

  async function add() {
    const v = parseFloat(value);
    if (!label.trim() || !Number.isFinite(v) || v <= 0) return;
    setBusy(true);
    try {
      await api.addAsset(wasiyyah!.id, { label: label.trim(), category, value: v });
      await reload();
      setLabel("");
      setValue("");
    } finally {
      setBusy(false);
    }
  }

  async function remove(assetId: string) {
    await api.removeAsset(wasiyyah!.id, assetId);
    await reload();
  }

  return (
    <div className="screen">
      <AppBar title="My Assets" subtitle="What forms your estate (tirkah)" back />
      <div className="pad col gap16">
        <div className="estate-card">
          <div className="label">Total Assets</div>
          <div className="amt">{rm(wasiyyah.gross)}</div>
          <div className="small" style={{ opacity: 0.9, marginTop: 4 }}>
            {wasiyyah.assets.length} item{wasiyyah.assets.length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="card">
          <div className="section-title">Add an asset</div>
          <div className="field">
            <label>Description</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Apartment in Setapak" />
          </div>
          <div className="field">
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c.v} value={c.v}>{c.icon} {c.label}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Value (RM)</label>
            <input value={value} onChange={(e) => setValue(e.target.value)} inputMode="numeric" placeholder="250000" />
          </div>
          <button className="btn btn-primary btn-block" onClick={add} disabled={busy}>
            {busy ? "Adding…" : "＋ Add asset"}
          </button>
          <p className="small muted mt8" style={{ lineHeight: 1.45 }}>
            Tip: for jointly-owned assets, enter only your own share.
          </p>
        </div>

        <div className="card">
          <div className="section-title">Asset list</div>
          {wasiyyah.assets.length === 0 ? (
            <p className="muted small">No assets yet.</p>
          ) : (
            wasiyyah.assets.map((a) => (
              <div className="list-item" key={a.id}>
                <div className="li-ico">{ICONS[a.category] ?? "📦"}</div>
                <div>
                  <div className="li-name">{a.label}</div>
                  <div className="li-sub">{CATEGORIES.find((c) => c.v === a.category)?.label}</div>
                </div>
                <div className="li-amt">{rm(a.value)}</div>
                <button className="del" onClick={() => remove(a.id)} aria-label="Remove">🗑</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
