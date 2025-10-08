import { CONFIG } from '../config/constants.js';

/**
 * DifficultyManager - управление сложностью игры
 * Отвечает за динамическое изменение параметров спавна в зависимости от прогресса
 * Поддерживает систему snapshot/restore для временных изменений (например, бустеры)
 */
export class DifficultyManager {
  constructor() {
    // Текущий счёт игрока
    this.currentScore = 0;

    // Базовые интервалы спавна (секунды)
    this.baseCoinSpawnInterval = 0.8;
    this.baseObstacleSpawnInterval = 1.2;
    this.baseBoosterSpawnInterval = 8.0;

    // Текущие (динамические) интервалы спавна
    this.currentCoinSpawnInterval = this.baseCoinSpawnInterval;
    this.currentObstacleSpawnInterval = this.baseObstacleSpawnInterval;
    this.currentBoosterSpawnInterval = this.baseBoosterSpawnInterval;

    // Множители сложности (изменяются по мере прогресса)
    this.coinFrequencyMultiplier = 1.0; // Чем выше, тем чаще монеты
    this.obstacleFrequencyMultiplier = 1.0; // Чем выше, тем чаще препятствия

    console.log('📊 DifficultyManager initialized');
  }

  /**
   * Обновить счёт и пересчитать сложность
   */
  updateScore(score) {
    this.currentScore = score;
    this.recalculateDifficulty();
  }

  /**
   * Пересчитать параметры сложности на основе текущего счёта
   * В будущем здесь будет логика повышения сложности
   */
  recalculateDifficulty() {
    // Примерная логика (можно улучшать):
    // Каждые 50 монет немного увеличиваем частоту спавна монет
    const progressTier = Math.floor(this.currentScore / 50);

    // Увеличиваем частоту монет на 10% за каждый tier (максимум +50%)
    this.coinFrequencyMultiplier = 1.0 + Math.min(progressTier * 0.1, 0.5);

    // Увеличиваем частоту препятствий на 5% за каждый tier (максимум +30%)
    this.obstacleFrequencyMultiplier = 1.0 + Math.min(progressTier * 0.05, 0.3);

    // Пересчитываем интервалы (меньше интервал = чаще спавн)
    this.currentCoinSpawnInterval = this.baseCoinSpawnInterval / this.coinFrequencyMultiplier;
    this.currentObstacleSpawnInterval = this.baseObstacleSpawnInterval / this.obstacleFrequencyMultiplier;
  }

  /**
   * Получить текущий интервал спавна монет
   */
  getCoinSpawnInterval() {
    return this.currentCoinSpawnInterval;
  }

  /**
   * Получить текущий интервал спавна препятствий
   */
  getObstacleSpawnInterval() {
    return this.currentObstacleSpawnInterval;
  }

  /**
   * Получить текущий интервал спавна бустеров
   */
  getBoosterSpawnInterval() {
    return this.currentBoosterSpawnInterval;
  }

  /**
   * Создать snapshot текущего состояния (перед применением временных эффектов)
   * @returns {Object} - Snapshot состояния
   */
  createSnapshot() {
    return {
      score: this.currentScore,
      coinSpawnInterval: this.currentCoinSpawnInterval,
      obstacleSpawnInterval: this.currentObstacleSpawnInterval,
      boosterSpawnInterval: this.currentBoosterSpawnInterval,
      coinFrequencyMultiplier: this.coinFrequencyMultiplier,
      obstacleFrequencyMultiplier: this.obstacleFrequencyMultiplier
    };
  }

  /**
   * Восстановить состояние из snapshot (после окончания временных эффектов)
   * @param {Object} snapshot - Snapshot для восстановления
   */
  restoreSnapshot(snapshot) {
    if (!snapshot) {
      console.warn('⚠️ Cannot restore: snapshot is null');
      return;
    }

    this.currentScore = snapshot.score;
    this.currentCoinSpawnInterval = snapshot.coinSpawnInterval;
    this.currentObstacleSpawnInterval = snapshot.obstacleSpawnInterval;
    this.currentBoosterSpawnInterval = snapshot.boosterSpawnInterval;
    this.coinFrequencyMultiplier = snapshot.coinFrequencyMultiplier;
    this.obstacleFrequencyMultiplier = snapshot.obstacleFrequencyMultiplier;

    console.log('📸 Difficulty state restored from snapshot');
  }

  /**
   * Применить временный эффект бустера (перезаписывает текущие интервалы)
   * Используется для резкого изменения параметров на время бустера
   */
  applyBoosterEffect() {
    // Во время бустера используется специальный интервал из CONFIG
    this.currentCoinSpawnInterval = CONFIG.BOOSTER_COIN_SPAWN_INTERVAL;

    console.log('✨ Booster effect applied to difficulty');
  }

  /**
   * Сбросить все параметры в начальное состояние
   */
  reset() {
    this.currentScore = 0;
    this.coinFrequencyMultiplier = 1.0;
    this.obstacleFrequencyMultiplier = 1.0;
    this.currentCoinSpawnInterval = this.baseCoinSpawnInterval;
    this.currentObstacleSpawnInterval = this.baseObstacleSpawnInterval;
    this.currentBoosterSpawnInterval = this.baseBoosterSpawnInterval;

    console.log('🔄 DifficultyManager reset');
  }

  /**
   * Получить текущую статистику (для дебага)
   */
  getStats() {
    return {
      score: this.currentScore,
      coinInterval: this.currentCoinSpawnInterval.toFixed(2),
      obstacleInterval: this.currentObstacleSpawnInterval.toFixed(2),
      coinMultiplier: this.coinFrequencyMultiplier.toFixed(2),
      obstacleMultiplier: this.obstacleFrequencyMultiplier.toFixed(2)
    };
  }
}
