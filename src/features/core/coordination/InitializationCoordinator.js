/**
 * InitializationCoordinator - Инициализация всех систем игры в правильном порядке.
 */

import { CONFIG, ASSET_PATHS } from '../../../shared/config/constants.js';
import { Renderer } from '../../../core/Renderer.js';
import { GameLoop } from '../../../core/GameLoop.js';
import { AssetLoader } from '../../../core/AssetLoader.js';
import { Player } from '../../player/entities/Player.js';
import { SpawnSystem } from '../../spawning/SpawnSystem.js';
import { CollisionSystem } from '../../collision/system/CollisionSystem.js';
import { DifficultyManager } from '../../progression/manager/DifficultyManager.js';
import { UIController } from '../../ui/UIController.js';
import { GameStateManager } from '../../state/GameStateManager.js';
import { BoosterManager } from '../../booster/manager/BoosterManager.js';
import { ProgressionManager } from '../../progression/manager/ProgressionManager.js';
import { CullingManager } from '../../rendering/culling/CullingManager.js';
import { InterpolationManager } from '../../rendering/interpolation/InterpolationManager.js';
import { CollisionHandler } from '../../collision/handler/CollisionHandler.js';
import { EffectCoordinator } from '../../effects/manager/EffectCoordinator.js';
import { GameLifecycleManager } from '../../progression/lifecycle/GameLifecycleManager.js';
import { CullingCoordinator } from '../../rendering/culling/CullingCoordinator.js';
import { PlayerPhysicsController } from '../../player/controllers/PlayerPhysicsController.js';
import { SoundManager } from '../../sound/manager/SoundManager.js';
import { RestartManager } from '../../restart/manager/RestartManager.js';

export class InitializationCoordinator {
  constructor(registry) {
    this.registry = registry;
  }

  async init() {
    try {
      this.registry.ui = new UIController();

      this.registry.renderer = new Renderer('game-canvas');
      await this.registry.renderer.init();

      this.registry.assetLoader = new AssetLoader();
      await this.registry.assetLoader.init();

      this.registry.assetLoader.startBackgroundLoading();
      await this.registry.assetLoader.loadCriticalAssets();

      this.initSoundSystem();

      this.registry.ui.hideLoading();

      this.registry.stateManager = new GameStateManager();
      this.registry.stateManager.setState('menu');
      this.registry.ui.showStartScreen();

      console.log('✅ Game initialization completed');
    } catch (error) {
      console.error('❌ Game initialization failed:', error);
      throw error;
    }
  }

  initSoundSystem() {
    this.registry.soundManager = new SoundManager({
      masterVolume: 1.0,
      musicVolume: 0.6,
      sfxVolume: 0.7,
    });

    const MUSIC_VOLUME = 0.6;

    this.registry.soundManager.loadMusic('mainMusic', ASSET_PATHS.MUSIC_MAIN, { volume: MUSIC_VOLUME });
    this.registry.soundManager.loadMusic('bonusMusic', ASSET_PATHS.MUSIC_BONUS, { volume: MUSIC_VOLUME });

    this.registry.soundManager.loadSound('coin', ASSET_PATHS.SFX_COIN, { volume: 0.2 });
    this.registry.soundManager.loadSound('boosterCollect', ASSET_PATHS.SFX_BOOSTER_COLLECT, { volume: 0.5 });
    this.registry.soundManager.loadSound('collision', ASSET_PATHS.SFX_COLLISION, { volume: 0.6 });
    this.registry.soundManager.loadSound('win', ASSET_PATHS.SFX_WIN, { volume: 0.7 });
    this.registry.soundManager.loadSound('lose', ASSET_PATHS.SFX_LOSE, { volume: 0.6 });

    this.registry.soundManager.initMusicStates({
      bpm: 130,
      beatsPerBar: 4,
      beatSync: true,
      gameplayBaseVolume: 0.6,
      gameplayIntensityVolume: 0.6,
      boosterIntensityVolume: 0.6,
      boosterFadeOut: 500,
      boosterFadeIn: 500,
    });

    console.log('✅ Sound system initialized');
  }

  async initGameplaySystems(updateCallback, renderCallback) {
    await this.registry.assetLoader.ensureGameplayAssetsReady();

    // Player Physics
    this.registry.playerPhysicsController = new PlayerPhysicsController(CONFIG.PLAYER.PHYSICS);

    // Player Entity
    const playerSpritesheet = this.registry.assetLoader.getAsset('playerAnimated');
    const playerBoostSpritesheet = this.registry.assetLoader.getAsset('playerAnimatedBoost');
    this.registry.player = new Player(
      playerSpritesheet,
      playerBoostSpritesheet,
      this.registry.playerPhysicsController,
      CONFIG.CANVAS_WIDTH,
      CONFIG.CANVAS_HEIGHT
    );
    this.registry.renderer.addToStage(this.registry.player.getSprite());

    // Spawn System (управление всеми entity spawners)
    const obstacleTextures = [
      this.registry.assetLoader.getAsset('obstacleBase'),
      this.registry.assetLoader.getAsset('obstacleLarge')
    ];
    const coinTexture = this.registry.assetLoader.getAsset('coin');
    const starTexture = this.registry.assetLoader.getAsset('star');
    const cloudTexture = this.registry.assetLoader.getAsset('cloud');
    const boosterSpritesheet = this.registry.assetLoader.getAsset('booster');
    const coinCollectEffectSpritesheet = this.registry.assetLoader.getAsset('coinCollectEffect');
    const collisionEffectSpritesheet = this.registry.assetLoader.getAsset('collisionEffect');

    this.registry.spawnSystem = new SpawnSystem(
      obstacleTextures,
      coinTexture,
      starTexture,
      cloudTexture,
      boosterSpritesheet,
      coinCollectEffectSpritesheet,
      collisionEffectSpritesheet,
      this.registry.renderer.stage,
      this.registry.renderer.decorationLayer
    );

    // Collision System
    this.registry.collisionSystem = new CollisionSystem();

    // Managers (difficulty, progression, booster)
    this.registry.difficultyManager = new DifficultyManager();
    this.registry.progressionManager = new ProgressionManager(this.registry.ui);
    this.registry.boosterManager = new BoosterManager(
      this.registry.spawnSystem,
      this.registry.difficultyManager,
      this.registry.ui,
      this.registry.player,
      this.registry.soundManager
    );

    // Handlers & Coordinators
    this.registry.collisionHandler = new CollisionHandler(
      this.registry.collisionSystem,
      this.registry.soundManager
    );
    this.registry.effectCoordinator = new EffectCoordinator(this.registry.spawnSystem);

    // Rendering Optimization (culling, interpolation)
    this.registry.cullingManager = new CullingManager({
      cullThreshold: CONFIG.CULLING.THRESHOLD,
      leftMultiplier: CONFIG.CULLING.LEFT_MULTIPLIER,
      rightMultiplier: CONFIG.CULLING.RIGHT_MULTIPLIER,
      rendererWidth: CONFIG.CANVAS_WIDTH,
      timeBudgetMs: CONFIG.CULLING.TIME_BUDGET_MS
    });
    this.registry.interpolationManager = new InterpolationManager();
    this.registry.cullingCoordinator = new CullingCoordinator(
      this.registry.cullingManager,
      this.registry.spawnSystem
    );

    // Game Loop
    this.registry.gameLoop = new GameLoop(updateCallback, renderCallback);

    // Lifecycle Manager (управление игровым жизненным циклом)
    this.registry.lifecycleManager = new GameLifecycleManager({
      stateManager: this.registry.stateManager,
      progressionManager: this.registry.progressionManager,
      boosterManager: this.registry.boosterManager,
      difficultyManager: this.registry.difficultyManager,
      player: this.registry.player,
      spawnSystem: this.registry.spawnSystem,
      gameLoop: this.registry.gameLoop,
      renderer: this.registry.renderer,
      ui: this.registry.ui,
      soundManager: this.registry.soundManager,
      setWaitingForInput: (isWaiting) => {
        this.registry.isWaitingForUserInput = isWaiting;
      }
    });

    // Restart Manager (полный перезапуск игры)
    this.registry.restartManager = new RestartManager({
      stateManager: this.registry.stateManager,
      progressionManager: this.registry.progressionManager,
      boosterManager: this.registry.boosterManager,
      difficultyManager: this.registry.difficultyManager,
      player: this.registry.player,
      spawnSystem: this.registry.spawnSystem,
      gameLoop: this.registry.gameLoop,
      ui: this.registry.ui,
      soundManager: this.registry.soundManager,
      game: null
    });

    const rendererWidth = this.registry.renderer.app?.screen?.width || CONFIG.CANVAS_WIDTH;
    this.registry.cullingManager.setBoundaries(rendererWidth);

    if (typeof window !== 'undefined') {
      window.soundManager = this.registry.soundManager;
      console.log('Debug: Type window.soundManager.playMusic("mainMusic", 100) to test music');
    }

    console.log('✅ Gameplay systems initialized');
  }

  initUI(callbacks) {
    this.registry.ui.setupEventListeners(callbacks);
  }
}
