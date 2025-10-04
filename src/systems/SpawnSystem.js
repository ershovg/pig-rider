import { CONFIG } from '../config/constants.js';
import { MathUtils } from '../utils/MathUtils.js';
import { ObjectPool } from '../utils/ObjectPool.js';
import { Obstacle } from '../entities/Obstacle.js';
import { Coin } from '../entities/Coin.js';

export class SpawnSystem {
  constructor(obstacleTexture, coinTexture, stage) {
    this.stage = stage;

    // Create object pools
    this.obstaclePool = new ObjectPool(
      () => {
        const obstacle = new Obstacle(obstacleTexture);
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

    // Track last spawn positions for each lane
    this.lastObstacleX = Array(CONFIG.LANES.TOTAL).fill(CONFIG.CANVAS_WIDTH);
    this.lastCoinX = Array(CONFIG.LANES.TOTAL).fill(CONFIG.CANVAS_WIDTH);

    // Spawn timers
    this.obstacleSpawnTimer = 0;
    this.coinSpawnTimer = 0;

    console.log('🎯 Spawn system initialized');
  }

  /**
   * Update spawn system
   */
  update(deltaTime, gameSpeed) {
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

    // Spawn new obstacles
    this.spawnObstacles(deltaTime, gameSpeed);

    // Spawn new coins
    this.spawnCoins(deltaTime, gameSpeed);
  }

  /**
   * Spawn obstacles at random intervals
   */
  spawnObstacles(deltaTime, gameSpeed) {
    this.obstacleSpawnTimer += deltaTime;

    // Determine spawn interval based on speed
    const baseInterval = 1.2; // seconds
    const spawnInterval = baseInterval / gameSpeed;

    if (this.obstacleSpawnTimer >= spawnInterval) {
      this.obstacleSpawnTimer = 0;

      // Choose random lane
      const lane = MathUtils.randomInt(0, CONFIG.LANES.TOTAL - 1);

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
   * Spawn coins at random intervals
   */
  spawnCoins(deltaTime, gameSpeed) {
    this.coinSpawnTimer += deltaTime;

    const baseInterval = 0.8; // seconds
    const spawnInterval = baseInterval / gameSpeed;

    if (this.coinSpawnTimer >= spawnInterval) {
      this.coinSpawnTimer = 0;

      // Choose random lane (avoid spawning too many in player's lane)
      const lane = MathUtils.randomInt(0, CONFIG.LANES.TOTAL - 1);

      // Calculate spawn position
      const minDist = CONFIG.COIN.MIN_DISTANCE;
      const maxDist = CONFIG.COIN.MAX_DISTANCE;
      const distance = MathUtils.randomFloat(minDist, maxDist);

      const spawnX = Math.max(
        CONFIG.CANVAS_WIDTH + distance,
        this.lastCoinX[lane] + distance
      );

      // Spawn coin
      const coin = this.coinPool.acquire();
      coin.activate(lane, spawnX);

      this.lastCoinX[lane] = spawnX;
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
   * Reset spawn system
   */
  reset() {
    this.obstaclePool.releaseAll();
    this.coinPool.releaseAll();
    this.lastObstacleX.fill(CONFIG.CANVAS_WIDTH);
    this.lastCoinX.fill(CONFIG.CANVAS_WIDTH);
    this.obstacleSpawnTimer = 0;
    this.coinSpawnTimer = 0;
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      obstacles: this.obstaclePool.getStats(),
      coins: this.coinPool.getStats()
    };
  }
}
