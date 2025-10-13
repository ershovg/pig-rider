import { CONFIG } from '../config/constants.js';

export class CullingCoordinator {
  constructor(cullingManager, spawnSystem) {
    this.cullingManager = cullingManager;
    this.spawnSystem = spawnSystem;
  }

  performCulling(frameCount) {
    this.cullGameplayObjects();

    if (frameCount % CONFIG.CULLING.DECORATION_INTERVAL === 0) {
      this.cullDecorations();
    }
  }

  cullGameplayObjects() {
    const obstacles = this.spawnSystem.getActiveObstacles();
    const coins = this.spawnSystem.getActiveCoins();
    const boosters = this.spawnSystem.getActiveBoosters();

    this.cullingManager.cullWithBudget(obstacles);
    this.cullingManager.cullWithBudget(coins);
    this.cullingManager.cullWithBudget(boosters);
  }

  cullDecorations() {
    const clouds = this.spawnSystem.getActiveClouds();
    const stars = this.spawnSystem.getActiveStars();

    this.cullingManager.cullAll(clouds);
    this.cullingManager.cullAll(stars);
  }
}
