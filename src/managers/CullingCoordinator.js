import { CONFIG } from '../config/constants.js';

export class CullingCoordinator {
  constructor(cullingManager, spawnSystem) {
    this.cullingManager = cullingManager;
    this.spawnSystem = spawnSystem;

    // 🆕 Stats для Performance Monitor
    this.stats = {
      lastFrameCulled: 0,
      totalCulled: 0
    };
  }

  performCulling(frameCount) {
    // Сбрасываем счётчик для текущего frame
    this.stats.lastFrameCulled = 0;

    // 🆕 ВОССТАНОВЛЕНО: Резервный culling для критических объектов
    // BaseSpawner делает основной culling, но это дополнительная страховка
    this.cullGameplayObjects();

    if (frameCount % CONFIG.CULLING.DECORATION_INTERVAL === 0) {
      this.cullDecorations();
    }
  }

  // 🆕 ВОССТАНОВЛЕНО: Резервный culling для gameplay объектов
  // Работает параллельно с BaseSpawner для дополнительной надежности
  cullGameplayObjects() {
    // Проверяем obstacles на всякий случай (резервный механизм)
    const obstacles = this.spawnSystem.getActiveObstacles();
    const obstaclePool = this.spawnSystem.obstacleSpawner?.pool;

    if (obstacles && obstaclePool) {
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        // Проверяем через shouldCull интерфейс
        if (obstacle.shouldCull && obstacle.shouldCull(this.cullingManager.cullThreshold)) {
          // Проверяем, что объект еще активен (не был удален в BaseSpawner)
          if (obstacle.isActive()) {
            obstacle.deactivate();
            obstaclePool.release(obstacle);
            this.stats.lastFrameCulled++;
          }
        }
      }
    }

    // Аналогично для coins
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

    // Обновляем общую статистику
    this.stats.totalCulled += this.stats.lastFrameCulled;
  }

  // 🆕 ВОССТАНОВЛЕНО: Резервный culling для декораций
  cullDecorations() {
    // Clouds
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

    // Stars
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

    // Обновляем общую статистику
    this.stats.totalCulled += this.stats.lastFrameCulled;
  }

  /**
   * Получить статистику culling для Performance Monitor
   */
  getStats() {
    return { ...this.stats };
  }
}
