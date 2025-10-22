/**
 * Gameplay Music State
 *
 * Управляет музыкой во время обычной игры.
 * Использует vertical layering: base + intensity треки играют одновременно.
 */
import { BaseMusicState } from './BaseMusicState.js';

export class GameplayState extends BaseMusicState {
  constructor(sounds, config = {}) {
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

  /**
   * Активирует gameplay состояние
   * Запускает оба трека (base слышен, intensity беззвучен)
   */
  async enter(context = {}) {
    await super.enter(context);

    this.masterVolume = context.masterVolume || 1.0;

    this.baseTrack = this.getTrack(this.config.baseAlias);
    this.intensityTrack = this.getTrack(this.config.intensityAlias);

    if (!this.baseTrack || !this.intensityTrack) {
      console.error(`❌ [${this.name}] Tracks not found`);
      return;
    }

    console.log(`🎵 [${this.name}] Starting vertical layering...`);
    console.log(`   Base: ${this.config.baseAlias} (${this.config.baseVolume})`);
    console.log(`   Intensity: ${this.config.intensityAlias} (silent)`);

    // Устанавливаем начальные громкости
    this.baseTrack.volume(this.config.baseVolume * this.masterVolume);
    this.intensityTrack.volume(0); // Intensity беззвучен

    // Запускаем оба трека одновременно
    const baseId = this.baseTrack.play();
    const intensityId = this.intensityTrack.play();

    // Синхронизация треков
    if (this.config.sync && baseId !== null && intensityId !== null) {
      const baseSeek = this.baseTrack.seek();
      this.intensityTrack.seek(baseSeek, intensityId);
      console.log(`🔄 [${this.name}] Tracks synced at ${baseSeek.toFixed(2)}s`);
    }

    console.log(`✅ [${this.name}] Layered music started`);
  }

  /**
   * Деактивирует gameplay состояние
   * Останавливает оба трека с fade-out
   */
  async exit(context = {}) {
    const fadeDuration = context.fadeDuration || 1000;

    console.log(`⏹️ [${this.name}] Stopping layered music (${fadeDuration}ms fade)`);

    if (this.baseTrack) {
      this.baseTrack.fade(this.baseTrack.volume(), 0, fadeDuration);
    }
    if (this.intensityTrack) {
      this.intensityTrack.fade(this.intensityTrack.volume(), 0, fadeDuration);
    }

    // Останавливаем после fade-out
    await new Promise(resolve => setTimeout(resolve, fadeDuration));

    if (this.baseTrack) this.baseTrack.stop();
    if (this.intensityTrack) this.intensityTrack.stop();

    await super.exit(context);
  }

  /**
   * Пауза layered music
   */
  pause() {
    super.pause();
    if (this.baseTrack) this.baseTrack.pause();
    if (this.intensityTrack) this.intensityTrack.pause();
  }

  /**
   * Возобновление layered music
   */
  resume() {
    super.resume();
    if (this.baseTrack) this.baseTrack.play();
    if (this.intensityTrack) this.intensityTrack.play();
  }

  /**
   * Получить текущую позицию base трека (для синхронизации)
   */
  getCurrentPosition() {
    return this.baseTrack ? this.baseTrack.seek() : 0;
  }

  /**
   * Debug info
   */
  getDebugInfo() {
    return {
      ...super.getDebugInfo(),
      baseVolume: this.baseTrack?.volume(),
      intensityVolume: this.intensityTrack?.volume(),
      basePosition: this.baseTrack?.seek(),
      intensityPosition: this.intensityTrack?.seek(),
    };
  }
}
