import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store";
import { api } from "../api";
import { AppBar } from "../components/AppBar";
import type { DraftMessage, DraftTurn } from "../types";

const STEP_KEY = "warisankita.draftStep";

/** Quick replies that open a structured-input screen rather than advancing. */
const NAV_REPLY: Record<string, string> = {
  "Add assets": "/assets",
  "Build family tree": "/heirs",
  "Add a bequest": "/hibah-waqf",
  "Plan hibah / waqf": "/hibah-waqf",
};

export function Drafter() {
  const { wasiyyah, reload } = useStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(() => Number(localStorage.getItem(STEP_KEY)) || 1);
  const [turn, setTurn] = useState<DraftTurn | null>(null);
  const [extra, setExtra] = useState<DraftMessage[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!wasiyyah) return;
    localStorage.setItem(STEP_KEY, String(step));
    setExtra([]);
    api.draft(wasiyyah.id, step).then(setTurn).catch(() => {});
  }, [wasiyyah, step]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turn, extra]);

  if (!wasiyyah) return null;

  function pushUser(text: string) {
    setExtra((e) => [...e, { role: "user", text, kind: "normal" }]);
  }
  function pushAi(text: string, kind: DraftMessage["kind"] = "normal") {
    setExtra((e) => [...e, { role: "ai", text, kind }]);
  }

  async function handleReply(reply: string) {
    pushUser(reply);

    if (reply === "How does this work?") {
      pushAi("I guide you step-by-step: confirm your identity, list assets and heirs, decide any bequests within the 1/3 limit, add two witnesses, then e-sign. Every change is committed to the blockchain vault.");
      return;
    }
    if (reply === "Verify identity") {
      setBusy(true);
      try {
        await api.ekyc(wasiyyah!.id, wasiyyah!.ownerIcMasked ?? "880101-14-5523");
        await reload();
        pushAi("Identity verified via MyDigital ID ✓ (simulated).", "success");
        setTimeout(() => setStep((s) => Math.min(s + 1, 7)), 600);
      } finally {
        setBusy(false);
      }
      return;
    }
    if (NAV_REPLY[reply]) {
      navigate(NAV_REPLY[reply]);
      return;
    }
    if (reply === "Review & sign") {
      navigate("/faraid");
      return;
    }
    // Default: advance to the next step.
    setStep((s) => Math.min(s + 1, 7));
  }

  function send() {
    if (!text.trim()) return;
    pushUser(text.trim());
    setText("");
    pushAi("Noted, baarakallahu feek. Use the suggestions below to continue, or tap an action.");
  }

  function renderMsg(m: DraftMessage, i: number) {
    if (m.kind === "ruling") {
      return (
        <div className="ruling-card" key={i}>
          <div className="tag">📖 Islamic Ruling</div>
          <div style={{ marginTop: 4 }}>{m.text}</div>
          {m.citation && <div className="cite">— {m.citation}</div>}
        </div>
      );
    }
    if (m.kind === "success") return <div className="success-card" key={i}>✅ {m.text}</div>;
    if (m.kind === "warning") return <div className="warn-card" key={i}>⚠️ {m.text}</div>;
    if (m.role === "user")
      return (
        <div className="msg-wrap user" key={i}>
          <div className="bubble user">{m.text}</div>
        </div>
      );
    return (
      <div className="msg-wrap" key={i}>
        <div className="ai-badge">AI</div>
        <div className="bubble ai">
          {m.text}
          {m.citation && <div className="cite" style={{ marginTop: 6, fontSize: 11, color: "#92611a", fontStyle: "italic" }}>— {m.citation}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="screen col" style={{ display: "flex" }}>
      <AppBar
        title="AI Wasiyyah Assistant"
        subtitle={turn ? `Step ${turn.step} of ${turn.totalSteps} · ${turn.stepName}` : "Loading…"}
        back
        progress={turn ? (turn.step / turn.totalSteps) * 100 : 0}
      />

      <div className="chat" ref={scrollRef} style={{ flex: 1, overflowY: "auto" }}>
        {turn?.messages.map(renderMsg)}
        {extra.map(renderMsg)}
      </div>

      {turn && (
        <div className="quickreplies">
          {turn.quickReplies.map((q) => (
            <button key={q} className="chip" disabled={busy} onClick={() => handleReply(q)}>
              {q}
            </button>
          ))}
        </div>
      )}

      <div className="composer">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type your reply…"
        />
        <button className="send" onClick={send} aria-label="Send">➤</button>
      </div>
    </div>
  );
}
