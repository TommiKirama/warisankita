import { Fraction, lcmAll } from "./fraction.js";
import { HEIR_META } from "./labels.js";
import type {
  FaraidInput,
  FaraidResult,
  HeirCounts,
  HeirKey,
  HeirResult,
  ShareType,
} from "./types.js";

/**
 * Rule-based Faraid (Islamic inheritance) calculator.
 *
 * Encodes the fixed Quranic shares (An-Nisaʾ 11–12, 176), residuary (ʿasabah)
 * distribution "to the male a share equal to two females", exclusion (ḥajb),
 * ʿaul (proportional reduction when shares exceed the estate) and radd
 * (return of surplus to fixed-share heirs).
 *
 * Madhhab note: shares follow the position common to the Sunni schools with a
 * Shafiʿi default. The grandfather-with-siblings (jadd wa ikhwah) case is
 * handled by treating the grandfather like the father (he screens siblings);
 * a note is emitted so that a qualified scholar can review the muqasama view.
 * For any real distribution, validate with a certified faraidh practitioner.
 */

interface Working {
  shareType: ShareType;
  share: Fraction; // group share (all individuals of this heir combined)
  reason: string;
}

const ONE = new Fraction(1);
const F = (n: number, d = 1) => new Fraction(n, d);

function c(h: HeirCounts, k: HeirKey): number {
  return Math.max(0, Math.floor(h[k] ?? 0));
}

export function calculateFaraid(input: FaraidInput): FaraidResult {
  const h = input.heirs;
  const estate = Math.max(0, input.estate);
  const notes: string[] = [];
  const results = new Map<HeirKey, Working>();
  const present = (Object.keys(HEIR_META) as HeirKey[]).filter((k) => c(h, k) > 0);

  if (present.length === 0) {
    return formatResult(estate, results, h, false, false, notes);
  }

  // ---- Counts -------------------------------------------------------------
  const sons = c(h, "son");
  const daughters = c(h, "daughter");
  const grandsons = c(h, "grandson");
  const granddaughters = c(h, "granddaughter");
  const father = c(h, "father") > 0;
  const mother = c(h, "mother") > 0;
  const pgf = c(h, "paternal_grandfather") > 0;
  const husband = c(h, "husband") > 0;
  const wives = c(h, "wife");

  const fullBrothers = c(h, "full_brother");
  const fullSisters = c(h, "full_sister");
  const patBrothers = c(h, "paternal_brother");
  const patSisters = c(h, "paternal_sister");
  const matBrothers = c(h, "maternal_brother");
  const matSisters = c(h, "maternal_sister");

  const hasSon = sons > 0;
  const hasGrandson = grandsons > 0;
  const maleDescendant = hasSon || hasGrandson;
  const anyDescendant = hasSon || daughters > 0 || hasGrandson || granddaughters > 0;
  // The grandfather inherits and screens like the father when the father is absent.
  const rootMaleAscendant = father || pgf;
  const siblingTotal =
    fullBrothers + fullSisters + patBrothers + patSisters + matBrothers + matSisters;

  // ---- Special case: al-Gharrawayn / al-ʿUmariyyatan ----------------------
  // Only heirs are a spouse + both parents: mother takes 1/3 of the *remainder*
  // after the spouse, not 1/3 of the whole estate.
  const otherThanSpouseAndParents = present.filter(
    (k) => !["husband", "wife", "father", "mother"].includes(k),
  ).length;
  if (father && mother && (husband || wives > 0) && otherThanSpouseAndParents === 0) {
    const spouseShare = husband ? F(1, 2) : F(1, 4).scale(1); // wife group still 1/4 total
    const wifeShare = F(1, 4);
    if (husband) {
      results.set("husband", { shareType: "fard", share: F(1, 2), reason: cite("husband-1/2") });
      const remainder = ONE.sub(F(1, 2));
      const motherShare = remainder.scale(1).mul(F(1, 3));
      results.set("mother", {
        shareType: "fard",
        share: motherShare,
        reason: "al-ʿUmariyyatan — mother takes 1/3 of the remainder after the husband (1/3 × 1/2 = 1/6). Ruling of ʿUmar ibn al-Khattab (raḍiyallāhu ʿanhu).",
      });
      results.set("father", {
        shareType: "asabah",
        share: remainder.sub(motherShare),
        reason: "Father takes the residue after the husband and mother (al-ʿUmariyyatan).",
      });
    } else {
      results.set("wife", { shareType: "fard", share: wifeShare, reason: cite("wife-1/4") });
      const remainder = ONE.sub(wifeShare);
      const motherShare = remainder.mul(F(1, 3));
      results.set("mother", {
        shareType: "fard",
        share: motherShare,
        reason: "al-ʿUmariyyatan — mother takes 1/3 of the remainder after the wife (1/3 × 3/4 = 1/4). Ruling of ʿUmar ibn al-Khattab (raḍiyallāhu ʿanhu).",
      });
      results.set("father", {
        shareType: "asabah",
        share: remainder.sub(motherShare),
        reason: "Father takes the residue after the wife and mother (al-ʿUmariyyatan).",
      });
    }
    notes.push(
      "Special case applied: al-Gharrawayn / al-ʿUmariyyatan (spouse + both parents).",
    );
    void spouseShare;
    return formatResult(estate, results, h, false, false, notes);
  }

  // ---- Spouses ------------------------------------------------------------
  if (husband) {
    results.set("husband", {
      shareType: "fard",
      share: anyDescendant ? F(1, 4) : F(1, 2),
      reason: cite(anyDescendant ? "husband-1/4" : "husband-1/2"),
    });
  }
  if (wives > 0) {
    results.set("wife", {
      shareType: "fard",
      share: anyDescendant ? F(1, 8) : F(1, 4),
      reason: cite(anyDescendant ? "wife-1/8" : "wife-1/4"),
    });
  }

  // ---- Mother & grandmothers ---------------------------------------------
  if (mother) {
    const reducedToSixth = anyDescendant || siblingTotal >= 2;
    results.set("mother", {
      shareType: "fard",
      share: reducedToSixth ? F(1, 6) : F(1, 3),
      reason: cite(reducedToSixth ? "mother-1/6" : "mother-1/3"),
    });
  } else {
    // Grandmothers inherit 1/6 (shared) only when the mother is absent.
    const grandmothers: HeirKey[] = [];
    if (c(h, "maternal_grandmother") > 0) grandmothers.push("maternal_grandmother");
    // Paternal grandmother is additionally screened by the father.
    if (c(h, "paternal_grandmother") > 0 && !father) grandmothers.push("paternal_grandmother");
    if (grandmothers.length > 0) {
      const heads = grandmothers.reduce((s, k) => s + c(h, k), 0);
      for (const k of grandmothers) {
        results.set(k, {
          shareType: "fard",
          share: F(1, 6).scale(c(h, k)).div(F(heads)),
          reason: cite("grandmother-1/6"),
        });
      }
    }
  }

  // ---- Father (fixed portion) --------------------------------------------
  // With any descendant the father is guaranteed 1/6; residue handled below.
  if (father && anyDescendant) {
    results.set("father", { shareType: "fard", share: F(1, 6), reason: cite("father-1/6") });
  }
  if (!father && pgf && anyDescendant) {
    results.set("paternal_grandfather", {
      shareType: "fard",
      share: F(1, 6),
      reason: cite("grandfather-1/6"),
    });
  }

  // ---- Daughters & granddaughters ----------------------------------------
  if (daughters > 0 && !hasSon) {
    results.set("daughter", {
      shareType: "fard",
      share: daughters === 1 ? F(1, 2) : F(2, 3),
      reason: cite(daughters === 1 ? "daughter-1/2" : "daughter-2/3"),
    });
  }

  // Granddaughters (son's daughters)
  if (granddaughters > 0 && !hasSon && !hasGrandson) {
    if (daughters === 0) {
      results.set("granddaughter", {
        shareType: "fard",
        share: granddaughters === 1 ? F(1, 2) : F(2, 3),
        reason: cite(granddaughters === 1 ? "granddaughter-1/2" : "granddaughter-2/3"),
      });
    } else if (daughters === 1) {
      results.set("granddaughter", {
        shareType: "fard",
        share: F(1, 6),
        reason: cite("granddaughter-1/6"),
      });
    }
    // daughters >= 2 and no grandson → granddaughters excluded (handled below).
  }

  // ---- Siblings -----------------------------------------------------------
  // Maternal (uterine) siblings: screened by any descendant, father, grandfather.
  const matTotal = matBrothers + matSisters;
  if (matTotal > 0 && !anyDescendant && !father && !pgf) {
    const share = matTotal === 1 ? F(1, 6) : F(1, 3);
    // Split equally regardless of gender (An-Nisaʾ 12).
    if (matBrothers > 0)
      results.set("maternal_brother", {
        shareType: "fard",
        share: share.scale(matBrothers).div(F(matTotal)),
        reason: cite(matTotal === 1 ? "maternal-1/6" : "maternal-1/3"),
      });
    if (matSisters > 0)
      results.set("maternal_sister", {
        shareType: "fard",
        share: share.scale(matSisters).div(F(matTotal)),
        reason: cite(matTotal === 1 ? "maternal-1/6" : "maternal-1/3"),
      });
  }

  // Full siblings: screened by father, son, grandson.
  const fullScreened = rootMaleAscendant || maleDescendant;
  let fullSisterIsResiduary = false; // asabah maʿa al-ghayr
  if (!fullScreened) {
    if (fullBrothers > 0) {
      // asabah bil-ghayr handled in residue step; mark presence.
    } else if (fullSisters > 0 && (daughters > 0 || granddaughters > 0)) {
      fullSisterIsResiduary = true; // takes residue with daughters
    } else if (fullSisters > 0) {
      results.set("full_sister", {
        shareType: "fard",
        share: fullSisters === 1 ? F(1, 2) : F(2, 3),
        reason: cite(fullSisters === 1 ? "full-sister-1/2" : "full-sister-2/3"),
      });
    }
  }

  // Paternal (consanguine) siblings: screened additionally by full brother and
  // by a full sister acting as residuary, and (for sisters) by two+ full sisters.
  const patScreenedBase = rootMaleAscendant || maleDescendant || fullBrothers > 0 || fullSisterIsResiduary;
  const fullSistersTook23 = results.get("full_sister")?.share.eq(F(2, 3)) ?? false;
  const fullSisterTook12 = results.get("full_sister")?.share.eq(F(1, 2)) ?? false;
  if (!patScreenedBase) {
    if (patBrothers > 0) {
      // asabah bil-ghayr in residue step.
    } else if (patSisters > 0) {
      if (fullSisterTook12) {
        // Complete the 2/3 alongside a single full sister.
        results.set("paternal_sister", {
          shareType: "fard",
          share: F(1, 6),
          reason: cite("paternal-sister-1/6"),
        });
      } else if (!fullSistersTook23) {
        results.set("paternal_sister", {
          shareType: "fard",
          share: patSisters === 1 ? F(1, 2) : F(2, 3),
          reason: cite(patSisters === 1 ? "paternal-sister-1/2" : "paternal-sister-2/3"),
        });
      }
      // fullSistersTook23 with no paternal brother → paternal sisters excluded.
    }
  }

  if ((father || pgf) && siblingTotal > 0) {
    if (pgf && !father) {
      notes.push(
        "Grandfather present with siblings: handled by screening siblings (treating the grandfather like the father). The Shafiʿi muqasama view may differ — please confirm with a certified scholar.",
      );
    }
  }

  // ---- Sum of fixed shares & residue -------------------------------------
  let sumFard = Fraction.zero();
  for (const w of results.values()) sumFard = sumFard.add(w.share);
  let residue = ONE.sub(sumFard);

  let aulApplied = false;
  let raddApplied = false;

  if (residue.lt(Fraction.zero())) {
    // ---- ʿAul: shares exceed the estate → scale down proportionally -------
    aulApplied = true;
    for (const [k, w] of results) {
      results.set(k, { ...w, share: w.share.div(sumFard) });
    }
    notes.push(
      `ʿAul applied: fixed shares summed to ${sumFard.toString()} (> 1); all shares reduced proportionally.`,
    );
  } else if (residue.isZero()) {
    // Perfectly distributed — nothing to assign or return.
  } else {
    // ---- Assign residue to the residuary (ʿasabah) ------------------------
    const assigned = assignResidue(
      results,
      residue,
      { sons, daughters, grandsons, granddaughters, fullBrothers, fullSisters, patBrothers, patSisters },
      { hasSon, hasGrandson, father, pgf, fullSisterIsResiduary, patScreenedBase, fullSistersTook23, fullSisterTook12 },
    );
    if (!assigned) {
      // ---- Radd: return surplus to fixed-share heirs (not spouses) --------
      raddApplied = true;
      applyRadd(results, residue, notes);
    }
  }

  return formatResult(estate, results, h, aulApplied, raddApplied, notes);
}

// ---------------------------------------------------------------------------

function assignResidue(
  results: Map<HeirKey, Working>,
  residue: Fraction,
  counts: {
    sons: number; daughters: number; grandsons: number; granddaughters: number;
    fullBrothers: number; fullSisters: number; patBrothers: number; patSisters: number;
  },
  flags: {
    hasSon: boolean; hasGrandson: boolean; father: boolean; pgf: boolean;
    fullSisterIsResiduary: boolean; patScreenedBase: boolean;
    fullSistersTook23: boolean; fullSisterTook12: boolean;
  },
): boolean {
  const { sons, daughters, grandsons, granddaughters, fullBrothers, fullSisters, patBrothers, patSisters } = counts;

  // 1. Son (+ daughters as asabah bil-ghayr, 2:1)
  if (flags.hasSon) {
    splitByGender(results, residue, "son", sons, "daughter", daughters);
    return true;
  }
  // 2. Grandson (+ granddaughters, 2:1)
  if (flags.hasGrandson) {
    splitByGender(results, residue, "grandson", grandsons, "granddaughter", granddaughters);
    return true;
  }
  // 3. Father takes the residue (fard 1/6 already set when a daughter exists)
  if (flags.father) {
    const existing = results.get("father");
    if (existing) {
      results.set("father", {
        shareType: "fard+asabah",
        share: existing.share.add(residue),
        reason: "Father takes 1/6 as a fixed share plus the residue as the nearest male agnate (An-Nisaʾ 11).",
      });
    } else {
      results.set("father", { shareType: "asabah", share: residue, reason: cite("father-asabah") });
    }
    return true;
  }
  // 4. Paternal grandfather (when father absent)
  if (flags.pgf) {
    const existing = results.get("paternal_grandfather");
    if (existing) {
      results.set("paternal_grandfather", {
        shareType: "fard+asabah",
        share: existing.share.add(residue),
        reason: "Grandfather takes 1/6 plus the residue as agnate (in the father's absence).",
      });
    } else {
      results.set("paternal_grandfather", { shareType: "asabah", share: residue, reason: cite("grandfather-asabah") });
    }
    return true;
  }
  // 5. Full brother (+ full sisters, 2:1)
  if (fullBrothers > 0) {
    splitByGender(results, residue, "full_brother", fullBrothers, "full_sister", fullSisters);
    return true;
  }
  // 6. Full sister(s) as asabah maʿa al-ghayr (with daughters/granddaughters) — split equally
  if (flags.fullSisterIsResiduary && fullSisters > 0) {
    results.set("full_sister", {
      shareType: "asabah",
      share: residue,
      reason: "Full sister becomes residuary (asabah maʿa al-ghayr) alongside daughters — Hadith: 'Make the sisters with the daughters residuaries' (Sahih al-Bukhari 6736).",
    });
    return true;
  }
  // 7. Paternal brother (+ paternal sisters, 2:1)
  if (!flags.patScreenedBase && patBrothers > 0) {
    splitByGender(results, residue, "paternal_brother", patBrothers, "paternal_sister", patSisters);
    return true;
  }
  return false;
}

/** Distribute a residue between males and females at the ratio 2:1 per head. */
function splitByGender(
  results: Map<HeirKey, Working>,
  residue: Fraction,
  maleKey: HeirKey,
  males: number,
  femaleKey: HeirKey,
  females: number,
): void {
  const parts = males * 2 + females;
  if (parts === 0) return;
  if (males > 0) {
    results.set(maleKey, {
      shareType: "asabah",
      share: residue.scale(males * 2).div(new Fraction(parts)),
      reason: cite("asabah-male"),
    });
  }
  if (females > 0) {
    results.set(femaleKey, {
      shareType: "asabah",
      share: residue.scale(females).div(new Fraction(parts)),
      reason: cite("asabah-female"),
    });
  }
}

/** Return surplus proportionally to fixed-share heirs other than the spouse. */
function applyRadd(results: Map<HeirKey, Working>, residue: Fraction, notes: string[]): void {
  const eligible = [...results.entries()].filter(
    ([k]) => k !== "husband" && k !== "wife",
  );
  if (eligible.length === 0) {
    // Only a spouse survives — give the remainder to the spouse (modern practice).
    for (const [k, w] of results) {
      results.set(k, { shareType: "radd", share: w.share.add(residue), reason: w.reason + " The remainder returns to the spouse as the sole heir." });
    }
    notes.push("No residuary; surplus returned to the surviving spouse (sole heir).");
    return;
  }
  let total = Fraction.zero();
  for (const [, w] of eligible) total = total.add(w.share);
  for (const [k, w] of eligible) {
    const add = residue.mul(w.share).div(total);
    results.set(k, { shareType: "radd", share: w.share.add(add), reason: w.reason + " Increased by radd (return of surplus, no residuary present)." });
  }
  notes.push("Radd applied: surplus returned proportionally to fixed-share heirs (excluding spouse).");
}

// ---------------------------------------------------------------------------

function formatResult(
  estate: number,
  results: Map<HeirKey, Working>,
  heirs: HeirCounts,
  aulApplied: boolean,
  raddApplied: boolean,
  notes: string[],
): FaraidResult {
  const out: HeirResult[] = [];
  const denominators: number[] = [];

  // Present heirs that received nothing are explicitly marked excluded (mahjub).
  for (const k of Object.keys(HEIR_META) as HeirKey[]) {
    const cnt = c(heirs, k);
    if (cnt === 0) continue;
    const w = results.get(k);
    if (w && !w.share.isZero()) {
      denominators.push(w.share.den);
      const amount = round2(estate * w.share.toNumber());
      const suffix = aulApplied ? " (ʿaul)" : raddApplied && w.shareType === "radd" ? " (radd)" : "";
      out.push({
        heir: k,
        label: HEIR_META[k].label,
        count: cnt,
        shareType: w.shareType,
        share: w.share,
        shareLabel: w.share.toString() + suffix,
        amount,
        amountPerHead: round2(amount / cnt),
        reason: w.reason,
      });
    } else {
      out.push({
        heir: k,
        label: HEIR_META[k].label,
        count: cnt,
        shareType: "excluded",
        share: Fraction.zero(),
        shareLabel: "0",
        amount: 0,
        amountPerHead: 0,
        reason: exclusionReason(k, heirs),
      });
    }
  }

  const baseDenominator = denominators.length ? lcmAll(denominators) : 1;
  const totalDistributed = round2(out.reduce((s, r) => s + r.amount, 0));

  return { estate, heirs: out, aulApplied, raddApplied, baseDenominator, notes, totalDistributed };
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Best-effort explanation for why a present heir is excluded (mahjub). */
function exclusionReason(k: HeirKey, h: HeirCounts): string {
  const has = (x: HeirKey) => c(h, x) > 0;
  switch (k) {
    case "paternal_grandfather":
      return "Excluded by the father, who is nearer.";
    case "paternal_grandmother":
      return has("mother") ? "Excluded by the mother." : "Excluded by the father.";
    case "maternal_grandmother":
      return "Excluded by the mother.";
    case "grandson":
    case "granddaughter":
      if (has("son")) return "Excluded by the son (nearer descendant).";
      if (k === "granddaughter") return "Excluded — two or more daughters already take 2/3 and no grandson raises the granddaughter to residuary.";
      return "Excluded by a nearer descendant.";
    case "full_brother":
    case "full_sister":
      if (has("son") || has("grandson")) return "Excluded by a male descendant.";
      if (has("father")) return "Excluded by the father.";
      return "Excluded by a nearer heir.";
    case "paternal_brother":
    case "paternal_sister":
      if (has("son") || has("grandson")) return "Excluded by a male descendant.";
      if (has("father")) return "Excluded by the father.";
      if (has("full_brother")) return "Excluded by the full brother.";
      if (c(h, "full_sister") >= 2) return "Excluded — two full sisters already take the sisters' 2/3.";
      return "Excluded by nearer (full) siblings.";
    case "maternal_brother":
    case "maternal_sister":
      return "Excluded by a descendant, the father, or the grandfather.";
    default:
      return "Receives no share in this configuration.";
  }
}

// ---------------------------------------------------------------------------
// Citations — concise, traceable fiqh references for each ruling.
function cite(key: string): string {
  const m: Record<string, string> = {
    "husband-1/2": "An-Nisaʾ 12 — the husband takes 1/2 when the deceased left no child.",
    "husband-1/4": "An-Nisaʾ 12 — the husband takes 1/4 when a child survives.",
    "wife-1/4": "An-Nisaʾ 12 — the wife (or wives, shared) takes 1/4 when no child survives.",
    "wife-1/8": "An-Nisaʾ 12 — the wife (or wives, shared) takes 1/8 when a child survives.",
    "father-1/6": "An-Nisaʾ 11 — the father takes 1/6 when the deceased has a child.",
    "father-asabah": "An-Nisaʾ 11 — the father inherits the residue as nearest male agnate when no son survives.",
    "grandfather-1/6": "By analogy to the father (An-Nisaʾ 11) — the grandfather takes 1/6 with a descendant.",
    "grandfather-asabah": "By analogy to the father — the grandfather takes the residue in the father's absence.",
    "mother-1/6": "An-Nisaʾ 11 — the mother takes 1/6 when a child or two-or-more siblings survive.",
    "mother-1/3": "An-Nisaʾ 11 — the mother takes 1/3 when there is no child and fewer than two siblings.",
    "grandmother-1/6": "Sunnah — the grandmother(s) take 1/6 (shared) in the mother's absence (Sunan Abu Dawud 2894).",
    "daughter-1/2": "An-Nisaʾ 11 — a single daughter (no son) takes 1/2.",
    "daughter-2/3": "An-Nisaʾ 11 — two or more daughters (no son) share 2/3.",
    "granddaughter-1/2": "An-Nisaʾ 11 (by extension) — a single granddaughter takes 1/2 when no child/grandson is nearer.",
    "granddaughter-2/3": "An-Nisaʾ 11 (by extension) — granddaughters share 2/3 when no nearer descendant.",
    "granddaughter-1/6": "Granddaughter(s) take 1/6 to complete the daughters' 2/3 (ruling of Ibn Masʿud, Sahih al-Bukhari 6736).",
    "maternal-1/6": "An-Nisaʾ 12 — a single maternal (uterine) sibling takes 1/6.",
    "maternal-1/3": "An-Nisaʾ 12 — two or more maternal siblings share 1/3 equally, regardless of gender.",
    "full-sister-1/2": "An-Nisaʾ 176 — a single full sister (kalalah) takes 1/2.",
    "full-sister-2/3": "An-Nisaʾ 176 — two or more full sisters share 2/3.",
    "paternal-sister-1/2": "An-Nisaʾ 176 (by extension) — a single paternal sister takes 1/2.",
    "paternal-sister-2/3": "An-Nisaʾ 176 (by extension) — paternal sisters share 2/3.",
    "paternal-sister-1/6": "Paternal sister(s) take 1/6 to complete the sisters' 2/3 beside one full sister.",
    "asabah-male": "Residuary (ʿasabah): 'to the male a share equal to that of two females' (An-Nisaʾ 11).",
    "asabah-female": "Residuary (ʿasabah) with male kin at the ratio 1:2 (An-Nisaʾ 11).",
  };
  return m[key] ?? "Quranic / Sunnah-based fixed share.";
}
