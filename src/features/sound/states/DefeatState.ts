import type { SoundRegistry, StateContext, HowlInstance } from '../../../types';
import type { DefeatStateConfig } from '../../../types';
import { BaseMusicState } from './BaseMusicState.ts';

export class DefeatState extends BaseMusicState {
  private defeatTrack: HowlInstance | null;
  private masterVolume: number;

  constructor(sounds: SoundRegistry, config: Partial<DefeatStateConfig> = {}) {
    super('defeat', sounds, {
      defeatAlias: config.defeatAlias || 'defeatMusic',
      defeatVolume: config.defeatVolume || 0.6,
      fadeDuration: config.fadeDuration || 1000,
      ...config,
    });

    this.defeatTrack = null;
    this.masterVolume = 1.0;
  }

  async enter(context: StateContext = {}): Promise<void> {
    await super.enter(context);

    this.masterVolume = context.masterVolume || 1.0;
    this.defeatTrack = this.getTrack(this.config.defeatAlias);

    if (!this.defeatTrack) {
      console.warn(`⚠️ [${this.name}] Defeat track not loaded yet`);
      return;
    }

    const targetVolume = this.config.defeatVolume * this.masterVolume;
    this.defeatTrack.volume(0);
    this.defeatTrack.play();
    this.defeatTrack.fade(0, targetVolume, this.config.fadeDuration);

    console.log(`💀 [${this.name}] Defeat music playing!`);
  }

  async exit(context: StateContext = {}): Promise<void> {
    if (this.defeatTrack && this.defeatTrack.playing()) {
      this.defeatTrack.fade(this.defeatTrack.volume() as number, 0, this.config.fadeDuration);

      await new Promise(resolve => setTimeout(resolve, this.config.fadeDuration));
      this.defeatTrack.stop();
    }

    await super.exit(context);
  }
}
