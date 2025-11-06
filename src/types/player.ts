import { Lane } from './common';

export interface Player {
  moveUp(): void;
  moveDown(): void;
  moveToLane(lane: Lane): void;
  switchAnimation(isBooster: boolean): void;
}
