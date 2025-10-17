/**
 * Управление логикой бустеров (активация, таймеры, cooldown)
 */
import { CONFIG } from '../config/constants.js';

export class BoosterManager {
  constructor(spawnSystem, difficultyManager, ui, player, soundManager = null) {
    this.spawnSystem = spawnSystem;
    this.difficultyManager = difficultyManager;
    this.ui = ui;
    this.player = player; // 🆕 Для переключения анимации
    this.soundManager = soundManager; // 🆕 Для управления музыкой (Dependency Injection)

    this.isActive = false;
    this.timeRemaining = 0;
    this.currentLane = 0;
    this.laneSwitchTimer = 0;
    this.cooldownTimer = 0;
    this.preBoosterSnapshot = null;

    // 🆕 Флаг первого бустера (для Context-Aware Pausing)
    // Используется чтобы приглушить музыку только при ПЕРВОМ получении бустера
    // (когда показывается обучающий модал с описанием что такое бустер)
    this.isFirstBoosterEver = true;
  }

  /**
   * Проверяет, первый ли раз игрок получает бустер
   * @returns {boolean}
   */
  isFirstBooster() {
    return this.isFirstBoosterEver;
  }

  /**
   * Помечает, что первый бустер был использован
   */
  markFirstBoosterUsed() {
    this.isFirstBoosterEver = false;
    console.log('✅ First booster used, future boosters will skip tutorial modal');
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

    // 🆕 Переключаем анимацию на бустер
    if (this.player) {
      this.player.switchAnimation(true);
    }

    // 🎵 Переключаем на booster музыкальное состояние
    // Это сделает gap crossfade + beat-sync переход
    if (this.soundManager) {
      this.soundManager.setMusicState('booster');
      console.log('🎵 Music state: booster (gap crossfade + beat-sync)');
    }

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

    // 🆕 Возвращаем обычную анимацию
    if (this.player) {
      this.player.switchAnimation(false);
    }

    // 🎵 Возвращаемся к gameplay музыкальному состоянию
    // Это сделает gap crossfade обратно
    if (this.soundManager) {
      this.soundManager.setMusicState('gameplay');
      console.log('🎵 Music state: gameplay (gap crossfade back)');
    }

    console.log(`⏹️ Booster deactivated. Cooldown: ${CONFIG.BOOSTER_COOLDOWN_DURATION}s`);
  }

  reset() {
    this.isActive = false;
    this.timeRemaining = 0;
    this.currentLane = 0;
    this.laneSwitchTimer = 0;
    this.cooldownTimer = 0;
    this.preBoosterSnapshot = null;

    // 🔧 НЕ сбрасываем isFirstBoosterEver при reset()
    // Это флаг для всей сессии игры, должен сохраняться между рестартами
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
