/**
 * Главный оркестратор аудио-системы игры.
 * Делегирует управление музыкой в MusicStateManager.
 */
import { Howl } from 'howler';
import { MusicStateManager } from './MusicStateManager.js';
import { DEFAULT_SOUND_CONFIG } from '../config/defaultSounds.js';

export class SoundManager {
  static createWithDefaults() {
    const config = DEFAULT_SOUND_CONFIG;

    const manager = new SoundManager({
      masterVolume: config.volumes.master,
      musicVolume: config.volumes.music,
      sfxVolume: config.volumes.sfx,
    });

    config.music.forEach(({ id, path, volume }) => {
      manager.loadMusic(id, path, { volume });
    });

    config.sfx.forEach(({ id, path, volume }) => {
      manager.loadSound(id, path, { volume });
    });

    manager.initMusicStates(config.musicStates);

    console.log('✅ Sound system initialized with default configuration');
    return manager;
  }

  constructor(config = {}) {
    // Реестр всех звуков (Howl instances)
    this.sounds = new Map();

    // Глобальные настройки
    this.isMuted = false;
    this.masterVolume = config.masterVolume || 1.0;
    this.musicVolume = config.musicVolume || 0.6;
    this.sfxVolume = config.sfxVolume || 0.7;
    this.audioUnlocked = false;

    // Music State Manager (управляет состояниями музыки)
    this.musicStateManager = null;

    // Setup audio unlock
    this.setupAudioUnlock();

    console.log('🔊 SoundManager initialized (modular architecture)');
  }

  /**
   * Инициализирует Music State Manager после загрузки звуков
   * @param {object} config - Конфигурация (BPM, громкости, и т.д.)
   */
  initMusicStates(config = {}) {
    this.musicStateManager = new MusicStateManager(this.sounds, {
      masterVolume: this.masterVolume,
      bpm: config.bpm || 130,
      beatsPerBar: config.beatsPerBar || 4,
      beatSync: config.beatSync !== undefined ? config.beatSync : true,
      ...config,
    });

    console.log('✅ Music state system initialized');
  }

  /**
   * Настраивает unlock аудио при первом взаимодействии
   */
  setupAudioUnlock() {
    const unlockAudio = () => {
      if (this.audioUnlocked) return;
      this.audioUnlocked = true;
      console.log('🔓 Audio context unlocked');

      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    };

    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);
    document.addEventListener('keydown', unlockAudio);
  }

  /**
   * Загружает звук
   */
  loadSound(alias, src, options = {}) {
    const sound = new Howl({
      volume: options.volume || this.sfxVolume,
      preload: true,
      html5: false,
      ...options,
      src,
    });

    this.sounds.set(alias, sound);
    console.log(`🎵 Sound loaded: ${alias}`);

    return sound;
  }

  /**
   * Загружает музыку
   */
  loadMusic(alias, src, options = {}) {
    const music = new Howl({
      volume: options.volume || this.musicVolume,
      loop: true,
      preload: true,
      html5: false,
      ...options,
      src,
      onload: () => console.log(`✅ Music loaded: ${alias}`),
      onloaderror: (_id, error) => console.error(`❌ Error loading ${alias}:`, error),
    });

    this.sounds.set(alias, music);

    return music;
  }

  /**
   * Воспроизводит sound effect
   */
  play(alias, options = {}) {
    if (this.isMuted) return null;

    const sound = this.sounds.get(alias);
    if (!sound) {
      console.warn(`⚠️ Sound not found: ${alias}`);
      return null;
    }

    if (options.volume !== undefined) {
      sound.volume(options.volume * this.masterVolume);
    }

    return sound.play();
  }

  /**
   * Переключает музыкальное состояние
   * Основной API для управления музыкой!
   */
  setMusicState(stateName, context = {}) {
    if (!this.musicStateManager) {
      console.error('❌ Music state manager not initialized! Call initMusicStates() first');
      return;
    }

    return this.musicStateManager.setState(stateName, context);
  }

  /**
   * Пауза музыки
   */
  pauseMusic() {
    if (this.musicStateManager) {
      this.musicStateManager.pause();
    }
  }

  /**
   * Возобновление музыки
   */
  resumeMusic() {
    if (this.musicStateManager) {
      this.musicStateManager.resume();
    }
  }

  /**
   * 🆕 Context-Aware Pausing (Умная Пауза)
   * Плавно приглушает музыку для модалов/UI элементов
   *
   * @param {number} targetVolume - Целевая громкость (0.0-1.0)
   * @param {number} fadeDuration - Длительность fade (ms)
   * @returns {object} - Объект с методом restore()
   */
  pauseSmooth(targetVolume = 0.3, fadeDuration = 300) {
    if (!this.musicStateManager) {
      console.warn('⚠️ Music state manager not initialized');
      return { restore: () => { } };
    }

    return this.musicStateManager.pauseSmooth(targetVolume, fadeDuration);
  }

  /**
   * 🆕 Alias для модалов
   */
  pauseForModal(targetVolume = 0.3) {
    return this.pauseSmooth(targetVolume, 300);
  }

  /**
   * Останавливает все звуки
   */
  stopAll() {
    this.sounds.forEach(sound => sound.stop());
    console.log('🔇 All sounds stopped');
  }

  /**
   * Устанавливает master volume
   */
  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    console.log(`🔊 Master volume: ${this.masterVolume}`);
  }

  /**
   * Mute/Unmute
   */
  mute() {
    this.isMuted = true;
    this.sounds.forEach(sound => sound.mute(true));
    console.log('🔇 Muted');
  }

  unmute() {
    this.isMuted = false;
    this.sounds.forEach(sound => sound.mute(false));
    console.log('🔊 Unmuted');
  }

  toggleMute() {
    if (this.isMuted) {
      this.unmute();
    } else {
      this.mute();
    }
  }

  /**
   * Настройка beat-sync
   */
  setBeatSync(enabled) {
    if (this.musicStateManager) {
      this.musicStateManager.setBeatSync(enabled);
    }
  }

  setBPM(bpm) {
    if (this.musicStateManager) {
      this.musicStateManager.setBPM(bpm);
    }
  }

  /**
   * Получить текущее музыкальное состояние
   */
  getCurrentMusicState() {
    return this.musicStateManager?.getCurrentState() || 'none';
  }

  /**
   * Debug info
   */
  getDebugInfo() {
    return {
      isMuted: this.isMuted,
      masterVolume: this.masterVolume,
      musicVolume: this.musicVolume,
      sfxVolume: this.sfxVolume,
      loadedSounds: Array.from(this.sounds.keys()),
      musicState: this.musicStateManager?.getDebugInfo(),
    };
  }

  /**
   * Очистка ресурсов
   */
  destroy() {
    this.stopAll();

    this.sounds.forEach(sound => sound.unload());
    this.sounds.clear();

    this.musicStateManager = null;

    console.log('🗑️ SoundManager destroyed');
  }

  /**
   * Сброс состояния
   * КРИТИЧЕСКИ ВАЖНО: сбрасывает MusicStateManager для предотвращения конфликтов
   */
  reset() {
    // Сначала сбрасываем music state manager (очищает currentState/previousState)
    if (this.musicStateManager) {
      this.musicStateManager.reset();
    }

    // Потом останавливаем все звуки (включая SFX)
    this.stopAll();

    console.log('🔄 SoundManager reset complete');
  }
}
