/**
 * UpdateCoordinator - Управление игровым циклом обновления.
 * Порядок систем критичен: Booster → Progression → Player → Spawn → Culling → Collision → Win/Lose
 */

export class UpdateCoordinator {
  constructor(registry) {
    this.registry = registry;
  }

  update(deltaTime, frameDeltaTime = null) {
    if (!this.registry.stateManager.isPlaying()) return;

    this.registry.frameCount++;

    this.registry.interpolationManager.saveStates([
      this.registry.spawnSystem.getActiveObstacles(),
      this.registry.spawnSystem.getActiveCoins(),
      this.registry.spawnSystem.getActiveBoosters(),
      [this.registry.player]
    ]);

    this.registry.boosterManager.update(deltaTime);
    this.registry.progressionManager.update(deltaTime);
    this.registry.difficultyManager.updateScore(this.registry.progressionManager.getScore());
    this.registry.player.update(deltaTime);

    const boosterContext = this.registry.boosterManager.getContext();
    this.registry.spawnSystem.update(deltaTime, this.registry.progressionManager.getGameSpeed(), {
      ...boosterContext,
      difficultyManager: this.registry.difficultyManager,
      cullThreshold: this.registry.cullingManager.cullThreshold,
      frameDeltaTime: frameDeltaTime || deltaTime
    });

    this.registry.cullingCoordinator.performCulling(this.registry.frameCount);

    const result = this.registry.collisionHandler.processFrame(
      this.registry.player,
      this.registry.spawnSystem.getActiveObstacles(),
      this.registry.spawnSystem.getActiveCoins(),
      this.registry.spawnSystem.getActiveBoosters()
    );

    // Обработка столкновения с препятствием
    if (result.obstacleCollision && !this.registry.isColliding) {
      this.handleObstacleCollision(result.obstacleCollision);
      return;
    }

    // Обработка собранных монет
    if (result.collectedCoins.length > 0) {
      const shouldEndGame = this.handleCoinCollection(result.collectedCoins);
      if (shouldEndGame) return;
    }

    // Обработка собранного бустера
    if (result.collectedBooster) {
      const shouldEndGame = this.handleBoosterCollection(result.collectedBooster);
      if (shouldEndGame) return;
    }
  }

  handleObstacleCollision(collision) {
    this.registry.isColliding = true;
    this.registry.lifecycleManager.handleCollisionSequence(
      collision,
      this.registry.effectCoordinator,
      () => {
        this.registry.lifecycleManager.endGame(
          false,
          this.registry.progressionManager.getScore()
        );
      }
    );
  }

  handleCoinCollection(coins) {
    for (const coin of coins) {
      this.registry.progressionManager.addScore(coin.value);
      this.registry.effectCoordinator.emitCoinCollectEffect(coin.x, coin.y);

      if (this.registry.progressionManager.checkWinCondition()) {
        this.registry.lifecycleManager.endGame(
          true,
          this.registry.progressionManager.getScore()
        );
        return true;
      }
    }
    return false;
  }

  handleBoosterCollection(boosterValue) {
    this.registry.progressionManager.addScore(boosterValue);

    if (this.registry.progressionManager.checkWinCondition()) {
      this.registry.lifecycleManager.endGame(
        true,
        this.registry.progressionManager.getScore()
      );
      return true;
    }

    this.registry.lifecycleManager.handleBoosterActivation();
    return false;
  }

  resetCollisionFlag() {
    this.registry.isColliding = false;
  }

  resetFrameCount() {
    this.registry.frameCount = 0;
  }
}
