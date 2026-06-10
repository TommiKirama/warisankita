/**
 * Exact rational arithmetic for Faraid shares.
 *
 * Islamic inheritance shares are precise fractions (1/2, 2/3, 1/6, 1/8 ...).
 * Using floating point here would introduce rounding error and break ʿaul/radd
 * proportioning, so every share is carried as an exact reduced fraction.
 */
export class Fraction {
  readonly num: number;
  readonly den: number;

  constructor(num: number, den: number = 1) {
    if (den === 0) throw new Error("Fraction denominator cannot be zero");
    if (den < 0) {
      num = -num;
      den = -den;
    }
    const g = Fraction.gcd(Math.abs(num), Math.abs(den)) || 1;
    this.num = num / g;
    this.den = den / g;
  }

  static gcd(a: number, b: number): number {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      [a, b] = [b, a % b];
    }
    return a;
  }

  static zero(): Fraction {
    return new Fraction(0, 1);
  }

  add(other: Fraction): Fraction {
    return new Fraction(this.num * other.den + other.num * this.den, this.den * other.den);
  }

  sub(other: Fraction): Fraction {
    return new Fraction(this.num * other.den - other.num * this.den, this.den * other.den);
  }

  mul(other: Fraction): Fraction {
    return new Fraction(this.num * other.num, this.den * other.den);
  }

  div(other: Fraction): Fraction {
    return new Fraction(this.num * other.den, this.den * other.num);
  }

  scale(k: number): Fraction {
    return new Fraction(this.num * k, this.den);
  }

  isZero(): boolean {
    return this.num === 0;
  }

  gt(other: Fraction): boolean {
    return this.num * other.den > other.num * this.den;
  }

  lt(other: Fraction): boolean {
    return this.num * other.den < other.num * this.den;
  }

  eq(other: Fraction): boolean {
    return this.num * other.den === other.num * this.den;
  }

  toNumber(): number {
    return this.num / this.den;
  }

  toString(): string {
    if (this.den === 1) return `${this.num}`;
    return `${this.num}/${this.den}`;
  }
}

/** Lowest common multiple of a list of denominators. */
export function lcmAll(values: number[]): number {
  return values.reduce((acc, v) => (acc * v) / Fraction.gcd(acc, v), 1);
}
