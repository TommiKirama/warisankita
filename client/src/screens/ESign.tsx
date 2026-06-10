import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store";
import { api } from "../api";
import { AppBar } from "../components/AppBar";

export function ESign() {
  const { wasiyyah, reload } = useStore();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [ic, setIc] = useState("");
  const [busy, setBusy] = useState(false);
  const [signed, setSigned] = useState<{ hash: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (!wasiyyah) return null;

  const checks = [
    { label: "Identity verified (eKYC)", ok: wasiyyah.ekycVerified },
    { label: "Two witnesses added", ok: wasiyyah.witnesses.length >= 2 },
    { label: "Bequests within 1/3", ok: !wasiyyah.bequestSummary.exceedsOneThird },
    { label: "Heirs added", ok: Object.values(wasiyyah.heirs).some((n) => (n ?? 0) > 0) },
  ];
  const canSign = checks.every((c) => c.ok) && wasiyyah.status !== "registered";

  async function addWitness() {
    if (!name.trim() || ic.replace(/\D/g, "").length < 6) return;
    setBusy(true);
    try {
      await api.addWitness(wasiyyah!.id, { name: name.trim(), ic: ic.trim() });
      await reload();
      setName(""); setIc("");
    } finally { setBusy(false); }
  }

  async function sign() {
    setBusy(true);
    setErr(null);
    try {
      const res = await api.sign(wasiyyah!.id);
      setSigned({ hash: res.blockHash });
      await reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Sign failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="screen">
      <AppBar title="Witness & e-Sign" subtitle="MyDigital ID PKI signature" back />
      <div className="pad col gap16">
        {wasiyyah.status === "registered" || signed ? (
          <div className="card center">
            <div style={{ fontSize: 46 }}>✅</div>
            <h2 style={{ color: "var(--green)", marginTop: 6 }}>Wasiyyah Registered</h2>
            <p className="small muted mt8" style={{ lineHeight: 1.5 }}>
              Your wasiyyah is e-signed and anchored on the blockchain vault. Co-governed (in the full
              system) by JAKIM, Amanah Raya and the Mahkamah Syariah.
            </p>
            {wasiyyah.signature && (
              <div className="bhash" style={{ marginTop: 12, textAlign: "left" }}>
                Signature: {wasiyyah.signature.signatureHash}
              </div>
            )}
            <button className="btn btn-primary btn-block mt16" onClick={() => navigate("/vault")}>
              🔗 View in Blockchain Vault
            </button>
            <button className="btn btn-ghost btn-block mt8" onClick={() => navigate("/")}>
              Back to Home
            </button>
          </div>
        ) : (
          <>
            <div className="card">
              <div className="section-title">Pre-sign checklist</div>
              {checks.map((c) => (
                <div className="row gap8" key={c.label} style={{ padding: "7px 0" }}>
                  <span style={{ fontSize: 16 }}>{c.ok ? "✅" : "⬜"}</span>
                  <span className="small" style={{ color: c.ok ? "var(--ink)" : "var(--muted)" }}>{c.label}</span>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="section-title">Witnesses ({wasiyyah.witnesses.length}/2)</div>
              {wasiyyah.witnesses.map((w) => (
                <div className="list-item" key={w.id}>
                  <div className="li-ico">🧑‍⚖️</div>
                  <div><div className="li-name">{w.name}</div><div className="li-sub">{w.ic} · MyDigital ID ✓</div></div>
                </div>
              ))}
              {wasiyyah.witnesses.length < 2 && (
                <>
                  <div className="field mt12"><label>Witness name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" /></div>
                  <div className="field"><label>IC number</label>
                    <input value={ic} onChange={(e) => setIc(e.target.value)} placeholder="880101-14-5523" /></div>
                  <button className="btn btn-outline btn-block" onClick={addWitness} disabled={busy}>
                    ＋ Add &amp; verify witness (MyDigital ID)
                  </button>
                </>
              )}
            </div>

            {err && <div className="warn-card">⚠️ {err}</div>}

            <button className="btn btn-accent btn-block" onClick={sign} disabled={!canSign || busy}>
              {busy ? "Signing…" : "✍️ e-Sign & register on blockchain"}
            </button>
            {!canSign && (
              <p className="small muted center">Complete the checklist above to enable signing.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
