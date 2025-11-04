import { BaseSpawner } from '../../spawning/spawners/BaseSpawner.js';
import { CONFIG } from '../../../shared/config/constants.ts';
import { MathUtils } from '../../../shared/utils/MathUtils.ts';

/**
 * Спавнер монет с поддержкой двух режимов:
 * - Normal: случайные полосы, переменный интервал
 * - Booster: одна полоса, плотное расположение (80px)
 */
export class CoinSpawner extends BaseSpawner {
  constructor(config) {
    super({
      pool: config.pool,
      stage: config.stage,
      baseInterval: 800,
      getIntervalModifier: config.getIntervalModifier
    });

    this.coordinationService = config.coordinationService;
    this.lastCoinX = [0, 0, 0];
    this.timer = 100;
  }

  getCurrentInterval(context) {
    const { isBoosterMode = false, gameSpeed = 1.0, difficultyManager = null } = context;

    if (isBoosterMode) {
      return CONFIG.BOOSTER_COIN_SPAWN_INTERVAL * 1000;
    }

    const baseInterval = difficultyManager
      ? difficultyManager.getCoinSpawnInterval() * 1000
      : this.baseInterval;

    return baseInterval / gameSpeed;
  }

  spawn(gameSpeed, context = {}) {
    const { isBoosterMode = false, boosterActiveLane = 0 } = context;

    if (isBoosterMode) {
      this.spawnBoosterCoin(boosterActiveLane);
    } else {
      this.spawnNormalCoin();
    }
  }

  spawnNormalCoin() {
    const lane = MathUtils.randomInt(0, CONFIG.LANES.TOTAL - 1);
    const distance = MathUtils.randomFloat(CONFIG.COIN.MIN_DISTANCE, CONFIG.COIN.MAX_DISTANCE);

    const spawnX = Math.max(
      CONFIG.CANVAS_WIDTH + distance,
      this.lastCoinX[lane] + distance
    );

    if (this.coordinationService && !this.coordinationService.canSpawnAt(lane, spawnX, 150)) {
      return;
    }

    const coin = this.pool.acquire();
    if (coin) {
      coin.activate(lane, spawnX);
      this.lastCoinX[lane] = spawnX;
    }
  }

  spawnBoosterCoin(lane) {
    const distance = 80; // Плотное расположение для booster режима

    const spawnX = Math.max(
      CONFIG.CANVAS_WIDTH + distance,
      this.lastCoinX[lane] + distance
    );

    const coin = this.pool.acquire();
    if (coin) {
      coin.activate(lane, spawnX);
      this.lastCoinX[lane] = spawnX;
    }
  }

  /**
   * Заполняет полосу 20 монетами при старте бустера
   */
  fillLaneWithCoins(lane) {
    const coinCount = 20;
    const spacing = 80;
    let spawnX = CONFIG.CANVAS_WIDTH + 100;

    for (let i = 0; i < coinCount; i++) {
      const coin = this.pool.acquire();
      if (coin) {
        coin.activate(lane, spawnX);
        spawnX += spacing;
      }
    }

    this.lastCoinX[lane] = spawnX;
    console.log(`[CoinSpawner] Filled lane ${lane} with ${coinCount} coins`);
  }

  reset() {
    super.reset();
    this.lastCoinX = [0, 0, 0];
  }

  /**
   * Очищает дальние booster-монеты (оставляет ~5 ближайших) и монеты на препятствиях
   */
  clearBoosterCoins() {
    const activeCoins = this.getActiveObjects();
    let clearedCount = 0;
    let safetyCleared = 0;

    // Оставляем ~5 монет (400px = 5 * 80px spacing)
    const keepThreshold = CONFIG.CANVAS_WIDTH + 400;

    for (let i = activeCoins.length - 1; i >= 0; i--) {
      const coin = activeCoins[i];
      if (coin && coin.isActive()) {
        const coinX = coin.x;
        const coinLane = coin.lane;
        let shouldRemove = false;

        if (coinX > keepThreshold) {
          shouldRemove = true;
          clearedCount++;
        } else if (this.coordinationService && !this.coordinationService.canSpawnAt(coinLane, coinX, 150)) {
          shouldRemove = true;
          safetyCleared++;
        }

        if (shouldRemove) {
          coin.deactivate();
          this.pool.release(coin);
        }
      }
    }

    console.log(`[CoinSpawner] Cleared ${clearedCount} distant + ${safetyCleared} unsafe coins`);
  }

  getCoinsInLane(lane) {
    return this.getActiveObjects().filter(coin => coin.lane === lane);
  }
}
