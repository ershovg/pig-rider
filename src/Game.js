/**
 * Game - Главный facade. Композиция координаторов без бизнес-логики.
 * Архитектура: SystemRegistry (DI) → Coordinators (Init/Update/Render) → Systems
 */

import { SystemRegistry } from './features/core/registry/SystemRegistry.js';
import { InitializationCoordinator } from './features/core/coordination/InitializationCoordinator.js';
import { UpdateCoordinator } from './features/core/coordination/UpdateCoordinator.js';
import { RenderCoordinator } from './features/core/coordination/RenderCoordinator.js';

export class Game {
  constructor() {
    this.registry = new SystemRegistry();
    this.initCoordinator = new InitializationCoordinator(this.registry);
    this.updateCoordinator = new UpdateCoordinator(this.registry);
    this.renderCoordinator = new RenderCoordinator(this.registry);
  }

  async init() {
    try {
      await this.initCoordinator.init();

      this.initCoordinator.initUI({
        onPlayClick: () => this.startGame(),
        onBoosterContinue: () => this.resumeGame(),
        onRetry: () => this.restartGame(),
        onRestartGame: () => this.handleRestart(),
        onBookDemo: () => console.log('Book demo clicked')
      });
    } catch (error) {
      console.error('❌ Game initialization failed:', error);
      throw error;
    }
  }

  async startGame() {
    if (!this.registry.player) {
      await this.initCoordinator.initGameplaySystems(
        (dt, frameDt) => this.update(dt, frameDt),
        (alpha) => this.render(alpha)
      );
      this.registry.restartManager.setGame(this);
    }

    this.updateCoordinator.resetCollisionFlag();
    this.updateCoordinator.resetFrameCount();
    this.registry.lifecycleManager.startGame();
    this.startPoolLogging();
  }

  resumeGame() {
    this.registry.ui.hideBoosterModal();
    this.registry.stateManager.setState('playing');
    this.registry.gameLoop.resume();
  }

  restartGame() {
    this.startGame();
  }

  handleRestart() {
    if (!this.registry.restartManager) {
      console.error('❌ RestartManager not initialized');
      return;
    }
    this.registry.restartManager.restart();
  }

  update(deltaTime, frameDeltaTime = null) {
    this.updateCoordinator.update(deltaTime, frameDeltaTime);
  }

  render(alpha) {
    this.renderCoordinator.render(alpha);
  }

  pause() {
    if (this.registry.stateManager.isPlaying()) {
      this.registry.stateManager.setState('paused');
      this.registry.gameLoop.pause();
    }
  }

  resume() {
    if (this.registry.stateManager.isPaused()) {
      this.registry.stateManager.setState('playing');
      this.registry.gameLoop.resume();
    }
  }

  startPoolLogging() {
    if (this.registry.poolLogInterval) {
      clearInterval(this.registry.poolLogInterval);
    }

    this.registry.poolLogInterval = setInterval(() => {
      if (!this.registry.spawnSystem) return;

      const obstaclePool = this.registry.spawnSystem.obstacleSpawner?.pool;
      const coinPool = this.registry.spawnSystem.coinSpawner?.pool;
      const boosterPool = this.registry.spawnSystem.boosterSpawner?.pool;
      const cloudPool = this.registry.spawnSystem.cloudSpawner?.pool;
      const starPool = this.registry.spawnSystem.starSpawner?.pool;

      const obstacleStats = obstaclePool?.getStats() || { active: 0, pooled: 0, total: 0 };
      const coinStats = coinPool?.getStats() || { active: 0, pooled: 0, total: 0 };
      const boosterStats = boosterPool?.getStats() || { active: 0, pooled: 0, total: 0 };
      const cloudStats = cloudPool?.getStats() || { active: 0, pooled: 0, total: 0 };
      const starStats = starPool?.getStats() || { active: 0, pooled: 0, total: 0 };

      console.log(
        `[POOL DEBUG] Obstacles: active=${obstacleStats.active} pooled=${obstacleStats.pooled} total=${obstacleStats.total} | ` +
        `Coins: active=${coinStats.active} pooled=${coinStats.pooled} | ` +
        `Boosters: active=${boosterStats.active} pooled=${boosterStats.pooled} | ` +
        `Clouds: active=${cloudStats.active} pooled=${cloudStats.pooled} | ` +
        `Stars: active=${starStats.active} pooled=${starStats.pooled}`
      );
    }, 5000);
  }

  stopPoolLogging() {
    if (this.registry.poolLogInterval) {
      clearInterval(this.registry.poolLogInterval);
      this.registry.poolLogInterval = null;
    }
  }

  destroy() {
    this.stopPoolLogging();
    if (this.registry.gameLoop) this.registry.gameLoop.stop();
    if (this.registry.player) this.registry.player.destroy();
    if (this.registry.ui) this.registry.ui.destroy();
    if (this.registry.renderer) this.registry.renderer.destroy();
  }
}
