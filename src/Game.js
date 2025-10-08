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
import { EventBus } from './utils/EventBus.js';
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

    this.ui = null; // HTML UI Controller
    this.aiBot = null; // AI Bot Modal
    this.elevenLabs = null; // ElevenLabs Service

    this.gameState = 'loading'; // loading, menu, playing, paused, ended
    this.score = 0;
    this.gameSpeed = CONFIG.GAME_SPEED;

    // Booster state
    this.isBoosterActive = false;
    this.boosterTimeRemaining = 0;
    this.boosterCurrentLane = 0;           // Текущая активная линия во время бустера
    this.boosterLaneSwitchTimer = 0;       // Таймер смены линии
    this.boosterCooldownTimer = 0;         // Cooldown после окончания бустера
    this.preBoosterSnapshot = null;        // Snapshot состояния до бустера

    console.log('🎮 Game instance created');
  }

  /**
   * Initialize game
   */
  async init() {
    try {
      // Initialize HTML UI Controller
      this.ui = new UIController();

      // Initialize ElevenLabs Service (if API key is available)
      if (ENV.ELEVENLABS_API_KEY) {
        this.elevenLabs = new ElevenLabsService(ENV.ELEVENLABS_API_KEY);
        await this.elevenLabs.init();

        // Initialize AI Bot Modal
        this.aiBot = new AIBotModal(this.elevenLabs);
        await this.aiBot.init();
        this.aiBot.onComplete = () => this.startGame();
      } else {
        console.warn('⚠️ ElevenLabs API key not found. AI bot will be disabled.');
      }

      // Initialize renderer (PixiJS)
      this.renderer = new Renderer('game-canvas');
      await this.renderer.init();

      // Load assets
      this.assetLoader = new AssetLoader();
      await this.assetLoader.loadAssets();

      // Hide loading screen
      this.ui.hideLoading();

      // Initialize UI event listeners
      this.initUI();

      // Show AI Bot welcome or start screen
      this.gameState = 'menu';
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

  /**
   * Initialize game systems
   */
  initSystems() {
    // Create player
    const playerTexture = this.assetLoader.getAsset('player');
    this.player = new Player(playerTexture);
    this.renderer.addToStage(this.player.getSprite());

    // Create spawn system with multiple obstacle textures for variety
    const obstacleTextures = [
      this.assetLoader.getAsset('obstacleBase'),
      this.assetLoader.getAsset('obstacleLarge')
    ];
    const coinTexture = this.assetLoader.getAsset('coin');

    // Get new textures for decorative and interactive elements
    const starTexture = this.assetLoader.getAsset('star'); // Звездочки
    const cloudTexture = this.assetLoader.getAsset('cloud'); // Облака
    const boosterTexture = this.assetLoader.getAsset('booster'); // Бустеры/кубки

    this.spawnSystem = new SpawnSystem(
      obstacleTextures,
      coinTexture,
      starTexture,
      cloudTexture,
      boosterTexture,
      this.renderer.stage
    );

    // Create collision system
    this.collisionSystem = new CollisionSystem();

    // Create difficulty manager
    this.difficultyManager = new DifficultyManager();

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
    // Initialize game systems on first start
    if (!this.player) {
      this.initSystems();
    }

    this.gameState = 'playing';
    this.score = 0;
    this.gameSpeed = CONFIG.GAME_SPEED;

    // Reset booster state
    this.isBoosterActive = false;
    this.boosterTimeRemaining = 0;
    this.boosterCurrentLane = 0;
    this.boosterLaneSwitchTimer = 0;
    this.boosterCooldownTimer = 0;
    this.preBoosterSnapshot = null;
    this.ui.removeBoosterClass();

    // Reset difficulty manager
    this.difficultyManager.reset();

    this.player.reset();
    this.spawnSystem.reset();

    // Hide start screen, show HUD
    this.ui.hideStartScreen();
    this.ui.showHUD();
    this.ui.updateCoinCount(0, CONFIG.TARGET_COINS);

    // Start renderer ticker
    this.renderer.start();

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

    // Update booster cooldown timer
    if (this.boosterCooldownTimer > 0) {
      this.boosterCooldownTimer -= deltaTime;
    }

    // Update booster timer
    if (this.isBoosterActive) {
      this.boosterTimeRemaining -= deltaTime;

      // Update lane switch timer
      this.boosterLaneSwitchTimer -= deltaTime;

      // Switch lane every BOOSTER_LANE_SWITCH_INTERVAL seconds
      if (this.boosterLaneSwitchTimer <= 0) {
        this.boosterLaneSwitchTimer = CONFIG.BOOSTER_LANE_SWITCH_INTERVAL;
        // Choose random lane (different from current)
        const availableLanes = [0, 1, 2].filter(l => l !== this.boosterCurrentLane);
        this.boosterCurrentLane = availableLanes[Math.floor(Math.random() * availableLanes.length)];

        // Instantly fill the new lane with coins
        this.spawnSystem.fillLaneWithCoins(this.boosterCurrentLane);

        console.log(`🔄 Booster lane switched to: ${this.boosterCurrentLane}`);
      }

      // Check if booster expired
      if (this.boosterTimeRemaining <= 0) {
        this.deactivateBooster();
      }
    }

    // Increase game speed gradually
    this.gameSpeed = Math.min(
      this.gameSpeed + CONFIG.SPEED_INCREMENT,
      CONFIG.MAX_SPEED
    );

    // Update player
    this.player.update(deltaTime);

    // Update difficulty manager with current score
    this.difficultyManager.updateScore(this.score);

    // Update spawn system (pass booster mode flag, active lane, and cooldown status)
    const isBoosterOnCooldown = this.boosterCooldownTimer > 0;
    this.spawnSystem.update(
      deltaTime,
      this.gameSpeed,
      this.isBoosterActive,
      this.boosterCurrentLane,
      isBoosterOnCooldown,
      this.difficultyManager
    );

    // Check collisions
    const obstacles = this.spawnSystem.getActiveObstacles();
    const coins = this.spawnSystem.getActiveCoins();
    const boosters = this.spawnSystem.getActiveBoosters();
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

    // Handle booster collection
    for (const booster of boosters) {
      if (!booster.isActive()) continue;

      const playerHitbox = this.player.getHitbox();
      const boosterHitbox = booster.getHitbox();

      if (boosterHitbox && MathUtils.checkAABB(playerHitbox, boosterHitbox)) {
        const result = booster.collect();
        if (result) {
          this.score += result.value;
          this.ui.updateCoinCount(this.score, CONFIG.TARGET_COINS);

          // Check win condition
          if (this.score >= CONFIG.TARGET_COINS) {
            this.endGame(true);
            return;
          }

          // Activate booster mode (pause game, show modal)
          this.handleBoosterActivation();
        }
      }
    }
  }

  /**
   * Handle booster activation (show modal and activate)
   */
  async handleBoosterActivation() {
    // Pause game
    this.gameLoop.pause();

    // Show booster modal and wait for user confirmation
    const confirmed = await this.ui.showBoosterModal();

    if (confirmed) {
      // Save current difficulty state (snapshot)
      this.preBoosterSnapshot = this.difficultyManager.createSnapshot();

      // Activate booster
      this.isBoosterActive = true;
      this.boosterTimeRemaining = CONFIG.BOOSTER_DURATION;
      this.boosterLaneSwitchTimer = CONFIG.BOOSTER_LANE_SWITCH_INTERVAL;

      // Choose random starting lane for booster
      this.boosterCurrentLane = Math.floor(Math.random() * CONFIG.LANES.TOTAL);

      // Apply booster effect to difficulty manager
      this.difficultyManager.applyBoosterEffect();

      // Clear all obstacles
      this.spawnSystem.clearAllObstacles();

      // Instantly fill the starting lane with coins
      this.spawnSystem.fillLaneWithCoins(this.boosterCurrentLane);

      // Add CSS class for visual effect
      this.ui.addBoosterClass();

      console.log(`✨ Booster mode activated! Starting lane: ${this.boosterCurrentLane}`);
    }

    // Resume game
    this.gameLoop.resume();
  }

  /**
   * Deactivate booster mode
   */
  deactivateBooster() {
    this.isBoosterActive = false;
    this.boosterTimeRemaining = 0;
    this.boosterLaneSwitchTimer = 0;

    // Restore difficulty state from snapshot
    if (this.preBoosterSnapshot) {
      this.difficultyManager.restoreSnapshot(this.preBoosterSnapshot);
      this.preBoosterSnapshot = null;
    }

    // Start cooldown timer
    this.boosterCooldownTimer = CONFIG.BOOSTER_COOLDOWN_DURATION;

    // Remove CSS class
    this.ui.removeBoosterClass();

    console.log(`⏹️ Booster mode deactivated. Cooldown: ${CONFIG.BOOSTER_COOLDOWN_DURATION}s`);
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

    if (this.aiBot) {
      this.aiBot.destroy();
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
