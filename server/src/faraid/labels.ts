import type { HeirKey } from "./types.js";

export interface HeirMeta {
  key: HeirKey;
  label: string; // English
  labelMs: string; // Bahasa Malaysia
  arabic: string;
  gender: "male" | "female";
  /** Whether more than one of this heir can survive (affects per-head split). */
  multiple: boolean;
  category: "spouse" | "ascendant" | "descendant" | "sibling";
}

export const HEIR_META: Record<HeirKey, HeirMeta> = {
  husband: { key: "husband", label: "Husband", labelMs: "Suami", arabic: "الزوج", gender: "male", multiple: false, category: "spouse" },
  wife: { key: "wife", label: "Wife", labelMs: "Isteri", arabic: "الزوجة", gender: "female", multiple: true, category: "spouse" },

  father: { key: "father", label: "Father", labelMs: "Bapa", arabic: "الأب", gender: "male", multiple: false, category: "ascendant" },
  mother: { key: "mother", label: "Mother", labelMs: "Ibu", arabic: "الأم", gender: "female", multiple: false, category: "ascendant" },
  paternal_grandfather: { key: "paternal_grandfather", label: "Paternal grandfather", labelMs: "Datuk sebelah bapa", arabic: "الجد", gender: "male", multiple: false, category: "ascendant" },
  paternal_grandmother: { key: "paternal_grandmother", label: "Paternal grandmother", labelMs: "Nenek sebelah bapa", arabic: "الجدة لأب", gender: "female", multiple: false, category: "ascendant" },
  maternal_grandmother: { key: "maternal_grandmother", label: "Maternal grandmother", labelMs: "Nenek sebelah ibu", arabic: "الجدة لأم", gender: "female", multiple: false, category: "ascendant" },

  son: { key: "son", label: "Son", labelMs: "Anak lelaki", arabic: "الابن", gender: "male", multiple: true, category: "descendant" },
  daughter: { key: "daughter", label: "Daughter", labelMs: "Anak perempuan", arabic: "البنت", gender: "female", multiple: true, category: "descendant" },
  grandson: { key: "grandson", label: "Grandson (son's son)", labelMs: "Cucu lelaki", arabic: "ابن الابن", gender: "male", multiple: true, category: "descendant" },
  granddaughter: { key: "granddaughter", label: "Granddaughter (son's daughter)", labelMs: "Cucu perempuan", arabic: "بنت الابن", gender: "female", multiple: true, category: "descendant" },

  full_brother: { key: "full_brother", label: "Full brother", labelMs: "Saudara lelaki seibu sebapa", arabic: "الأخ الشقيق", gender: "male", multiple: true, category: "sibling" },
  full_sister: { key: "full_sister", label: "Full sister", labelMs: "Saudara perempuan seibu sebapa", arabic: "الأخت الشقيقة", gender: "female", multiple: true, category: "sibling" },
  paternal_brother: { key: "paternal_brother", label: "Paternal half-brother", labelMs: "Saudara lelaki sebapa", arabic: "الأخ لأب", gender: "male", multiple: true, category: "sibling" },
  paternal_sister: { key: "paternal_sister", label: "Paternal half-sister", labelMs: "Saudara perempuan sebapa", arabic: "الأخت لأب", gender: "female", multiple: true, category: "sibling" },
  maternal_brother: { key: "maternal_brother", label: "Maternal half-brother", labelMs: "Saudara lelaki seibu", arabic: "الأخ لأم", gender: "male", multiple: true, category: "sibling" },
  maternal_sister: { key: "maternal_sister", label: "Maternal half-sister", labelMs: "Saudara perempuan seibu", arabic: "الأخت لأم", gender: "female", multiple: true, category: "sibling" },
};

export const ALL_HEIR_KEYS = Object.keys(HEIR_META) as HeirKey[];
