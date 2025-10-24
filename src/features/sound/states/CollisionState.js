/**
 * Collision Sound State
 *
 * Управляет звуком при столкновении (кратковременный эффект).
 * TODO: Реализовать позже
 */
import { BaseMusicState } from './BaseMusicState.js';

export class CollisionState extends BaseMusicState {
  constructor(sounds, config = {}) {
    super('collision', sounds, {
      collisionAlias: config.collisionAlias || 'collisionSound',
      collisionVolume: config.collisionVolume || 0.8,
      ...config,
    });

    this.collisionSound = null;
    this.masterVolume = 1.0;
  }

  /**
   * Активирует collision состояние (проигрывает sound effect)
   */
  async enter(context = {}) {
    await super.enter(context);

    this.masterVolume = context.masterVolume || 1.0;
    this.collisionSound = this.getTrack(this.config.collisionAlias);

    if (!this.collisionSound) {
      console.warn(`⚠️ [${this.name}] Collision sound not loaded yet`);
      return;
    }

    const targetVolume = this.config.collisionVolume * this.masterVolume;
    this.collisionSound.volume(targetVolume);
    this.collisionSound.play();

    console.log(`💥 [${this.name}] Collision sound played!`);
  }

  /**
   * Деактивирует collision состояние (обычно мгновенно)
   */
  async exit(context = {}) {
    // Collision - это короткий sound effect, обычно не требует fade-out
    await super.exit(context);
  }
}
