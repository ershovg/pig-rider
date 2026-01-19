import * as PIXI from 'pixi.js';
import type { ObjectPool, BaseSpawnerConfig, SpawnContext } from '../../../types/spawning';
import type { Entity } from '../../../types/entities';

interface BaseSpawnerConstructorConfig<T extends Entity> extends BaseSpawnerConfig<T> {
  baseInterval: number;
  getIntervalModifier?: ((context: SpawnContext) => number) | null;
  name?: string | null;
}

/**
 * Базовый класс spawner'ов (Template Method Pattern)
 * @template T - тип entity в пуле (должен расширять Entity)
 */
export abstract class BaseSpawner<T extends Entity> {
  protected pool: ObjectPool<T>;
  protected stage: PIXI.Container;
  protected baseInterval: number;
  protected getIntervalModifier: ((context: SpawnContext) => number) | null;
  protected timer: number;
  protected enabled: boolean;
  protected name: string;

  constructor(config: BaseSpawnerConstructorConfig<T>) {
    const { pool, stage, baseInterval, getIntervalModifier = null, name = null } = config;

    if (this.constructor === BaseSpawner) {
      throw new Error('BaseSpawner is abstract and cannot be instantiated directly');
    }

    this.pool = pool;
    this.stage = stage;
    this.baseInterval = baseInterval;
    this.getIntervalModifier = getIntervalModifier;
    this.timer = 0;
    this.enabled = true;
    this.name = name || this.constructor.name;
  }

  update(deltaTime: number, gameSpeed: number, context: SpawnContext = {}): void {
    if (!this.enabled) return;

    this.updateActiveObjects(deltaTime, gameSpeed, context);

    const timeForSpawnTimer = context.frameDeltaTime ?? deltaTime;
    this.timer += timeForSpawnTimer * 1000;

    const currentInterval = this.getCurrentInterval(context);

    if (this.timer >= currentInterval) {
      this.timer = 0;
      this.spawn(gameSpeed, context);
    }
  }

  protected getCurrentInterval(context: SpawnContext): number {
    if (this.getIntervalModifier) {
      const modifier = this.getIntervalModifier(context);
      return this.baseInterval * modifier;
    }
    return this.baseInterval;
  }

  protected updateActiveObjects(deltaTime: number, gameSpeed: number, context: SpawnContext): void {
    const objects = this.pool.getActive();
    const cullThreshold = context.cullThreshold;

    let culled = 0;

    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];

      obj.update(deltaTime, gameSpeed);

      // Проверяем, поддерживает ли объект culling
      if (cullThreshold !== undefined && 'shouldCull' in obj && typeof obj.shouldCull === 'function') {
        if (obj.shouldCull(cullThreshold)) {
          obj.deactivate();
          this.pool.release(obj);
          culled++;
          continue;
        }
      }

      if (!obj.isActive()) {
        this.pool.release(obj);
      }
    }

    if (culled > 0) {
      console.log(`[${this.name}] Culled ${culled} objects (threshold: ${cullThreshold}px)`);
    }
  }

  /**
   * Метод spawn должен быть реализован в подклассах
   * Template Method Pattern - каждый spawner определяет свою логику спавна
   */
  protected abstract spawn(gameSpeed: number, context: SpawnContext): void;

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  reset(): void {
    this.timer = 0;
    this.pool.releaseAll();
  }

  getStats(): { active: number; pooled: number; total: number } {
    return {
      active: this.pool.getActiveCount(),
      pooled: this.pool.getPooledCount(),
      total: this.pool.getTotalCount()
    };
  }

  getActiveObjects(): T[] {
    return this.pool.getActive();
  }
}
