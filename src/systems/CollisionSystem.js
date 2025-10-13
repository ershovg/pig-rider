import { CONFIG } from '../config/constants.js';
import { MathUtils } from '../utils/MathUtils.js';

export class CollisionSystem {
  constructor() {
    this.gridCellSize = CONFIG.COLLISION.GRID_CELL_SIZE;
    this.spatialGrid = new Map();

    console.log('💥 Collision system initialized');
  }

  /**
   * Clear spatial grid
   */
  clearGrid() {
    this.spatialGrid.clear();
  }

  /**
   * Get grid cell key from position
   */
  getCellKey(x, y) {
    const cellX = Math.floor(x / this.gridCellSize);
    const cellY = Math.floor(y / this.gridCellSize);
    return `${cellX},${cellY}`;
  }

  /**
   * Add object to spatial grid
   */
  addToGrid(obj, hitbox) {
    // Get all cells this object overlaps
    const minCellX = Math.floor(hitbox.x / this.gridCellSize);
    const maxCellX = Math.floor((hitbox.x + hitbox.width) / this.gridCellSize);
    const minCellY = Math.floor(hitbox.y / this.gridCellSize);
    const maxCellY = Math.floor((hitbox.y + hitbox.height) / this.gridCellSize);

    for (let x = minCellX; x <= maxCellX; x++) {
      for (let y = minCellY; y <= maxCellY; y++) {
        const key = `${x},${y}`;
        if (!this.spatialGrid.has(key)) {
          this.spatialGrid.set(key, []);
        }
        this.spatialGrid.get(key).push({ obj, hitbox });
      }
    }
  }

  /**
   * Get potential collisions from spatial grid
   */
  getPotentialCollisions(hitbox) {
    const potential = new Set();

    const minCellX = Math.floor(hitbox.x / this.gridCellSize);
    const maxCellX = Math.floor((hitbox.x + hitbox.width) / this.gridCellSize);
    const minCellY = Math.floor(hitbox.y / this.gridCellSize);
    const maxCellY = Math.floor((hitbox.y + hitbox.height) / this.gridCellSize);

    for (let x = minCellX; x <= maxCellX; x++) {
      for (let y = minCellY; y <= maxCellY; y++) {
        const key = `${x},${y}`;
        const cell = this.spatialGrid.get(key);
        if (cell) {
          cell.forEach(item => potential.add(item));
        }
      }
    }

    return Array.from(potential);
  }

  checkObstacleCollisions(player, obstacles) {
    this.clearGrid();

    for (const obstacle of obstacles) {
      const hitbox = obstacle.getHitbox();
      if (hitbox) {
        this.addToGrid(obstacle, hitbox);
      }
    }

    const playerHitbox = player.getHitbox();
    const potentialCollisions = this.getPotentialCollisions(playerHitbox);

    for (const { obj, hitbox } of potentialCollisions) {
      if (MathUtils.checkAABB(playerHitbox, hitbox)) {
        return { hit: true, obstacle: obj };
      }
    }

    return { hit: false, obstacle: null };
  }

  /**
   * Check collision between player and coins
   * @returns {Array} Array of collected coins
   */
  checkCoinCollisions(player, coins) {
    const collected = [];
    const playerHitbox = player.getHitbox();

    for (const coin of coins) {
      const coinHitbox = coin.getHitbox();
      if (coinHitbox && MathUtils.checkAABB(playerHitbox, coinHitbox)) {
        collected.push(coin);
      }
    }

    return collected;
  }

  processCollisions(player, obstacles, coins) {
    const obstacleCollision = this.checkObstacleCollisions(player, obstacles);
    return {
      obstacleHit: obstacleCollision.hit,
      hitObstacle: obstacleCollision.obstacle,
      coinsCollected: this.checkCoinCollisions(player, coins)
    };
  }
}
