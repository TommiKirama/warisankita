import type { FaraidResult } from "./types.js";

/** Replace Fraction instances with JSON-friendly {fraction, value} pairs. */
export function serialiseFaraid(result: FaraidResult) {
  return {
    ...result,
    heirs: result.heirs.map((h) => ({
      ...h,
      share: { fraction: h.share.toString(), value: h.share.toNumber() },
    })),
  };
}
