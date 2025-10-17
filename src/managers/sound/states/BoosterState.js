/**
 * Booster Music State
 *
 * Управляет музыкой во время активного бустера.
 * Использует GAP CROSSFADE + BEAT SYNC для профессиональных переходов.
 */
import { BaseMusicState } from './BaseMusicState.js';

export class BoosterState extends BaseMusicState {
  constructor(sounds, beatSyncEngine, config = {}) {
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

  /**
   * Активирует booster состояние
   * Gap crossfade: base затухает → intensity появляется с начала
   *
   * @param {object} context
   * @param {Howl} context.baseTrack - Текущий base track для fade-out
   * @param {number} context.masterVolume - Master volume
   */
  async enter(context = {}) {
    await super.enter(context);

    this.masterVolume = context.masterVolume || 1.0;
    const baseTrack = context.baseTrack;

    this.intensityTrack = this.getTrack(this.config.intensityAlias);

    if (!this.intensityTrack) {
      console.error(`❌ [${this.name}] Intensity track not found`);
      return;
    }

    // 🎯 BEAT-SYNCED TRANSITION
    if (this.config.beatSync && baseTrack && this.beatSyncEngine) {
      await this._performBeatSyncedTransition(baseTrack);
    } else {
      // Обычный gap crossfade
      await this._performGapCrossfade(baseTrack);
    }
  }

  /**
   * Beat-synced переход (ждем следующий бит перед crossfade)
   * @private
   */
  async _performBeatSyncedTransition(baseTrack) {
    const currentPosition = baseTrack.seek();
    const delayToNextBeat = this.beatSyncEngine.getDelayToNextBeat(currentPosition);

    console.log(`🎼 [${this.name}] Beat-synced transition:`);
    console.log(`   Current position: ${currentPosition.toFixed(2)}s`);
    console.log(`   Waiting ${delayToNextBeat.toFixed(0)}ms for next beat...`);

    // Ждем следующий бит
    await new Promise(resolve => setTimeout(resolve, delayToNextBeat));

    console.log(`✅ [${this.name}] On beat! Starting gap crossfade...`);

    // Теперь делаем gap crossfade точно на бит
    await this._performGapCrossfade(baseTrack);
  }

  /**
   * Gap crossfade переход
   * @private
   */
  async _performGapCrossfade(baseTrack) {
    const { fadeOutDuration, fadeInDuration, intensityVolume } = this.config;

    console.log(`🚀 [${this.name}] GAP CROSSFADE starting...`);
    console.log(`   Phase 1: Base fade-out (${fadeOutDuration}ms)`);
    console.log(`   Phase 2: Intensity fade-in (${fadeInDuration}ms)`);

    // ШАГ 1: Base затухает до 0
    if (baseTrack) {
      const currentBaseVol = baseTrack.volume();
      baseTrack.fade(currentBaseVol, 0, fadeOutDuration);
    }

    // ШАГ 2: Сбрасываем intensity на начало (0 секунда)
    this.intensityTrack.seek(0);
    console.log(`🔄 [${this.name}] Intensity reset to 0s`);

    // ШАГ 3: Fade-in intensity с небольшой задержкой (gap эффект)
    const gapDelay = fadeOutDuration * 0.8; // Начинаем когда base ~20%

    await new Promise(resolve => setTimeout(resolve, gapDelay));

    const targetVolume = intensityVolume * this.masterVolume;
    this.intensityTrack.volume(0);
    this.intensityTrack.fade(0, targetVolume, fadeInDuration);

    console.log(`🎵 [${this.name}] Intensity fade-in started (0 → ${targetVolume})`);
    console.log(`✅ [${this.name}] Gap crossfade complete`);
  }

  /**
   * Деактивирует booster состояние
   * Gap crossfade обратно: intensity затухает
   */
  async exit(context = {}) {
    const { fadeOutDuration } = this.config;
    const baseTrack = context.baseTrack;
    const fadeInDuration = context.fadeInDuration || 500;

    console.log(`⏹️ [${this.name}] Exiting with gap crossfade...`);

    // ШАГ 1: Intensity затухает до 0
    if (this.intensityTrack) {
      const currentVol = this.intensityTrack.volume();
      this.intensityTrack.fade(currentVol, 0, fadeOutDuration);
    }

    // ШАГ 2: Base появляется с небольшой задержкой
    if (baseTrack) {
      const gapDelay = fadeOutDuration * 0.8;

      await new Promise(resolve => setTimeout(resolve, gapDelay));

      const targetBaseVol = (context.baseVolume || 0.6) * this.masterVolume;
      baseTrack.volume(0);
      baseTrack.fade(0, targetBaseVol, fadeInDuration);

      console.log(`🎵 [${this.name}] Base fade-in started (0 → ${targetBaseVol})`);
    }

    await super.exit(context);
  }

  /**
   * Debug info
   */
  getDebugInfo() {
    return {
      ...super.getDebugInfo(),
      intensityVolume: this.intensityTrack?.volume(),
      intensityPosition: this.intensityTrack?.seek(),
      beatSync: this.config.beatSync,
    };
  }
}
