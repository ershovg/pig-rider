/**
 * Главный оркестратор игры (тонкий слой координации)
 */
import { CONFIG } from './config/constants.js';
import { ENV } from './config/env.js';
import { Renderer } from './core/Renderer.js';
import { GameLoop } from './core/GameLoop.js';
import { AssetLoader } from './core/AssetLoader.js';
import { Player } from './entities/Player.js';
import { SpawnSystem } from './systems/SpawnSystem.js';
import { CollisionSystem } from './systems/CollisionSystem.js';
import { DifficultyManager } from './systems/DifficultyManager.js';
import { UIController } from './ui/UIController.js';
import { AIBotModal } from './ui/AIBotModal.js';
import { ElevenLabsService } from './services/ElevenLabsService.js';
import { GameStateManager } from './managers/GameStateManager.js';
import { BoosterManager } from './managers/BoosterManager.js';
import { ProgressionManager } from './managers/ProgressionManager.js';
import { CullingManager } from './managers/CullingManager.js';
import { InterpolationManager } from './managers/InterpolationManager.js';
import { PlayerPhysicsController } from './controllers/PlayerPhysicsController.js';
import { MathUtils } from './utils/MathUtils.js';

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
    this.aiBot = null;
    this.elevenLabs = null;

    this.stateManager = new GameStateManager();
    this.boosterManager = null;
    this.progressionManager = null;
    this.isColliding = false;

    // 🆕 Performance managers
    this.cullingManager = new CullingManager({
      cullThreshold: CONFIG.CULLING.THRESHOLD,
      timeBudgetMs: CONFIG.CULLING.TIME_BUDGET_MS
    });
    this.interpolationManager = new InterpolationManager();
    this.playerPhysicsController = new PlayerPhysicsController(CONFIG.PLAYER.PHYSICS);

    // Frame counter для periodic culling
    this.frameCount = 0;

    console.log('🎮 Game instance created');
  }

  async init() {
    try {
      this.ui = new UIController();

      if (ENV.ELEVENLABS_API_KEY) {
        this.elevenLabs = new ElevenLabsService(ENV.ELEVENLABS_API_KEY);
        await this.elevenLabs.init();
        this.aiBot = new AIBotModal(this.elevenLabs);
        await this.aiBot.init();
        this.aiBot.onComplete = () => this.startGame();
      } else {
        console.warn('⚠️ ElevenLabs API key not found. AI bot will be disabled.');
      }

      this.renderer = new Renderer('game-canvas');
      await this.renderer.init();

      this.assetLoader = new AssetLoader();
      await this.assetLoader.loadAssets();

      this.ui.hideLoading();
      this.initUI();

      this.stateManager.setState('menu');
      if (this.aiBot) {
        this.aiBot.show();
      } else {
        this.ui.showStartScreen();
      }

      console.log('✅ Game initialized successfully');
    } catch (error) {
      console.error('❌ Game initialization failed:', error);
      throw error;
    }
  }

  initSystems() {
    const playerSpritesheet = this.assetLoader.getAsset('playerAnimated');
    this.player = new Player(
      playerSpritesheet,
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
    const boosterTexture = this.assetLoader.getAsset('booster');

    this.spawnSystem = new SpawnSystem(
      obstacleTextures,
      coinTexture,
      starTexture,
      cloudTexture,
      boosterTexture,
      this.renderer.stage
    );

    this.collisionSystem = new CollisionSystem();
    this.difficultyManager = new DifficultyManager();

    this.progressionManager = new ProgressionManager(this.ui);
    this.boosterManager = new BoosterManager(
      this.spawnSystem,
      this.difficultyManager,
      this.ui
    );

    this.gameLoop = new GameLoop(
      (dt) => this.update(dt),
      (alpha) => this.render(alpha)
    );
  }

  initUI() {
    this.ui.setupEventListeners({
      onPlayClick: () => this.startGame(),
      onBoosterContinue: () => this.resumeGame(),
      onRetry: () => this.restartGame(),
      onBookDemo: () => {
        console.log('Book demo clicked');
      }
    });
  }

  startGame() {
    if (!this.player) {
      this.initSystems();
    }

    this.stateManager.setState('playing');
    this.progressionManager.reset();
    this.boosterManager.reset();
    this.difficultyManager.reset();
    this.player.reset();
    this.spawnSystem.reset();
    this.isColliding = false;

    this.frameCount = 0;

    this.ui.hideStartScreen();
    this.ui.showHUD();
    this.ui.updateCoinCount(0, CONFIG.TARGET_COINS);
    this.ui.removeBoosterClass();

    this.renderer.start();
    this.gameLoop.start();

    console.log('🚀 Game started (with interpolation & culling)');
  }

  resumeGame() {
    this.ui.hideBoosterModal();
    this.stateManager.setState('playing');
    this.gameLoop.resume();
  }

  restartGame() {
    this.startGame();
  }

  endGame(isWin) {
    this.stateManager.setState('ended');
    this.gameLoop.stop();

    this.ui.hideHUD();
    if (isWin) {
      this.ui.showWinScreen(this.progressionManager.getScore());
    } else {
      this.ui.showLoseScreen(this.progressionManager.getScore());
    }

    console.log(`🏁 Game ended - ${isWin ? 'WIN' : 'LOSE'} - Score: ${this.progressionManager.getScore()}`);
  }

  update(deltaTime) {
    if (!this.stateManager.isPlaying()) return;

    this.frameCount++;

    if (this.isColliding) {
      this.player.update(deltaTime);
      return;
    }

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
      difficultyManager: this.difficultyManager
    });

    // 🆕 Culling - удаляем объекты за пределами viewport
    this.performCulling();

    const obstacles = this.spawnSystem.getActiveObstacles();
    const coins = this.spawnSystem.getActiveCoins();
    const boosters = this.spawnSystem.getActiveBoosters();
    const collisions = this.collisionSystem.processCollisions(
      this.player,
      obstacles,
      coins
    );

    if (collisions.obstacleHit && !this.isColliding) {
      this.isColliding = true;

      const obstacle = collisions.hitObstacle;
      const obstacleSprite = obstacle.getSprite();

      this.player.triggerCollision(obstacleSprite, () => {
        this.endGame(false);
      });
      return;
    }

    for (const coin of collisions.coinsCollected) {
      const value = coin.collect();
      if (value) {
        this.progressionManager.addScore(value);
        const coinSprite = coin.getSprite();
        this.spawnSystem.emitCoinSparkle(coinSprite.x, coinSprite.y);

        if (this.progressionManager.checkWinCondition()) {
          this.endGame(true);
          return;
        }
      }
    }

    for (const booster of boosters) {
      if (!booster.isActive()) continue;

      const playerHitbox = this.player.getHitbox();
      const boosterHitbox = booster.getHitbox();

      if (boosterHitbox && MathUtils.checkAABB(playerHitbox, boosterHitbox)) {
        const result = booster.collect();
        if (result) {
          this.progressionManager.addScore(result.value);

          if (this.progressionManager.checkWinCondition()) {
            this.endGame(true);
            return;
          }

          this.handleBoosterActivation();
        }
      }
    }
  }

  async handleBoosterActivation() {
    this.gameLoop.pause();
    const confirmed = await this.ui.showBoosterModal();

    if (confirmed) {
      await this.boosterManager.activate();
    }

    this.gameLoop.resume();
  }

  /**
   * Render (вызывается на каждом RAF, до 120+ FPS)
   *
   * @param {number} alpha - Прогресс между physics frames (0.0 to 1.0)
   */
  render(alpha) {
    // 🆕 Интерполируем все движущиеся объекты для плавности 120 FPS
    if (CONFIG.INTERPOLATION.ENABLED) {
      this.interpolationManager.interpolate(alpha, [
        this.spawnSystem.getActiveObstacles(),
        this.spawnSystem.getActiveCoins(),
        this.spawnSystem.getActiveBoosters(),
        [this.player]
      ]);
    }

    // Renderer automatically renders stage
  }

  /**
   * Culling объектов за пределами viewport
   *
   * Вызывается после physics update, но перед collision detection.
   * Использует временной бюджет чтобы не блокировать frame.
   */
  performCulling() {
    const obstacles = this.spawnSystem.getActiveObstacles();
    const coins = this.spawnSystem.getActiveCoins();
    const boosters = this.spawnSystem.getActiveBoosters();

    // Culling критичных объектов с временным бюджетом
    this.cullingManager.cullWithBudget(obstacles);
    this.cullingManager.cullWithBudget(coins);
    this.cullingManager.cullWithBudget(boosters);

    // Декорации culling реже (каждые N frames) - они некритичны
    if (this.frameCount % CONFIG.CULLING.DECORATION_INTERVAL === 0) {
      const clouds = this.spawnSystem.getActiveClouds();
      const stars = this.spawnSystem.getActiveStars();

      this.cullingManager.cullAll(clouds);
      this.cullingManager.cullAll(stars);
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

  destroy() {
    if (this.gameLoop) {
      this.gameLoop.stop();
    }

    if (this.player) {
      this.player.destroy();
    }

    if (this.aiBot) {
      this.aiBot.destroy();
    }

    if (this.ui) {
      this.ui.destroy();
    }

    if (this.renderer) {
      this.renderer.destroy();
    }

    console.log('🗑️ Game destroyed');
  }
}
