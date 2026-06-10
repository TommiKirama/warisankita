import { useState } from "react";
import { useStore } from "../store";
import { api, rm } from "../api";
import { AppBar } from "../components/AppBar";

type Tab = "bequest" | "hibah" | "waqf";

export function HibahWaqf() {
  const { wasiyyah, reload } = useStore();
  const [tab, setTab] = useState<Tab>("bequest");
  const [busy, setBusy] = useState(false);

  // bequest form
  const [bName, setBName] = useState("");
  const [bAmount, setBAmount] = useState("");
  const [bPurpose, setBPurpose] = useState<"charity" | "non_heir" | "waqf">("charity");
  // hibah form
  const [hRecipient, setHRecipient] = useState("");
  const [hAsset, setHAsset] = useState("");
  const [hValue, setHValue] = useState("");
  // waqf form
  const [wAsset, setWAsset] = useState("");
  const [wValue, setWValue] = useState("");
  const [wCause, setWCause] = useState("");

  if (!wasiyyah) return null;
  const bs = wasiyyah.bequestSummary;

  async function addBequest() {
    const amt = parseFloat(bAmount);
    if (!bName.trim() || !Number.isFinite(amt) || amt <= 0) return;
    setBusy(true);
    try {
      await api.addBequest(wasiyyah!.id, { beneficiary: bName.trim(), amount: amt, purpose: bPurpose });
      await reload();
      setBName(""); setBAmount("");
    } finally { setBusy(false); }
  }
  async function removeBequest(id: string) { await api.removeBequest(wasiyyah!.id, id); await reload(); }

  async function addHibah() {
    const v = parseFloat(hValue);
    if (!hRecipient.trim() || !hAsset.trim() || !Number.isFinite(v)) return;
    setBusy(true);
    try {
      await api.addHibah(wasiyyah!.id, { recipient: hRecipient.trim(), asset: hAsset.trim(), value: v });
      await reload();
      setHRecipient(""); setHAsset(""); setHValue("");
    } finally { setBusy(false); }
  }

  async function addWaqf() {
    const v = parseFloat(wValue);
    if (!wAsset.trim() || !wCause.trim() || !Number.isFinite(v)) return;
    setBusy(true);
    try {
      await api.addWaqf(wasiyyah!.id, { asset: wAsset.trim(), value: v, beneficiaryCause: wCause.trim() });
      await reload();
      setWAsset(""); setWValue(""); setWCause("");
    } finally { setBusy(false); }
  }

  return (
    <div className="screen">
      <AppBar title="Hibah & Waqf Planner" subtitle="Lifetime giving beyond Faraid" back />
      <div className="pad col gap16">
        <div className="row gap8">
          {(["bequest", "hibah", "waqf"] as Tab[]).map((t) => (
            <button
              key={t}
              className={tab === t ? "btn btn-primary" : "btn btn-outline"}
              style={{ flex: 1, padding: "10px 8px", fontSize: 13 }}
              onClick={() => setTab(t)}
            >
              {t === "bequest" ? "Wasiyyah" : t === "hibah" ? "Hibah" : "Waqf"}
            </button>
          ))}
        </div>

        {tab === "bequest" && (
          <>
            <div className="ruling-card">
              <div className="tag">📖 Islamic Ruling</div>
              <div style={{ marginTop: 4 }}>
                A bequest (wasiyyah) to non-heirs/charity may not exceed <b>one-third</b> of the estate,
                and cannot be made to an existing Faraid heir.
              </div>
              <div className="cite">— Sahih al-Bukhari 2742; Sunan Abu Dawud 2870</div>
            </div>

            <div className="card">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="small muted">Bequests used</span>
                <span className="small" style={{ fontWeight: 700 }}>
                  {rm(bs.totalValid)} / {rm(bs.maxAllowed)} (max ⅓)
                </span>
              </div>
              <div className="progressbar mt8" style={{ background: "#e6eaf2" }}>
                <i style={{ width: `${bs.maxAllowed > 0 ? Math.min(100, (bs.totalValid / bs.maxAllowed) * 100) : 0}%`, background: bs.exceedsOneThird ? "var(--red)" : "var(--green)" }} />
              </div>
              {bs.exceedsOneThird && (
                <div className="warn-card mt8">
                  ⚠️ Requested bequests ({rm(bs.totalRequested)}) exceed one-third. The excess is invalid
                  unless all adult heirs consent after death.
                </div>
              )}
            </div>

            <div className="card">
              <div className="section-title">Add a bequest</div>
              <div className="field"><label>Beneficiary</label>
                <input value={bName} onChange={(e) => setBName(e.target.value)} placeholder="e.g. Yayasan Anak Yatim" />
              </div>
              <div className="field"><label>Amount (RM)</label>
                <input value={bAmount} onChange={(e) => setBAmount(e.target.value)} inputMode="numeric" placeholder="10000" />
              </div>
              <div className="field"><label>Purpose</label>
                <select value={bPurpose} onChange={(e) => setBPurpose(e.target.value as any)}>
                  <option value="charity">Charity / sadaqah</option>
                  <option value="non_heir">Non-heir relative</option>
                  <option value="waqf">Waqf endowment</option>
                </select>
              </div>
              <button className="btn btn-primary btn-block" onClick={addBequest} disabled={busy}>＋ Add bequest</button>
            </div>

            <div className="card">
              <div className="section-title">Bequests</div>
              {wasiyyah.bequests.length === 0 ? <p className="muted small">None yet.</p> :
                wasiyyah.bequests.map((b) => (
                  <div className="list-item" key={b.id}>
                    <div className="li-ico">🤲</div>
                    <div>
                      <div className="li-name">{b.beneficiary}</div>
                      <div className="li-sub">{b.purpose.replace("_", " ")}</div>
                    </div>
                    <div className="li-amt">{b.amount ? rm(b.amount) : `${b.percentage}%`}</div>
                    <button className="del" onClick={() => removeBequest(b.id)}>🗑</button>
                  </div>
                ))}
            </div>
          </>
        )}

        {tab === "hibah" && (
          <>
            <div className="ruling-card">
              <div className="tag">📖 What is Hibah?</div>
              <div style={{ marginTop: 4 }}>A completed gift during your lifetime. Once validly transferred and possessed, it is outside the estate and not subject to Faraid.</div>
            </div>
            <div className="card">
              <div className="section-title">Record a hibah gift</div>
              <div className="field"><label>Recipient</label>
                <input value={hRecipient} onChange={(e) => setHRecipient(e.target.value)} placeholder="e.g. My daughter Aisha" /></div>
              <div className="field"><label>Asset</label>
                <input value={hAsset} onChange={(e) => setHAsset(e.target.value)} placeholder="e.g. Apartment unit B-12" /></div>
              <div className="field"><label>Value (RM)</label>
                <input value={hValue} onChange={(e) => setHValue(e.target.value)} inputMode="numeric" placeholder="300000" /></div>
              <button className="btn btn-primary btn-block" onClick={addHibah} disabled={busy}>＋ Record hibah</button>
            </div>
            <div className="card">
              <div className="section-title">Hibah gifts</div>
              {wasiyyah.hibah.length === 0 ? <p className="muted small">None yet.</p> :
                wasiyyah.hibah.map((g) => (
                  <div className="list-item" key={g.id}>
                    <div className="li-ico">🎁</div>
                    <div><div className="li-name">{g.recipient}</div><div className="li-sub">{g.asset}</div></div>
                    <div className="li-amt">{rm(g.value)}</div>
                  </div>
                ))}
            </div>
          </>
        )}

        {tab === "waqf" && (
          <>
            <div className="ruling-card">
              <div className="tag">📖 What is Waqf?</div>
              <div style={{ marginTop: 4 }}>An endowment whose benefit flows perpetually to a cause — sadaqah jariyah that keeps earning reward after death.</div>
              <div className="cite">— Sahih Muslim 1631</div>
            </div>
            <div className="card">
              <div className="section-title">Create a waqf</div>
              <div className="field"><label>Asset</label>
                <input value={wAsset} onChange={(e) => setWAsset(e.target.value)} placeholder="e.g. Shoplot rental income" /></div>
              <div className="field"><label>Value (RM)</label>
                <input value={wValue} onChange={(e) => setWValue(e.target.value)} inputMode="numeric" placeholder="200000" /></div>
              <div className="field"><label>Beneficiary cause</label>
                <input value={wCause} onChange={(e) => setWCause(e.target.value)} placeholder="e.g. Masjid maintenance / tahfiz school" /></div>
              <button className="btn btn-primary btn-block" onClick={addWaqf} disabled={busy}>＋ Create waqf</button>
            </div>
            <div className="card">
              <div className="section-title">Waqf endowments</div>
              {wasiyyah.waqf.length === 0 ? <p className="muted small">None yet.</p> :
                wasiyyah.waqf.map((e) => (
                  <div className="list-item" key={e.id}>
                    <div className="li-ico">🕌</div>
                    <div><div className="li-name">{e.beneficiaryCause}</div><div className="li-sub">{e.asset}</div></div>
                    <div className="li-amt">{rm(e.value)}</div>
                  </div>
                ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
