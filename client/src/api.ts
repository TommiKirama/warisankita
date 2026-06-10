import type {
  Block, ChainVerification, DraftTurn, FaqEntry, FaraidResult,
  HeirCounts, HeirMeta, Lesson, Wasiyyah,
} from "./types";

async function req<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Faraid
  heirMeta: () => req<HeirMeta[]>("/faraid/heirs"),
  calculate: (estate: number, heirs: HeirCounts) =>
    req<FaraidResult>("/faraid/calculate", { method: "POST", body: JSON.stringify({ estate, heirs }) }),

  // Wasiyyah
  listWasiyyah: () => req<Wasiyyah[]>("/wasiyyah"),
  getWasiyyah: (id: string) => req<Wasiyyah>(`/wasiyyah/${id}`),
  seedDemo: () => req<Wasiyyah>("/wasiyyah/seed-demo", { method: "POST" }),
  createWasiyyah: (ownerName: string, ownerIc?: string) =>
    req<{ id: string }>("/wasiyyah", { method: "POST", body: JSON.stringify({ ownerName, ownerIc }) }),
  draft: (id: string, step: number) => req<DraftTurn>(`/wasiyyah/${id}/draft/${step}`),
  ekyc: (id: string, ic: string) => req<Wasiyyah>(`/wasiyyah/${id}/ekyc`, { method: "POST", body: JSON.stringify({ ic }) }),
  addAsset: (id: string, body: { label: string; category: string; value: number }) =>
    req(`/wasiyyah/${id}/assets`, { method: "POST", body: JSON.stringify(body) }),
  removeAsset: (id: string, assetId: string) =>
    req<Wasiyyah>(`/wasiyyah/${id}/assets/${assetId}`, { method: "DELETE" }),
  setHeirs: (id: string, heirs: HeirCounts) =>
    req<Wasiyyah>(`/wasiyyah/${id}/heirs`, { method: "PUT", body: JSON.stringify({ heirs }) }),
  addBequest: (id: string, body: Record<string, unknown>) =>
    req(`/wasiyyah/${id}/bequests`, { method: "POST", body: JSON.stringify(body) }),
  removeBequest: (id: string, bequestId: string) =>
    req<Wasiyyah>(`/wasiyyah/${id}/bequests/${bequestId}`, { method: "DELETE" }),
  addHibah: (id: string, body: Record<string, unknown>) =>
    req(`/wasiyyah/${id}/hibah`, { method: "POST", body: JSON.stringify(body) }),
  addWaqf: (id: string, body: Record<string, unknown>) =>
    req(`/wasiyyah/${id}/waqf`, { method: "POST", body: JSON.stringify(body) }),
  addWitness: (id: string, body: { name: string; ic: string }) =>
    req(`/wasiyyah/${id}/witnesses`, { method: "POST", body: JSON.stringify(body) }),
  sign: (id: string) => req<{ wasiyyah: Wasiyyah; blockHash: string }>(`/wasiyyah/${id}/sign`, { method: "POST" }),
  history: (id: string) => req<Block[]>(`/wasiyyah/${id}/history`),

  // Vault
  blocks: () => req<Block[]>("/vault/blocks"),
  verify: () => req<ChainVerification>("/vault/verify"),
  simulateTamper: (index: number) =>
    req<{ before: ChainVerification; after: ChainVerification; alteredIndex: number }>(
      "/vault/simulate-tamper",
      { method: "POST", body: JSON.stringify({ index }) },
    ),

  // Education
  lessons: () => req<Lesson[]>("/education/lessons"),
  faq: () => req<FaqEntry[]>("/education/faq"),
};

export function rm(n: number): string {
  return "RM " + n.toLocaleString("en-MY", { maximumFractionDigits: 0 });
}
