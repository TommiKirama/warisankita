import { Router } from "express";
import { allBlocks, simulateTamper, verifyChain } from "../blockchain/ledger.js";

export const vaultRouter = Router();

/** All blocks in the wasiyyah vault (newest first for display). */
vaultRouter.get("/blocks", (_req, res) => {
  res.json(allBlocks().reverse());
});

/** Verify the integrity of the entire chain. */
vaultRouter.get("/verify", (_req, res) => {
  res.json(verifyChain());
});

/**
 * Demo: show what happens if an attacker alters a stored block. Runs on a clone
 * so the real ledger is never touched.
 */
vaultRouter.post("/simulate-tamper", (req, res) => {
  const index = Number.isFinite(req.body?.index) ? Number(req.body.index) : 0;
  res.json(simulateTamper(index));
});
