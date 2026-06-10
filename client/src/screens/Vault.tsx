import { useEffect, useState } from "react";
import { api } from "../api";
import { AppBar } from "../components/AppBar";
import type { Block, ChainVerification } from "../types";

const TYPE_LABEL: Record<string, string> = {
  WASIYYAH_CREATED: "Wasiyyah created",
  EKYC_VERIFIED: "Identity verified (eKYC)",
  ASSET_ADDED: "Asset added",
  ASSET_REMOVED: "Asset removed",
  HEIRS_UPDATED: "Heirs updated",
  BEQUEST_ADDED: "Bequest added",
  BEQUEST_REMOVED: "Bequest removed",
  HIBAH_ADDED: "Hibah recorded",
  WAQF_ADDED: "Waqf recorded",
  WITNESS_ADDED: "Witness added",
  WASIYYAH_REGISTERED: "Wasiyyah registered ✓",
};

export function Vault() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [verify, setVerify] = useState<ChainVerification | null>(null);
  const [tamper, setTamper] = useState<{ after: ChainVerification; alteredIndex: number } | null>(null);

  async function load() {
    const [b, v] = await Promise.all([api.blocks(), api.verify()]);
    setBlocks(b);
    setVerify(v);
  }
  useEffect(() => {
    load();
  }, []);

  async function runTamper() {
    const oldest = blocks.length ? blocks[blocks.length - 1].index : 0;
    const res = await api.simulateTamper(oldest);
    setTamper({ after: res.after, alteredIndex: res.alteredIndex });
  }

  return (
    <div className="screen">
      <AppBar title="Blockchain Wasiyyah Vault" subtitle="Tamper-evident hash chain" back />
      <div className="pad col gap12">
        {verify && (
          <div className={`verify-banner ${verify.valid ? "verify-ok" : "verify-bad"}`}>
            {verify.valid ? "🛡️" : "❌"} {verify.message} ({verify.length} blocks)
          </div>
        )}

        <div className="card">
          <div className="section-title">Integrity demo</div>
          <p className="small muted" style={{ lineHeight: 1.5 }}>
            Each block commits to the previous block's SHA-256 hash. Altering any past record breaks
            every block after it. Run a simulated attack (on a safe copy) to see detection in action.
          </p>
          <button className="btn btn-outline btn-block mt12" onClick={runTamper}>
            ⚡ Simulate tamper attack
          </button>
          {tamper && (
            <div className={`verify-banner mt12 ${tamper.after.valid ? "verify-ok" : "verify-bad"}`}>
              {tamper.after.valid
                ? "Chain still valid."
                : `❌ Attack detected! ${tamper.after.message} The real ledger was not touched.`}
            </div>
          )}
        </div>

        <div className="section-title" style={{ marginTop: 4 }}>Ledger ({blocks.length} blocks)</div>
        {blocks.map((b, i) => (
          <div key={b.hash}>
            <div className="block">
              <div className="row gap8">
                <span className="bidx">#{b.index}</span>
                <span className="btype">{TYPE_LABEL[b.type] ?? b.type}</span>
                <span className="spacer" />
                <span className="btime">{new Date(b.timestamp).toLocaleString("en-MY")}</span>
              </div>
              {typeof b.data.owner === "string" && (
                <div className="small muted mt8">Owner: {b.data.owner as string}</div>
              )}
              {typeof b.data.signatureHash === "string" && (
                <div className="small muted">e-Signature: {(b.data.signatureHash as string).slice(0, 24)}…</div>
              )}
              <div className="bhash">hash: {b.hash}</div>
            </div>
            {i < blocks.length - 1 && <div className="chain-link">⛓</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
