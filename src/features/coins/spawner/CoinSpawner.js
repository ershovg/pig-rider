import { BaseSpawner } from '../../spawning/spawners/BaseSpawner.js';
import { CONFIG } from '../../../shared/config/constants.js';
import { MathUtils } from '../../../shared/utils/MathUtils.js';

/**
 * CoinSpawner - Отвечает за спавн монет
 *
 * Два режима работы:
 * 1. Normal Mode - случайные полосы, обычная плотность
 * 2. Booster Mode - только одна полоса, очень плотное расположение монет
 *
 * Ключевые особенности:
 * - Переключение режимов через контекст (isBoosterMode, boosterActiveLane)
 * - Разные интервалы спавна для разных режимов
 * - Отслеживание последних позиций на каждой полосе
 */
export class CoinSpawner extends BaseSpawner {
  /**
   * @param {Object} config
   * @param {ObjectPool} config.pool - Пул монет
   * @param {PIXI.Container} config.stage - Сцена
   * @param {Function} config.getIntervalModifier - Функция модификации интервала
   */
  constructor(config) {
    super({
      pool: config.pool,
      stage: config.stage,
      baseInterval: 800, // Базовый интервал (мс) - будет модифицироваться
      getIntervalModifier: config.getIntervalModifier
    });

    // Отслеживаем последнюю X-позицию монеты на каждой полосе
    this.lastCoinX = [0, 0, 0];

    this.timer = 100;
  }

  /**
   * Получить текущий интервал спавна с учетом режима
   * Переопределяем базовый метод для поддержки booster mode
   *
   * @param {Object} context - { isBoosterMode, gameSpeed, difficultyManager }
   * @returns {number} Интервал в миллисекундах
   */
  getCurrentInterval(context) {
    const { isBoosterMode = false, gameSpeed = 1.0, difficultyManager = null } = context;

    if (isBoosterMode) {
      // В booster режиме используем фиксированный короткий интервал
      return CONFIG.BOOSTER_COIN_SPAWN_INTERVAL * 1000; // Конвертируем в мс
    }

    // Нормальный режим: базовый интервал из difficulty manager
    const baseInterval = difficultyManager
      ? difficultyManager.getCoinSpawnInterval() * 1000 // Конвертируем в мс
      : this.baseInterval;

    // Модифицируем интервал по скорости игры
    return baseInterval / gameSpeed;
  }

  /**
   * Логика спавна монеты
   *
   * @param {number} gameSpeed - Текущая скорость игры
   * @param {Object} context - { isBoosterMode, boosterActiveLane }
   */
  spawn(gameSpeed, context = {}) {
    const { isBoosterMode = false, boosterActiveLane = 0 } = context;

    if (isBoosterMode) {
      this.spawnBoosterCoin(boosterActiveLane);
    } else {
      this.spawnNormalCoin();
    }
  }

  /**
   * Спавн монеты в обычном режиме
   * - Случайная полоса
   * - Случайное расстояние между MIN и MAX
   */
  spawnNormalCoin() {
    // Выбираем случайную полосу
    const lane = MathUtils.randomInt(0, CONFIG.LANES.TOTAL - 1);

    // Рассчитываем расстояние от последней монеты
    const minDist = CONFIG.COIN.MIN_DISTANCE;
    const maxDist = CONFIG.COIN.MAX_DISTANCE;
    const distance = MathUtils.randomFloat(minDist, maxDist);

    const spawnX = Math.max(
      CONFIG.CANVAS_WIDTH + distance,
      this.lastCoinX[lane] + distance
    );

    // Спавним монету
    const coin = this.pool.acquire();
    if (coin) {
      coin.activate(lane, spawnX);
      this.lastCoinX[lane] = spawnX;
    }
  }

  /**
   * Спавн монеты в booster режиме
   * - Только на заданной полосе
   * - Очень плотное расположение (80px между монетами)
   *
   * @param {number} lane - Активная полоса для бустера (0, 1, 2)
   */
  spawnBoosterCoin(lane) {
    // В booster режиме монеты очень плотно расположены
    const distance = 80; // Фиксированное малое расстояние

    const spawnX = Math.max(
      CONFIG.CANVAS_WIDTH + distance,
      this.lastCoinX[lane] + distance
    );

    // Спавним монету
    const coin = this.pool.acquire();
    if (coin) {
      coin.activate(lane, spawnX);
      this.lastCoinX[lane] = spawnX;
    }
  }

  /**
   * Заполнить полосу монетами мгновенно (для начала booster режима)
   * Спавнит 20 монет подряд на заданной полосе
   *
   * @param {number} lane - Полоса для заполнения (0, 1, 2)
   */
  fillLaneWithCoins(lane) {
    const coinCount = 20; // Количество монет для заполнения
    const spacing = 80; // Расстояние между монетами

    let spawnX = CONFIG.CANVAS_WIDTH + 100; // Начальная позиция

    for (let i = 0; i < coinCount; i++) {
      const coin = this.pool.acquire();
      if (coin) {
        coin.activate(lane, spawnX);
        spawnX += spacing; // Следующая монета дальше
      }
    }

    // Обновляем последнюю позицию
    this.lastCoinX[lane] = spawnX;

    console.log(`[CoinSpawner] Filled lane ${lane} with ${coinCount} coins`);
  }

  /**
   * Сброс состояния
   */
  reset() {
    super.reset();
    this.lastCoinX = [0, 0, 0];
  }

  /**
   * Получить монеты на конкретной полосе (для отладки)
   * @param {number} lane - Номер полосы
   * @returns {Array}
   */
  getCoinsInLane(lane) {
    return this.getActiveObjects().filter(coin => coin.lane === lane);
  }
}
