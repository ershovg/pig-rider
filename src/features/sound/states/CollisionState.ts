import type { SoundRegistry, StateContext, HowlInstance } from '../../../types';
import type { CollisionStateConfig } from '../../../types';
import { BaseMusicState } from './BaseMusicState.ts';

export class CollisionState extends BaseMusicState {
  private collisionSound: HowlInstance | null;
  private masterVolume: number;

  constructor(sounds: SoundRegistry, config: Partial<CollisionStateConfig> = {}) {
    super('collision', sounds, {
      collisionAlias: config.collisionAlias || 'collisionSound',
      collisionVolume: config.collisionVolume || 0.8,
      ...config,
    });

    this.collisionSound = null;
    this.masterVolume = 1.0;
  }

  async enter(context: StateContext = {}): Promise<void> {
    await super.enter(context);

    this.masterVolume = context.masterVolume || 1.0;
    this.collisionSound = this.getTrack(this.config.collisionAlias);

    if (!this.collisionSound) {
      console.warn(`[${this.name}] Collision sound not loaded yet`);
      return;
    }

    const targetVolume = this.config.collisionVolume * this.masterVolume;
    this.collisionSound.volume(targetVolume);
    this.collisionSound.play();
  }

  async exit(context: StateContext = {}): Promise<void> {
    await super.exit(context);
  }
}
