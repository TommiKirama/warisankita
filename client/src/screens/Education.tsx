import { useEffect, useState } from "react";
import { api } from "../api";
import { AppBar } from "../components/AppBar";
import type { FaqEntry, Lesson } from "../types";

const CAT_LABEL: Record<string, string> = {
  process: "Process", wasiyyah: "Wasiyyah", faraid: "Faraid", hibah: "Hibah", waqf: "Waqf",
};

export function Education() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [faq, setFaq] = useState<FaqEntry[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [tab, setTab] = useState<"lessons" | "faq">("lessons");

  useEffect(() => {
    api.lessons().then(setLessons).catch(() => {});
    api.faq().then(setFaq).catch(() => {});
  }, []);

  return (
    <div className="screen">
      <AppBar title="Faraid Education Hub" subtitle="Bite-sized lessons & verified Q&A" />
      <div className="pad col gap16">
        <div className="row gap8">
          <button className={tab === "lessons" ? "btn btn-primary" : "btn btn-outline"} style={{ flex: 1 }} onClick={() => setTab("lessons")}>Lessons</button>
          <button className={tab === "faq" ? "btn btn-primary" : "btn btn-outline"} style={{ flex: 1 }} onClick={() => setTab("faq")}>Ask Ustaz</button>
        </div>

        {tab === "lessons" && lessons.map((l) => (
          <div className="lesson" key={l.id} onClick={() => setOpen(open === l.id ? null : l.id)}>
            <div className="lcat">{CAT_LABEL[l.category] ?? l.category}</div>
            <div className="lt">{l.title}</div>
            <div className="ls">{l.summary}</div>
            <div className="lmeta">⏱ {l.durationMin} min read · {l.titleMs}</div>
            {open === l.id && (
              <div className="mt12" onClick={(e) => e.stopPropagation()}>
                {l.body.map((p, i) => (
                  <p key={i} className="small" style={{ lineHeight: 1.55, marginBottom: 8 }}>{p}</p>
                ))}
                <div className="mt8">
                  {l.citations.map((c, i) => (
                    <span className="cite-pill" key={i}>{c.reference}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {tab === "faq" && faq.map((f) => (
          <div className="lesson" key={f.id} onClick={() => setOpen(open === f.id ? null : f.id)}>
            <div className="lt">❓ {f.question}</div>
            {open === f.id && (
              <div className="mt8" onClick={(e) => e.stopPropagation()}>
                <p className="small" style={{ lineHeight: 1.55 }}>{f.answer}</p>
                <div className="mt8">
                  {f.citations.map((c, i) => (
                    <span className="cite-pill" key={i}>{c.reference}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        <p className="small muted center" style={{ lineHeight: 1.5 }}>
          Educational content. For binding rulings, consult JAKIM e-Fatwa or a qualified mufti.
        </p>
      </div>
    </div>
  );
}
