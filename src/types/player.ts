import type { Lane } from './common';

export interface PlayerInputController {
  disable(): void;
  enable(): void;
}

export interface Player {
  moveUp(): void;
  moveDown(): void;
  moveToLane(lane: Lane): void;
  switchAnimation(isBooster: boolean): void;
  reset(): void;
  inputController?: PlayerInputController;
}
