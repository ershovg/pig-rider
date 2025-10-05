import { CONFIG } from './config/constants.js';
import { Renderer } from './core/Renderer.js';
import { GameLoop } from './core/GameLoop.js';
import { AssetLoader } from './core/AssetLoader.js';
import { Player } from './entities/Player.js';
import { SpawnSystem } from './systems/SpawnSystem.js';
import { CollisionSystem } from './systems/CollisionSystem.js';
import { UIController } from './ui/UIController.js';
import { EventBus } from './utils/EventBus.js';

export class Game {
  constructor() {
    this.renderer = null;
    this.gameLoop = null;
    this.assetLoader = null;

    this.player = null;
    this.spawnSystem = null;
    this.collisionSystem = null;

    this.ui = null; // HTML UI Controller

    this.gameState = 'loading'; // loading, menu, playing, paused, ended
    this.score = 0;
    this.gameSpeed = CONFIG.GAME_SPEED;

    console.log('🎮 Game instance created');
  }

  /**
   * Initialize game
   */
  async init() {
    try {
      // Initialize HTML UI Controller
      this.ui = new UIController();

      // Initialize renderer (PixiJS)
      this.renderer = new Renderer('game-canvas');
      await this.renderer.init();

      // Load assets
      this.assetLoader = new AssetLoader();
      await this.assetLoader.loadAssets();

      // Hide loading screen
      this.ui.hideLoading();

      // Initialize game systems (PixiJS)
      this.initSystems();

      // Initialize UI event listeners
      this.initUI();

      // Show start screen
      this.gameState = 'menu';
      this.ui.showStartScreen();

      console.log('✅ Game initialized successfully');
    } catch (error) {
      console.error('❌ Game initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize game systems
   */
  initSystems() {
    // Create player
    const playerTexture = this.assetLoader.getAsset('player');
    this.player = new Player(playerTexture);
    this.renderer.addToStage(this.player.getSprite());

    // Create spawn system
    const obstacleTexture = this.assetLoader.getAsset('obstacle');
    const coinTexture = this.assetLoader.getAsset('coin');
    this.spawnSystem = new SpawnSystem(
      obstacleTexture,
      coinTexture,
      this.renderer.stage
    );

    // Create collision system
    this.collisionSystem = new CollisionSystem();

    // Create game loop
    this.gameLoop = new GameLoop(
      (dt) => this.update(dt),
      (alpha) => this.render(alpha)
    );
  }

  /**
   * Initialize UI event listeners
   */
  initUI() {
    // Setup HTML UI button listeners
    this.ui.setupEventListeners({
      onPlayClick: () => this.startGame(),
      onBoosterContinue: () => this.resumeGame(),
      onRetry: () => this.restartGame(),
      onBookDemo: () => {
        // TODO: Navigate to demo booking page
        console.log('Book demo clicked');
      }
    });
  }

  /**
   * Start game
   */
  startGame() {
    this.gameState = 'playing';
    this.score = 0;
    this.gameSpeed = CONFIG.GAME_SPEED;

    this.player.reset();
    this.spawnSystem.reset();

    // Hide start screen, show HUD
    this.ui.hideStartScreen();
    this.ui.showHUD();
    this.ui.updateCoinCount(0, CONFIG.TARGET_COINS);

    this.gameLoop.start();

    console.log('🚀 Game started');
  }

  /**
   * Resume game (after booster modal)
   */
  resumeGame() {
    this.ui.hideBoosterModal();
    this.gameState = 'playing';
    this.gameLoop.resume();
  }

  /**
   * Restart game
   */
  restartGame() {
    this.startGame();
  }

  /**
   * End game
   */
  endGame(isWin) {
    this.gameState = 'ended';
    this.gameLoop.stop();

    // Hide HUD, show end screen
    this.ui.hideHUD();
    if (isWin) {
      this.ui.showWinScreen(this.score);
    } else {
      this.ui.showLoseScreen(this.score);
    }

    console.log(`🏁 Game ended - ${isWin ? 'WIN' : 'LOSE'} - Score: ${this.score}`);
  }

  /**
   * Update game state (fixed timestep)
   */
  update(deltaTime) {
    if (this.gameState !== 'playing') return;

    // Increase game speed gradually
    this.gameSpeed = Math.min(
      this.gameSpeed + CONFIG.SPEED_INCREMENT,
      CONFIG.MAX_SPEED
    );

    // Update player
    this.player.update(deltaTime);

    // Update spawn system
    this.spawnSystem.update(deltaTime, this.gameSpeed);

    // Check collisions
    const obstacles = this.spawnSystem.getActiveObstacles();
    const coins = this.spawnSystem.getActiveCoins();
    const collisions = this.collisionSystem.processCollisions(
      this.player,
      obstacles,
      coins
    );

    // Handle obstacle collision
    if (collisions.obstacleHit) {
      this.endGame(false);
      return;
    }

    // Handle coin collection
    for (const coin of collisions.coinsCollected) {
      const value = coin.collect();
      if (value) {
        this.score += value;
        this.ui.updateCoinCount(this.score, CONFIG.TARGET_COINS);

        // Check win condition
        if (this.score >= CONFIG.TARGET_COINS) {
          this.endGame(true);
          return;
        }
      }
    }
  }

  /**
   * Render game (interpolated)
   */
  render(alpha) {
    // Renderer automatically renders stage
    // Alpha can be used for interpolation if needed
  }

  /**
   * Pause game
   */
  pause() {
    if (this.gameState === 'playing') {
      this.gameState = 'paused';
      this.gameLoop.pause();
    }
  }

  /**
   * Resume game
   */
  resume() {
    if (this.gameState === 'paused') {
      this.gameState = 'playing';
      this.gameLoop.resume();
    }
  }

  /**
   * Destroy game and cleanup
   */
  destroy() {
    if (this.gameLoop) {
      this.gameLoop.stop();
    }

    if (this.player) {
      this.player.destroy();
    }

    if (this.ui) {
      this.ui.destroy();
    }

    if (this.renderer) {
      this.renderer.destroy();
    }

    EventBus.clear();

    console.log('🗑️ Game destroyed');
  }
}
