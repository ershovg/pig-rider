import type { SoundRegistry, StateContext, HowlInstance } from '../../../types';
import type { GameplayStateConfig } from '../../../types';
import { BaseMusicState } from './BaseMusicState.ts';

export class GameplayState extends BaseMusicState {
  private baseTrack: HowlInstance | null;
  private intensityTrack: HowlInstance | null;
  private masterVolume: number;

  constructor(sounds: SoundRegistry, config: Partial<GameplayStateConfig> = {}) {
    super('gameplay', sounds, {
      baseAlias: config.baseAlias || 'mainMusic',
      intensityAlias: config.intensityAlias || 'bonusMusic',
      baseVolume: config.baseVolume || 0.6,
      intensityVolume: config.intensityVolume || 0.6,
      sync: config.sync !== undefined ? config.sync : true,
      ...config,
    });

    this.baseTrack = null;
    this.intensityTrack = null;
    this.masterVolume = 1.0;
  }

  async enter(context: StateContext = {}): Promise<void> {
    await super.enter(context);

    this.masterVolume = context.masterVolume || 1.0;

    this.baseTrack = this.getTrack(this.config.baseAlias);
    this.intensityTrack = this.getTrack(this.config.intensityAlias);

    if (!this.baseTrack || !this.intensityTrack) {
      console.error(`[${this.name}] Tracks not found`);
      return;
    }

    this.baseTrack.volume(this.config.baseVolume * this.masterVolume);
    this.intensityTrack.volume(0);

    const baseId = this.baseTrack.play();
    const intensityId = this.intensityTrack.play();

    if (this.config.sync && baseId !== null && intensityId !== null) {
      const baseSeek = this.baseTrack.seek() as number;
      this.intensityTrack.seek(baseSeek, intensityId);
    }
  }

  async exit(context: StateContext = {}): Promise<void> {
    const fadeDuration = context.fadeDuration || 1000;

    if (this.baseTrack) {
      this.baseTrack.fade(this.baseTrack.volume() as number, 0, fadeDuration);
    }
    if (this.intensityTrack) {
      this.intensityTrack.fade(this.intensityTrack.volume() as number, 0, fadeDuration);
    }

    await new Promise(resolve => setTimeout(resolve, fadeDuration));

    if (this.baseTrack) this.baseTrack.stop();
    if (this.intensityTrack) this.intensityTrack.stop();

    await super.exit(context);
  }

  pause(): void {
    super.pause();
    if (this.baseTrack) this.baseTrack.pause();
    if (this.intensityTrack) this.intensityTrack.pause();
  }

  resume(): void {
    super.resume();
    if (this.baseTrack) this.baseTrack.play();
    if (this.intensityTrack) this.intensityTrack.play();
  }

  getCurrentPosition(): number {
    return this.baseTrack ? (this.baseTrack.seek() as number) : 0;
  }

  getDebugInfo(): Record<string, any> {
    return {
      ...super.getDebugInfo(),
      baseVolume: this.baseTrack?.volume(),
      intensityVolume: this.intensityTrack?.volume(),
      basePosition: this.baseTrack?.seek(),
      intensityPosition: this.intensityTrack?.seek(),
    };
  }
}
