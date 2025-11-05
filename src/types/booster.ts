import { Lane } from './common';

export interface BoosterSnapshot {
  [key: string]: unknown;
}

export interface BoosterContext {
  isBoosterMode: boolean;
  boosterActiveLane: Lane;
  isBoosterActive: boolean;
  boosterCooldown: number;
}
