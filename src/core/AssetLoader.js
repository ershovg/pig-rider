import * as PIXI from 'pixi.js';
import { ASSET_PATHS } from '../config/constants.js';

export class AssetLoader {
  constructor() {
    this.assets = {};
    this.loaded = false;
    this.bundlesInitialized = false;
  }

  /**
   * Инициализация bundles (вызывать ПЕРЕД загрузкой)
   */
  initBundles() {
    if (this.bundlesInitialized) return;

    // TIER 1: Critical assets (минимум для First Meaningful Paint)
    PIXI.Assets.addBundle('critical', {
      playerAnimated: ASSET_PATHS.PLAYER_ANIMATED,
      obstacleBase: ASSET_PATHS.OBSTACLE_BASE,
      coin: ASSET_PATHS.COIN,
      star: ASSET_PATHS.STAR,
      cloud: ASSET_PATHS.CLOUD,
      coinCollectEffect: ASSET_PATHS.COIN_COLLECT_EFFECT
    });

    // TIER 2: Gameplay assets (фоновая загрузка, готовы до старта игры)
    PIXI.Assets.addBundle('gameplay', {
      obstacleLarge: ASSET_PATHS.OBSTACLE_LARGE,
      booster: ASSET_PATHS.BOOSTER,
      collisionEffect: ASSET_PATHS.COLLISION_EFFECT,
      playerAnimatedBoost: ASSET_PATHS.PLAYER_ANIMATED_BOOST
    });

    this.bundlesInitialized = true;
    console.log('📦 Bundles initialized');
  }

  /**
   * TIER 1: Загрузить критичные ассеты (блокирующе)
   * Возвращает Promise, позволяет показать UI сразу после загрузки
   */
  async loadCriticalAssets() {
    console.log('🚀 Loading critical assets...');

    const criticalAssets = await PIXI.Assets.loadBundle('critical', (progress) => {
      console.log(`Critical: ${Math.round(progress * 100)}%`);
    });

    // Сохраняем в this.assets для обратной совместимости
    Object.assign(this.assets, criticalAssets);

    // Для совместимости со старым кодом
    this.assets.obstacle = this.assets.obstacleBase;

    console.log('✅ Critical assets ready (First Meaningful Paint!)');
    return criticalAssets;
  }

  /**
   * TIER 2: Загрузить gameplay ассеты (фоновая загрузка)
   * Не блокирует UI, грузится параллельно
   */
  async loadGameplayAssets() {
    console.log('🎮 Loading gameplay assets in background...');

    const gameplayAssets = await PIXI.Assets.loadBundle('gameplay', (progress) => {
      console.log(`Gameplay: ${Math.round(progress * 100)}%`);
    });

    Object.assign(this.assets, gameplayAssets);

    this.loaded = true;
    console.log('✅ All assets loaded successfully');
    return gameplayAssets;
  }

  /**
   * Главный метод загрузки (совместимость со старым API)
   * Загружает critical блокирующе, gameplay параллельно
   */
  async loadAssets() {
    try {
      this.initBundles();

      // TIER 1: блокирующая загрузка критичных ассетов
      await this.loadCriticalAssets();

      // TIER 2: загрузка gameplay ассетов (ожидаем)
      // Необходима, так как пулы создают объекты, которым требуются эти ассеты
      await this.loadGameplayAssets();

      return this.assets;
    } catch (error) {
      console.error('❌ Error loading assets:', error);
      throw error;
    }
  }

  /**
   * Placeholder for audio loading (to be implemented later)
   */
  async loadAudio(path) {
    // TODO: Implement audio loading with Howler.js or Web Audio API
    return null;
  }

  /**
   * Get loaded asset by key
   */
  getAsset(key) {
    return this.assets[key];
  }
}
