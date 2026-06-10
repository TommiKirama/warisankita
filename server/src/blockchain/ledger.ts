import { createHash } from "node:crypto";
import { db } from "../db/store.js";

/**
 * Tamper-evident, hash-chained ledger — the prototype's stand-in for the
 * Hyperledger Fabric "Wasiyyah Vault" described in the proposal.
 *
 * Each block commits to the previous block's hash, so altering any historical
 * record invalidates every block after it. This reproduces Fabric's core
 * immutability guarantee locally; a production deployment would replace this
 * with a permissioned Fabric network whose nodes are operated by JAKIM,
 * Amanah Raya and the Mahkamah Syariah.
 */

export interface Block {
  index: number;
  timestamp: string;
  /** Logical event, e.g. "WASIYYAH_REGISTERED", "WASIYYAH_AMENDED". */
  type: string;
  /** Application payload committed to the chain. */
  data: Record<string, unknown>;
  prevHash: string;
  hash: string;
}

const GENESIS_PREV = "0".repeat(64);

function computeHash(b: Omit<Block, "hash">): string {
  const material = `${b.index}|${b.timestamp}|${b.type}|${JSON.stringify(b.data)}|${b.prevHash}`;
  return createHash("sha256").update(material).digest("hex");
}

function chain(): Block[] {
  return db.data().ledger;
}

/** Append a new block committing `data` under `type`; returns the new block. */
export function appendBlock(type: string, data: Record<string, unknown>): Block {
  const ledger = chain();
  const prev = ledger[ledger.length - 1];
  const partial: Omit<Block, "hash"> = {
    index: ledger.length,
    timestamp: new Date().toISOString(),
    type,
    data,
    prevHash: prev ? prev.hash : GENESIS_PREV,
  };
  const block: Block = { ...partial, hash: computeHash(partial) };
  ledger.push(block);
  db.save();
  return block;
}

export interface ChainVerification {
  valid: boolean;
  length: number;
  brokenAt: number | null;
  message: string;
}

/** Re-hash every block and confirm the prevHash links are intact. */
export function verifyChain(): ChainVerification {
  return verifyBlocks(chain());
}

/** Verify an arbitrary block array (used for the tamper demo on a clone). */
export function verifyBlocks(ledger: Block[]): ChainVerification {
  for (let i = 0; i < ledger.length; i++) {
    const b = ledger[i];
    const expectedPrev = i === 0 ? GENESIS_PREV : ledger[i - 1].hash;
    if (b.prevHash !== expectedPrev) {
      return { valid: false, length: ledger.length, brokenAt: i, message: `Broken link at block ${i}: prevHash mismatch.` };
    }
    const { hash, ...rest } = b;
    if (computeHash(rest) !== hash) {
      return { valid: false, length: ledger.length, brokenAt: i, message: `Tampered data at block ${i}: hash mismatch.` };
    }
  }
  return { valid: true, length: ledger.length, brokenAt: null, message: "Ledger intact — all blocks verified." };
}

/**
 * Demonstrate tamper-resistance WITHOUT corrupting the real ledger: clone the
 * chain, secretly alter one block's payload, then run verification on the clone.
 * Returns the verification result the attacker would trigger.
 */
export function simulateTamper(index: number): { before: ChainVerification; after: ChainVerification; alteredIndex: number } {
  const before = verifyChain();
  const clone: Block[] = structuredClone(chain());
  if (clone.length === 0) {
    return { before, after: before, alteredIndex: -1 };
  }
  const i = Math.min(Math.max(index, 0), clone.length - 1);
  clone[i] = { ...clone[i], data: { ...clone[i].data, _tamperedField: "attacker changed this" } };
  return { before, after: verifyBlocks(clone), alteredIndex: i };
}

/** Full audit trail for one wasiyyah, oldest first. */
export function historyFor(wasiyyahId: string): Block[] {
  return chain().filter((b) => b.data.wasiyyahId === wasiyyahId);
}

export function allBlocks(): Block[] {
  return [...chain()];
}
