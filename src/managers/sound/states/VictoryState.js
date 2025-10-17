/**
 * Victory Music State
 *
 * Управляет музыкой при победе игрока.
 * TODO: Реализовать позже (когда будет готов victory track)
 */
import { BaseMusicState } from './BaseMusicState.js';

export class VictoryState extends BaseMusicState {
  constructor(sounds, config = {}) {
    super('victory', sounds, {
      victoryAlias: config.victoryAlias || 'victoryMusic',
      victoryVolume: config.victoryVolume || 0.7,
      fadeDuration: config.fadeDuration || 1000,
      ...config,
    });

    this.victoryTrack = null;
    this.masterVolume = 1.0;
  }

  /**
   * Активирует victory состояние
   */
  async enter(context = {}) {
    await super.enter(context);

    this.masterVolume = context.masterVolume || 1.0;
    this.victoryTrack = this.getTrack(this.config.victoryAlias);

    if (!this.victoryTrack) {
      console.warn(`⚠️ [${this.name}] Victory track not loaded yet`);
      return;
    }

    // TODO: Реализовать fade-in победной музыки
    const targetVolume = this.config.victoryVolume * this.masterVolume;
    this.victoryTrack.volume(0);
    this.victoryTrack.play();
    this.victoryTrack.fade(0, targetVolume, this.config.fadeDuration);

    console.log(`🎉 [${this.name}] Victory music playing!`);
  }

  /**
   * Деактивирует victory состояние
   */
  async exit(context = {}) {
    if (this.victoryTrack && this.victoryTrack.playing()) {
      this.victoryTrack.fade(this.victoryTrack.volume(), 0, this.config.fadeDuration);

      await new Promise(resolve => setTimeout(resolve, this.config.fadeDuration));
      this.victoryTrack.stop();
    }

    await super.exit(context);
  }
}
