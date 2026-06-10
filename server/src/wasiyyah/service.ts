import { randomUUID, createHash } from "node:crypto";
import { db } from "../db/store.js";
import { appendBlock } from "../blockchain/ledger.js";
import { calculateFaraid } from "../faraid/engine.js";
import type { FaraidResult } from "../faraid/types.js";
import type {
  Asset,
  Bequest,
  CreateWasiyyahInput,
  HibahGift,
  WaqfEndowment,
  Wasiyyah,
  Witness,
} from "./types.js";

function now(): string {
  return new Date().toISOString();
}

/** Mask a Malaysian IC like 880101-14-5523 → 880101-**-**23. */
export function maskIc(ic: string): string {
  const digits = ic.replace(/\D/g, "");
  if (digits.length < 4) return "****";
  const last2 = digits.slice(-2);
  const first6 = digits.slice(0, 6).padEnd(6, "*");
  return `${first6}-**-**${last2}`;
}

export function listWasiyyah(): Wasiyyah[] {
  return db.data().wasiyyah;
}

export function getWasiyyah(id: string): Wasiyyah | undefined {
  return db.data().wasiyyah.find((w) => w.id === id);
}

export function createWasiyyah(input: CreateWasiyyahInput): Wasiyyah {
  const w: Wasiyyah = {
    id: randomUUID(),
    ownerName: input.ownerName.trim(),
    ownerIcMasked: input.ownerIc ? maskIc(input.ownerIc) : undefined,
    ekycVerified: false,
    status: "draft",
    assets: [],
    heirs: {},
    bequests: [],
    hibah: [],
    waqf: [],
    witnesses: [],
    createdAt: now(),
    updatedAt: now(),
  };
  db.data().wasiyyah.push(w);
  db.save();
  appendBlock("WASIYYAH_CREATED", { wasiyyahId: w.id, owner: w.ownerName });
  return w;
}

/** Apply a mutation, stamp updatedAt, persist, and record a ledger amendment. */
function amend<T>(id: string, type: string, fn: (w: Wasiyyah) => T, summary: Record<string, unknown> = {}): T {
  const w = getWasiyyah(id);
  if (!w) throw new HttpError(404, "Wasiyyah not found");
  const result = fn(w);
  w.updatedAt = now();
  db.save();
  appendBlock(type, { wasiyyahId: id, ...summary });
  return result;
}

export function verifyEkyc(id: string, ic: string): Wasiyyah {
  amend(id, "EKYC_VERIFIED", (w) => {
    w.ekycVerified = true;
    w.ownerIcMasked = maskIc(ic);
  }, { method: "mydigital_id (simulated)" });
  return getWasiyyah(id)!;
}

export function addAsset(id: string, a: Omit<Asset, "id">): Asset {
  const asset: Asset = { id: randomUUID(), ...a, value: Math.max(0, a.value) };
  amend(id, "ASSET_ADDED", (w) => w.assets.push(asset), { label: asset.label, value: asset.value });
  return asset;
}

export function removeAsset(id: string, assetId: string): void {
  amend(id, "ASSET_REMOVED", (w) => {
    w.assets = w.assets.filter((x) => x.id !== assetId);
  }, { assetId });
}

export function setHeirs(id: string, heirs: Wasiyyah["heirs"]): Wasiyyah {
  amend(id, "HEIRS_UPDATED", (w) => {
    w.heirs = heirs;
  });
  return getWasiyyah(id)!;
}

export function grossEstate(w: Wasiyyah): number {
  return round2(w.assets.reduce((s, a) => s + a.value, 0));
}

export interface BequestSummary {
  totalRequested: number;
  totalValid: number;
  maxAllowed: number; // one-third of gross
  exceedsOneThird: boolean;
  percentOfEstate: number;
}

function resolveBequestAmount(b: Bequest, gross: number): number {
  if (typeof b.amount === "number") return b.amount;
  if (typeof b.percentage === "number") return (b.percentage / 100) * gross;
  return 0;
}

export function summariseBequests(w: Wasiyyah): BequestSummary {
  const gross = grossEstate(w);
  const totalRequested = round2(w.bequests.reduce((s, b) => s + resolveBequestAmount(b, gross), 0));
  const maxAllowed = round2(gross / 3);
  const totalValid = Math.min(totalRequested, maxAllowed);
  return {
    totalRequested,
    totalValid: round2(totalValid),
    maxAllowed,
    exceedsOneThird: totalRequested > maxAllowed + 0.001,
    percentOfEstate: gross > 0 ? round2((totalValid / gross) * 100) : 0,
  };
}

export function addBequest(id: string, b: Omit<Bequest, "id">): { bequest: Bequest; summary: BequestSummary } {
  const bequest: Bequest = { id: randomUUID(), ...b };
  amend(id, "BEQUEST_ADDED", (w) => w.bequests.push(bequest), { beneficiary: bequest.beneficiary });
  return { bequest, summary: summariseBequests(getWasiyyah(id)!) };
}

export function removeBequest(id: string, bequestId: string): void {
  amend(id, "BEQUEST_REMOVED", (w) => {
    w.bequests = w.bequests.filter((x) => x.id !== bequestId);
  }, { bequestId });
}

export function addHibah(id: string, g: Omit<HibahGift, "id">): HibahGift {
  const gift: HibahGift = { id: randomUUID(), ...g };
  amend(id, "HIBAH_ADDED", (w) => w.hibah.push(gift), { recipient: gift.recipient });
  return gift;
}

export function addWaqf(id: string, e: Omit<WaqfEndowment, "id">): WaqfEndowment {
  const waqf: WaqfEndowment = { id: randomUUID(), ...e };
  amend(id, "WAQF_ADDED", (w) => w.waqf.push(waqf), { cause: waqf.beneficiaryCause });
  return waqf;
}

export function addWitness(id: string, name: string, ic: string, via: Witness["verifiedVia"]): Witness {
  const witness: Witness = {
    id: randomUUID(),
    name: name.trim(),
    ic: maskIc(ic),
    verifiedVia: via,
    verifiedAt: now(),
  };
  amend(id, "WITNESS_ADDED", (w) => w.witnesses.push(witness), { witness: witness.name });
  return witness;
}

/** Net estate available to Faraid heirs = gross − valid bequests. */
export function netEstateForFaraid(w: Wasiyyah): number {
  const gross = grossEstate(w);
  const { totalValid } = summariseBequests(w);
  return round2(gross - totalValid);
}

export function faraidPreview(w: Wasiyyah): FaraidResult {
  return calculateFaraid({ estate: netEstateForFaraid(w), heirs: w.heirs });
}

export interface SignResult {
  wasiyyah: Wasiyyah;
  blockHash: string;
}

/** e-Sign (simulated MyDigital ID PKI), then register on the blockchain. */
export function signAndRegister(id: string): SignResult {
  const w = getWasiyyah(id);
  if (!w) throw new HttpError(404, "Wasiyyah not found");
  if (!w.ekycVerified) throw new HttpError(400, "Identity (eKYC) must be verified before signing.");
  if (w.witnesses.length < 2) throw new HttpError(400, "Two witnesses are required before signing.");
  const { exceedsOneThird } = summariseBequests(w);
  if (exceedsOneThird) throw new HttpError(400, "Bequests exceed one-third of the estate. Reduce them or obtain heirs' consent.");

  const snapshot = JSON.stringify({ assets: w.assets, heirs: w.heirs, bequests: w.bequests, hibah: w.hibah, waqf: w.waqf });
  const signatureHash = createHash("sha256").update(`${w.id}|${w.ownerName}|${snapshot}|${now()}`).digest("hex");

  w.signature = { signedBy: w.ownerName, method: "mydigital_id_pki", signatureHash, signedAt: now() };
  w.status = "registered";
  w.updatedAt = now();
  db.save();
  const block = appendBlock("WASIYYAH_REGISTERED", {
    wasiyyahId: w.id,
    owner: w.ownerName,
    signatureHash,
    netEstate: netEstateForFaraid(w),
    witnesses: w.witnesses.length,
  });
  return { wasiyyah: w, blockHash: block.hash };
}

export interface Progress {
  percent: number;
  done: string[];
  remaining: string[];
}

/** Drafting completion used by the Home dashboard ring. */
export function computeProgress(w: Wasiyyah): Progress {
  const steps: { label: string; ok: boolean }[] = [
    { label: "Identity verified", ok: w.ekycVerified },
    { label: "Assets added", ok: w.assets.length > 0 },
    { label: "Heirs added", ok: Object.values(w.heirs).some((n) => (n ?? 0) > 0) },
    { label: "Bequests reviewed", ok: w.bequests.length > 0 || w.status !== "draft" },
    { label: "Two witnesses", ok: w.witnesses.length >= 2 },
    { label: "Signed & registered", ok: w.status === "registered" },
  ];
  const done = steps.filter((s) => s.ok).map((s) => s.label);
  const remaining = steps.filter((s) => !s.ok).map((s) => s.label);
  return { percent: Math.round((done.length / steps.length) * 100), done, remaining };
}

/** Create a fully-populated demo wasiyyah matching the proposal's mockups. */
export function seedDemo(): Wasiyyah {
  const w = createWasiyyah({ ownerName: "Ahmad bin Ali", ownerIc: "880101-14-5523" });
  verifyEkyc(w.id, "880101-14-5523");
  addAsset(w.id, { label: "Family home (Shah Alam)", category: "property", value: 600000 });
  addAsset(w.id, { label: "EPF savings", category: "epf", value: 250000 });
  addAsset(w.id, { label: "Bank savings", category: "bank", value: 150000 });
  addAsset(w.id, { label: "Business shares", category: "business", value: 150000 });
  addAsset(w.id, { label: "Vehicle", category: "vehicle", value: 50000 });
  setHeirs(w.id, { wife: 1, son: 2, daughter: 1 });
  // Full one-third bequest (RM 400,000 of RM 1.2M) to charity → net estate RM 800,000.
  addBequest(w.id, { beneficiary: "Yayasan Anak Yatim Selangor", amount: 400000, purpose: "charity", note: "Orphan welfare" });
  addWitness(w.id, "Hassan bin Omar", "850202-10-1122", "mydigital_id");
  addWitness(w.id, "Yusuf bin Idris", "870303-08-3344", "mydigital_id");
  return getWasiyyah(w.id)!;
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
