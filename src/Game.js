import { CONFIG } from './config/constants.js';
import { Renderer } from './core/Renderer.js';
import { GameLoop } from './core/GameLoop.js';
import { AssetLoader } from './core/AssetLoader.js';
import { Player } from './entities/Player.js';
import { SpawnSystem } from './systems/SpawnSystem.js';
import { CollisionSystem } from './systems/CollisionSystem.js';
import { DifficultyManager } from './systems/DifficultyManager.js';
import { UIController } from './ui/UIController.js';
import { GameStateManager } from './managers/GameStateManager.js';
import { BoosterManager } from './managers/BoosterManager.js';
import { ProgressionManager } from './managers/ProgressionManager.js';
import { CullingManager } from './managers/CullingManager.js';
import { InterpolationManager } from './managers/InterpolationManager.js';
import { CollisionHandler } from './managers/CollisionHandler.js';
import { EffectCoordinator } from './managers/EffectCoordinator.js';
import { GameLifecycleManager } from './managers/GameLifecycleManager.js';
import { CullingCoordinator } from './managers/CullingCoordinator.js';
import { PlayerPhysicsController } from './controllers/PlayerPhysicsController.js';
import { PerformanceMonitor } from './managers/PerformanceMonitor.js';
import { DebugOverlay } from './utils/DebugOverlay.js';

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
    this.boosterManager = null;
    this.progressionManager = null;
    this.collisionHandler = null;
    this.effectCoordinator = null;
    this.lifecycleManager = null;
    this.cullingCoordinator = null;
    this.performanceMonitor = null;
    this.debugOverlay = null;
    this.isColliding = false;

    this.cullingManager = new CullingManager({
      leftMultiplier: CONFIG.CULLING.LEFT_MULTIPLIER,
      rightMultiplier: CONFIG.CULLING.RIGHT_MULTIPLIER,
      rendererWidth: CONFIG.CANVAS_WIDTH,
      timeBudgetMs: CONFIG.CULLING.TIME_BUDGET_MS
    });
    this.interpolationManager = new InterpolationManager();
    this.playerPhysicsController = new PlayerPhysicsController(CONFIG.PLAYER.PHYSICS);

    this.frameCount = 0;

    // 🔍 DEBUG: Интервал для логирования размеров пулов (каждые 5 секунд)
    this.poolLogInterval = null;

    // 🆕 Keyboard shortcut для Performance Monitor (Shift+P)
    this.setupPerformanceShortcut();
  }

  setupPerformanceShortcut() {
    document.addEventListener('keydown', (e) => {
      // Shift+P для toggle Performance Monitor
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
      await this.assetLoader.loadAssets();

      this.ui.hideLoading();
      this.initUI();

      this.stateManager.setState('menu');
      this.ui.showStartScreen();
    } catch (error) {
      console.error('❌ Game initialization failed:', error);
      throw error;
    }
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
      this.renderer.decorationLayer // 🆕 Передаём ParticleContainer для декораций
    );

    this.collisionSystem = new CollisionSystem();
    this.difficultyManager = new DifficultyManager();

    this.progressionManager = new ProgressionManager(this.ui);
    this.boosterManager = new BoosterManager(
      this.spawnSystem,
      this.difficultyManager,
      this.ui,
      this.player
    );

    this.collisionHandler = new CollisionHandler(this.collisionSystem);
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
      ui: this.ui
    });

    // 🆕 Инициализируем Performance Monitor
    this.performanceMonitor = new PerformanceMonitor(this.renderer, this.gameLoop);
    this.performanceMonitor.enable();

    // 🆕 Инициализируем Debug Overlay для culling boundaries
    this.debugOverlay = new DebugOverlay(this.renderer, this.cullingManager);

    // Устанавливаем динамические boundaries на основе реального размера канваса
    const rendererWidth = this.renderer.app?.screen?.width || CONFIG.CANVAS_WIDTH;
    this.cullingManager.setBoundaries(rendererWidth);

    console.log('💡 Press Shift+P to toggle Performance Monitor');
    console.log('💡 Press D to toggle Culling Debug Overlay');
  }

  initUI() {
    this.ui.setupEventListeners({
      onPlayClick: () => this.startGame(),
      onBoosterContinue: () => this.resumeGame(),
      onRetry: () => this.restartGame(),
      onBookDemo: () => console.log('Book demo clicked')
    });
  }

  startGame() {
    if (!this.player) {
      this.initSystems();
    }

    this.isColliding = false;
    this.frameCount = 0;

    this.lifecycleManager.startGame();

    // 🔍 DEBUG: Запускаем логирование размеров пулов каждые 5 секунд
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

  update(deltaTime) {
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
      cullThreshold: this.cullingManager.cullThreshold
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

    // 🆕 Обновляем Performance Monitor
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

  // 🔍 DEBUG: Логирование размеров пулов
  startPoolLogging() {
    // Очищаем предыдущий интервал, если был
    if (this.poolLogInterval) {
      clearInterval(this.poolLogInterval);
    }

    // Логируем каждые 5 секунд
    this.poolLogInterval = setInterval(() => {
      if (!this.spawnSystem) return;

      const obstaclePool = this.spawnSystem.obstacleSpawner?.pool;
      const coinPool = this.spawnSystem.coinSpawner?.pool;
      const boosterPool = this.spawnSystem.boosterSpawner?.pool;
      const cloudPool = this.spawnSystem.cloudSpawner?.pool;
      const starPool = this.spawnSystem.starSpawner?.pool;

      // Получаем полную статистику пула
      const obstacleStats = obstaclePool?.getStats() || { active: 0, pooled: 0, total: 0 };
      const coinStats = coinPool?.getStats() || { active: 0, pooled: 0, total: 0 };
      const boosterStats = boosterPool?.getStats() || { active: 0, pooled: 0, total: 0 };
      const cloudStats = cloudPool?.getStats() || { active: 0, pooled: 0, total: 0 };
      const starStats = starPool?.getStats() || { active: 0, pooled: 0, total: 0 };

      console.log(
        `🔍 [POOL DEBUG] Obstacles: active=${obstacleStats.active} pooled=${obstacleStats.pooled} total=${obstacleStats.total} | ` +
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
    if (this.debugOverlay) this.debugOverlay.destroy();
    if (this.gameLoop) this.gameLoop.stop();
    if (this.player) this.player.destroy();
    if (this.ui) this.ui.destroy();
    if (this.renderer) this.renderer.destroy();
  }
}
