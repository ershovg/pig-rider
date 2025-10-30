/**
 * Управление прогрессией игры (скорость, счет, win/lose условия)
 * Hybrid подход: Постепенный рост + фиксированный мощный бустер
 * Нативный lerp для плавных переходов (синхронно с game loop)
 */
import { CONFIG } from '../../../shared/config/constants.js';

export class ProgressionManager {
  constructor(ui) {
    this.ui = ui;
    this.score = 0;

    // Постепенная скорость (растет каждый фрейм)
    this.baseSpeed = CONFIG.GAME_SPEED;

    // Текущая актуальная скорость (lerp к targetSpeed)
    this.currentSpeed = CONFIG.GAME_SPEED;

    // Целевая скорость (для плавных переходов)
    this.targetSpeed = CONFIG.GAME_SPEED;

    // Booster state
    this.isBoosterActive = false;
    this.boosterTransitionSpeed = 5.0; // Скорость lerp (выше = быстрее переход)

    console.log('📊 ProgressionManager initialized with gradual progression + native lerp');
  }

  update(deltaTime) {
    // 1. Обновляем базовую скорость (постепенный рост)
    if (!this.isBoosterActive) {
      this.baseSpeed = Math.min(
        this.baseSpeed + CONFIG.SPEED_INCREMENT,
        CONFIG.MAX_SPEED
      );
      this.targetSpeed = this.baseSpeed;
    }

    // 2. Плавная интерполяция к целевой скорости (lerp)
    // Это работает синхронно с game loop - никаких подергиваний!
    const diff = this.targetSpeed - this.currentSpeed;
    if (Math.abs(diff) > 0.001) {
      // Lerp formula: current += (target - current) * speed * deltaTime
      this.currentSpeed += diff * this.boosterTransitionSpeed * deltaTime;
    } else {
      // Snap when very close
      this.currentSpeed = this.targetSpeed;
    }
  }

  /**
   * Активировать временное ускорение бустера
   * Плавно разгоняется относительно текущей скорости (как в Subway Surfers)
   * Мультипликатор ×1.6 с cap на MAX_SPEED (2.5)
   */
  activateBoosterSpeed() {
    this.isBoosterActive = true;

    // Динамическая скорость бустера (текущая × 1.6, но не выше MAX_SPEED)
    // Это решает проблему контраста: в начале +60%, в конце достигает максимума
    const boosterMultiplier = 1.6;
    this.targetSpeed = Math.min(
      this.baseSpeed * boosterMultiplier,  // 60% прибавка к текущей скорости
      CONFIG.MAX_SPEED                     // Cap: не выше 2.5x
    );

    // Увеличиваем скорость перехода для быстрого разгона (как в Subway Surfers)
    this.boosterTransitionSpeed = 6.0; // Быстрее чем обычно для эффекта "ракеты"

    console.log(`⚡ Booster activating: ${this.currentSpeed.toFixed(2)}x → ${this.targetSpeed.toFixed(2)}x (${this.baseSpeed.toFixed(2)} × ${boosterMultiplier})`);
  }

  /**
   * Деактивировать временное ускорение бустера
   * Плавно возвращает скорость к текущей постепенной скорости
   */
  deactivateBoosterSpeed() {
    this.isBoosterActive = false;

    // Возвращаемся к базовой постепенной скорости
    this.targetSpeed = this.baseSpeed;

    // Немного снижаем скорость перехода для плавного торможения
    this.boosterTransitionSpeed = 4.0; // Медленнее для эффекта "торможения"

    console.log(`🛑 Booster deactivating: ${this.currentSpeed.toFixed(2)}x → ${this.targetSpeed.toFixed(2)}x`);
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

  /**
   * Получить текущую скорость игры
   * Возвращает интерполированную скорость (lerp)
   * @returns {number} - Текущая скорость
   */
  getGameSpeed() {
    return this.currentSpeed;
  }

  /**
   * Получить статистику для отладки
   */
  getStats() {
    return {
      score: this.score,
      baseSpeed: this.baseSpeed.toFixed(3),
      currentSpeed: this.currentSpeed.toFixed(3),
      targetSpeed: this.targetSpeed.toFixed(3),
      isBoosterActive: this.isBoosterActive
    };
  }

  reset() {
    this.score = 0;

    // Сбрасываем все скорости
    this.baseSpeed = CONFIG.GAME_SPEED;
    this.currentSpeed = CONFIG.GAME_SPEED;
    this.targetSpeed = CONFIG.GAME_SPEED;

    // Сбрасываем booster state
    this.isBoosterActive = false;
    this.boosterTransitionSpeed = 5.0;

    console.log('🔄 ProgressionManager reset (speed: 1.0x, native lerp mode)');
  }
}
