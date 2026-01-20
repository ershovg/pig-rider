import { SystemRegistry } from './features/core/registry/SystemRegistry.ts';
import { InitializationCoordinator } from './features/core/coordination/InitializationCoordinator.ts';
import { UpdateCoordinator } from './features/core/coordination/UpdateCoordinator.ts';
import { RenderCoordinator } from './features/core/coordination/RenderCoordinator.ts';

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

      this.initCoordinator.setupUIEventListeners({
        onPlayClick: () => this.startGame(),
        onBoosterContinue: () => this.resumeGame(),
        onRetry: () => this.restartGame(),
        onRestartGame: () => this.handleRestart(),
        onMuteToggle: () => this.registry.soundManager.toggleMute()
      });
    } catch (error) {
      console.error('Game initialization failed:', error);
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
      console.error('RestartManager not initialized');
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

  destroy() {
    if (this.registry.gameLoop) this.registry.gameLoop.stop();
    if (this.registry.player) this.registry.player.destroy();
    if (this.registry.ui) this.registry.ui.destroy();
    if (this.registry.renderer) this.registry.renderer.destroy();
  }
}
