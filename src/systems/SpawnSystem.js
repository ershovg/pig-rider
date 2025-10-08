import { CONFIG } from '../config/constants.js';
import { MathUtils } from '../utils/MathUtils.js';
import { ObjectPool } from '../utils/ObjectPool.js';
import { Obstacle } from '../entities/Obstacle.js';
import { Coin } from '../entities/Coin.js';
import { Star } from '../entities/Star.js';
import { Cloud } from '../entities/Cloud.js';
import { Booster } from '../entities/Booster.js';

export class SpawnSystem {
  constructor(obstacleTextures, coinTexture, starTexture, cloudTexture, boosterTexture, stage) {
    this.stage = stage;
    this.obstacleTextures = Array.isArray(obstacleTextures) ? obstacleTextures : [obstacleTextures];

    // Create object pools for obstacles and coins
    this.obstaclePool = new ObjectPool(
      () => {
        // Randomly choose texture for variety
        const randomTexture = this.obstacleTextures[MathUtils.randomInt(0, this.obstacleTextures.length - 1)];
        const obstacle = new Obstacle(randomTexture);
        this.stage.addChild(obstacle.getSprite());
        return obstacle;
      },
      (obstacle) => obstacle.reset(),
      CONFIG.OBSTACLE.POOL_SIZE
    );

    this.coinPool = new ObjectPool(
      () => {
        const coin = new Coin(coinTexture);
        this.stage.addChild(coin.getSprite());
        return coin;
      },
      (coin) => coin.reset(),
      CONFIG.COIN.POOL_SIZE
    );

    // Create object pools for decorative elements
    // Stars - декоративные звездочки
    this.starPool = new ObjectPool(
      () => {
        const star = new Star(starTexture);
        this.stage.addChild(star.getSprite());
        return star;
      },
      (star) => star.reset(),
      15 // Pool size для звездочек
    );

    // Clouds - декоративные облака
    this.cloudPool = new ObjectPool(
      () => {
        const cloud = new Cloud(cloudTexture);
        this.stage.addChild(cloud.getSprite());
        return cloud;
      },
      (cloud) => cloud.reset(),
      10 // Pool size для облаков
    );

    // Boosters - интерактивные бустеры/кубки
    this.boosterPool = new ObjectPool(
      () => {
        const booster = new Booster(boosterTexture);
        this.stage.addChild(booster.getSprite());
        return booster;
      },
      (booster) => booster.reset(),
      5 // Pool size для бустеров
    );

    // Track last spawn positions for each lane
    this.lastObstacleX = Array(CONFIG.LANES.TOTAL).fill(CONFIG.CANVAS_WIDTH);
    this.lastCoinX = Array(CONFIG.LANES.TOTAL).fill(CONFIG.CANVAS_WIDTH);
    this.lastStarX = Array(CONFIG.LANES.TOTAL).fill(CONFIG.CANVAS_WIDTH);
    this.lastCloudX = Array(CONFIG.LANES.TOTAL).fill(CONFIG.CANVAS_WIDTH);
    this.lastBoosterX = Array(CONFIG.LANES.TOTAL).fill(CONFIG.CANVAS_WIDTH);

    // Spawn timers
    this.obstacleSpawnTimer = 0;
    this.coinSpawnTimer = 0;
    this.starSpawnTimer = 0;
    this.cloudSpawnTimer = 0;
    this.boosterSpawnTimer = 0;

    console.log('🎯 Spawn system initialized with decorative elements');
  }

  /**
   * Update spawn system
   * @param {number} deltaTime - Delta time in seconds
   * @param {number} gameSpeed - Current game speed
   * @param {boolean} isBoosterMode - Whether booster mode is active
   * @param {number} boosterActiveLane - Active lane during booster mode
   * @param {boolean} isBoosterOnCooldown - Whether booster is on cooldown
   * @param {Object} difficultyManager - Difficulty manager instance
   */
  update(deltaTime, gameSpeed, isBoosterMode = false, boosterActiveLane = 0, isBoosterOnCooldown = false, difficultyManager = null) {
    // Update all active obstacles
    const activeObstacles = this.obstaclePool.getActive();
    for (const obstacle of activeObstacles) {
      obstacle.update(deltaTime, gameSpeed);

      // Return to pool if deactivated
      if (!obstacle.isActive()) {
        this.obstaclePool.release(obstacle);
      }
    }

    // Update all active coins
    const activeCoins = this.coinPool.getActive();
    for (const coin of activeCoins) {
      coin.update(deltaTime, gameSpeed);

      // Return to pool if deactivated
      if (!coin.isActive()) {
        this.coinPool.release(coin);
      }
    }

    // Update stars - декоративные звездочки
    const activeStars = this.starPool.getActive();
    for (const star of activeStars) {
      star.update(deltaTime, gameSpeed);
      if (!star.isActive()) {
        this.starPool.release(star);
      }
    }

    // Update clouds - декоративные облака
    const activeClouds = this.cloudPool.getActive();
    for (const cloud of activeClouds) {
      cloud.update(deltaTime, gameSpeed);
      if (!cloud.isActive()) {
        this.cloudPool.release(cloud);
      }
    }

    // Update boosters - интерактивные бустеры
    const activeBoosters = this.boosterPool.getActive();
    for (const booster of activeBoosters) {
      booster.update(deltaTime, gameSpeed);
      if (!booster.isActive()) {
        this.boosterPool.release(booster);
      }
    }

    // Spawn new obstacles (skip during booster mode)
    if (!isBoosterMode) {
      this.spawnObstacles(deltaTime, gameSpeed, difficultyManager);
    }

    // Spawn new coins (special mechanics during booster mode)
    this.spawnCoins(deltaTime, gameSpeed, isBoosterMode, boosterActiveLane, difficultyManager);

    // Spawn decorative elements
    this.spawnStars(deltaTime, gameSpeed);
    this.spawnClouds(deltaTime, gameSpeed);

    // Spawn boosters (skip during booster mode AND cooldown)
    if (!isBoosterMode && !isBoosterOnCooldown) {
      this.spawnBoosters(deltaTime, gameSpeed);
    }
  }

  /**
   * Spawn obstacles at random intervals
   */
  spawnObstacles(deltaTime, gameSpeed, difficultyManager) {
    this.obstacleSpawnTimer += deltaTime;

    // Get interval from difficulty manager (or fallback to default)
    const baseInterval = difficultyManager ? difficultyManager.getObstacleSpawnInterval() : 1.2;
    const spawnInterval = baseInterval / gameSpeed;

    if (this.obstacleSpawnTimer >= spawnInterval) {
      this.obstacleSpawnTimer = 0;

      // Get lanes that currently have obstacles near spawn area
      const blockedLanes = this.getBlockedLanes();

      // CRITICAL: Never block all lanes - always leave at least 1 free
      let availableLanes = [];
      for (let i = 0; i < CONFIG.LANES.TOTAL; i++) {
        if (!blockedLanes.includes(i)) {
          availableLanes.push(i);
        }
      }

      // If all lanes would be blocked, skip this spawn
      if (availableLanes.length === 0) {
        console.warn('⚠️ All lanes blocked - skipping obstacle spawn');
        return;
      }

      // Choose random lane from available lanes
      const lane = availableLanes[MathUtils.randomInt(0, availableLanes.length - 1)];

      // Calculate spawn position
      const minDist = CONFIG.OBSTACLE.MIN_DISTANCE;
      const maxDist = CONFIG.OBSTACLE.MAX_DISTANCE;
      const distance = MathUtils.randomFloat(minDist, maxDist);

      const spawnX = Math.max(
        CONFIG.CANVAS_WIDTH + distance,
        this.lastObstacleX[lane] + distance
      );

      // Spawn obstacle
      const obstacle = this.obstaclePool.acquire();
      obstacle.activate(lane, spawnX);

      this.lastObstacleX[lane] = spawnX;
    }
  }

  /**
   * Get lanes that currently have obstacles in the near spawn area
   * This prevents blocking all lanes simultaneously
   */
  getBlockedLanes() {
    const blocked = [];
    const safeDistance = 1500; // Distance threshold to consider a lane "blocked"

    const activeObstacles = this.obstaclePool.getActive();
    for (const obstacle of activeObstacles) {
      if (!obstacle.isActive()) continue;

      const obstacleX = obstacle.getSprite().x;

      // If obstacle is in the spawn/near area, mark its lane as blocked
      if (obstacleX > CONFIG.CANVAS_WIDTH - safeDistance) {
        const lane = obstacle.lane;
        if (!blocked.includes(lane)) {
          blocked.push(lane);
        }
      }
    }

    return blocked;
  }

  /**
   * Spawn coins at random intervals
   * @param {boolean} isBoosterMode - If true, spawn on specific lane with very high frequency
   * @param {number} boosterActiveLane - Active lane during booster mode
   * @param {Object} difficultyManager - Difficulty manager instance
   */
  spawnCoins(deltaTime, gameSpeed, isBoosterMode = false, boosterActiveLane = 0, difficultyManager = null) {
    this.coinSpawnTimer += deltaTime;

    let spawnInterval;

    if (isBoosterMode) {
      // Во время бустера используем очень короткий интервал из CONFIG
      spawnInterval = CONFIG.BOOSTER_COIN_SPAWN_INTERVAL;
    } else {
      // Обычный режим: используем интервал из difficulty manager
      const baseInterval = difficultyManager ? difficultyManager.getCoinSpawnInterval() : 0.8;
      spawnInterval = baseInterval / gameSpeed;
    }

    if (this.coinSpawnTimer >= spawnInterval) {
      this.coinSpawnTimer = 0;

      if (isBoosterMode) {
        // Во время бустера спавним монеты ТОЛЬКО на активной линии, очень плотно
        const lane = boosterActiveLane;

        // Минимальная дистанция между монетами (очень плотно)
        const distance = 80; // Очень близко друг к другу

        const spawnX = Math.max(
          CONFIG.CANVAS_WIDTH + distance,
          this.lastCoinX[lane] + distance
        );

        const coin = this.coinPool.acquire();
        if (coin) {
          coin.activate(lane, spawnX);
          this.lastCoinX[lane] = spawnX;
        }
      } else {
        // Обычный режим: случайная линия
        const lane = MathUtils.randomInt(0, CONFIG.LANES.TOTAL - 1);

        const minDist = CONFIG.COIN.MIN_DISTANCE;
        const maxDist = CONFIG.COIN.MAX_DISTANCE;
        const distance = MathUtils.randomFloat(minDist, maxDist);

        const spawnX = Math.max(
          CONFIG.CANVAS_WIDTH + distance,
          this.lastCoinX[lane] + distance
        );

        const coin = this.coinPool.acquire();
        if (coin) {
          coin.activate(lane, spawnX);
          this.lastCoinX[lane] = spawnX;
        }
      }
    }
  }

  /**
   * Get all active obstacles
   */
  getActiveObstacles() {
    return this.obstaclePool.getActive().filter(o => o.isActive());
  }

  /**
   * Get all active coins
   */
  getActiveCoins() {
    return this.coinPool.getActive().filter(c => c.isActive());
  }

  /**
   * Spawn stars at random intervals - декоративные звездочки
   */
  spawnStars(deltaTime, gameSpeed) {
    this.starSpawnTimer += deltaTime;

    const spawnInterval = 0.6; // Частый спавн звездочек

    if (this.starSpawnTimer >= spawnInterval) {
      this.starSpawnTimer = 0;

      const lane = MathUtils.randomInt(0, CONFIG.LANES.TOTAL - 1);
      const distance = MathUtils.randomFloat(200, 600);
      const spawnX = CONFIG.CANVAS_WIDTH + distance;

      const star = this.starPool.acquire();
      star.activate(lane, spawnX);

      this.lastStarX[lane] = spawnX;
    }
  }

  /**
   * Spawn clouds at random intervals - декоративные облака
   * Использует улучшенную логику для предотвращения кластеризации
   */
  spawnClouds(deltaTime, gameSpeed) {
    this.cloudSpawnTimer += deltaTime;

    const spawnInterval = 2.5; // Редкий спавн облаков

    if (this.cloudSpawnTimer >= spawnInterval) {
      this.cloudSpawnTimer = 0;

      // Находим лучшую линию для спавна (с минимальным количеством облаков)
      const lane = this.getBestCloudLane();

      // Проверяем минимальную дистанцию до существующих облаков на этой линии
      const MIN_CLOUD_DISTANCE = 1000; // Минимум 1000px между облаками
      const canSpawn = this.canSpawnCloud(lane, MIN_CLOUD_DISTANCE);

      if (!canSpawn) {
        // Пропускаем спавн, если слишком близко к другим облакам
        return;
      }

      const distance = MathUtils.randomFloat(300, 800);
      const spawnX = Math.max(
        CONFIG.CANVAS_WIDTH + distance,
        this.lastCloudX[lane] + MIN_CLOUD_DISTANCE
      );

      const cloud = this.cloudPool.acquire();
      if (cloud) {
        cloud.activate(lane, spawnX);
        this.lastCloudX[lane] = spawnX;
      }
    }
  }

  /**
   * Проверяет, можно ли заспавнить облако на линии
   * (проверяет дистанцию до всех активных облаков)
   */
  canSpawnCloud(lane, minDistance) {
    const activeClouds = this.cloudPool.getActive();
    const spawnX = CONFIG.CANVAS_WIDTH;

    for (const cloud of activeClouds) {
      if (!cloud.isActive() || cloud.lane !== lane) continue;

      const cloudX = cloud.getSprite().x;
      const distance = Math.abs(cloudX - spawnX);

      // Если облако слишком близко - нельзя спавнить
      if (distance < minDistance) {
        return false;
      }
    }

    return true;
  }

  /**
   * Находит лучшую линию для спавна облака
   * (линию с наименьшим количеством активных облаков)
   */
  getBestCloudLane() {
    const activeClouds = this.cloudPool.getActive();
    const laneCounts = Array(CONFIG.LANES.TOTAL).fill(0);

    // Подсчитываем количество облаков на каждой линии
    for (const cloud of activeClouds) {
      if (cloud.isActive()) {
        laneCounts[cloud.lane]++;
      }
    }

    // Находим линию с минимальным количеством облаков
    let minCount = Infinity;
    let bestLanes = [];

    for (let i = 0; i < CONFIG.LANES.TOTAL; i++) {
      if (laneCounts[i] < minCount) {
        minCount = laneCounts[i];
        bestLanes = [i];
      } else if (laneCounts[i] === minCount) {
        bestLanes.push(i);
      }
    }

    // Если несколько линий с одинаковым минимумом - выбираем случайную
    return bestLanes[MathUtils.randomInt(0, bestLanes.length - 1)];
  }

  /**
   * Spawn boosters at random intervals - интерактивные бустеры
   */
  spawnBoosters(deltaTime, gameSpeed) {
    this.boosterSpawnTimer += deltaTime;

    const spawnInterval = 8; // Редкий спавн бустеров (раз в 8 секунд)

    if (this.boosterSpawnTimer >= spawnInterval) {
      this.boosterSpawnTimer = 0;

      const lane = MathUtils.randomInt(0, CONFIG.LANES.TOTAL - 1);
      const distance = MathUtils.randomFloat(400, 800);
      const spawnX = CONFIG.CANVAS_WIDTH + distance;

      const booster = this.boosterPool.acquire();
      booster.activate(lane, spawnX);

      this.lastBoosterX[lane] = spawnX;
    }
  }

  /**
   * Get all active boosters
   */
  getActiveBoosters() {
    return this.boosterPool.getActive().filter(b => b.isActive());
  }

  /**
   * Reset spawn system
   */
  reset() {
    this.obstaclePool.releaseAll();
    this.coinPool.releaseAll();
    this.starPool.releaseAll();
    this.cloudPool.releaseAll();
    this.boosterPool.releaseAll();

    this.lastObstacleX.fill(CONFIG.CANVAS_WIDTH);
    this.lastCoinX.fill(CONFIG.CANVAS_WIDTH);
    this.lastStarX.fill(CONFIG.CANVAS_WIDTH);
    this.lastCloudX.fill(CONFIG.CANVAS_WIDTH);
    this.lastBoosterX.fill(CONFIG.CANVAS_WIDTH);

    this.obstacleSpawnTimer = 0;
    this.coinSpawnTimer = 0;
    this.starSpawnTimer = 0;
    this.cloudSpawnTimer = 0;
    this.boosterSpawnTimer = 0;
  }

  /**
   * Clear all active obstacles (for booster mode)
   */
  clearAllObstacles() {
    const activeObstacles = this.obstaclePool.getActive();
    for (const obstacle of activeObstacles) {
      obstacle.deactivate();
    }
    this.obstaclePool.releaseAll();
    console.log('🧹 All obstacles cleared');
  }

  /**
   * Instantly fill a lane with coins (for booster activation)
   * @param {number} lane - Lane to fill with coins
   */
  fillLaneWithCoins(lane) {
    const numCoins = 20; // Количество монет для заполнения
    const spacing = 100; // Расстояние между монетами

    for (let i = 0; i < numCoins; i++) {
      const spawnX = CONFIG.CANVAS_WIDTH + (i * spacing);

      const coin = this.coinPool.acquire();
      if (coin) {
        coin.activate(lane, spawnX);
        this.lastCoinX[lane] = spawnX;
      }
    }

    console.log(`💰 Lane ${lane} filled with ${numCoins} coins`);
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      obstacles: this.obstaclePool.getStats(),
      coins: this.coinPool.getStats(),
      stars: this.starPool.getStats(),
      clouds: this.cloudPool.getStats(),
      boosters: this.boosterPool.getStats()
    };
  }
}
