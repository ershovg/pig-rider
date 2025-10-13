/**
 * Управление прогрессией игры (скорость, счет, win/lose условия)
 */
import { CONFIG } from '../config/constants.js';

export class ProgressionManager {
  constructor(ui) {
    this.ui = ui;
    this.score = 0;
    this.gameSpeed = CONFIG.GAME_SPEED;
  }

  update(deltaTime) {
    this.gameSpeed = Math.min(
      this.gameSpeed + CONFIG.SPEED_INCREMENT,
      CONFIG.MAX_SPEED
    );
  }

  addScore(value) {
    this.score += value;
    this.ui.updateCoinCount(this.score, CONFIG.TARGET_COINS);
  }

  checkWinCondition() {
    return this.score >= CONFIG.TARGET_COINS;
  }

  getScore() {
    return this.score;
  }

  getGameSpeed() {
    return this.gameSpeed;
  }

  reset() {
    this.score = 0;
    this.gameSpeed = CONFIG.GAME_SPEED;
  }
}
