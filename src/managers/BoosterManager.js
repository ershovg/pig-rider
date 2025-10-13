/**
 * Управление логикой бустеров (активация, таймеры, cooldown)
 */
import { CONFIG } from '../config/constants.js';

export class BoosterManager {
  constructor(spawnSystem, difficultyManager, ui) {
    this.spawnSystem = spawnSystem;
    this.difficultyManager = difficultyManager;
    this.ui = ui;

    this.isActive = false;
    this.timeRemaining = 0;
    this.currentLane = 0;
    this.laneSwitchTimer = 0;
    this.cooldownTimer = 0;
    this.preBoosterSnapshot = null;
  }

  update(deltaTime) {
    if (this.cooldownTimer > 0) {
      this.cooldownTimer -= deltaTime;
    }

    if (this.isActive) {
      this.timeRemaining -= deltaTime;
      this.laneSwitchTimer -= deltaTime;

      if (this.laneSwitchTimer <= 0) {
        this.switchLane();
      }

      if (this.timeRemaining <= 0) {
        this.deactivate();
      }
    }
  }

  switchLane() {
    this.laneSwitchTimer = CONFIG.BOOSTER_LANE_SWITCH_INTERVAL;
    const availableLanes = [0, 1, 2].filter(l => l !== this.currentLane);
    this.currentLane = availableLanes[Math.floor(Math.random() * availableLanes.length)];
    this.spawnSystem.fillLaneWithCoins(this.currentLane);
    console.log(`🔄 Booster lane switched to: ${this.currentLane}`);
  }

  async activate() {
    this.preBoosterSnapshot = this.difficultyManager.createSnapshot();
    this.isActive = true;
    this.timeRemaining = CONFIG.BOOSTER_DURATION;
    this.laneSwitchTimer = CONFIG.BOOSTER_LANE_SWITCH_INTERVAL;
    this.currentLane = Math.floor(Math.random() * CONFIG.LANES.TOTAL);

    this.difficultyManager.applyBoosterEffect();
    this.spawnSystem.clearAllObstacles();
    this.spawnSystem.fillLaneWithCoins(this.currentLane);
    this.ui.addBoosterClass();

    console.log(`✨ Booster activated! Lane: ${this.currentLane}`);
  }

  deactivate() {
    this.isActive = false;
    this.timeRemaining = 0;
    this.laneSwitchTimer = 0;

    if (this.preBoosterSnapshot) {
      this.difficultyManager.restoreSnapshot(this.preBoosterSnapshot);
      this.preBoosterSnapshot = null;
    }

    this.cooldownTimer = CONFIG.BOOSTER_COOLDOWN_DURATION;
    this.ui.removeBoosterClass();

    console.log(`⏹️ Booster deactivated. Cooldown: ${CONFIG.BOOSTER_COOLDOWN_DURATION}s`);
  }

  reset() {
    this.isActive = false;
    this.timeRemaining = 0;
    this.currentLane = 0;
    this.laneSwitchTimer = 0;
    this.cooldownTimer = 0;
    this.preBoosterSnapshot = null;
  }

  getContext() {
    return {
      isBoosterMode: this.isActive,
      boosterActiveLane: this.currentLane,
      isBoosterActive: this.isActive,
      boosterCooldown: this.cooldownTimer
    };
  }
}
