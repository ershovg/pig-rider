import type {
  GameStateManager,
  ProgressionManager,
  BoosterManager,
  DifficultyManager,
  SpawnSystem,
  SoundManager
} from './managers';
import type { Player } from './player';
import type { UIController } from './ui';
import type { GameLoop, Renderer } from './core';
import type { SetWaitingForInputCallback } from './common';

export interface GameLifecycleManagerDependencies {
  stateManager: GameStateManager;
  progressionManager: ProgressionManager;
  boosterManager: BoosterManager;
  difficultyManager: DifficultyManager;
  player: Player;
  spawnSystem: SpawnSystem;
  gameLoop: GameLoop;
  renderer: Renderer;
  ui: UIController;
  soundManager: SoundManager;
  setWaitingForInput?: SetWaitingForInputCallback;
}

export interface ProgressionStats {
  score: number;
  baseSpeed: string;
  currentSpeed: string;
  targetSpeed: string;
  isBoosterActive: boolean;
}

export interface DifficultyStats {
  score: number;
  coinInterval: string;
  obstacleInterval: string;
  coinMultiplier: string;
  obstacleMultiplier: string;
}
