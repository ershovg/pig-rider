import * as PIXI from 'pixi.js';
import { ASSET_PATHS } from '../config/constants.js';

export class AssetLoader {
  constructor() {
    this.assets = {};
    this.loaded = false;
  }

  /**
   * Load all game assets
   * @returns {Promise} Resolves when all assets are loaded
   */
  async loadAssets() {
    try {
      console.log('📦 Loading assets...');

      // Load PNG sprites from Figma
      this.assets.player = await PIXI.Assets.load(ASSET_PATHS.PLAYER);

      // Load animated player sprite sheets
      // PixiJS автоматически распарсит JSON и создаст текстуры для всех кадров
      this.assets.playerAnimated = await PIXI.Assets.load(ASSET_PATHS.PLAYER_ANIMATED);
      this.assets.playerAnimatedBoost = await PIXI.Assets.load(ASSET_PATHS.PLAYER_ANIMATED_BOOST);

      this.assets.obstacleBase = await PIXI.Assets.load(ASSET_PATHS.OBSTACLE_BASE);
      this.assets.obstacleLarge = await PIXI.Assets.load(ASSET_PATHS.OBSTACLE_LARGE);
      this.assets.coin = await PIXI.Assets.load(ASSET_PATHS.COIN);
      this.assets.coinStar = await PIXI.Assets.load(ASSET_PATHS.COIN_STAR);
      this.assets.coinCollectEffect = await PIXI.Assets.load(ASSET_PATHS.COIN_COLLECT_EFFECT); // Эффект сбора монеты
      this.assets.collisionEffect = await PIXI.Assets.load(ASSET_PATHS.COLLISION_EFFECT); // Эффект взрыва при столкновении
      this.assets.booster = await PIXI.Assets.load(ASSET_PATHS.BOOSTER);
      this.assets.star = await PIXI.Assets.load(ASSET_PATHS.STAR);
      this.assets.cloud = await PIXI.Assets.load(ASSET_PATHS.CLOUD);

      // Для совместимости со старым кодом
      this.assets.obstacle = this.assets.obstacleBase;

      // Audio loading placeholder (will be implemented later)
      // this.assets.bgMusic = await this.loadAudio(ASSET_PATHS.MUSIC_BG);
      // this.assets.coinSfx = await this.loadAudio(ASSET_PATHS.SFX_COIN);
      // this.assets.crashSfx = await this.loadAudio(ASSET_PATHS.SFX_CRASH);

      this.loaded = true;
      console.log('✅ All assets loaded successfully');
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
