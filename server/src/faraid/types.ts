import type { Fraction } from "./fraction.js";

/**
 * Supported heirs. Keys are stable identifiers used across the API and UI.
 * Coverage follows the common Sunni (Shafiʿi-default) Faraid framework.
 */
export type HeirKey =
  // Spouses
  | "husband"
  | "wife"
  // Ascendants
  | "father"
  | "mother"
  | "paternal_grandfather" // father's father (and up)
  | "paternal_grandmother" // father's mother
  | "maternal_grandmother" // mother's mother
  // Descendants
  | "son"
  | "daughter"
  | "grandson" // son's son (and his sons down the male line)
  | "granddaughter" // son's daughter
  // Full siblings (same father and mother)
  | "full_brother"
  | "full_sister"
  // Paternal / consanguine siblings (same father only)
  | "paternal_brother"
  | "paternal_sister"
  // Maternal / uterine siblings (same mother only)
  | "maternal_brother"
  | "maternal_sister";

export type HeirCounts = Partial<Record<HeirKey, number>>;

export interface FaraidInput {
  /** Net estate value after debts, funeral costs and any valid wasiyyah (≤ 1/3). */
  estate: number;
  /** Count of each surviving heir. Zero / omitted means none survive. */
  heirs: HeirCounts;
}

/** How a given heir received their portion. */
export type ShareType =
  | "fard" // fixed Quranic share
  | "asabah" // residuary
  | "fard+asabah" // fixed share plus residue (e.g. father with only daughters)
  | "radd" // fixed share increased by the return
  | "excluded"; // blocked (mahjub) — receives nothing

export interface HeirResult {
  heir: HeirKey;
  label: string;
  count: number;
  shareType: ShareType;
  /** Total fraction of the estate going to this heir group (all individuals combined). */
  share: Fraction;
  /** Human-readable fraction, e.g. "1/8" or "7/15 (ʿaul)". */
  shareLabel: string;
  /** Monetary amount for the whole group. */
  amount: number;
  /** Amount per individual within the group. */
  amountPerHead: number;
  /** Plain-language fiqh explanation with citation. */
  reason: string;
}

export interface FaraidResult {
  estate: number;
  heirs: HeirResult[];
  /** True when fixed shares exceeded the estate and were proportionally reduced. */
  aulApplied: boolean;
  /** True when a surplus was returned to fixed-share heirs. */
  raddApplied: boolean;
  /** Base denominator used (asl al-mas'alah), after ʿaul/radd correction. */
  baseDenominator: number;
  /** Notes about special cases triggered (Umariyyatan, kalalah, etc.). */
  notes: string[];
  /** Total distributed (should equal estate, barring rounding to cents). */
  totalDistributed: number;
}
