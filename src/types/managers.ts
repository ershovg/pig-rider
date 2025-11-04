import { Lane } from './common';

export interface BoosterSnapshot {
  [key: string]: unknown;
}

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
  setMusicState(state: string): void;
}

export interface BoosterContext {
  isBoosterMode: boolean;
  boosterActiveLane: Lane;
  isBoosterActive: boolean;
  boosterCooldown: number;
}
