import { CONFIG } from '../../../shared/config/constants.ts';

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
    this.ui.showRunningScreen();
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

    // Останавливаем музыку (но не SFX)
    if (this.soundManager) {
      // Останавливаем только музыкальные треки
      const mainMusic = this.soundManager.sounds.get('mainMusic');
      const bonusMusic = this.soundManager.sounds.get('bonusMusic');
      if (mainMusic) mainMusic.stop();
      if (bonusMusic) bonusMusic.stop();
      console.log('🎵 Background music stopped on game end');
    }

    this.ui.hideRunningScreen();

    if (isWin) {
      // 🏆 ПОБЕДА: проигрываем победный звук
      if (this.soundManager) {
        this.soundManager.play('win');
      }
      this.ui.showWinScreen(score);
    } else {
      // 💀 ПОРАЖЕНИЕ: проигрываем звук поражения
      if (this.soundManager) {
        this.soundManager.play('lose');
      }
      this.ui.showLoseScreen(score);
    }
  }

  async handleCollisionSequence(collisionPoint, effectCoordinator, onComplete) {
    // 1️⃣ Проигрываем звук столкновения с препятствием
    if (this.soundManager) {
      this.soundManager.play('collision');
    }

    // 2️⃣ Показываем визуальный эффект взрыва
    effectCoordinator.emitCollisionEffect(collisionPoint.x, collisionPoint.y);
    this.gameLoop.stop();

    // 3️⃣ Ждем завершения анимации взрыва (350ms)
    await this.delay(350);

    // 4️⃣ Показываем lose screen + проигрываем звук поражения
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

    // 🔍 КРИТИЧЕСКИ ВАЖНО: Резюмим игру только если вкладка видима
    // Если пользователь закрыл модалку в другой вкладке и вернулся,
    // visibilitychange handler сам вызовет resume()
    if (!document.hidden) {
      this.gameLoop.resume();
      console.log('✅ Game resumed after booster modal (tab is visible)');
    } else {
      console.log('⏸️ Game stays paused (tab is hidden, will resume on visibility change)');
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
