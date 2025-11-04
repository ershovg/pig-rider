import * as PIXI from 'pixi.js';
import { ASSET_PATHS } from '../shared/config/constants.ts';

type BundleName = 'critical' | 'gameplay';

interface AssetManifest {
  bundles: Array<{
    name: BundleName;
    assets: Array<{
      alias: string;
      src: string;
    }>;
  }>;
}

export class AssetLoader {
  private assets: Record<string, any> = {};
  private loaded: boolean = false;
  private manifestInitialized: boolean = false;

  async init(): Promise<void> {
    if (this.manifestInitialized) return;

    const manifest: AssetManifest = {
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

  async loadCriticalAssets(): Promise<Record<string, any>> {
    console.log('🚀 Loading critical assets...');

    const criticalAssets = await PIXI.Assets.loadBundle('critical', (progress: number) => {
      console.log(`Critical: ${Math.round(progress * 100)}%`);
    });

    Object.assign(this.assets, criticalAssets);
    this.assets.obstacle = this.assets.obstacleBase;

    console.log('✅ Critical assets ready');
    return criticalAssets;
  }

  startBackgroundLoading(): void {
    console.log('🎮 Starting background loading for gameplay assets...');
    PIXI.Assets.backgroundLoadBundle(['gameplay']);
  }

  async ensureGameplayAssetsReady(): Promise<Record<string, any>> {
    console.log('⏳ Ensuring gameplay assets are ready...');

    const gameplayAssets = await PIXI.Assets.loadBundle('gameplay');
    Object.assign(this.assets, gameplayAssets);

    this.loaded = true;
    console.log('✅ All assets loaded');
    return gameplayAssets;
  }

  async loadAssets(): Promise<Record<string, any>> {
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

  getAsset(key: string): any {
    return this.assets[key];
  }

  isLoaded(): boolean {
    return this.loaded;
  }
}
