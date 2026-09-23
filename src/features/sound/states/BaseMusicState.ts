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
  }

  async enter(context: StateContext = {}): Promise<void> {
    this.isActive = true;
  }

  async exit(context: StateContext = {}): Promise<void> {
    this.isActive = false;
  }

  update(deltaTime: number): void {
    // Переопределяется в дочерних классах при необходимости
  }

  pause(): void {
    // Переопределяется в дочерних классах при необходимости
  }

  resume(): void {
    // Переопределяется в дочерних классах при необходимости
  }

  getTrack(alias: string): HowlInstance | null {
    const track = this.sounds.get(alias);
    if (!track) {
      console.warn(`[${this.name}] Track not found: ${alias}`);
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
