import { CONFIG } from '../config/constants.js';

export class GameLifecycleManager {
  constructor(dependencies) {
    this.stateManager = dependencies.stateManager;
    this.progressionManager = dependencies.progressionManager;
    this.boosterManager = dependencies.boosterManager;
    this.difficultyManager = dependencies.difficultyManager;
    this.player = dependencies.player;
    this.spawnSystem = dependencies.spawnSystem;
    this.gameLoop = dependencies.gameLoop;
    this.renderer = dependencies.renderer;
    this.ui = dependencies.ui;
    this.soundManager = dependencies.soundManager; // 🆕 Для запуска музыки
  }

  startGame() {
    this.stateManager.setState('playing');
    this.progressionManager.reset();
    this.boosterManager.reset();
    this.difficultyManager.reset();
    this.player.reset();
    this.spawnSystem.reset();

    this.ui.hideStartScreen();
    this.ui.showHUD();
    this.ui.updateCoinCount(0, CONFIG.TARGET_COINS);
    this.ui.removeBoosterClass();

    // 🎵 Запускаем музыку СРАЗУ при старте игры
    // 500ms fade-in для быстрого начала (после клика пользователя)
    if (this.soundManager) {
      this.soundManager.playMusic('mainMusic', 500);
      console.log('🎵 Main music started on game start');
    }

    this.renderer.start();
    this.gameLoop.start();
  }

  endGame(isWin, score) {
    this.stateManager.setState('ended');
    this.gameLoop.stop();

    if (this.player?.inputController) {
      this.player.inputController.disable();
    }

    this.ui.hideHUD();

    if (isWin) {
      this.ui.showWinScreen(score);
    } else {
      this.ui.showLoseScreen(score);
    }
  }

  async handleCollisionSequence(collisionPoint, effectCoordinator, onComplete) {
    effectCoordinator.emitCollisionEffect(collisionPoint.x, collisionPoint.y);
    this.gameLoop.stop();

    await this.delay(350);
    onComplete();
  }

  async handleBoosterActivation(onConfirm) {
    this.gameLoop.pause();
    const confirmed = await this.ui.showBoosterModal();

    if (confirmed) {
      await this.boosterManager.activate();
      onConfirm?.();
    }

    this.gameLoop.resume();
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
