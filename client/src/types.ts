// Shapes mirrored from the server API responses.

export type HeirKey =
  | "husband" | "wife"
  | "father" | "mother" | "paternal_grandfather" | "paternal_grandmother" | "maternal_grandmother"
  | "son" | "daughter" | "grandson" | "granddaughter"
  | "full_brother" | "full_sister"
  | "paternal_brother" | "paternal_sister"
  | "maternal_brother" | "maternal_sister";

export type HeirCounts = Partial<Record<HeirKey, number>>;

export interface HeirMeta {
  key: HeirKey;
  label: string;
  labelMs: string;
  arabic: string;
  gender: "male" | "female";
  multiple: boolean;
  category: "spouse" | "ascendant" | "descendant" | "sibling";
}

export type ShareType = "fard" | "asabah" | "fard+asabah" | "radd" | "excluded";

export interface HeirResult {
  heir: HeirKey;
  label: string;
  count: number;
  shareType: ShareType;
  share: { fraction: string; value: number };
  shareLabel: string;
  amount: number;
  amountPerHead: number;
  reason: string;
}

export interface FaraidResult {
  estate: number;
  heirs: HeirResult[];
  aulApplied: boolean;
  raddApplied: boolean;
  baseDenominator: number;
  notes: string[];
  totalDistributed: number;
}

export interface Asset {
  id: string;
  label: string;
  category: "property" | "bank" | "epf" | "business" | "vehicle" | "investment" | "other";
  value: number;
}

export interface Bequest {
  id: string;
  beneficiary: string;
  amount?: number;
  percentage?: number;
  purpose: "charity" | "non_heir" | "waqf";
  note?: string;
}

export interface HibahGift { id: string; recipient: string; asset: string; value: number; note?: string; }
export interface WaqfEndowment { id: string; asset: string; value: number; beneficiaryCause: string; }
export interface Witness { id: string; name: string; ic: string; verifiedVia: string; verifiedAt: string; }
export interface SignatureRecord { signedBy: string; method: string; signatureHash: string; signedAt: string; }

export interface BequestSummary {
  totalRequested: number;
  totalValid: number;
  maxAllowed: number;
  exceedsOneThird: boolean;
  percentOfEstate: number;
}

export interface Progress { percent: number; done: string[]; remaining: string[]; }

export interface Wasiyyah {
  id: string;
  ownerName: string;
  ownerIcMasked?: string;
  ekycVerified: boolean;
  status: "draft" | "witnessed" | "registered";
  assets: Asset[];
  heirs: HeirCounts;
  bequests: Bequest[];
  hibah: HibahGift[];
  waqf: WaqfEndowment[];
  witnesses: Witness[];
  signature?: SignatureRecord;
  createdAt: string;
  updatedAt: string;
  gross: number;
  netEstate: number;
  bequestSummary: BequestSummary;
  progress: Progress;
  faraid: FaraidResult;
}

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
  collect: "none" | "assets" | "heirs" | "bequests" | "hibah_waqf" | "witnesses" | "review";
  done: boolean;
}

export interface Citation { source: string; reference: string; text: string; }
export interface Lesson {
  id: string; category: string; title: string; titleMs: string;
  durationMin: number; summary: string; body: string[]; citations: Citation[];
}
export interface FaqEntry { id: string; question: string; answer: string; citations: Citation[]; }

export interface Block {
  index: number; timestamp: string; type: string;
  data: Record<string, unknown>; prevHash: string; hash: string;
}
export interface ChainVerification { valid: boolean; length: number; brokenAt: number | null; message: string; }
