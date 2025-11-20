import type { Lane, GameState } from './common';
import type { BoosterSnapshot } from './booster';
import type { ProgressionStats, DifficultyStats } from './progression';
import type { ObjectPool } from './spawning';
import type { CullableEntity } from './rendering';

export interface SpawnSystem {
  clearAllObstacles(): void;
  fillLaneWithCoins(lane: Lane): void;
  clearBoosterCoins(): void;
  clearAllEffects(): void;
  reset(): void;
  getActiveObstacles(): CullableEntity[];
  getActiveCoins(): CullableEntity[];
  getActiveClouds(): CullableEntity[];
  getActiveStars(): CullableEntity[];
  obstacleSpawner?: { pool: ObjectPool };
  coinSpawner?: { pool: ObjectPool };
  cloudSpawner?: { pool: ObjectPool };
  starSpawner?: { pool: ObjectPool };
}

export interface DifficultyManager {
  createSnapshot(): BoosterSnapshot;
  applyBoosterEffect(): void;
  restoreSnapshot(snapshot: BoosterSnapshot): void;
  reset(): void;
  updateScore(score: number): void;
  recalculateDifficulty(): void;
  getCoinSpawnInterval(): number;
  getObstacleSpawnInterval(): number;
  getBoosterSpawnInterval(): number;
  getStats(): DifficultyStats;
}

export interface ProgressionManager {
  activateBoosterSpeed(): void;
  deactivateBoosterSpeed(): void;
  reset(): void;
  update(deltaTime: number): void;
  addScore(value: number): void;
  checkWinCondition(): boolean;
  getScore(): number;
  getGameSpeed(): number;
  getStats(): ProgressionStats;
}

export interface BoosterManager {
  reset(): void;
  isFirstBooster(): boolean;
  markFirstBoosterUsed(): void;
  activate(): Promise<void>;
  isFirstBoosterEver: boolean;
}

export interface GameStateManager {
  setState(newState: GameState): void;
  getState(): GameState;
  isPlaying(): boolean;
  isPaused(): boolean;
  isEnded(): boolean;
  isMenu(): boolean;
}

export interface SoundAsset {
  stop(): void;
}

export interface VolumeRestore {
  restore(fadeDuration: number): void;
}

export interface SoundManager {
  play(alias: string, options?: Record<string, unknown>): void;
  setMusicState(state: string, context?: Record<string, unknown>): void;
  sounds: Map<string, SoundAsset>;
  pauseForModal(volume: number): VolumeRestore;
  reset(): void;
}
