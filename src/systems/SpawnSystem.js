import { EntityPoolManager } from './pools/EntityPoolManager.js';

// Spawners
import { ObstacleSpawner } from './spawners/ObstacleSpawner.js';
import { CoinSpawner } from './spawners/CoinSpawner.js';
import { CloudSpawner } from './spawners/CloudSpawner.js';
import { StarSpawner } from './spawners/StarSpawner.js';
import { BoosterSpawner } from './spawners/BoosterSpawner.js';
import { SparkleSpawner } from './spawners/SparkleSpawner.js';

// Entities
import { Obstacle } from '../entities/Obstacle.js';
import { Coin } from '../entities/Coin.js';
import { Cloud } from '../entities/Cloud.js';
import { Star } from '../entities/Star.js';
import { Booster } from '../entities/Booster.js';
import { CoinSparkle } from '../entities/CoinSparkle.js';

import { CONFIG } from '../config/constants.js';

export class SpawnSystem {
  constructor(obstacleTextures, coinTexture, starTexture, cloudTexture, boosterTexture, stage) {
    this.stage = stage;

    // Сохраняем текстуры для создания entities
    this.textures = {
      obstacles: obstacleTextures,
      coin: coinTexture,
      star: starTexture,
      cloud: cloudTexture,
      booster: boosterTexture
    };

    // Инициализация пулов через EntityPoolManager
    this.poolManager = new EntityPoolManager(stage);
    this.initializePools();

    // Инициализация spawner'ов
    this.initializeSpawners();
  }

  /**
   * Регистрация всех пулов объектов
   */
  initializePools() {
    // Выбираем случайную текстуру препятствия для каждого объекта
    this.poolManager.registerPool('obstacle', Obstacle, 20, {
      texture: this.textures.obstacles[Math.floor(Math.random() * this.textures.obstacles.length)]
    });
    this.poolManager.registerPool('coin', Coin, 50, { texture: this.textures.coin });
    this.poolManager.registerPool('star', Star, 30, { texture: this.textures.star });
    this.poolManager.registerPool('cloud', Cloud, 15, { texture: this.textures.cloud });
    this.poolManager.registerPool('booster', Booster, 5, { texture: this.textures.booster });
    this.poolManager.registerPool('sparkle', CoinSparkle, 20, { texture: this.textures.coin });
  }

  /**
   * Инициализация всех spawner'ов
   */
  initializeSpawners() {
    // Obstacle Spawner - с pattern-based generation (v2.0)
    this.obstacleSpawner = new ObstacleSpawner({
      pool: this.poolManager.getPool('obstacle'),
      stage: this.stage,
      getIntervalModifier: (context) => {
        // Модификатор интервала из difficulty manager
        const { difficultyManager } = context;
        if (!difficultyManager) return 1.0;

        const baseInterval = CONFIG.OBSTACLE.MIN_DISTANCE;
        const currentInterval = difficultyManager.getObstacleSpawnInterval();
        return currentInterval / baseInterval;
      }
    });

    // Coin Spawner - с booster mode support
    this.coinSpawner = new CoinSpawner({
      pool: this.poolManager.getPool('coin'),
      stage: this.stage,
      getIntervalModifier: (context) => {
        // Интервал зависит от difficulty manager и booster mode
        // (логика внутри CoinSpawner.getCurrentInterval)
        return 1.0;
      }
    });

    // Decorative Spawners
    this.cloudSpawner = new CloudSpawner({
      pool: this.poolManager.getPool('cloud'),
      stage: this.stage
    });

    this.starSpawner = new StarSpawner({
      pool: this.poolManager.getPool('star'),
      stage: this.stage
    });

    // Booster Spawner
    this.boosterSpawner = new BoosterSpawner({
      pool: this.poolManager.getPool('booster'),
      stage: this.stage
    });

    // Sparkle Spawner (manual trigger only)
    this.sparkleSpawner = new SparkleSpawner({
      pool: this.poolManager.getPool('sparkle'),
      stage: this.stage
    });
  }

  /**
   * Обновление всех spawner'ов
   *
   * @param {number} deltaTime - Время с последнего кадра (секунды)
   * @param {number} gameSpeed - Текущая скорость игры
   * @param {Object} context - Контекст игры
   * @param {boolean} context.isBoosterMode - Активен ли режим бустера
   * @param {number} context.boosterActiveLane - Активная полоса бустера (0-2)
   * @param {boolean} context.isBoosterActive - Активен ли бустер (для BoosterSpawner)
   * @param {number} context.boosterCooldown - Кулдаун бустера
   * @param {DifficultyManager} context.difficultyManager - Менеджер сложности
   */
  update(deltaTime, gameSpeed, context = {}) {
    const {
      isBoosterMode = false,
      boosterActiveLane = 0,
      isBoosterActive = false,
      boosterCooldown = 0,
      difficultyManager = null
    } = context;

    // Обновляем препятствия (не спавним во время booster mode)
    if (!isBoosterMode) {
      this.obstacleSpawner.update(deltaTime, gameSpeed, { difficultyManager });
    }

    // Обновляем монеты (в booster mode работает по-особому)
    this.coinSpawner.update(deltaTime, gameSpeed, {
      isBoosterMode,
      boosterActiveLane,
      gameSpeed,
      difficultyManager
    });

    // Обновляем декоративные элементы
    this.cloudSpawner.update(deltaTime, gameSpeed);
    this.starSpawner.update(deltaTime, gameSpeed);

    // Обновляем бустеры (не спавним если бустер активен или кулдаун)
    this.boosterSpawner.update(deltaTime, gameSpeed, {
      isBoosterActive,
      boosterCooldown
    });

    // Обновляем sparkles (только активные объекты, без автоспавна)
    this.sparkleSpawner.update(deltaTime, gameSpeed);
  }

  /**
   * Заполнить полосу монетами (для начала booster режима)
   * @param {number} lane - Номер полосы (0, 1, 2)
   */
  fillLaneWithCoins(lane) {
    this.coinSpawner.fillLaneWithCoins(lane);
  }

  /**
   * Очистить все препятствия (при активации бустера)
   */
  clearAllObstacles() {
    this.obstacleSpawner.clearAll();
  }

  /**
   * Испустить sparkle эффект при сборе монеты
   * @param {number} x - X-координата
   * @param {number} y - Y-координата
   */
  emitCoinSparkle(x, y) {
    this.sparkleSpawner.emit(x, y);
  }

  /**
   * Получить активные препятствия
   * @returns {Array}
   */
  getActiveObstacles() {
    return this.obstacleSpawner.getActiveObjects();
  }

  /**
   * Получить активные монеты
   * @returns {Array}
   */
  getActiveCoins() {
    return this.coinSpawner.getActiveObjects();
  }

  /**
   * Получить активные бустеры
   * @returns {Array}
   */
  getActiveBoosters() {
    return this.boosterSpawner.getActiveObjects();
  }

  /**
   * Сбросить все spawner'ы
   */
  reset() {
    this.obstacleSpawner.reset();
    this.coinSpawner.reset();
    this.cloudSpawner.reset();
    this.starSpawner.reset();
    this.boosterSpawner.reset();
    this.sparkleSpawner.reset();
  }

  /**
   * Получить статистику всех пулов (для отладки)
   * @returns {Object}
   */
  getStats() {
    return this.poolManager.getAllStats();
  }

  /**
   * Вывести статистику в консоль (для отладки)
   */
  logStats() {
    this.poolManager.logStats();
  }
}
