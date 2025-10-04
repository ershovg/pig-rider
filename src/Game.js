import { CONFIG } from './config/constants.js';
import { Renderer } from './core/Renderer.js';
import { GameLoop } from './core/GameLoop.js';
import { AssetLoader } from './core/AssetLoader.js';
import { Player } from './entities/Player.js';
import { SpawnSystem } from './systems/SpawnSystem.js';
import { CollisionSystem } from './systems/CollisionSystem.js';
import { HUD } from './ui/HUD.js';
import { StartModal } from './ui/StartModal.js';
import { EndModal } from './ui/EndModal.js';

export class Game {
  constructor() {
    this.renderer = null;
    this.gameLoop = null;
    this.assetLoader = null;

    this.player = null;
    this.spawnSystem = null;
    this.collisionSystem = null;

    this.hud = null;
    this.startModal = null;
    this.endModal = null;

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
      // Initialize renderer
      this.renderer = new Renderer('game-canvas');
      await this.renderer.init();

      // Load assets
      this.assetLoader = new AssetLoader();
      await this.assetLoader.loadAssets();

      // Hide loading screen
      document.getElementById('loading').style.display = 'none';

      // Initialize game systems
      this.initSystems();

      // Initialize UI
      this.initUI();

      // Show start modal
      this.gameState = 'menu';
      this.startModal.show();

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
   * Initialize UI
   */
  initUI() {
    // Create HUD
    this.hud = new HUD();
    this.renderer.addToStage(this.hud.getContainer());
    this.hud.hide();

    // Create start modal
    this.startModal = new StartModal(() => this.startGame());
    this.renderer.addToStage(this.startModal.getContainer());

    // Create end modal
    this.endModal = new EndModal(() => this.restartGame());
    this.renderer.addToStage(this.endModal.getContainer());
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
    this.hud.reset();
    this.hud.show();

    this.gameLoop.start();

    console.log('🚀 Game started');
  }

  /**
   * Restart game
   */
  restartGame() {
    this.endModal.hide();
    this.startGame();
  }

  /**
   * End game
   */
  endGame(isWin) {
    this.gameState = 'ended';
    this.gameLoop.stop();
    this.hud.hide();
    this.endModal.showResults(isWin, this.score);

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
    this.hud.updateSpeed(this.gameSpeed);

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
        this.hud.updateScore(this.score);

        // Check win condition
        if (this.score >= CONFIG.TARGET_EGGS) {
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

    if (this.hud) {
      this.hud.destroy();
    }

    if (this.startModal) {
      this.startModal.destroy();
    }

    if (this.endModal) {
      this.endModal.destroy();
    }

    if (this.renderer) {
      this.renderer.destroy();
    }

    console.log('🗑️ Game destroyed');
  }
}
