import type { SoundRegistry, StateContext, HowlInstance } from '../../../types';
import type { BoosterStateConfig } from '../../../types';
import { BaseMusicState } from './BaseMusicState.ts';
import { BeatSyncEngine } from '../core/BeatSyncEngine.ts';

export class BoosterState extends BaseMusicState {
  private beatSyncEngine: BeatSyncEngine;
  private intensityTrack: HowlInstance | null;
  private masterVolume: number;

  constructor(sounds: SoundRegistry, beatSyncEngine: BeatSyncEngine, config: Partial<BoosterStateConfig> = {}) {
    super('booster', sounds, {
      intensityAlias: config.intensityAlias || 'bonusMusic',
      intensityVolume: config.intensityVolume || 0.6,
      fadeOutDuration: config.fadeOutDuration || 500,
      fadeInDuration: config.fadeInDuration || 500,
      beatSync: config.beatSync !== undefined ? config.beatSync : true,
      ...config,
    });

    this.beatSyncEngine = beatSyncEngine;
    this.intensityTrack = null;
    this.masterVolume = 1.0;
  }

  async enter(context: StateContext = {}): Promise<void> {
    await super.enter(context);

    this.masterVolume = context.masterVolume || 1.0;
    const baseTrack = context.baseTrack;

    this.intensityTrack = this.getTrack(this.config.intensityAlias);

    if (!this.intensityTrack) {
      console.error(`[${this.name}] Intensity track not found`);
      return;
    }

    if (this.config.beatSync && baseTrack && this.beatSyncEngine) {
      await this._performBeatSyncedTransition(baseTrack);
    } else {
      await this._performGapCrossfade(baseTrack);
    }
  }

  private async _performBeatSyncedTransition(baseTrack: HowlInstance): Promise<void> {
    const currentPosition = baseTrack.seek() as number;
    const delayToNextBeat = this.beatSyncEngine.getDelayToNextBeat(currentPosition);

    await new Promise(resolve => setTimeout(resolve, delayToNextBeat));

    await this._performGapCrossfade(baseTrack);
  }

  private async _performGapCrossfade(baseTrack: HowlInstance | undefined): Promise<void> {
    const { fadeOutDuration, fadeInDuration, intensityVolume } = this.config;

    if (baseTrack) {
      const currentBaseVol = baseTrack.volume() as number;
      baseTrack.fade(currentBaseVol, 0, fadeOutDuration);
    }

    this.intensityTrack!.seek(0);

    const gapDelay = fadeOutDuration * 0.8;

    await new Promise(resolve => setTimeout(resolve, gapDelay));

    const targetVolume = intensityVolume * this.masterVolume;
    this.intensityTrack!.volume(0);
    this.intensityTrack!.fade(0, targetVolume, fadeInDuration);
  }

  async exit(context: StateContext = {}): Promise<void> {
    const { fadeOutDuration } = this.config;
    const baseTrack = context.baseTrack;
    const fadeInDuration = context.fadeInDuration || 500;

    if (this.intensityTrack) {
      const currentVol = this.intensityTrack.volume() as number;
      this.intensityTrack.fade(currentVol, 0, fadeOutDuration);
    }

    if (baseTrack) {
      const gapDelay = fadeOutDuration * 0.8;

      await new Promise(resolve => setTimeout(resolve, gapDelay));

      const targetBaseVol = (context.baseVolume || 0.6) * this.masterVolume;
      baseTrack.volume(0);
      baseTrack.fade(0, targetBaseVol, fadeInDuration);
    }

    await super.exit(context);
  }

  getDebugInfo(): Record<string, any> {
    return {
      ...super.getDebugInfo(),
      intensityVolume: this.intensityTrack?.volume(),
      intensityPosition: this.intensityTrack?.seek(),
      beatSync: this.config.beatSync,
    };
  }
}
