import type { SoundRegistry, StateContext, HowlInstance, BaseMusicStateConfig, MusicState } from '../../../types';

export class BaseMusicState implements MusicState {
  name: string;
  sounds: SoundRegistry;
  config: BaseMusicStateConfig;
  isActive: boolean;

  constructor(name: string, sounds: SoundRegistry, config: BaseMusicStateConfig = {}) {
    this.name = name;
    this.sounds = sounds;
    this.config = config;
    this.isActive = false;

    console.log(`🎵 [${this.name}] State created`);
  }

  async enter(context: StateContext = {}): Promise<void> {
    this.isActive = true;
    console.log(`▶️ [${this.name}] State entered`, context);
  }

  async exit(context: StateContext = {}): Promise<void> {
    this.isActive = false;
    console.log(`⏹️ [${this.name}] State exited`, context);
  }

  update(deltaTime: number): void {
    // Переопределяется в дочерних классах при необходимости
  }

  pause(): void {
    console.log(`⏸️ [${this.name}] Paused`);
  }

  resume(): void {
    console.log(`▶️ [${this.name}] Resumed`);
  }

  getTrack(alias: string): HowlInstance | null {
    const track = this.sounds.get(alias);
    if (!track) {
      console.warn(`⚠️ [${this.name}] Track not found: ${alias}`);
    }
    return track || null;
  }

  getDebugInfo(): Record<string, any> {
    return {
      name: this.name,
      isActive: this.isActive,
      config: this.config,
    };
  }
}
