import { Lane } from './common';
import { BoosterSnapshot } from './booster';

export interface SpawnSystem {
  clearAllObstacles(): void;
  fillLaneWithCoins(lane: Lane): void;
  clearBoosterCoins(): void;
}

export interface DifficultyManager {
  createSnapshot(): BoosterSnapshot;
  applyBoosterEffect(): void;
  restoreSnapshot(snapshot: BoosterSnapshot): void;
}

export interface ProgressionManager {
  activateBoosterSpeed(): void;
  deactivateBoosterSpeed(): void;
}

export interface SoundManager {
  play(alias: string, options?: Record<string, unknown>): void;
  setMusicState(state: string, context?: Record<string, unknown>): void;
}
