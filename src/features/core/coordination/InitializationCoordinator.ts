import { CONFIG } from '../../../shared/config/constants.ts';
import { Renderer } from '../../../core/Renderer.ts';
import { GameLoop } from '../../../core/GameLoop.ts';
import { AssetLoader } from '../../../core/AssetLoader.ts';
import { Player } from '../../player/entities/Player.ts';
import { SpawnSystem } from '../../spawning/SpawnSystem.ts';
import { CollisionSystem } from '../../collision/system/CollisionSystem.ts';
import { DifficultyManager } from '../../progression/manager/DifficultyManager.ts';
import { UIController } from '../../ui/UIController.ts';
import { GameStateManager } from '../../state/GameStateManager.ts';
import { BoosterManager } from '../../booster/manager/BoosterManager.ts';
import { ProgressionManager } from '../../progression/manager/ProgressionManager.ts';
import { CullingManager } from '../../rendering/culling/CullingManager.ts';
import { InterpolationManager } from '../../rendering/interpolation/InterpolationManager.ts';
import { CollisionHandler } from '../../collision/handler/CollisionHandler.ts';
import { EffectCoordinator } from '../../effects/manager/EffectCoordinator.ts';
import { GameLifecycleManager } from '../../progression/lifecycle/GameLifecycleManager.ts';
import { CullingCoordinator } from '../../rendering/culling/CullingCoordinator.ts';
import { PlayerPhysicsController } from '../../player/controllers/PlayerPhysicsController.ts';
import { SoundManager } from '../../sound/manager/SoundManager.ts';
import { RestartManager } from '../../restart/manager/RestartManager.ts';
import type { SystemRegistry } from '../registry/SystemRegistry.ts';
import type { UIEventCallbacks } from '../../../types/ui';

export class InitializationCoordinator {
  private registry: SystemRegistry;

  constructor(registry: SystemRegistry) {
    this.registry = registry;
  }

  async init(): Promise<void> {
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

  async initGameplaySystems(updateCallback: (deltaTime: number) => void, renderCallback: (alpha: number) => void): Promise<void> {
    await this.registry.assetLoader!.ensureGameplayAssetsReady();

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

  initUI(): void {
    this.registry.ui = new UIController();
  }

  async initRenderer(): Promise<void> {
    this.registry.renderer = new Renderer('game-canvas');
    await this.registry.renderer.init();
  }

  async initAssetLoader(): Promise<void> {
    this.registry.assetLoader = new AssetLoader();
    await this.registry.assetLoader.init();
    this.registry.assetLoader.startBackgroundLoading();
    await this.registry.assetLoader.loadCriticalAssets();
  }

  initSoundSystem(): void {
    this.registry.soundManager = SoundManager.createWithDefaults();
  }

  initStartScreen(): void {
    this.registry.ui!.hideLoading();
    this.registry.stateManager = new GameStateManager();
    this.registry.stateManager.setState('menu');
    this.registry.ui!.showStartScreen();

    if (this.registry.soundManager) {
      this.registry.ui!.updateMuteButtonState(this.registry.soundManager.isMuted);
    }
  }

  initPlayer(): void {
    this.registry.playerPhysicsController = new PlayerPhysicsController(CONFIG.PLAYER.PHYSICS);

    const playerSpritesheet = this.registry.assetLoader!.getAsset('playerAnimated');
    const playerBoostSpritesheet = this.registry.assetLoader!.getAsset('playerAnimatedBoost');

    this.registry.player = new Player(
      playerSpritesheet,
      playerBoostSpritesheet,
      this.registry.playerPhysicsController,
      CONFIG.CANVAS_WIDTH,
      CONFIG.CANVAS_HEIGHT
    );

    const playerSprite = this.registry.player.getSprite();
    playerSprite.zIndex = 10;
    this.registry.renderer!.addToStage(playerSprite);
  }

  initSpawnSystem(): void {
    this.registry.spawnSystem = new SpawnSystem(
      this.registry.assetLoader!,
      this.registry.renderer!.stage,
      this.registry.renderer!.decorationLayer,
      this.registry.renderer!.effectsLayer
    );
  }

  initCollisionSystem(): void {
    this.registry.collisionSystem = new CollisionSystem();
  }

  initCoreManagers(): void {
    this.registry.difficultyManager = new DifficultyManager();
    this.registry.progressionManager = new ProgressionManager(this.registry.ui!);
    this.registry.boosterManager = new BoosterManager(
      this.registry.spawnSystem!,
      this.registry.difficultyManager,
      this.registry.ui!,
      this.registry.player!,
      this.registry.soundManager!,
      this.registry.progressionManager
    );
  }

  initHandlers(): void {
    this.registry.collisionHandler = new CollisionHandler(
      this.registry.collisionSystem!,
      this.registry.soundManager!
    );
    this.registry.effectCoordinator = new EffectCoordinator(this.registry.spawnSystem!);
  }

  initRenderingOptimization(): void {
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
      this.registry.spawnSystem!
    );
  }

  initGameLoop(updateCallback: (deltaTime: number) => void, renderCallback: (alpha: number) => void): void {
    this.registry.gameLoop = new GameLoop(updateCallback, renderCallback);
  }

  initLifecycleManagers(): void {
    const coreDependencies = {
      stateManager: this.registry.stateManager!,
      progressionManager: this.registry.progressionManager!,
      boosterManager: this.registry.boosterManager!,
      difficultyManager: this.registry.difficultyManager!,
      player: this.registry.player!,
      spawnSystem: this.registry.spawnSystem!,
      gameLoop: this.registry.gameLoop!,
      ui: this.registry.ui!,
      soundManager: this.registry.soundManager!,
    };

    this.registry.lifecycleManager = new GameLifecycleManager({
      ...coreDependencies,
      renderer: this.registry.renderer!,
      setWaitingForInput: (isWaiting: boolean) => {
        this.registry.isWaitingForUserInput = isWaiting;
      }
    });

    this.registry.restartManager = new RestartManager({
      ...coreDependencies,
      game: null
    });
  }

  initPostSetup(): void {
    const rendererWidth = this.registry.renderer!.app?.screen?.width || CONFIG.CANVAS_WIDTH;
    this.registry.cullingManager!.setBoundaries(rendererWidth);

    if (typeof window !== 'undefined') {
      (window as Window & { soundManager?: SoundManager }).soundManager = this.registry.soundManager!;
    }
  }

  setupUIEventListeners(callbacks: UIEventCallbacks): void {
    this.registry.ui!.setupEventListeners(callbacks);
  }
}
