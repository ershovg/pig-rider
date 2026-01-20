import { CONFIG } from '../../../shared/config/constants';
import { MathUtils } from '../../../shared/utils/MathUtils';
import type { HasHitbox, Hitbox } from '../../../types';
import type { CollisionProcessResult } from '../../../types/collision';
import type { CheckResult } from '../../../types/patterns';

interface GridItem<T> {
  obj: T;
  hitbox: Hitbox;
}

export class CollisionSystem {
  private gridCellSize: number;
  private spatialGrid: Map<string, GridItem<HasHitbox>[]>;

  constructor() {
    this.gridCellSize = CONFIG.COLLISION.GRID_CELL_SIZE;
    this.spatialGrid = new Map();
  }

  clearGrid(): void {
    this.spatialGrid.clear();
  }

  getCellKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.gridCellSize);
    const cellY = Math.floor(y / this.gridCellSize);
    return `${cellX},${cellY}`;
  }

  addToGrid(obj: HasHitbox, hitbox: Hitbox): void {
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
        this.spatialGrid.get(key)!.push({ obj, hitbox });
      }
    }
  }

  getPotentialCollisions(hitbox: Hitbox): GridItem<HasHitbox>[] {
    const potential = new Set<GridItem<HasHitbox>>();

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

  checkObstacleCollisions<T extends HasHitbox>(
    player: HasHitbox,
    obstacles: T[]
  ): CheckResult<T> {
    this.clearGrid();

    for (const obstacle of obstacles) {
      const hitbox = obstacle.getHitbox();
      if (hitbox) {
        this.addToGrid(obstacle, hitbox);
      }
    }

    const playerHitbox = player.getHitbox();
    if (!playerHitbox) {
      return { found: false, entity: null };
    }

    const potentialCollisions = this.getPotentialCollisions(playerHitbox);

    for (const { obj, hitbox } of potentialCollisions) {
      if (MathUtils.checkAABB(playerHitbox, hitbox)) {
        return { found: true, entity: obj as T };
      }
    }

    return { found: false, entity: null };
  }

  checkCoinCollisions<T extends HasHitbox>(player: HasHitbox, coins: T[]): T[] {
    const collected: T[] = [];
    const playerHitbox = player.getHitbox();

    if (!playerHitbox) {
      return collected;
    }

    for (const coin of coins) {
      const coinHitbox = coin.getHitbox();
      if (coinHitbox && MathUtils.checkAABB(playerHitbox, coinHitbox)) {
        collected.push(coin);
      }
    }

    return collected;
  }

  processCollisions<TObstacle extends HasHitbox, TCoin extends HasHitbox>(
    player: HasHitbox,
    obstacles: TObstacle[],
    coins: TCoin[]
  ): CollisionProcessResult<TObstacle, TCoin> {
    const obstacleCollision = this.checkObstacleCollisions(player, obstacles);
    return {
      obstacleHit: obstacleCollision.found,
      hitObstacle: obstacleCollision.entity,
      coinsCollected: this.checkCoinCollisions(player, coins)
    };
  }
}
