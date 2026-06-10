import { Router } from "express";
import { z } from "zod";
import { calculateFaraid } from "../faraid/engine.js";
import { serialiseFaraid } from "../faraid/serialise.js";
import { HEIR_META } from "../faraid/labels.js";
import type { HeirKey } from "../faraid/types.js";

export const faraidRouter = Router();

const heirKeys = Object.keys(HEIR_META) as [HeirKey, ...HeirKey[]];

const calcSchema = z.object({
  estate: z.number().nonnegative(),
  heirs: z.record(z.enum(heirKeys), z.number().int().nonnegative()).default({}),
});

/** Metadata for every supported heir — drives the family-tree UI. */
faraidRouter.get("/heirs", (_req, res) => {
  res.json(Object.values(HEIR_META));
});

/** Pure Faraid calculation — no persistence. */
faraidRouter.post("/calculate", (req, res) => {
  const parsed = calcSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }
  const result = calculateFaraid(parsed.data);
  // Fractions are class instances; serialise them as readable strings + numbers.
  res.json(serialiseFaraid(result));
});
