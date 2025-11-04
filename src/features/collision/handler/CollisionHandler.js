import { MathUtils } from '../../../shared/utils/MathUtils.ts';

export class CollisionHandler {
  constructor(collisionSystem, soundManager = null) {
    this.collisionSystem = collisionSystem;
    this.soundManager = soundManager; // Сохраняем soundManager для проигрывания звуков
  }

  processFrame(player, obstacles, coins, boosters) {
    const collisions = this.collisionSystem.processCollisions(player, obstacles, coins);

    return {
      obstacleCollision: this.handleObstacleCollision(player, collisions),
      collectedCoins: this.handleCoinCollection(collisions.coinsCollected),
      collectedBooster: this.handleBoosterCollection(player, boosters)
    };
  }

  handleObstacleCollision(player, collisions) {
    if (!collisions.obstacleHit) return null;

    const playerSprite = player.getSprite();
    const obstacleSprite = collisions.hitObstacle.getSprite();

    return {
      x: (playerSprite.x + obstacleSprite.x) / 2,
      y: (playerSprite.y + obstacleSprite.y) / 2
    };
  }

  handleCoinCollection(coinsCollected) {
    const collected = [];

    for (const coin of coinsCollected) {
      const value = coin.collect();
      if (value) {
        const sprite = coin.getSprite();
        collected.push({ value, x: sprite.x, y: sprite.y });

        if (this.soundManager) {
          this.soundManager.play('coin');
        }
      }
    }

    return collected;
  }

  handleBoosterCollection(player, boosters) {
    const playerHitbox = player.getHitbox();

    for (const booster of boosters) {
      if (!booster.isActive()) continue;

      const boosterHitbox = booster.getHitbox();
      if (!boosterHitbox) continue;

      if (MathUtils.checkAABB(playerHitbox, boosterHitbox)) {
        const result = booster.collect();
        if (result) {
          // Проигрываем звук сбора бустера (ДО показа модалки)
          if (this.soundManager) {
            this.soundManager.play('boosterCollect');
          }
          return result;
        }
      }
    }

    return null;
  }
}
