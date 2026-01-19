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

export interface BaseSpawnerConfig<T> {
  pool: ObjectPool<T>;
  stage: PIXI.Container;
}

export interface CollectibleSpawnerConfig<T> extends BaseSpawnerConfig<T> {
  coordinationService?: SpawnCoordinationService;
  getIntervalModifier?: ((context: SpawnContext) => number) | null;
}

export interface ObstacleSpawnerConfig<T> extends CollectibleSpawnerConfig<T> {
  textures?: PIXI.Texture[];
}

export interface ObstacleEntity {
  lane: Lane;
  getSprite(): { x: number };
  isActive(): boolean;
  reset?(): void;
  deactivate?(): void;
}

export interface CoinEntity {
  lane: Lane;
  x: number;
  isActive(): boolean;
  reset?(): void;
  deactivate?(): void;
}

export type EntityFactory<T> = () => T;

export type EntityResetFn<T> = (entity: T) => void;

export interface PoolStats {
  active: number;
  pooled: number;
  total: number;
}

export interface PoolRegistrationConfig {
  texture?: PIXI.Texture | PIXI.Spritesheet;
  [key: string]: unknown;
}

export interface SpawnSystemTextures {
  obstacles: PIXI.Texture[];
  coinSpritesheet: PIXI.Spritesheet;
  star: PIXI.Texture;
  cloud: PIXI.Texture;
  boosterSpritesheet: PIXI.Spritesheet;
  coinCollectEffectSpritesheet: PIXI.Spritesheet;
  collisionEffectSpritesheet: PIXI.Spritesheet;
}

export interface SpawnSystemUpdateContext extends SpawnContext {
  isBoosterActive?: boolean;
}
