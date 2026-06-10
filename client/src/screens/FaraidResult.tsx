import { useNavigate } from "react-router-dom";
import { useStore } from "../store";
import { rm } from "../api";
import { AppBar } from "../components/AppBar";
import { Donut, PALETTE } from "../components/Donut";

export function FaraidResult() {
  const { wasiyyah } = useStore();
  const navigate = useNavigate();
  if (!wasiyyah) return null;

  const faraid = wasiyyah.faraid;
  const inheriting = faraid.heirs.filter((h) => h.shareType !== "excluded");
  const excluded = faraid.heirs.filter((h) => h.shareType === "excluded");

  const segments = inheriting.map((h, i) => ({
    label: h.label,
    value: h.amount,
    color: PALETTE[i % PALETTE.length],
  }));

  return (
    <div className="screen">
      <AppBar title="Faraid Distribution" subtitle="Based on Qurʾan An-Nisaʾ 11–12, 176" back />

      <div className="pad col gap16">
        <div className="estate-card">
          <div className="label">Net Estate (after 1/3 wasiyyah)</div>
          <div className="amt">{rm(faraid.estate)}</div>
          <div className="small" style={{ opacity: 0.9, marginTop: 4 }}>
            Gross {rm(wasiyyah.gross)} − bequests {rm(wasiyyah.bequestSummary.totalValid)}
          </div>
        </div>

        {faraid.heirs.length === 0 ? (
          <div className="card center">
            <p className="muted">No heirs added yet.</p>
            <button className="btn btn-ghost mt12" onClick={() => navigate("/heirs")}>
              Add heirs in Family Tree
            </button>
          </div>
        ) : (
          <>
            <div className="card">
              <Donut
                segments={segments}
                centerTop={`${inheriting.length}`}
                centerBottom={inheriting.length === 1 ? "heir" : "heirs"}
              />

              {(faraid.aulApplied || faraid.raddApplied) && (
                <div className="note mt8">
                  {faraid.aulApplied && "ʿAul applied — fixed shares exceeded the estate and were scaled proportionally. "}
                  {faraid.raddApplied && "Radd applied — surplus returned to fixed-share heirs."}
                </div>
              )}

              <div className="mt12">
                {inheriting.map((h, i) => (
                  <div className="heir-row" key={h.heir}>
                    <span className="swatch" style={{ background: PALETTE[i % PALETTE.length] }} />
                    <div>
                      <div className="name">
                        {h.label}
                        {h.count > 1 ? ` ×${h.count}` : ""}
                      </div>
                      <div className="meta">
                        {h.shareLabel} · {((h.share.value) * 100).toFixed(1)}%
                        {h.count > 1 ? ` · ${rm(h.amountPerHead)} each` : ""}
                      </div>
                    </div>
                    <div className="amt">{rm(h.amount)}</div>
                  </div>
                ))}
              </div>
            </div>

            {excluded.length > 0 && (
              <div className="card">
                <div className="section-title">Excluded (Mahjūb)</div>
                {excluded.map((h) => (
                  <div className="heir-row excluded" key={h.heir}>
                    <div>
                      <div className="name">
                        {h.label}
                        {h.count > 1 ? ` ×${h.count}` : ""}
                      </div>
                      <div className="reason">{h.reason}</div>
                    </div>
                    <span className="tag-excluded">excluded</span>
                  </div>
                ))}
              </div>
            )}

            <div className="card">
              <div className="section-title">Why these shares?</div>
              {inheriting.map((h) => (
                <div key={h.heir} className="mt8">
                  <b className="small">{h.label}</b>
                  <div className="reason">{h.reason}</div>
                </div>
              ))}
            </div>
          </>
        )}

        <button
          className="btn btn-accent btn-block"
          onClick={() => navigate("/sign")}
          disabled={faraid.heirs.length === 0}
        >
          {wasiyyah.status === "registered" ? "🔗 View on Blockchain" : "Confirm & Save to Blockchain"}
        </button>

        <p className="small muted center" style={{ lineHeight: 1.5 }}>
          This is a computed estimate. Verify any real distribution with a certified faraidh practitioner.
        </p>
      </div>
    </div>
  );
}
