import { describe, it, expect } from "vitest";
import { calculateFaraid } from "./engine.js";
import type { HeirKey } from "./types.js";

/** Helper: map heir -> exact fraction string from a result. */
function shares(input: Parameters<typeof calculateFaraid>[0]) {
  const r = calculateFaraid(input);
  const m: Partial<Record<HeirKey, string>> = {};
  for (const h of r.heirs) m[h.heir] = h.share.toString();
  return { m, r };
}

describe("Faraid engine — fixed shares", () => {
  it("husband alone with a child gets 1/4", () => {
    const { m } = shares({ estate: 1000, heirs: { husband: 1, son: 1 } });
    expect(m.husband).toBe("1/4");
    expect(m.son).toBe("3/4");
  });

  it("husband with no child gets 1/2 (residue via radd to none → spouse-only handled elsewhere)", () => {
    const { m } = shares({ estate: 1000, heirs: { husband: 1, daughter: 2, father: 1, mother: 1 } });
    // Classic ʿaul case: shares sum to 15/12, base raised to /15.
    // husband 3/15 reduces to 1/5; the rest are already in lowest terms.
    expect(m.husband).toBe("1/5"); // 3/15
    expect(m.daughter).toBe("8/15");
    expect(m.father).toBe("2/15");
    expect(m.mother).toBe("2/15");
  });

  it("wife with son and daughter: 1/8 then residue 2:1", () => {
    const { m } = shares({ estate: 24000, heirs: { wife: 1, son: 1, daughter: 1 } });
    expect(m.wife).toBe("1/8");
    // residue 7/8 split 2:1 → son 7/12, daughter 7/24
    expect(m.son).toBe("7/12");
    expect(m.daughter).toBe("7/24");
  });
});

describe("Faraid engine — al-ʿUmariyyatan (spouse + both parents)", () => {
  it("husband + father + mother: H 1/2, M 1/6, F 1/3", () => {
    const { m } = shares({ estate: 6000, heirs: { husband: 1, father: 1, mother: 1 } });
    expect(m.husband).toBe("1/2");
    expect(m.mother).toBe("1/6");
    expect(m.father).toBe("1/3");
  });

  it("wife + father + mother: W 1/4, M 1/4, F 1/2", () => {
    const { m } = shares({ estate: 12000, heirs: { wife: 1, father: 1, mother: 1 } });
    expect(m.wife).toBe("1/4");
    expect(m.mother).toBe("1/4");
    expect(m.father).toBe("1/2");
  });
});

describe("Faraid engine — ʿaul", () => {
  it("husband + 2 full sisters → 1/2 + 2/3 = 7/6, ʿaul to /7", () => {
    const { m, r } = shares({ estate: 7000, heirs: { husband: 1, full_sister: 2 } });
    expect(r.aulApplied).toBe(true);
    expect(m.husband).toBe("3/7");
    expect(m.full_sister).toBe("4/7");
  });
});

describe("Faraid engine — radd", () => {
  it("mother + daughter, no residuary → radd; daughter 3/4, mother 1/4", () => {
    const { m, r } = shares({ estate: 4000, heirs: { mother: 1, daughter: 1 } });
    expect(r.raddApplied).toBe(true);
    // fard: daughter 1/2, mother 1/6 → 2/3; surplus 1/3 returned 3:1
    // daughter 1/2 / (1/2+1/6) = 3/4 ; mother = 1/4
    expect(m.daughter).toBe("3/4");
    expect(m.mother).toBe("1/4");
  });

  it("daughter alone gets everything via radd", () => {
    const { m } = shares({ estate: 5000, heirs: { daughter: 1 } });
    expect(m.daughter).toBe("1");
  });
});

describe("Faraid engine — exclusion (ḥajb)", () => {
  it("son excludes grandson and full brother; grandfather still takes 1/6 (screened only by father)", () => {
    const r = calculateFaraid({ estate: 9000, heirs: { son: 1, grandson: 1, full_brother: 1, paternal_grandfather: 1 } });
    const gson = r.heirs.find((h) => h.heir === "grandson")!;
    const fb = r.heirs.find((h) => h.heir === "full_brother")!;
    const pgf = r.heirs.find((h) => h.heir === "paternal_grandfather")!;
    expect(gson.shareType).toBe("excluded");
    expect(fb.shareType).toBe("excluded");
    expect(pgf.share.toString()).toBe("1/6"); // grandfather behaves like the father
    expect(r.heirs.find((h) => h.heir === "son")!.share.toString()).toBe("5/6");
  });

  it("father excludes all siblings", () => {
    const r = calculateFaraid({ estate: 6000, heirs: { father: 1, mother: 1, full_brother: 2, maternal_sister: 1 } });
    expect(r.heirs.find((h) => h.heir === "full_brother")!.shareType).toBe("excluded");
    expect(r.heirs.find((h) => h.heir === "maternal_sister")!.shareType).toBe("excluded");
    // mother reduced to 1/6 because there are 2+ siblings (even though they're excluded)
    expect(r.heirs.find((h) => h.heir === "mother")!.share.toString()).toBe("1/6");
    // no descendant → father is pure residuary (asabah), and takes 5/6
    const fatherR = r.heirs.find((h) => h.heir === "father")!;
    expect(fatherR.shareType).toBe("asabah");
    expect(fatherR.share.toString()).toBe("5/6");
  });
});

describe("Faraid engine — daughters with granddaughters", () => {
  it("one daughter + granddaughter: daughter 1/2, granddaughter 1/6 (completing 2/3), then radd", () => {
    const { m, r } = shares({ estate: 6000, heirs: { daughter: 1, granddaughter: 1 } });
    // 1/2 + 1/6 = 2/3, radd surplus 1/3 → ratio 3:1
    expect(r.raddApplied).toBe(true);
    expect(m.daughter).toBe("3/4");
    expect(m.granddaughter).toBe("1/4");
  });

  it("two daughters exclude a lone granddaughter", () => {
    const r = calculateFaraid({ estate: 6000, heirs: { daughter: 2, granddaughter: 1, father: 1 } });
    expect(r.heirs.find((h) => h.heir === "granddaughter")!.shareType).toBe("excluded");
  });
});

describe("Faraid engine — maternal siblings (kalalah)", () => {
  it("mother + 2 maternal siblings + full brother", () => {
    const { m } = shares({ estate: 6000, heirs: { mother: 1, maternal_brother: 1, maternal_sister: 1, full_brother: 1 } });
    expect(m.mother).toBe("1/6"); // 2+ siblings
    // maternal siblings share 1/3 equally → each 1/6
    expect(m.maternal_brother).toBe("1/6");
    expect(m.maternal_sister).toBe("1/6");
    // full brother residue = 1 - 1/6 - 1/3 = 1/2
    expect(m.full_brother).toBe("1/2");
  });
});

describe("Faraid engine — full sister as residuary with daughter", () => {
  it("daughter + full sister: daughter 1/2 (fard), sister takes residue 1/2", () => {
    const { m } = shares({ estate: 8000, heirs: { daughter: 1, full_sister: 1 } });
    expect(m.daughter).toBe("1/2");
    expect(m.full_sister).toBe("1/2");
  });
});

describe("Faraid engine — totals always conserve the estate", () => {
  const cases: Parameters<typeof calculateFaraid>[0][] = [
    { estate: 100000, heirs: { husband: 1, son: 2, daughter: 1, mother: 1 } },
    { estate: 333333, heirs: { wife: 2, father: 1, mother: 1, son: 1 } },
    { estate: 250000, heirs: { daughter: 3, mother: 1, father: 1 } },
    { estate: 90000, heirs: { husband: 1, full_sister: 2, mother: 1 } },
  ];
  it("distributes within 1 unit of the estate (rounding)", () => {
    for (const cse of cases) {
      const r = calculateFaraid(cse);
      expect(Math.abs(r.totalDistributed - r.estate)).toBeLessThanOrEqual(1);
    }
  });
});
