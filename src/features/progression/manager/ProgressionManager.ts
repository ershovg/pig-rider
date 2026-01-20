import { CONFIG } from '../../../shared/config/constants';
import type { UIController, ProgressionStats } from '../../../types';

export class ProgressionManager {
  private ui: UIController;
  private score: number;
  private baseSpeed: number;
  private currentSpeed: number;
  private targetSpeed: number;
  private isBoosterActive: boolean;
  private boosterTransitionSpeed: number;

  constructor(ui: UIController) {
    this.ui = ui;
    this.score = 0;
    this.baseSpeed = CONFIG.GAME_SPEED;
    this.currentSpeed = CONFIG.GAME_SPEED;
    this.targetSpeed = CONFIG.GAME_SPEED;
    this.isBoosterActive = false;
    this.boosterTransitionSpeed = 5.0;
  }

  update(deltaTime: number): void {
    if (!this.isBoosterActive) {
      this.baseSpeed = Math.min(
        this.baseSpeed + CONFIG.SPEED_INCREMENT,
        CONFIG.MAX_SPEED
      );
      this.targetSpeed = this.baseSpeed;
    }

    const diff = this.targetSpeed - this.currentSpeed;
    if (Math.abs(diff) > 0.001) {
      this.currentSpeed += diff * this.boosterTransitionSpeed * deltaTime;
    } else {
      this.currentSpeed = this.targetSpeed;
    }
  }

  activateBoosterSpeed(): void {
    this.isBoosterActive = true;
    const boosterMultiplier = 1.6;
    this.targetSpeed = Math.min(
      this.baseSpeed * boosterMultiplier,
      CONFIG.MAX_SPEED
    );
    this.boosterTransitionSpeed = 6.0;
  }

  deactivateBoosterSpeed(): void {
    this.isBoosterActive = false;
    this.targetSpeed = this.baseSpeed;
    this.boosterTransitionSpeed = 4.0;
  }

  addScore(value: number): void {
    this.score += value;
    this.ui.updateCoinCount(this.score, CONFIG.TARGET_COINS);
  }

  checkWinCondition(): boolean {
    return this.score >= CONFIG.TARGET_COINS;
  }

  getScore(): number {
    return this.score;
  }

  getGameSpeed(): number {
    return this.currentSpeed;
  }

  getStats(): ProgressionStats {
    return {
      score: this.score,
      baseSpeed: this.baseSpeed.toFixed(3),
      currentSpeed: this.currentSpeed.toFixed(3),
      targetSpeed: this.targetSpeed.toFixed(3),
      isBoosterActive: this.isBoosterActive
    };
  }

  reset(): void {
    this.score = 0;
    this.baseSpeed = CONFIG.GAME_SPEED;
    this.currentSpeed = CONFIG.GAME_SPEED;
    this.targetSpeed = CONFIG.GAME_SPEED;
    this.isBoosterActive = false;
    this.boosterTransitionSpeed = 5.0;
  }
}
