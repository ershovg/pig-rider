import type * as PIXI from 'pixi.js';
import { ObjectPool } from '../../../shared/utils/ObjectPool';
import type {
  EntityFactory,
  EntityResetFn,
  PoolStats,
  PoolRegistrationConfig
} from '../../../types/spawning';

export class EntityPoolManager {
  private stage: PIXI.Container;
  private decorationLayer: PIXI.Container | null;
  private effectsLayer: PIXI.Container | null;
  private pools: Map<string, ObjectPool<unknown>>;

  constructor(stage: PIXI.Container, decorationLayer: PIXI.Container | null = null, effectsLayer: PIXI.Container | null = null) {
    this.stage = stage;
    this.decorationLayer = decorationLayer;
    this.effectsLayer = effectsLayer;
    this.pools = new Map(); // Хранилище пулов: name -> ObjectPool
  }

  registerPool<T extends object>(
    name: string,
    EntityClass: new (texture?: PIXI.Texture | PIXI.Spritesheet, container?: PIXI.Container) => T,
    initialSize: number,
    entityConfig: PoolRegistrationConfig = {}
  ): void {
    if (this.pools.has(name)) {
      return;
    }

    // Determine target container based on entity type:
    // - Decorations (cloud, star) → decorationLayer (background)
    // - Effects (coinCollectEffect, collisionEffect) → effectsLayer (on top)
    // - Game objects (obstacle, coin, booster, player) → stage (middle layer)
    const isDecoration = (name === 'cloud' || name === 'star');
    const isEffect = (name === 'coinCollectEffect' || name === 'collisionEffect');

    let targetContainer: PIXI.Container;
    if (isDecoration && this.decorationLayer) {
      targetContainer = this.decorationLayer;
    } else if (isEffect && this.effectsLayer) {
      targetContainer = this.effectsLayer;
    } else {
      targetContainer = this.stage;
    }

    const factory: EntityFactory<T> = () => {
      return new EntityClass(entityConfig.texture, targetContainer);
    };

    const reset: EntityResetFn<T> = (entity: T) => {
      if ('reset' in entity && typeof entity.reset === 'function') {
        entity.reset();
      } else if ('deactivate' in entity && typeof entity.deactivate === 'function') {
        entity.deactivate();
      }
    };

    let maxSize: number;
    if (name === 'obstacle') {
      maxSize = initialSize * 3;
    } else if (name === 'coin' || name === 'star') {
      maxSize = initialSize * 2;
    } else {
      maxSize = Math.ceil(initialSize * 1.5);
    }
    const pool = new ObjectPool<T>(factory, reset, initialSize, maxSize);

    this.pools.set(name, pool as ObjectPool<unknown>);
  }

  getPool<T = unknown>(name: string): ObjectPool<T> {
    const pool = this.pools.get(name);
    if (!pool) {
      throw new Error(`Pool "${name}" not found. Did you forget to register it?`);
    }
    return pool as ObjectPool<T>;
  }

  acquire<T = unknown>(poolName: string): T | null {
    return this.getPool<T>(poolName).acquire();
  }

  release<T = unknown>(poolName: string, obj: T): void {
    this.getPool<T>(poolName).release(obj);
  }

  releaseAll(poolName: string): void {
    this.getPool(poolName).releaseAll();
  }

  getActiveObjects<T = unknown>(poolName: string): T[] {
    return this.getPool<T>(poolName).getActive();
  }

  resetAll(): void {
    this.pools.forEach((pool) => {
      pool.releaseAll();
    });
  }

  getAllStats(): Record<string, PoolStats> {
    const stats: Record<string, PoolStats> = {};

    this.pools.forEach((pool, name) => {
      stats[name] = {
        active: pool.getActiveCount(),
        pooled: pool.getPooledCount(),
        total: pool.getTotalCount()
      };
    });

    return stats;
  }

  logStats(): void {
    const stats = this.getAllStats();

    Object.entries(stats).forEach(([name, stat]) => {
      console.log(
        `${name.padEnd(12)} | Active: ${stat.active.toString().padStart(3)} | ` +
        `Pooled: ${stat.pooled.toString().padStart(3)} | ` +
        `Total: ${stat.total.toString().padStart(3)}`
      );
    });
  }

  hasPool(name: string): boolean {
    return this.pools.has(name);
  }

  removePool(name: string): void {
    if (this.pools.has(name)) {
      this.pools.get(name)!.releaseAll();
      this.pools.delete(name);
    }
  }

  getPoolCount(): number {
    return this.pools.size;
  }
}
