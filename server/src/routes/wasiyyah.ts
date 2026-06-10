import { Router } from "express";
import { z } from "zod";
import { serialiseFaraid } from "../faraid/serialise.js";
import { HEIR_META } from "../faraid/labels.js";
import type { HeirKey } from "../faraid/types.js";
import { draftTurn, TOTAL_STEPS } from "../wasiyyah/drafter.js";
import {
  addAsset,
  addBequest,
  addHibah,
  addWaqf,
  addWitness,
  computeProgress,
  createWasiyyah,
  faraidPreview,
  getWasiyyah,
  grossEstate,
  HttpError,
  listWasiyyah,
  netEstateForFaraid,
  removeAsset,
  removeBequest,
  seedDemo,
  setHeirs,
  signAndRegister,
  summariseBequests,
  verifyEkyc,
} from "../wasiyyah/service.js";
import { historyFor } from "../blockchain/ledger.js";

export const wasiyyahRouter = Router();

const heirKeys = Object.keys(HEIR_META) as [HeirKey, ...HeirKey[]];

function wrap(handler: (req: any, res: any) => void) {
  return (req: any, res: any) => {
    try {
      handler(req, res);
    } catch (e) {
      if (e instanceof HttpError) return res.status(e.status).json({ error: e.message });
      console.error(e);
      res.status(500).json({ error: "Internal error" });
    }
  };
}

/** Decorate a wasiyyah with computed estate + faraid for the UI. */
function withComputed(id: string) {
  const w = getWasiyyah(id);
  if (!w) throw new HttpError(404, "Wasiyyah not found");
  return {
    ...w,
    gross: grossEstate(w),
    netEstate: netEstateForFaraid(w),
    bequestSummary: summariseBequests(w),
    progress: computeProgress(w),
    faraid: serialiseFaraid(faraidPreview(w)),
  };
}

wasiyyahRouter.get("/", (_req, res) => {
  res.json(listWasiyyah());
});

/** Create a fully-populated demo wasiyyah (matches the proposal mockups). */
wasiyyahRouter.post(
  "/seed-demo",
  wrap((_req, res) => {
    const w = seedDemo();
    res.status(201).json(withComputed(w.id));
  }),
);

wasiyyahRouter.post(
  "/",
  wrap((req, res) => {
    const schema = z.object({ ownerName: z.string().min(1), ownerIc: z.string().optional() });
    const data = schema.parse(req.body);
    res.status(201).json(createWasiyyah(data));
  }),
);

wasiyyahRouter.get(
  "/:id",
  wrap((req, res) => res.json(withComputed(req.params.id))),
);

/** Conversational drafter turn for a given step. */
wasiyyahRouter.get(
  "/:id/draft/:step",
  wrap((req, res) => {
    const w = getWasiyyah(req.params.id);
    if (!w) throw new HttpError(404, "Wasiyyah not found");
    const step = Math.min(Math.max(parseInt(req.params.step, 10) || 1, 1), TOTAL_STEPS);
    res.json(draftTurn(w, step));
  }),
);

wasiyyahRouter.post(
  "/:id/ekyc",
  wrap((req, res) => {
    const { ic } = z.object({ ic: z.string().min(4) }).parse(req.body);
    res.json(verifyEkyc(req.params.id, ic));
  }),
);

wasiyyahRouter.post(
  "/:id/assets",
  wrap((req, res) => {
    const schema = z.object({
      label: z.string().min(1),
      category: z.enum(["property", "bank", "epf", "business", "vehicle", "investment", "other"]),
      value: z.number().nonnegative(),
    });
    res.status(201).json(addAsset(req.params.id, schema.parse(req.body)));
  }),
);

wasiyyahRouter.delete(
  "/:id/assets/:assetId",
  wrap((req, res) => {
    removeAsset(req.params.id, req.params.assetId);
    res.json(withComputed(req.params.id));
  }),
);

wasiyyahRouter.put(
  "/:id/heirs",
  wrap((req, res) => {
    const schema = z.object({ heirs: z.record(z.enum(heirKeys), z.number().int().nonnegative()) });
    const { heirs } = schema.parse(req.body);
    setHeirs(req.params.id, heirs);
    res.json(withComputed(req.params.id));
  }),
);

wasiyyahRouter.post(
  "/:id/bequests",
  wrap((req, res) => {
    const schema = z
      .object({
        beneficiary: z.string().min(1),
        amount: z.number().positive().optional(),
        percentage: z.number().positive().max(100).optional(),
        purpose: z.enum(["charity", "non_heir", "waqf"]),
        note: z.string().optional(),
      })
      .refine((b) => b.amount != null || b.percentage != null, {
        message: "Provide either amount or percentage",
      });
    res.status(201).json(addBequest(req.params.id, schema.parse(req.body)));
  }),
);

wasiyyahRouter.delete(
  "/:id/bequests/:bequestId",
  wrap((req, res) => {
    removeBequest(req.params.id, req.params.bequestId);
    res.json(withComputed(req.params.id));
  }),
);

wasiyyahRouter.post(
  "/:id/hibah",
  wrap((req, res) => {
    const schema = z.object({
      recipient: z.string().min(1),
      asset: z.string().min(1),
      value: z.number().nonnegative(),
      note: z.string().optional(),
    });
    res.status(201).json(addHibah(req.params.id, schema.parse(req.body)));
  }),
);

wasiyyahRouter.post(
  "/:id/waqf",
  wrap((req, res) => {
    const schema = z.object({
      asset: z.string().min(1),
      value: z.number().nonnegative(),
      beneficiaryCause: z.string().min(1),
    });
    res.status(201).json(addWaqf(req.params.id, schema.parse(req.body)));
  }),
);

wasiyyahRouter.post(
  "/:id/witnesses",
  wrap((req, res) => {
    const schema = z.object({
      name: z.string().min(1),
      ic: z.string().min(4),
      verifiedVia: z.enum(["mydigital_id", "manual"]).default("mydigital_id"),
    });
    const { name, ic, verifiedVia } = schema.parse(req.body);
    res.status(201).json(addWitness(req.params.id, name, ic, verifiedVia));
  }),
);

/** e-Sign with MyDigital ID (simulated) and register on the blockchain. */
wasiyyahRouter.post(
  "/:id/sign",
  wrap((req, res) => {
    res.json(signAndRegister(req.params.id));
  }),
);

/** Blockchain audit trail for this wasiyyah. */
wasiyyahRouter.get(
  "/:id/history",
  wrap((req, res) => {
    if (!getWasiyyah(req.params.id)) throw new HttpError(404, "Wasiyyah not found");
    res.json(historyFor(req.params.id));
  }),
);
