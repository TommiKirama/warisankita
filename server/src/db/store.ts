import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Wasiyyah } from "../wasiyyah/types.js";
import type { Block } from "../blockchain/ledger.js";

/**
 * Minimal JSON-file persistence layer.
 *
 * In the proposal the production data tier is PostgreSQL + Hyperledger Fabric.
 * For a zero-config, cross-platform prototype this repository persists to a
 * single JSON file behind a typed interface, so the storage engine can later
 * be swapped for Postgres without touching the services or routes.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(HERE, "..", "..", "data");
const DB_FILE = join(DATA_DIR, "db.json");

export interface AppData {
  wasiyyah: Wasiyyah[];
  ledger: Block[];
}

const EMPTY: AppData = { wasiyyah: [], ledger: [] };

function ensureDir(): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function load(): AppData {
  ensureDir();
  if (!existsSync(DB_FILE)) return structuredClone(EMPTY);
  try {
    const raw = readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return { wasiyyah: parsed.wasiyyah ?? [], ledger: parsed.ledger ?? [] };
  } catch {
    return structuredClone(EMPTY);
  }
}

let cache: AppData = load();

function persist(): void {
  ensureDir();
  writeFileSync(DB_FILE, JSON.stringify(cache, null, 2), "utf-8");
}

export const db = {
  data(): AppData {
    return cache;
  },
  save(): void {
    persist();
  },
  /** Reload from disk (used by tests). */
  reset(): void {
    cache = structuredClone(EMPTY);
    persist();
  },
};
