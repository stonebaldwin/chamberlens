/** Hard per-period spend cap so a misconfig can't run up STT cost. */
export class BudgetExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BudgetExceededError";
  }
}

export interface SpendStore {
  getSpentUsd(period: string): Promise<number>;
  addSpendUsd(period: string, amount: number): Promise<void>;
}

/** In-memory store for tests; the pipeline wires a DB-backed store in Phase 6. */
export class InMemorySpendStore implements SpendStore {
  private readonly spend = new Map<string, number>();
  async getSpentUsd(period: string): Promise<number> {
    return this.spend.get(period) ?? 0;
  }
  async addSpendUsd(period: string, amount: number): Promise<void> {
    this.spend.set(period, (this.spend.get(period) ?? 0) + amount);
  }
}

export function periodKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export interface BudgetGuardOptions {
  monthlyCapUsd: number;
  store: SpendStore;
  /** Fraction (0..1) at which to fire onWarn (e.g. 0.8 = warn at 80%). */
  warnAtFraction?: number;
  onWarn?(spentUsd: number, capUsd: number): void | Promise<void>;
  now?: () => Date;
}

export class BudgetGuard {
  constructor(private readonly opts: BudgetGuardOptions) {}

  private now(): Date {
    return this.opts.now?.() ?? new Date();
  }

  estimateUsd(durationSeconds: number, costPerMinuteUsd: number): number {
    return (durationSeconds / 60) * costPerMinuteUsd;
  }

  /** Throws BudgetExceededError if spending `estimateUsd` would exceed the cap. */
  async assertCanSpend(estimateUsd: number): Promise<void> {
    const period = periodKey(this.now());
    const spent = await this.opts.store.getSpentUsd(period);
    const projected = spent + estimateUsd;
    if (projected > this.opts.monthlyCapUsd) {
      throw new BudgetExceededError(
        `STT budget cap reached for ${period}: $${spent.toFixed(2)} + $${estimateUsd.toFixed(
          2,
        )} > $${this.opts.monthlyCapUsd.toFixed(2)}`,
      );
    }
    const frac = this.opts.monthlyCapUsd > 0 ? projected / this.opts.monthlyCapUsd : 1;
    if (this.opts.warnAtFraction && frac >= this.opts.warnAtFraction) {
      await this.opts.onWarn?.(projected, this.opts.monthlyCapUsd);
    }
  }

  async record(actualUsd: number): Promise<void> {
    await this.opts.store.addSpendUsd(periodKey(this.now()), actualUsd);
  }
}
