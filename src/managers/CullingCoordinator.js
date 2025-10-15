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

    this.cullGameplayObjects();

    if (frameCount % CONFIG.CULLING.DECORATION_INTERVAL === 0) {
      this.cullDecorations();
    }
  }

  cullGameplayObjects() {
    const obstacles = this.spawnSystem.getActiveObstacles();
    const coins = this.spawnSystem.getActiveCoins();
    const boosters = this.spawnSystem.getActiveBoosters();

    this.stats.lastFrameCulled += this.cullingManager.cullWithBudget(obstacles);
    this.stats.lastFrameCulled += this.cullingManager.cullWithBudget(coins);
    this.stats.lastFrameCulled += this.cullingManager.cullWithBudget(boosters);

    this.stats.totalCulled += this.stats.lastFrameCulled;
  }

  cullDecorations() {
    const clouds = this.spawnSystem.getActiveClouds();
    const stars = this.spawnSystem.getActiveStars();

    const culled = this.cullingManager.cullAll(clouds) + this.cullingManager.cullAll(stars);
    this.stats.lastFrameCulled += culled;
    this.stats.totalCulled += culled;
  }

  /**
   * Получить статистику culling для Performance Monitor
   */
  getStats() {
    return { ...this.stats };
  }
}
