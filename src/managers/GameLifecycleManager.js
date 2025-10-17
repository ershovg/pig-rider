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

    // 🎵 Переключаем на gameplay музыкальное состояние
    // Это запустит vertical layering систему
    if (this.soundManager) {
      this.soundManager.setMusicState('gameplay');
      console.log('🎵 Music state: gameplay');
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

    // 🎵 Переключаем на victory/defeat состояние (TODO: когда будут треки)
    // Пока просто останавливаем музыку
    if (this.soundManager) {
      this.soundManager.stopAll();
      console.log('🎵 Music stopped on game end');
    }

    this.ui.hideHUD();

    if (isWin) {
      this.ui.showWinScreen(score);
      // TODO: this.soundManager.setMusicState('victory');
    } else {
      this.ui.showLoseScreen(score);
      // TODO: this.soundManager.setMusicState('defeat');
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
