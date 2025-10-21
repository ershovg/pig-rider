/**
 * Управление аудио-системой игры (музыка, звуковые эффекты)
 *
 * Использует Howler.js для кроссбраузерного воспроизведения звуков.
 * Все звуковые операции централизованы здесь (Single Responsibility Principle).
 */
import { Howl } from 'howler';

export class SoundManager {
  constructor() {
    // Реестр всех звуков (Howl instances)
    this.sounds = new Map();

    // Глобальные настройки
    this.isMuted = false;
    this.masterVolume = 1.0;
    this.audioUnlocked = false; // 🆕 Флаг для browser autoplay policy

    // Музыкальные треки (отдельно для управления)
    this.currentMusic = null;
    this.musicVolume = 0.7; // Фоновая музыка (увеличено с 0.5 до 0.7 для слышимости)
    this.sfxVolume = 0.7;   // Sound effects громче

    // 🆕 Unlock audio context при первом user interaction
    this.setupAudioUnlock();

    console.log('🔊 SoundManager initialized');
  }

  /**
   * Настраивает unlock аудио при первом пользовательском взаимодействии
   * (требуется для современных браузеров: Chrome, Safari, Firefox)
   */
  setupAudioUnlock() {
    const unlockAudio = () => {
      if (this.audioUnlocked) return;

      // Howler автоматически unlock'ает AudioContext при первом звуке
      // Но мы можем явно проверить состояние
      this.audioUnlocked = true;
      console.log('🔓 Audio context unlocked');

      // Удаляем listeners после unlock
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    };

    // Слушаем любое пользовательское взаимодействие
    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);
    document.addEventListener('keydown', unlockAudio);
  }

  /**
   * Загружает и регистрирует звук
   * @param {string} alias - Уникальное имя звука (например, 'coin')
   * @param {string|string[]} src - Путь или массив путей для fallback
   * @param {object} options - Дополнительные опции Howler.js
   */
  loadSound(alias, src, options = {}) {
    // Дефолтные настройки
    const defaultOptions = {
      volume: this.sfxVolume,
      preload: true, // Загрузить сразу
      html5: false,  // Использовать Web Audio API (лучше для игр)
    };

    const sound = new Howl({
      ...defaultOptions,
      ...options,
      src,
    });

    this.sounds.set(alias, sound);
    console.log(`🎵 Sound loaded: ${alias}`);

    return sound;
  }

  /**
   * Загружает фоновую музыку
   * @param {string} alias - Имя музыкального трека
   * @param {string|string[]} src - Путь к файлу
   * @param {object} options - Опции
   */
  loadMusic(alias, src, options = {}) {
    const defaultOptions = {
      volume: this.musicVolume,
      loop: true,    // Музыка всегда looped
      preload: true,
      html5: false,  // 🔧 Используем Web Audio API для обхода Mixed Content в dev режиме
    };

    console.log(`🎼 Loading music: ${alias} from ${src}`);

    const music = new Howl({
      ...defaultOptions,
      ...options,
      src,
      onload: () => {
        console.log(`✅ Music loaded successfully: ${alias}`);
      },
      onloaderror: (_id, error) => {
        console.error(`❌ Error loading music ${alias}:`, error);
      },
      onplay: () => {
        console.log(`▶️ Music started playing: ${alias}`);
      },
      onplayerror: (_id, error) => {
        console.error(`❌ Error playing music ${alias}:`, error);
        // Пытаемся unlock и переиграть
        music.once('unlock', () => {
          console.log(`🔓 Retrying playback after unlock...`);
          music.play();
        });
      }
    });

    this.sounds.set(alias, music);

    return music;
  }

  /**
   * Воспроизводит звук
   * @param {string} alias - Имя зарегистрированного звука
   * @param {object} options - Опции воспроизведения
   * @returns {number|null} - ID звука (для остановки конкретного экземпляра)
   */
  play(alias, options = {}) {
    if (this.isMuted) {
      return null;
    }

    const sound = this.sounds.get(alias);
    if (!sound) {
      console.warn(`⚠️ Sound not found: ${alias}`);
      return null;
    }

    // Применяем временные опции (например, volume для этого воспроизведения)
    if (options.volume !== undefined) {
      sound.volume(options.volume * this.masterVolume);
    }

    const id = sound.play();
    return id;
  }

  /**
   * Воспроизводит музыку (останавливает текущую)
   * @param {string} alias - Имя музыкального трека
   * @param {number} fadeDuration - Длительность fade-in (ms)
   */
  playMusic(alias, fadeDuration = 1000) {
    console.log(`🎵 playMusic() called with alias: ${alias}, fadeDuration: ${fadeDuration}`);

    // Останавливаем текущую музыку с fade-out
    if (this.currentMusic) {
      console.log(`⏹️ Stopping current music: ${this.currentMusic}`);
      this.stopMusic(fadeDuration);
    }

    if (this.isMuted) {
      console.log(`🔇 Music muted, skipping playback`);
      return;
    }

    const music = this.sounds.get(alias);
    if (!music) {
      console.warn(`⚠️ Music not found: ${alias}`);
      console.log(`Available sounds:`, Array.from(this.sounds.keys()));
      return;
    }

    console.log(`✅ Music found, starting playback...`);
    console.log(`📊 Music state: ${music.state()}, duration: ${music.duration()}`);
    this.currentMusic = alias;

    // Проверяем, загружен ли звук
    if (music.state() === 'unloaded' || music.state() === 'loading') {
      console.log(`⏳ Music still loading, waiting for load event...`);

      // Дождемся загрузки и запустим
      music.once('load', () => {
        console.log(`✅ Music loaded, starting playback now!`);
        this._startMusicPlayback(music, alias, fadeDuration);
      });

      // Если уже грузится, load не сработает - пытаемся играть сразу
      if (music.state() === 'loading') {
        this._startMusicPlayback(music, alias, fadeDuration);
      }
    } else {
      // Звук уже загружен
      this._startMusicPlayback(music, alias, fadeDuration);
    }
  }

  /**
   * Внутренний метод для запуска воспроизведения музыки
   * @private
   */
  _startMusicPlayback(music, alias, fadeDuration) {
    const targetVolume = this.musicVolume * this.masterVolume;

    // Устанавливаем целевую громкость сразу (fade глючит в некоторых окружениях)
    music.volume(targetVolume);
    const playId = music.play();
    console.log(`🎵 Play ID: ${playId}, State: ${music.state()}`);

    if (playId !== null && playId !== undefined) {
      // 🔧 Пробуем fade, но если не сработает - громкость уже установлена выше
      try {
        if (fadeDuration > 0) {
          music.volume(0);
          music.fade(0, targetVolume, fadeDuration);
        }
      } catch (e) {
        console.warn('⚠️ Fade failed, using instant volume:', e);
        music.volume(targetVolume); // Fallback
      }
      console.log(`🎶 Music playing: ${alias} (target volume: ${targetVolume})`);
    } else {
      console.error(`❌ Failed to play music ${alias} - playId is null`);
    }
  }

  /**
   * Останавливает текущую музыку
   * @param {number} fadeDuration - Длительность fade-out (ms)
   */
  stopMusic(fadeDuration = 1000) {
    if (!this.currentMusic) return;

    const music = this.sounds.get(this.currentMusic);
    if (music) {
      music.fade(music.volume(), 0, fadeDuration);

      // Останавливаем после fade-out
      setTimeout(() => {
        music.stop();
      }, fadeDuration);
    }

    console.log(`⏹️ Music stopped: ${this.currentMusic}`);
    this.currentMusic = null;
  }

  /**
   * Пауза музыки (можно возобновить)
   */
  pauseMusic() {
    if (!this.currentMusic) return;

    const music = this.sounds.get(this.currentMusic);
    if (music) {
      music.pause();
      console.log(`⏸️ Music paused: ${this.currentMusic}`);
    }
  }

  /**
   * Возобновление музыки
   */
  resumeMusic() {
    if (!this.currentMusic) return;

    const music = this.sounds.get(this.currentMusic);
    if (music) {
      music.play();
      console.log(`▶️ Music resumed: ${this.currentMusic}`);
    }
  }

  /**
   * Останавливает конкретный звук
   * @param {string} alias - Имя звука
   * @param {number} id - ID конкретного экземпляра (опционально)
   */
  stop(alias, id) {
    const sound = this.sounds.get(alias);
    if (sound) {
      sound.stop(id);
    }
  }

  /**
   * Останавливает все звуки
   */
  stopAll() {
    this.sounds.forEach((sound) => {
      sound.stop();
    });
    console.log('🔇 All sounds stopped');
  }

  /**
   * Устанавливает громкость мастер-канала
   * @param {number} volume - Громкость (0.0 - 1.0)
   */
  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));

    // Обновляем громкость всех активных звуков
    this.sounds.forEach((sound) => {
      const isMusicTrack = sound._loop; // Музыка всегда looped
      const baseVolume = isMusicTrack ? this.musicVolume : this.sfxVolume;
      sound.volume(baseVolume * this.masterVolume);
    });

    console.log(`🔊 Master volume: ${this.masterVolume}`);
  }

  /**
   * Устанавливает громкость музыки
   * @param {number} volume - Громкость (0.0 - 1.0)
   */
  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));

    if (this.currentMusic) {
      const music = this.sounds.get(this.currentMusic);
      if (music) {
        music.volume(this.musicVolume * this.masterVolume);
      }
    }

    console.log(`🎼 Music volume: ${this.musicVolume}`);
  }

  /**
   * Устанавливает громкость звуковых эффектов
   * @param {number} volume - Громкость (0.0 - 1.0)
   */
  setSFXVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    console.log(`🔔 SFX volume: ${this.sfxVolume}`);
  }

  /**
   * Отключает все звуки
   */
  mute() {
    this.isMuted = true;
    this.sounds.forEach((sound) => {
      sound.mute(true);
    });
    console.log('🔇 Muted');
  }

  /**
   * Включает звуки
   */
  unmute() {
    this.isMuted = false;
    this.sounds.forEach((sound) => {
      sound.mute(false);
    });
    console.log('🔊 Unmuted');
  }

  /**
   * Переключает mute/unmute
   */
  toggleMute() {
    if (this.isMuted) {
      this.unmute();
    } else {
      this.mute();
    }
  }

  /**
   * Проверяет, загружен ли звук
   * @param {string} alias - Имя звука
   * @returns {boolean}
   */
  hasSound(alias) {
    return this.sounds.has(alias);
  }

  /**
   * Получает состояние звуковой системы (для UI/debug)
   */
  getState() {
    return {
      isMuted: this.isMuted,
      masterVolume: this.masterVolume,
      musicVolume: this.musicVolume,
      sfxVolume: this.sfxVolume,
      currentMusic: this.currentMusic,
      loadedSounds: Array.from(this.sounds.keys()),
    };
  }

  /**
   * Очистка ресурсов (при destroy игры)
   */
  destroy() {
    this.stopAll();

    // Выгружаем все Howl instances
    this.sounds.forEach((sound) => {
      sound.unload();
    });

    this.sounds.clear();
    this.currentMusic = null;

    console.log('🗑️ SoundManager destroyed');
  }

  /**
   * Сброс состояния (при restart игры)
   */
  reset() {
    this.stopAll();
    this.currentMusic = null;
    console.log('🔄 SoundManager reset');
  }
}
