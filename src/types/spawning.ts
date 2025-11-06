import type * as PIXI from 'pixi.js';
import { Lane } from './common';

export interface ObjectPool<T = unknown> {
  acquire(): T | null;
  release(obj: T): void;
  releaseAll(): void;
  getActive(): T[];
  getActiveCount(): number;
  getPooledCount(): number;
  getTotalCount(): number;
}

export interface SpawnCoordinationService {
  canSpawnAt(lane: Lane, x: number, minDistance: number): boolean;
  canSpawnObstacleAt(lane: Lane, x: number, safeRadius: number): boolean;
  setCoinPool(coinPool: ObjectPool): void;
}

export interface ActivatableEntity {
  activate(lane: Lane, x: number): void;
}

/**
 * Контекст для spawner'ов
 * Передается в spawn() метод для передачи игрового состояния
 */
export interface SpawnContext {
  // Booster state
  isBoosterMode?: boolean;
  boosterActiveLane?: Lane;
  boosterCooldown?: number;

  // Game state
  gameSpeed?: number;

  // Difficulty
  difficultyManager?: {
    getCoinSpawnInterval?(): number;
    getObstacleSpawnInterval?(): number;
  } | null;

  // Rendering
  frameDeltaTime?: number;
  cullThreshold?: number;

  // Extensibility
  [key: string]: unknown;
}

/**
 * Базовая конфигурация для всех spawner'ов
 * @template T - тип entity в пуле
 */
export interface BaseSpawnerConfig<T> {
  pool: ObjectPool<T>;
  stage: PIXI.Container;
}

/**
 * Конфигурация для collectible spawner'ов (coins, boosters, gems, etc.)
 * Расширяет базовую конфигурацию с coordination и interval modifier
 * @template T - тип entity в пуле
 */
export interface CollectibleSpawnerConfig<T> extends BaseSpawnerConfig<T> {
  coordinationService?: SpawnCoordinationService;
  getIntervalModifier?: ((gameSpeed: number) => number) | null;
}

/**
 * Конфигурация для obstacle spawner'ов
 * Расширяет collectible config с texture support
 * @template T - тип entity в пуле
 */
export interface ObstacleSpawnerConfig<T> extends CollectibleSpawnerConfig<T> {
  textures?: PIXI.Texture[];
}
