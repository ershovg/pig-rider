import { CONFIG } from '../../../shared/config/constants.js';

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
    this.soundManager = dependencies.soundManager;
    this.setWaitingForInput = dependencies.setWaitingForInput || (() => {});
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

    // Пока просто останавливаем музыку
    if (this.soundManager) {
      this.soundManager.stopAll();
      console.log('🎵 Music stopped on game end');
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

    // 🔇 Context-Aware Pausing (Умная Пауза)
    // Приглушаем музыку только при ПЕРВОМ бустере (для обучающего модала)
    let volumeRestore = null;
    const isFirstBooster = this.boosterManager.isFirstBooster();

    if (this.soundManager && isFirstBooster) {
      console.log('🎓 First booster! Pausing music for tutorial modal...');
      volumeRestore = this.soundManager.pauseForModal(0.3); // До 30%
    } else {
      console.log('🚀 Subsequent booster, skipping modal and music pause');
    }

    // 🚫 Блокируем автоматический resume (visibilitychange и т.д.)
    this.setWaitingForInput(true);

    // Показываем модал с флагом isFirstTime
    // Если не первый раз - автоматически принимается без показа UI
    const confirmed = await this.ui.showBoosterModal(isFirstBooster);

    // ✅ Разблокируем автоматический resume
    this.setWaitingForInput(false);

    if (volumeRestore) {
      volumeRestore.restore(300); // 300ms fade-in обратно
    }

    if (confirmed) {
      // Помечаем, что первый бустер использован
      if (isFirstBooster) {
        this.boosterManager.markFirstBoosterUsed();
      }

      await this.boosterManager.activate();
      onConfirm?.();
    }

    this.gameLoop.resume();
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
