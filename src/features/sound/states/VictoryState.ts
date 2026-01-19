import type { SoundRegistry, StateContext, HowlInstance } from '../../../types';
import type { VictoryStateConfig } from '../../../types';
import { BaseMusicState } from './BaseMusicState.ts';

export class VictoryState extends BaseMusicState {
  private victoryTrack: HowlInstance | null;
  private masterVolume: number;

  constructor(sounds: SoundRegistry, config: Partial<VictoryStateConfig> = {}) {
    super('victory', sounds, {
      victoryAlias: config.victoryAlias || 'victoryMusic',
      victoryVolume: config.victoryVolume || 0.7,
      fadeDuration: config.fadeDuration || 1000,
      ...config,
    });

    this.victoryTrack = null;
    this.masterVolume = 1.0;
  }

  async enter(context: StateContext = {}): Promise<void> {
    await super.enter(context);

    this.masterVolume = context.masterVolume || 1.0;
    this.victoryTrack = this.getTrack(this.config.victoryAlias);

    if (!this.victoryTrack) {
      console.warn(`⚠️ [${this.name}] Victory track not loaded yet`);
      return;
    }

    const targetVolume = this.config.victoryVolume * this.masterVolume;
    this.victoryTrack.volume(0);
    this.victoryTrack.play();
    this.victoryTrack.fade(0, targetVolume, this.config.fadeDuration);

    console.log(`🎉 [${this.name}] Victory music playing!`);
  }

  async exit(context: StateContext = {}): Promise<void> {
    if (this.victoryTrack && this.victoryTrack.playing()) {
      this.victoryTrack.fade(this.victoryTrack.volume() as number, 0, this.config.fadeDuration);

      await new Promise(resolve => setTimeout(resolve, this.config.fadeDuration));
      this.victoryTrack.stop();
    }

    await super.exit(context);
  }
}
