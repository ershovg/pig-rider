/**
 * InitializationCoordinator
 *
 * Координирует инициализацию всех систем игры.
 * Отвечает за порядок и правильность создания всех компонентов.
 *
 * Принципы:
 * - Single Responsibility: Только инициализация систем
 * - Dependency Inversion: Получает SystemRegistry извне
 * - Open/Closed: Новые системы добавляются без изменения логики
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
  /**
   * @param {SystemRegistry} registry - Реестр систем для регистрации зависимостей
   */
  constructor(registry) {
    this.registry = registry;
  }

  /**
   * Главная точка инициализации игры
   * Последовательно инициализирует все критические системы
   */
  async init() {
    try {
      // 1. UI (показываем экран загрузки)
      this.registry.ui = new UIController();

      // 2. Renderer (PixiJS)
      this.registry.renderer = new Renderer('game-canvas');
      await this.registry.renderer.init();

      // 3. Asset Loader (загрузка критических ассетов)
      this.registry.assetLoader = new AssetLoader();
      await this.registry.assetLoader.init();

      // 4. Фоновая загрузка gameplay ассетов
      this.registry.assetLoader.startBackgroundLoading();

      // 5. Загрузка критических ассетов (для Start Screen)
      await this.registry.assetLoader.loadCriticalAssets();

      // 6. Инициализация звуковой системы
      this.initSoundSystem();

      // 7. Скрываем загрузку, показываем Start Screen
      this.registry.ui.hideLoading();

      // 8. State Manager и начальное состояние
      this.registry.stateManager = new GameStateManager();
      this.registry.stateManager.setState('menu');
      this.registry.ui.showStartScreen();

      console.log('✅ Game initialization completed');
    } catch (error) {
      console.error('❌ Game initialization failed:', error);
      throw error;
    }
  }

  /**
   * Инициализирует звуковую систему и загружает все звуки
   */
  initSoundSystem() {
    this.registry.soundManager = new SoundManager({
      masterVolume: 1.0,
      musicVolume: 0.6,
      sfxVolume: 0.7,
    });

    const MUSIC_VOLUME = 0.6;

    // Музыка
    this.registry.soundManager.loadMusic('mainMusic', ASSET_PATHS.MUSIC_MAIN, {
      volume: MUSIC_VOLUME,
    });

    this.registry.soundManager.loadMusic('bonusMusic', ASSET_PATHS.MUSIC_BONUS, {
      volume: MUSIC_VOLUME,
    });

    // Sound Effects (SFX)
    this.registry.soundManager.loadSound('coin', ASSET_PATHS.SFX_COIN, {
      volume: 0.2, // Тихий, приятный звук сбора монеты
    });

    this.registry.soundManager.loadSound('boosterCollect', ASSET_PATHS.SFX_BOOSTER_COLLECT, {
      volume: 0.5, // Средняя громкость для важного события
    });

    this.registry.soundManager.loadSound('collision', ASSET_PATHS.SFX_COLLISION, {
      volume: 0.6, // Заметный звук удара
    });

    this.registry.soundManager.loadSound('win', ASSET_PATHS.SFX_WIN, {
      volume: 0.7, // Громкий победный звук
    });

    this.registry.soundManager.loadSound('lose', ASSET_PATHS.SFX_LOSE, {
      volume: 0.6, // Средне-громкий звук поражения
    });

    // Инициализация музыкальных состояний
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

  /**
   * Инициализирует все игровые системы (вызывается при первом старте игры)
   * Ждет полной загрузки gameplay ассетов перед инициализацией
   */
  async initGameplaySystems(updateCallback, renderCallback) {
    // Ждем готовности gameplay ассетов
    await this.registry.assetLoader.ensureGameplayAssetsReady();

    // 1. Player Physics Controller
    this.registry.playerPhysicsController = new PlayerPhysicsController(CONFIG.PLAYER.PHYSICS);

    // 2. Player Entity
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

    // 3. Spawn System (все entity spawners)
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

    // 4. Collision System
    this.registry.collisionSystem = new CollisionSystem();

    // 5. Managers
    this.registry.difficultyManager = new DifficultyManager();
    this.registry.progressionManager = new ProgressionManager(this.registry.ui);
    this.registry.boosterManager = new BoosterManager(
      this.registry.spawnSystem,
      this.registry.difficultyManager,
      this.registry.ui,
      this.registry.player,
      this.registry.soundManager
    );

    // 6. Handlers & Coordinators
    this.registry.collisionHandler = new CollisionHandler(
      this.registry.collisionSystem,
      this.registry.soundManager
    );
    this.registry.effectCoordinator = new EffectCoordinator(this.registry.spawnSystem);

    // 7. Rendering Optimization
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

    // 8. Game Loop (с callback'ами на update/render)
    this.registry.gameLoop = new GameLoop(updateCallback, renderCallback);

    // 9. Lifecycle Manager (управление началом/концом игры)
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

    // 10. Restart Manager (управление рестартом игры)
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
      game: null // Будет установлен извне через setGame()
    });

    // 11. Установка culling boundaries
    const rendererWidth = this.registry.renderer.app?.screen?.width || CONFIG.CANVAS_WIDTH;
    this.registry.cullingManager.setBoundaries(rendererWidth);

    // Debug: экспонируем SoundManager в window для тестирования
    if (typeof window !== 'undefined') {
      window.soundManager = this.registry.soundManager;
      console.log('Debug: Type window.soundManager.playMusic("mainMusic", 100) to test music');
    }

    console.log('✅ Gameplay systems initialized');
  }

  /**
   * Устанавливает UI event listeners
   * @param {Object} callbacks - Объект с callback'ами для UI событий
   */
  initUI(callbacks) {
    this.registry.ui.setupEventListeners(callbacks);
  }
}
