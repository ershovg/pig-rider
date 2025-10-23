import { CONFIG } from './shared/config/constants.js';
import { Renderer } from './core/Renderer.js';
import { GameLoop } from './core/GameLoop.js';
import { AssetLoader } from './core/AssetLoader.js';
import { Player } from './features/player/entities/Player.js';
import { SpawnSystem } from './features/spawning/SpawnSystem.js';
import { CollisionSystem } from './features/collision/system/CollisionSystem.js';
import { DifficultyManager } from './features/progression/manager/DifficultyManager.js';
import { UIController } from './features/ui/UIController.js';
import { GameStateManager } from './features/state/GameStateManager.js';
import { BoosterManager } from './features/booster/manager/BoosterManager.js';
import { ProgressionManager } from './features/progression/manager/ProgressionManager.js';
import { CullingManager } from './features/rendering/culling/CullingManager.js';
import { InterpolationManager } from './features/rendering/interpolation/InterpolationManager.js';
import { CollisionHandler } from './features/collision/handler/CollisionHandler.js';
import { EffectCoordinator } from './features/effects/manager/EffectCoordinator.js';
import { GameLifecycleManager } from './features/progression/lifecycle/GameLifecycleManager.js';
import { CullingCoordinator } from './features/rendering/culling/CullingCoordinator.js';
import { PlayerPhysicsController } from './features/player/controllers/PlayerPhysicsController.js';
import { PerformanceMonitor } from './features/monitoring/PerformanceMonitor.js';
import { SoundManager } from './features/sound/manager/SoundManager.js';
import { ASSET_PATHS } from './shared/config/constants.js';

export class Game {
  constructor() {
    this.renderer = null;
    this.gameLoop = null;
    this.assetLoader = null;

    this.player = null;
    this.spawnSystem = null;
    this.collisionSystem = null;
    this.difficultyManager = null;

    this.ui = null;

    this.stateManager = new GameStateManager();
    this.soundManager = null;
    this.boosterManager = null;
    this.progressionManager = null;
    this.collisionHandler = null;
    this.effectCoordinator = null;
    this.lifecycleManager = null;
    this.cullingCoordinator = null;
    this.performanceMonitor = null;
    this.isColliding = false;

    // Флаг блокировки автоматического resume (для модалов, ожидающих клика)
    this.isWaitingForUserInput = false;

    this.cullingManager = new CullingManager({
      cullThreshold: CONFIG.CULLING.THRESHOLD,
      leftMultiplier: CONFIG.CULLING.LEFT_MULTIPLIER,
      rightMultiplier: CONFIG.CULLING.RIGHT_MULTIPLIER,
      rendererWidth: CONFIG.CANVAS_WIDTH,
      timeBudgetMs: CONFIG.CULLING.TIME_BUDGET_MS
    });
    this.interpolationManager = new InterpolationManager();
    this.playerPhysicsController = new PlayerPhysicsController(CONFIG.PLAYER.PHYSICS);

    this.frameCount = 0;
    this.poolLogInterval = null;
    this.setupPerformanceShortcut();
  }

  setupPerformanceShortcut() {
    document.addEventListener('keydown', (e) => {
      if (e.shiftKey && e.key === 'P') {
        if (this.performanceMonitor) {
          this.performanceMonitor.toggle();
        }
      }
    });
  }

  async init() {
    try {
      this.ui = new UIController();

      this.renderer = new Renderer('game-canvas');
      await this.renderer.init();

      this.assetLoader = new AssetLoader();
      await this.assetLoader.init();

      this.assetLoader.startBackgroundLoading();

      await this.assetLoader.loadCriticalAssets();

      this.initSoundSystem();

      this.ui.hideLoading();
      this.initUI();

      this.stateManager.setState('menu');
      this.ui.showStartScreen();
    } catch (error) {
      console.error('❌ Game initialization failed:', error);
      throw error;
    }
  }

  /**
   * Инициализирует звуковую систему и загружает все звуки
   */
  initSoundSystem() {
    this.soundManager = new SoundManager({
      masterVolume: 1.0,
      musicVolume: 0.6,
      sfxVolume: 0.7,
    });

    const MUSIC_VOLUME = 0.6;

    this.soundManager.loadMusic('mainMusic', ASSET_PATHS.MUSIC_MAIN, {
      volume: MUSIC_VOLUME,
    });

    this.soundManager.loadMusic('bonusMusic', ASSET_PATHS.MUSIC_BONUS, {
      volume: MUSIC_VOLUME,
    });

    this.soundManager.loadSound('coin', ASSET_PATHS.SFX_COIN, {
      volume: 0.05,
    });

    this.soundManager.initMusicStates({
      bpm: 130,
      beatsPerBar: 4,
      beatSync: true,
      gameplayBaseVolume: 0.6,
      gameplayIntensityVolume: 0.6,
      boosterIntensityVolume: 0.6,
      boosterFadeOut: 500,
      boosterFadeIn: 500,
    });

    console.log('Sound system initialized');
  }

  initSystems() {
    const playerSpritesheet = this.assetLoader.getAsset('playerAnimated');
    const playerBoostSpritesheet = this.assetLoader.getAsset('playerAnimatedBoost');
    this.player = new Player(
      playerSpritesheet,
      playerBoostSpritesheet,
      this.playerPhysicsController,
      CONFIG.CANVAS_WIDTH,
      CONFIG.CANVAS_HEIGHT
    );
    this.renderer.addToStage(this.player.getSprite());

    const obstacleTextures = [
      this.assetLoader.getAsset('obstacleBase'),
      this.assetLoader.getAsset('obstacleLarge')
    ];
    const coinTexture = this.assetLoader.getAsset('coin');
    const starTexture = this.assetLoader.getAsset('star');
    const cloudTexture = this.assetLoader.getAsset('cloud');
    const boosterSpritesheet = this.assetLoader.getAsset('booster');
    const coinCollectEffectSpritesheet = this.assetLoader.getAsset('coinCollectEffect');
    const collisionEffectSpritesheet = this.assetLoader.getAsset('collisionEffect');

    this.spawnSystem = new SpawnSystem(
      obstacleTextures,
      coinTexture,
      starTexture,
      cloudTexture,
      boosterSpritesheet,
      coinCollectEffectSpritesheet,
      collisionEffectSpritesheet,
      this.renderer.stage,
      this.renderer.decorationLayer
    );

    this.collisionSystem = new CollisionSystem();
    this.difficultyManager = new DifficultyManager();

    this.progressionManager = new ProgressionManager(this.ui);
    this.boosterManager = new BoosterManager(
      this.spawnSystem,
      this.difficultyManager,
      this.ui,
      this.player,
      this.soundManager
    );

    this.collisionHandler = new CollisionHandler(this.collisionSystem, this.soundManager);
    this.effectCoordinator = new EffectCoordinator(this.spawnSystem);
    this.cullingCoordinator = new CullingCoordinator(this.cullingManager, this.spawnSystem);

    this.gameLoop = new GameLoop(
      (dt) => this.update(dt),
      (alpha) => this.render(alpha)
    );

    this.lifecycleManager = new GameLifecycleManager({
      stateManager: this.stateManager,
      progressionManager: this.progressionManager,
      boosterManager: this.boosterManager,
      difficultyManager: this.difficultyManager,
      player: this.player,
      spawnSystem: this.spawnSystem,
      gameLoop: this.gameLoop,
      renderer: this.renderer,
      ui: this.ui,
      soundManager: this.soundManager,
      setWaitingForInput: (isWaiting) => { this.isWaitingForUserInput = isWaiting; }
    });

    this.performanceMonitor = new PerformanceMonitor(this.renderer, this.gameLoop);
    this.performanceMonitor.enable();
    const rendererWidth = this.renderer.app?.screen?.width || CONFIG.CANVAS_WIDTH;
    this.cullingManager.setBoundaries(rendererWidth);

    console.log('Press Shift+P to toggle Performance Monitor');
    console.log('Press D to toggle Culling Debug Overlay');

    if (typeof window !== 'undefined') {
      window.soundManager = this.soundManager;
      console.log('Debug: Type window.soundManager.playMusic("mainMusic", 100) to test music');
    }
  }

  initUI() {
    this.ui.setupEventListeners({
      onPlayClick: () => this.startGame(),
      onBoosterContinue: () => this.resumeGame(),
      onRetry: () => this.restartGame(),
      onBookDemo: () => console.log('Book demo clicked')
    });
  }

  async startGame() {
    if (!this.player) {
      await this.assetLoader.ensureGameplayAssetsReady();
      this.initSystems();
    }

    this.isColliding = false;
    this.frameCount = 0;

    this.lifecycleManager.startGame();

    this.startPoolLogging();
  }

  resumeGame() {
    this.ui.hideBoosterModal();
    this.stateManager.setState('playing');
    this.gameLoop.resume();
  }

  restartGame() {
    this.startGame();
  }

  update(deltaTime, frameDeltaTime = null) {
    if (!this.stateManager.isPlaying()) return;

    this.frameCount++;

    this.interpolationManager.saveStates([
      this.spawnSystem.getActiveObstacles(),
      this.spawnSystem.getActiveCoins(),
      this.spawnSystem.getActiveBoosters(),
      [this.player]
    ]);

    this.boosterManager.update(deltaTime);
    this.progressionManager.update(deltaTime);
    this.difficultyManager.updateScore(this.progressionManager.getScore());

    this.player.update(deltaTime);

    const boosterContext = this.boosterManager.getContext();
    this.spawnSystem.update(deltaTime, this.progressionManager.getGameSpeed(), {
      ...boosterContext,
      difficultyManager: this.difficultyManager,
      cullThreshold: this.cullingManager.cullThreshold,
      frameDeltaTime: frameDeltaTime || deltaTime
    });

    this.cullingCoordinator.performCulling(this.frameCount);

    const result = this.collisionHandler.processFrame(
      this.player,
      this.spawnSystem.getActiveObstacles(),
      this.spawnSystem.getActiveCoins(),
      this.spawnSystem.getActiveBoosters()
    );

    if (result.obstacleCollision && !this.isColliding) {
      this.isColliding = true;
      this.lifecycleManager.handleCollisionSequence(
        result.obstacleCollision,
        this.effectCoordinator,
        () => this.lifecycleManager.endGame(false, this.progressionManager.getScore())
      );
      return;
    }

    for (const coin of result.collectedCoins) {
      this.progressionManager.addScore(coin.value);
      this.effectCoordinator.emitCoinCollectEffect(coin.x, coin.y);

      if (this.progressionManager.checkWinCondition()) {
        this.lifecycleManager.endGame(true, this.progressionManager.getScore());
        return;
      }
    }

    if (result.collectedBooster) {
      this.progressionManager.addScore(result.collectedBooster.value);

      if (this.progressionManager.checkWinCondition()) {
        this.lifecycleManager.endGame(true, this.progressionManager.getScore());
        return;
      }

      this.lifecycleManager.handleBoosterActivation();
    }

    if (this.performanceMonitor) {
      this.performanceMonitor.update({
        spawnSystem: this.spawnSystem,
        cullingCoordinator: this.cullingCoordinator
      });
    }
  }

  render(alpha) {
    if (CONFIG.INTERPOLATION.ENABLED) {
      this.interpolationManager.interpolate(alpha, [
        this.spawnSystem.getActiveObstacles(),
        this.spawnSystem.getActiveCoins(),
        this.spawnSystem.getActiveBoosters(),
        [this.player]
      ]);
    }
  }

  pause() {
    if (this.stateManager.isPlaying()) {
      this.stateManager.setState('paused');
      this.gameLoop.pause();
    }
  }

  resume() {
    if (this.stateManager.isPaused()) {
      this.stateManager.setState('playing');
      this.gameLoop.resume();
    }
  }

  startPoolLogging() {
    if (this.poolLogInterval) {
      clearInterval(this.poolLogInterval);
    }

    this.poolLogInterval = setInterval(() => {
      if (!this.spawnSystem) return;

      const obstaclePool = this.spawnSystem.obstacleSpawner?.pool;
      const coinPool = this.spawnSystem.coinSpawner?.pool;
      const boosterPool = this.spawnSystem.boosterSpawner?.pool;
      const cloudPool = this.spawnSystem.cloudSpawner?.pool;
      const starPool = this.spawnSystem.starSpawner?.pool;

      const obstacleStats = obstaclePool?.getStats() || { active: 0, pooled: 0, total: 0 };
      const coinStats = coinPool?.getStats() || { active: 0, pooled: 0, total: 0 };
      const boosterStats = boosterPool?.getStats() || { active: 0, pooled: 0, total: 0 };
      const cloudStats = cloudPool?.getStats() || { active: 0, pooled: 0, total: 0 };
      const starStats = starPool?.getStats() || { active: 0, pooled: 0, total: 0 };

      console.log(
        `[POOL DEBUG] Obstacles: active=${obstacleStats.active} pooled=${obstacleStats.pooled} total=${obstacleStats.total} | ` +
        `Coins: active=${coinStats.active} pooled=${coinStats.pooled} | ` +
        `Boosters: active=${boosterStats.active} pooled=${boosterStats.pooled} | ` +
        `Clouds: active=${cloudStats.active} pooled=${cloudStats.pooled} | ` +
        `Stars: active=${starStats.active} pooled=${starStats.pooled}`
      );
    }, 5000);
  }

  stopPoolLogging() {
    if (this.poolLogInterval) {
      clearInterval(this.poolLogInterval);
      this.poolLogInterval = null;
    }
  }

  destroy() {
    this.stopPoolLogging();
    if (this.gameLoop) this.gameLoop.stop();
    if (this.player) this.player.destroy();
    if (this.ui) this.ui.destroy();
    if (this.renderer) this.renderer.destroy();
  }
}
