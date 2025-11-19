import { CONFIG } from '../../../shared/config/constants';
import type {
  GameLifecycleManagerDependencies,
  GameStateManager,
  ProgressionManager,
  BoosterManager,
  DifficultyManager,
  Player,
  SpawnSystem,
  GameLoop,
  Renderer,
  UIController,
  SoundManager,
  SetWaitingForInputCallback,
  VoidCallback,
  Point2D,
  EffectCoordinator
} from '../../../types';

export class GameLifecycleManager {
  private stateManager: GameStateManager;
  private progressionManager: ProgressionManager;
  private boosterManager: BoosterManager;
  private difficultyManager: DifficultyManager;
  private player: Player;
  private spawnSystem: SpawnSystem;
  private gameLoop: GameLoop;
  private renderer: Renderer;
  private ui: UIController;
  private soundManager: SoundManager;
  private setWaitingForInput: SetWaitingForInputCallback;

  constructor(dependencies: GameLifecycleManagerDependencies) {
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

  startGame(): void {
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

    if (this.soundManager) {
      this.soundManager.setMusicState('gameplay');
      console.log('🎵 Music state: gameplay');
    }

    this.renderer.start();
    this.gameLoop.start();
  }

  endGame(isWin: boolean, score: number): void {
    this.stateManager.setState('ended');
    this.gameLoop.stop();

    if (this.player?.inputController) {
      this.player.inputController.disable();
    }

    if (this.soundManager) {
      const mainMusic = this.soundManager.sounds.get('mainMusic');
      const bonusMusic = this.soundManager.sounds.get('bonusMusic');
      if (mainMusic) mainMusic.stop();
      if (bonusMusic) bonusMusic.stop();
      console.log('🎵 Background music stopped on game end');
    }

    this.ui.hideRunningScreen();

    if (isWin) {
      if (this.soundManager) {
        this.soundManager.play('win');
      }
      this.ui.showWinScreen(score);
    } else {
      if (this.soundManager) {
        this.soundManager.play('lose');
      }
      this.ui.showLoseScreen(score);
    }
  }

  async handleCollisionSequence(
    collisionPoint: Point2D,
    effectCoordinator: EffectCoordinator,
    onComplete: VoidCallback
  ): Promise<void> {
    if (this.soundManager) {
      this.soundManager.play('collision');
    }

    effectCoordinator.emitCollisionEffect(collisionPoint.x, collisionPoint.y);
    this.gameLoop.stop();

    await this.delay(350);

    onComplete();
  }

  async handleBoosterActivation(onConfirm?: VoidCallback): Promise<void> {
    this.gameLoop.pause();

    let volumeRestore = null;
    const isFirstBooster = this.boosterManager.isFirstBooster();

    if (this.soundManager && isFirstBooster) {
      console.log('🎓 First booster! Pausing music for tutorial modal...');
      volumeRestore = this.soundManager.pauseForModal(0.3);
    } else {
      console.log('🚀 Subsequent booster, skipping modal and music pause');
    }

    this.setWaitingForInput(true);

    const confirmed = await this.ui.showBoosterModal(isFirstBooster);

    this.setWaitingForInput(false);

    if (volumeRestore) {
      volumeRestore.restore(300);
    }

    if (confirmed) {
      if (isFirstBooster) {
        this.boosterManager.markFirstBoosterUsed();
      }

      await this.boosterManager.activate();
      onConfirm?.();
    }

    if (!document.hidden) {
      this.gameLoop.resume();
      console.log('✅ Game resumed after booster modal (tab is visible)');
    } else {
      console.log('⏸️ Game stays paused (tab is hidden, will resume on visibility change)');
    }
  }

  delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
