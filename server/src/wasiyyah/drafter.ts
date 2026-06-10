import { KEY_CITATIONS } from "../data/fiqh.js";
import type { Wasiyyah } from "./types.js";

/**
 * Scripted Wasiyyah Drafter.
 *
 * A deterministic, fiqh-grounded conversational flow that walks the user
 * through the seven steps of drafting a wasiyyah. It mirrors the proposal's
 * Llama-3 + RAG assistant but runs fully offline with every ruling tied to a
 * citation in the fiqh corpus — so a demo never depends on a model or network.
 */

export interface DraftMessage {
  role: "ai" | "user";
  text: string;
  kind: "normal" | "ruling" | "success" | "warning";
  citation?: string;
}

export interface DraftTurn {
  step: number;
  totalSteps: number;
  stepName: string;
  messages: DraftMessage[];
  quickReplies: string[];
  /** Screen the UI should surface for structured input at this step, if any. */
  collect: "none" | "assets" | "heirs" | "bequests" | "hibah_waqf" | "witnesses" | "review";
  done: boolean;
}

export const TOTAL_STEPS = 7;

const STEP_NAMES = [
  "Welcome",
  "Identity (eKYC)",
  "Assets",
  "Heirs",
  "Bequests (Wasiyyah)",
  "Hibah & Waqf",
  "Witness & Sign",
];

function ai(text: string, kind: DraftMessage["kind"] = "normal", citation?: string): DraftMessage {
  return { role: "ai", text, kind, citation };
}

/** Produce the assistant turn for a given step (1-indexed) of a wasiyyah. */
export function draftTurn(w: Wasiyyah, step: number): DraftTurn {
  const s = Math.min(Math.max(step, 1), TOTAL_STEPS);
  const name = STEP_NAMES[s - 1];
  let messages: DraftMessage[] = [];
  let quickReplies: string[] = [];
  let collect: DraftTurn["collect"] = "none";

  switch (s) {
    case 1:
      messages = [
        ai(`Assalamualaikum, ${w.ownerName.split(" ")[0] || "sahabat"}! I'll help you draft a Shariah-compliant wasiyyah, in shaa Allah.`),
        ai("This takes about 7 short steps and around 15 minutes. You can pause and resume anytime — every change is saved to the blockchain vault."),
      ];
      quickReplies = ["Let's begin", "How does this work?"];
      break;

    case 2:
      messages = [
        ai("First, let's confirm your identity so the wasiyyah is legally recognised."),
        w.ekycVerified
          ? ai(`Verified ✓ — ${w.ownerName}${w.ownerIcMasked ? `, ${w.ownerIcMasked}` : ""}.`, "success")
          : ai("Please verify with MyDigital ID (simulated in this prototype). Tap 'Verify identity' to continue.", "warning"),
      ];
      quickReplies = w.ekycVerified ? ["Continue"] : ["Verify identity"];
      break;

    case 3:
      messages = [
        ai("Now let's list what you own — properties, bank savings, EPF, business shares, vehicles."),
        ai("Tip: for jointly-owned assets, enter only your own share. The estate is settled in order: funeral → debts → bequests (max 1/3) → Faraid."),
      ];
      quickReplies = ["Add assets", "I've added my assets"];
      collect = "assets";
      break;

    case 4:
      messages = [
        ai("Who are your living heirs? Add your spouse, parents, children and siblings."),
        ai("I'll automatically detect who inherits and who is excluded (mahjub), so you don't need to know the rules yourself.", "normal", KEY_CITATIONS.childrenShares.reference),
      ];
      quickReplies = ["Build family tree", "Done adding heirs"];
      collect = "heirs";
      break;

    case 5:
      messages = [
        ai("Do you wish to leave any bequest (wasiyyah) to someone who is NOT a Faraid heir, or to charity?"),
        ai("Islamic ruling: a wasiyyah may not exceed one-third of your estate, and cannot be made to an existing heir.", "ruling", `${KEY_CITATIONS.oneThird.reference}; ${KEY_CITATIONS.noHeirBequest.reference}`),
        ai("Examples: an adopted child, a non-Muslim relative, a grandchild whose parent is alive, or a charity like Yayasan Anak Yatim."),
      ];
      quickReplies = ["Add a bequest", "No bequests, continue"];
      collect = "bequests";
      break;

    case 6:
      messages = [
        ai("You can also plan lifetime gifts (hibah) and endowments (waqf). These are powerful tools beyond Faraid."),
        ai("Hibah is a completed gift during your life; waqf dedicates an asset so its benefit flows perpetually as sadaqah jariyah."),
      ];
      quickReplies = ["Plan hibah / waqf", "Skip this step"];
      collect = "hibah_waqf";
      break;

    case 7:
      messages = [
        ai("Almost done. A valid wasiyyah needs two adult Muslim witnesses, then your e-signature."),
        ai("Review your Faraid distribution on the next screen, add witnesses, then sign with MyDigital ID to register on the blockchain.", "normal"),
      ];
      quickReplies = ["Review & sign"];
      collect = "review";
      break;
  }

  return {
    step: s,
    totalSteps: TOTAL_STEPS,
    stepName: name,
    messages,
    quickReplies,
    collect,
    done: s === TOTAL_STEPS,
  };
}

/** Friendly confirmation message after a bequest is recorded. */
export function bequestRecordedMessage(beneficiary: string, percentOfEstate: number): DraftMessage {
  return ai(
    `Recorded ✓ — bequest to ${beneficiary} (${percentOfEstate.toFixed(2)}% of estate).`,
    "success",
  );
}
