import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store";
import { api } from "../api";
import { AppBar } from "../components/AppBar";
import type { HeirCounts, HeirKey, HeirMeta } from "../types";

const CATEGORY_LABEL: Record<string, string> = {
  spouse: "Spouse",
  ascendant: "Parents & Grandparents",
  descendant: "Children & Grandchildren",
  sibling: "Siblings",
};

export function FamilyTree() {
  const { wasiyyah, reload } = useStore();
  const navigate = useNavigate();
  const [meta, setMeta] = useState<HeirMeta[]>([]);
  const [counts, setCounts] = useState<HeirCounts>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.heirMeta().then(setMeta).catch(() => {});
  }, []);
  useEffect(() => {
    if (wasiyyah) setCounts({ ...wasiyyah.heirs });
  }, [wasiyyah]);

  if (!wasiyyah) return null;

  function bump(key: HeirKey, delta: number, max: number) {
    setCounts((c) => {
      const next = Math.max(0, Math.min(max, (c[key] ?? 0) + delta));
      return { ...c, [key]: next };
    });
  }

  async function save() {
    setSaving(true);
    try {
      await api.setHeirs(wasiyyah!.id, counts);
      await reload();
      navigate("/faraid");
    } finally {
      setSaving(false);
    }
  }

  const grouped = ["spouse", "ascendant", "descendant", "sibling"].map((cat) => ({
    cat,
    items: meta.filter((m) => m.category === cat),
  }));

  const total = Object.values(counts).reduce((s, n) => s + (n ?? 0), 0);

  return (
    <div className="screen">
      <AppBar title="Family Tree Builder" subtitle="Add living heirs — exclusions auto-detect" back />
      <div className="pad col gap16">
        <div className="note">
          Add only <b>living</b> heirs. The engine applies Quranic shares and exclusion (ḥajb)
          automatically — e.g. a son screens the grandfather's residue and excludes brothers.
        </div>

        {grouped.map((g) => (
          <div className="card" key={g.cat}>
            <div className="section-title">{CATEGORY_LABEL[g.cat]}</div>
            {g.items.map((m) => {
              const max = m.multiple ? 20 : 1;
              const val = counts[m.key] ?? 0;
              return (
                <div className="counter-row" key={m.key}>
                  <div className="cinfo">
                    <div className="cname">
                      {m.label} <span className="muted" style={{ fontWeight: 400 }}>· {m.arabic}</span>
                    </div>
                    <div className="car">{m.labelMs}</div>
                  </div>
                  <div className="stepper">
                    <button onClick={() => bump(m.key, -1, max)} disabled={val === 0}>−</button>
                    <span className="n">{val}</span>
                    <button onClick={() => bump(m.key, 1, max)} disabled={val >= max}>+</button>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        <button className="btn btn-primary btn-block" onClick={save} disabled={saving || total === 0}>
          {saving ? "Saving…" : "Save & view Faraid distribution →"}
        </button>
      </div>
    </div>
  );
}
