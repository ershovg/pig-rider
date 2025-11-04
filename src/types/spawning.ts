import { Lane } from './common';

export interface ObjectPool<T = unknown> {
  acquire(): T | null;
  release(obj: T): void;
  getActive(): T[];
}

export interface SpawnCoordinationService {
  canSpawnAt(lane: Lane, x: number, minDistance: number): boolean;
}

export interface ActivatableEntity {
  activate(lane: Lane, x: number): void;
}

export interface SpawnContext {
  isBoosterActive?: boolean;
  boosterCooldown?: number;
  frameDeltaTime?: number;
  cullThreshold?: number;
  [key: string]: unknown;
}
