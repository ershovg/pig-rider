import { CONFIG } from '../../../shared/config/constants';
import type { SpawnSystem } from '../../../types/managers';
import type { CullingManager } from './CullingManager';

interface CullingCoordinatorStats {
  lastFrameCulled: number;
  totalCulled: number;
}

export class CullingCoordinator {
  private cullingManager: CullingManager;
  private spawnSystem: SpawnSystem;
  private stats: CullingCoordinatorStats;

  constructor(cullingManager: CullingManager, spawnSystem: SpawnSystem) {
    this.cullingManager = cullingManager;
    this.spawnSystem = spawnSystem;

    this.stats = {
      lastFrameCulled: 0,
      totalCulled: 0
    };
  }

  performCulling(frameCount: number): void {
    this.stats.lastFrameCulled = 0;

    this.cullGameplayObjects();

    if (frameCount % CONFIG.CULLING.DECORATION_INTERVAL === 0) {
      this.cullDecorations();
    }
  }

  cullGameplayObjects(): void {
    const obstacles = this.spawnSystem.getActiveObstacles();
    const obstaclePool = this.spawnSystem.obstacleSpawner?.pool;

    if (obstacles && obstaclePool) {
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        if (obstacle.shouldCull && obstacle.shouldCull(this.cullingManager.cullThreshold)) {
          if (obstacle.isActive()) {
            obstacle.deactivate();
            obstaclePool.release(obstacle);
            this.stats.lastFrameCulled++;
          }
        }
      }
    }

    const coins = this.spawnSystem.getActiveCoins();
    const coinPool = this.spawnSystem.coinSpawner?.pool;

    if (coins && coinPool) {
      for (let i = coins.length - 1; i >= 0; i--) {
        const coin = coins[i];
        if (coin.shouldCull && coin.shouldCull(this.cullingManager.cullThreshold)) {
          if (coin.isActive()) {
            coin.deactivate();
            coinPool.release(coin);
            this.stats.lastFrameCulled++;
          }
        }
      }
    }

    this.stats.totalCulled += this.stats.lastFrameCulled;
  }

  cullDecorations(): void {
    const clouds = this.spawnSystem.getActiveClouds();
    const cloudPool = this.spawnSystem.cloudSpawner?.pool;

    if (clouds && cloudPool) {
      for (let i = clouds.length - 1; i >= 0; i--) {
        const cloud = clouds[i];
        if (cloud.shouldCull && cloud.shouldCull(this.cullingManager.cullThreshold)) {
          if (cloud.isActive()) {
            cloud.deactivate();
            cloudPool.release(cloud);
            this.stats.lastFrameCulled++;
          }
        }
      }
    }

    const stars = this.spawnSystem.getActiveStars();
    const starPool = this.spawnSystem.starSpawner?.pool;

    if (stars && starPool) {
      for (let i = stars.length - 1; i >= 0; i--) {
        const star = stars[i];
        if (star.shouldCull && star.shouldCull(this.cullingManager.cullThreshold)) {
          if (star.isActive()) {
            star.deactivate();
            starPool.release(star);
            this.stats.lastFrameCulled++;
          }
        }
      }
    }

    this.stats.totalCulled += this.stats.lastFrameCulled;
  }

  getStats(): CullingCoordinatorStats {
    return { ...this.stats };
  }
}
