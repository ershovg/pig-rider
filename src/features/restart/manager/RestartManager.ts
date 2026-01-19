import { CONFIG } from '../../../shared/config/constants';
import type {
  GameStateManager,
  ProgressionManager,
  BoosterManager,
  DifficultyManager,
  SpawnSystem,
  SoundManager
} from '../../../types/managers';
import type { Player } from '../../../types/player';
import type { UIController } from '../../../types/ui';
import type { GameLoop, Renderer } from '../../../types/core';

interface UpdateCoordinator {
  resetCollisionFlag(): void;
  resetFrameCount(): void;
}

interface Game {
  stopPoolLogging(): void;
  startPoolLogging(): void;
  updateCoordinator?: UpdateCoordinator;
  renderer?: Renderer;
}

interface RestartManagerDependencies {
  stateManager: GameStateManager;
  progressionManager: ProgressionManager;
  boosterManager: BoosterManager;
  difficultyManager: DifficultyManager;
  player: Player;
  spawnSystem: SpawnSystem;
  gameLoop: GameLoop;
  ui: UIController;
  soundManager: SoundManager;
  game?: Game;
}

export class RestartManager {
  private stateManager: GameStateManager;
  private progressionManager: ProgressionManager;
  private boosterManager: BoosterManager;
  private difficultyManager: DifficultyManager;
  private player: Player;
  private spawnSystem: SpawnSystem;
  private gameLoop: GameLoop;
  private ui: UIController;
  private soundManager: SoundManager;
  private game?: Game;

  constructor(dependencies: RestartManagerDependencies) {
    this.stateManager = dependencies.stateManager;
    this.progressionManager = dependencies.progressionManager;
    this.boosterManager = dependencies.boosterManager;
    this.difficultyManager = dependencies.difficultyManager;
    this.player = dependencies.player;
    this.spawnSystem = dependencies.spawnSystem;
    this.gameLoop = dependencies.gameLoop;
    this.ui = dependencies.ui;
    this.soundManager = dependencies.soundManager;
    this.game = dependencies.game;

    console.log('✅ RestartManager initialized');
  }

  setGame(game: Game): void {
    this.game = game;
  }

  restart(): void {
    console.log('🔄 RestartManager: Starting full game restart...');

    this._stopSystems();
    this._cleanupUI();
    this._resetManagers();
    this._resetGameFlags();
    this._startGameplay();

    console.log('✅ RestartManager: Game restarted successfully');
  }

  private _stopSystems(): void {
    console.log('  ⏹️  Stopping systems...');

    if (this.gameLoop) {
      this.gameLoop.stop();
    }

    if (this.soundManager) {
      this.soundManager.reset();
    }

    if (this.game) {
      this.game.stopPoolLogging();
    }
  }

  private _cleanupUI(): void {
    console.log('  🧹 Cleaning up UI...');

    this.ui.hideWinScreen();
    this.ui.hideLoseScreen();
    this.ui.hideBoosterModal();
    this.ui.removeBoosterClass();
    this.ui.hideBoosterIcon();
  }

  private _resetManagers(): void {
    console.log('  🔄 Resetting managers...');

    this.progressionManager.reset();
    this.boosterManager.reset();

    this.boosterManager.isFirstBoosterEver = true;
    console.log('  🎓 First booster flag reset - tutorial will show again');

    this.difficultyManager.reset();
    this.player.reset();
    this.spawnSystem.reset();
    this.spawnSystem.clearAllEffects();
  }

  private _resetGameFlags(): void {
    console.log('  🏳️  Resetting game flags...');

    if (this.game && this.game.updateCoordinator) {
      this.game.updateCoordinator.resetCollisionFlag();
      this.game.updateCoordinator.resetFrameCount();
    }
  }

  private _startGameplay(): void {
    console.log('  ▶️  Starting gameplay...');

    this.stateManager.setState('playing');
    this.ui.showRunningScreen();
    this.ui.updateCoinCount(0, CONFIG.TARGET_COINS);

    if (this.soundManager) {
      this.soundManager.setMusicState('gameplay');
      console.log('  🎵 Music state: gameplay');
    }

    if (this.game?.renderer) {
      this.game.renderer.start();
    }

    this.gameLoop.start();

    if (this.game) {
      this.game.startPoolLogging();
    }
  }
}
