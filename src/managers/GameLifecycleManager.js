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

    // 🔇 Context-Aware Pausing (Умная Пауза)
    // Приглушаем музыку только при ПЕРВОМ бустере (для обучающего модала)
    let volumeRestore = null;

    if (this.soundManager && this.boosterManager.isFirstBooster()) {
      console.log('🎓 First booster! Pausing music for tutorial modal...');
      volumeRestore = this.soundManager.pauseForModal(0.3); // До 30%

      // TODO: Когда будет custom UI модал (вместо alert):
      // - Убрать alert() из UIController.showBoosterModal()
      // - Создать красивый HTML модал с анимацией
      // - Передавать isFirstTime флаг для показа/скрытия обучающего текста
      // - Fade будет работать параллельно с показом модала (без задержек)
    } else {
      console.log('🚀 Subsequent booster, skipping music pause');
    }

    // Показываем модал (сейчас alert, в будущем custom UI)
    const confirmed = await this.ui.showBoosterModal();

    // 🔊 Восстанавливаем громкость (если приглушали)
    if (volumeRestore) {
      volumeRestore.restore(300); // 300ms fade-in обратно
    }

    if (confirmed) {
      // Помечаем, что первый бустер использован
      if (this.boosterManager.isFirstBooster()) {
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
