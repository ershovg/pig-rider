import { MathUtils } from '../../../shared/utils/MathUtils';
import { CollisionSystem } from '../system/CollisionSystem';
import type { SoundManager } from '../../../types/managers';
import type { HasHitbox, HasSprite, RenderableCollectible } from '../../../types';
import type { Point2D } from '../../../types/common';
import type { ProcessFrameResult, CoinCollectedEvent } from '../../../types/collision';

export class CollisionHandler {
  private collisionSystem: CollisionSystem;
  private soundManager: SoundManager | null;

  constructor(collisionSystem: CollisionSystem, soundManager: SoundManager | null = null) {
    this.collisionSystem = collisionSystem;
    this.soundManager = soundManager;
  }

  processFrame<TObstacle extends HasHitbox & HasSprite, TCoin extends RenderableCollectible, TBooster extends RenderableCollectible>(
    player: HasHitbox & HasSprite,
    obstacles: TObstacle[],
    coins: TCoin[],
    boosters: TBooster[]
  ): ProcessFrameResult {
    const collisions = this.collisionSystem.processCollisions(player, obstacles, coins);

    return {
      obstacleCollision: this.handleObstacleCollision(player, collisions),
      collectedCoins: this.handleCoinCollection(collisions.coinsCollected),
      collectedBooster: this.handleBoosterCollection(player, boosters)
    };
  }

  private handleObstacleCollision<T extends HasSprite>(
    player: HasSprite,
    collisions: { obstacleHit: boolean; hitObstacle: T | null }
  ): Point2D | null {
    if (!collisions.obstacleHit || !collisions.hitObstacle) return null;

    const playerSprite = player.getSprite();
    const obstacleSprite = collisions.hitObstacle.getSprite();

    return {
      x: (playerSprite.x + obstacleSprite.x) / 2,
      y: (playerSprite.y + obstacleSprite.y) / 2
    };
  }

  private handleCoinCollection(coinsCollected: RenderableCollectible[]): CoinCollectedEvent[] {
    const collected: CoinCollectedEvent[] = [];

    for (const coin of coinsCollected) {
      const result = coin.collect();
      if (result) {
        const sprite = coin.getSprite();
        collected.push({ value: result.value, x: sprite.x, y: sprite.y });

        if (this.soundManager) {
          this.soundManager.play('coin');
        }
      }
    }

    return collected;
  }

  private handleBoosterCollection<T extends RenderableCollectible>(
    player: HasHitbox,
    boosters: T[]
  ): number | null {
    const playerHitbox = player.getHitbox();
    if (!playerHitbox) return null;

    for (const booster of boosters) {
      if (!booster.isActive()) continue;

      const boosterHitbox = booster.getHitbox();
      if (!boosterHitbox) continue;

      if (MathUtils.checkAABB(playerHitbox, boosterHitbox)) {
        const result = booster.collect();
        if (result) {
          if (this.soundManager) {
            this.soundManager.play('boosterCollect');
          }
          return result.value;
        }
      }
    }

    return null;
  }
}
