import type { HeirCounts } from "../faraid/types.js";

export type WasiyyahStatus = "draft" | "witnessed" | "registered";

export interface Asset {
  id: string;
  label: string;
  category: "property" | "bank" | "epf" | "business" | "vehicle" | "investment" | "other";
  value: number;
}

/** A bequest (wasiyyah proper) to a non-heir or charity — capped collectively at 1/3. */
export interface Bequest {
  id: string;
  beneficiary: string;
  /** Either a fixed amount or a percentage of the net estate. */
  amount?: number;
  percentage?: number;
  purpose: "charity" | "non_heir" | "waqf";
  note?: string;
}

export interface HibahGift {
  id: string;
  recipient: string;
  asset: string;
  value: number;
  note?: string;
}

export interface WaqfEndowment {
  id: string;
  asset: string;
  value: number;
  beneficiaryCause: string;
}

export interface Witness {
  id: string;
  name: string;
  ic: string; // masked when stored/returned
  verifiedVia: "mydigital_id" | "manual";
  verifiedAt: string;
}

export interface SignatureRecord {
  signedBy: string;
  method: "mydigital_id_pki";
  /** Simulated PKI signature digest. */
  signatureHash: string;
  signedAt: string;
}

export interface Wasiyyah {
  id: string;
  ownerName: string;
  /** Masked national ID, e.g. "880101-**-**34". */
  ownerIcMasked?: string;
  ekycVerified: boolean;
  status: WasiyyahStatus;
  assets: Asset[];
  heirs: HeirCounts;
  bequests: Bequest[];
  hibah: HibahGift[];
  waqf: WaqfEndowment[];
  witnesses: Witness[];
  signature?: SignatureRecord;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWasiyyahInput {
  ownerName: string;
  ownerIc?: string;
}
