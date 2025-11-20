import { CONFIG } from '../../../shared/config/constants.ts';
import { Renderer } from '../../../core/Renderer.ts';
import { GameLoop } from '../../../core/GameLoop.ts';
import { AssetLoader } from '../../../core/AssetLoader.ts';
import { Player } from '../../player/entities/Player.ts';
import { SpawnSystem } from '../../spawning/SpawnSystem.js';
import { CollisionSystem } from '../../collision/system/CollisionSystem.ts';
import { DifficultyManager } from '../../progression/manager/DifficultyManager.js';
import { UIController } from '../../ui/UIController.js';
import { GameStateManager } from '../../state/GameStateManager';
import { BoosterManager } from '../../booster/manager/BoosterManager.ts';
import { ProgressionManager } from '../../progression/manager/ProgressionManager.js';
import { CullingManager } from '../../rendering/culling/CullingManager.js';
import { InterpolationManager } from '../../rendering/interpolation/InterpolationManager.js';
import { CollisionHandler } from '../../collision/handler/CollisionHandler.ts';
import { EffectCoordinator } from '../../effects/manager/EffectCoordinator.ts';
import { GameLifecycleManager } from '../../progression/lifecycle/GameLifecycleManager.js';
import { CullingCoordinator } from '../../rendering/culling/CullingCoordinator.js';
import { PlayerPhysicsController } from '../../player/controllers/PlayerPhysicsController.ts';
import { SoundManager } from '../../sound/manager/SoundManager.js';
import { RestartManager } from '../../restart/manager/RestartManager.js';

export class InitializationCoordinator {
  constructor(registry) {
    this.registry = registry;
  }

  async init() {
    try {
      this.initUI();
      await this.initRenderer();
      await this.initAssetLoader();
      this.initSoundSystem();
      this.initStartScreen();

      console.log('✅ Game initialization completed');
    } catch (error) {
      console.error('❌ Game initialization failed:', error);
      throw error;
    }
  }

  async initGameplaySystems(updateCallback, renderCallback) {
    await this.registry.assetLoader.ensureGameplayAssetsReady();

    this.initPlayer();
    this.initSpawnSystem();
    this.initCollisionSystem();
    this.initCoreManagers();
    this.initHandlers();
    this.initRenderingOptimization();
    this.initGameLoop(updateCallback, renderCallback);
    this.initLifecycleManagers();
    this.initPostSetup();

    console.log('✅ Gameplay systems initialized');
  }

  initUI() {
    this.registry.ui = new UIController();
  }

  async initRenderer() {
    this.registry.renderer = new Renderer('game-canvas');
    await this.registry.renderer.init();
  }

  async initAssetLoader() {
    this.registry.assetLoader = new AssetLoader();
    await this.registry.assetLoader.init();
    this.registry.assetLoader.startBackgroundLoading();
    await this.registry.assetLoader.loadCriticalAssets();
  }

  initSoundSystem() {
    this.registry.soundManager = SoundManager.createWithDefaults();
  }

  initStartScreen() {
    this.registry.ui.hideLoading();
    this.registry.stateManager = new GameStateManager();
    this.registry.stateManager.setState('menu');
    this.registry.ui.showStartScreen();

    // Синхронизируем визуальное состояние mute кнопки с сохраненным состоянием
    if (this.registry.soundManager) {
      this.registry.ui.updateMuteButtonState(this.registry.soundManager.isMuted);
    }
  }

  initPlayer() {
    this.registry.playerPhysicsController = new PlayerPhysicsController(CONFIG.PLAYER.PHYSICS);

    const playerSpritesheet = this.registry.assetLoader.getAsset('playerAnimated');
    const playerBoostSpritesheet = this.registry.assetLoader.getAsset('playerAnimatedBoost');

    this.registry.player = new Player(
      playerSpritesheet,
      playerBoostSpritesheet,
      this.registry.playerPhysicsController,
      CONFIG.CANVAS_WIDTH,
      CONFIG.CANVAS_HEIGHT
    );

    const playerSprite = this.registry.player.getSprite();
    playerSprite.zIndex = 10; // 🎨 Игровой слой (между decorationLayer:0 и effectsLayer:20)
    this.registry.renderer.addToStage(playerSprite);
  }

  initSpawnSystem() {
    this.registry.spawnSystem = new SpawnSystem(
      this.registry.assetLoader,
      this.registry.renderer.stage,
      this.registry.renderer.decorationLayer,
      this.registry.renderer.effectsLayer
    );
  }

  initCollisionSystem() {
    this.registry.collisionSystem = new CollisionSystem();
  }

  initCoreManagers() {
    this.registry.difficultyManager = new DifficultyManager();
    this.registry.progressionManager = new ProgressionManager(this.registry.ui);
    this.registry.boosterManager = new BoosterManager(
      this.registry.spawnSystem,
      this.registry.difficultyManager,
      this.registry.ui,
      this.registry.player,
      this.registry.soundManager,
      this.registry.progressionManager  // Добавлен для плавных speed transitions
    );
  }

  initHandlers() {
    this.registry.collisionHandler = new CollisionHandler(
      this.registry.collisionSystem,
      this.registry.soundManager
    );
    this.registry.effectCoordinator = new EffectCoordinator(this.registry.spawnSystem);
  }

  initRenderingOptimization() {
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
  }

  initGameLoop(updateCallback, renderCallback) {
    this.registry.gameLoop = new GameLoop(updateCallback, renderCallback);
  }

  initLifecycleManagers() {
    const coreDependencies = {
      stateManager: this.registry.stateManager,
      progressionManager: this.registry.progressionManager,
      boosterManager: this.registry.boosterManager,
      difficultyManager: this.registry.difficultyManager,
      player: this.registry.player,
      spawnSystem: this.registry.spawnSystem,
      gameLoop: this.registry.gameLoop,
      ui: this.registry.ui,
      soundManager: this.registry.soundManager,
    };

    this.registry.lifecycleManager = new GameLifecycleManager({
      ...coreDependencies,
      renderer: this.registry.renderer,
      setWaitingForInput: (isWaiting) => {
        this.registry.isWaitingForUserInput = isWaiting;
      }
    });

    this.registry.restartManager = new RestartManager({
      ...coreDependencies,
      game: null
    });
  }

  initPostSetup() {
    const rendererWidth = this.registry.renderer.app?.screen?.width || CONFIG.CANVAS_WIDTH;
    this.registry.cullingManager.setBoundaries(rendererWidth);

    if (typeof window !== 'undefined') {
      window.soundManager = this.registry.soundManager;
    }
  }

  setupUIEventListeners(callbacks) {
    this.registry.ui.setupEventListeners(callbacks);
  }
}
