import * as PIXI from 'pixi.js';
import { ASSET_PATHS } from '../shared/config/constants.js';

export class AssetLoader {
  constructor() {
    this.assets = {};
    this.loaded = false;
    this.manifestInitialized = false;
  }

  async init() {
    if (this.manifestInitialized) return;

    const manifest = {
      bundles: [
        {
          name: 'critical',
          assets: [
            { alias: 'playerAnimated', src: ASSET_PATHS.PLAYER_ANIMATED },
            { alias: 'obstacleBase', src: ASSET_PATHS.OBSTACLE_BASE },
            { alias: 'coin', src: ASSET_PATHS.COIN },
            { alias: 'star', src: ASSET_PATHS.STAR },
            { alias: 'cloud', src: ASSET_PATHS.CLOUD },
            { alias: 'coinCollectEffect', src: ASSET_PATHS.COIN_COLLECT_EFFECT }
          ]
        },
        {
          name: 'gameplay',
          assets: [
            { alias: 'obstacleLarge', src: ASSET_PATHS.OBSTACLE_LARGE },
            { alias: 'booster', src: ASSET_PATHS.BOOSTER },
            { alias: 'collisionEffect', src: ASSET_PATHS.COLLISION_EFFECT },
            { alias: 'playerAnimatedBoost', src: ASSET_PATHS.PLAYER_ANIMATED_BOOST }
          ]
        }
      ]
    };

    await PIXI.Assets.init({ manifest });
    this.manifestInitialized = true;
    console.log('📦 Asset manifest initialized');
  }

  async loadCriticalAssets() {
    console.log('🚀 Loading critical assets...');

    const criticalAssets = await PIXI.Assets.loadBundle('critical', (progress) => {
      console.log(`Critical: ${Math.round(progress * 100)}%`);
    });

    Object.assign(this.assets, criticalAssets);
    this.assets.obstacle = this.assets.obstacleBase;

    console.log('✅ Critical assets ready');
    return criticalAssets;
  }

  startBackgroundLoading() {
    console.log('🎮 Starting background loading for gameplay assets...');
    PIXI.Assets.backgroundLoadBundle(['gameplay']);
  }

  async ensureGameplayAssetsReady() {
    console.log('⏳ Ensuring gameplay assets are ready...');

    const gameplayAssets = await PIXI.Assets.loadBundle('gameplay');
    Object.assign(this.assets, gameplayAssets);

    this.loaded = true;
    console.log('✅ All assets loaded');
    return gameplayAssets;
  }

  async loadAssets() {
    try {
      await this.init();

      this.startBackgroundLoading();

      await this.loadCriticalAssets();
      await this.ensureGameplayAssetsReady();

      return this.assets;
    } catch (error) {
      console.error('❌ Error loading assets:', error);
      throw error;
    }
  }

  getAsset(key) {
    return this.assets[key];
  }
}
