import type { CullableEntity } from '../../../types/rendering';
import type { ObjectPool } from '../../../types/spawning';

interface CullingManagerConfig {
  cullThreshold?: number;
  leftMultiplier?: number;
  rightMultiplier?: number;
  rendererWidth?: number;
  timeBudgetMs?: number;
}

interface CullingStats {
  totalCulled: number;
  lastCulled: number;
  budgetExceeded: number;
}

interface CullingBoundaries {
  left: number;
  right: number;
  width: number;
}

export class CullingManager {
  private leftMultiplier: number;
  private rightMultiplier: number;
  private rendererWidth: number;
  private useStaticThreshold: boolean;
  public cullThreshold: number;
  private timeBudgetMs: number;
  private stats: CullingStats;

  constructor(config: CullingManagerConfig = {}) {
    this.leftMultiplier = config.leftMultiplier ?? 0.15;
    this.rightMultiplier = config.rightMultiplier ?? 1.15;
    this.rendererWidth = config.rendererWidth ?? 1920;

    this.useStaticThreshold = config.cullThreshold !== undefined;

    if (this.useStaticThreshold) {
      this.cullThreshold = config.cullThreshold!;
    } else {
      this.cullThreshold = -this.leftMultiplier * this.rendererWidth;
    }

    this.timeBudgetMs = config.timeBudgetMs ?? 1;

    this.stats = {
      totalCulled: 0,
      lastCulled: 0,
      budgetExceeded: 0
    };

    console.log(`[CullingManager] Initialized with threshold: ${this.cullThreshold}px`);
  }

  setBoundaries(rendererWidth: number, leftMultiplier?: number, rightMultiplier?: number): void {
    this.rendererWidth = rendererWidth;
    if (leftMultiplier !== undefined) this.leftMultiplier = leftMultiplier;
    if (rightMultiplier !== undefined) this.rightMultiplier = rightMultiplier;

    if (!this.useStaticThreshold) {
      this.cullThreshold = -this.leftMultiplier * this.rendererWidth;
    }
  }

  getBoundaries(): CullingBoundaries {
    return {
      left: -this.leftMultiplier * this.rendererWidth,
      right: this.rightMultiplier * this.rendererWidth,
      width: this.rendererWidth
    };
  }

  cullWithBudget(entities: CullableEntity[], pool: ObjectPool | null = null): number {
    const startTime = performance.now();
    let culled = 0;
    let processed = 0;

    for (let i = entities.length - 1; i >= 0; i--) {
      processed++;

      if (processed % 10 === 0) {
        const elapsed = performance.now() - startTime;
        if (elapsed > this.timeBudgetMs) {
          this.stats.budgetExceeded++;
          break;
        }
      }

      const entity = entities[i];

      if (entity.shouldCull && entity.shouldCull(this.cullThreshold)) {
        entity.deactivate();

        if (pool) {
          pool.release(entity);
        }

        culled++;
      }
    }

    const timeMs = performance.now() - startTime;

    this.stats.totalCulled += culled;
    this.stats.lastCulled = culled;

    if (culled > 0) {
      console.log(`[Culling] Removed ${culled} objects (threshold: ${this.cullThreshold}px, time: ${timeMs.toFixed(2)}ms)`);
    }

    return culled;
  }

  cullAll(entities: CullableEntity[], pool: ObjectPool | null = null): number {
    let culled = 0;

    for (let i = entities.length - 1; i >= 0; i--) {
      const entity = entities[i];

      if (entity.shouldCull && entity.shouldCull(this.cullThreshold)) {
        entity.deactivate();

        if (pool) {
          pool.release(entity);
        }

        culled++;
      }
    }

    this.stats.totalCulled += culled;
    this.stats.lastCulled = culled;

    if (culled > 0) {
      console.log(`[Culling] Removed ${culled} decorations (threshold: ${this.cullThreshold}px)`);
    }

    return culled;
  }

  cullSingle(entity: CullableEntity, pool: ObjectPool | null = null): boolean {
    if (entity.shouldCull && entity.shouldCull(this.cullThreshold)) {
      entity.deactivate();

      if (pool) {
        pool.release(entity);
      }

      this.stats.totalCulled++;
      this.stats.lastCulled = 1;
      return true;
    }
    return false;
  }

  getStats(): CullingStats {
    return { ...this.stats };
  }

  resetStats(): void {
    this.stats.totalCulled = 0;
    this.stats.lastCulled = 0;
    this.stats.budgetExceeded = 0;
  }

  setThreshold(threshold: number): void {
    this.cullThreshold = threshold;
  }

  setTimeBudget(budgetMs: number): void {
    this.timeBudgetMs = budgetMs;
  }
}
