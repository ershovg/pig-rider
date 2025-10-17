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
    this.currentMusicPosition = 0; // 🆕 Сохраняем позицию для resume
    this.musicVolume = 0.7; // Фоновая музыка (увеличено с 0.5 до 0.7 для слышимости)
    this.sfxVolume = 0.7;   // Sound effects громче

    // 🆕 Crossfade управление
    this.isCrossfading = false;
    this.crossfadeTimeout = null;

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
      const originalVolume = music._volume; // Сохраняем оригинальную громкость
      music.fade(music.volume(), 0, fadeDuration);

      // Останавливаем после fade-out И восстанавливаем громкость
      setTimeout(() => {
        music.stop();
        music.volume(originalVolume); // 🔧 ВОССТАНАВЛИВАЕМ для следующего play()
      }, fadeDuration);
    }

    console.log(`⏹️ Music stopped: ${this.currentMusic}`);
    this.currentMusic = null;
  }

  /**
   * 🆕 Профессиональный crossfade между двумя треками
   * Используется AAA-игровой подход: плавное перекрытие треков
   * @param {string} newAlias - Имя нового музыкального трека
   * @param {number} crossfadeDuration - Длительность crossfade (ms)
   * @param {boolean} savePosition - Сохранить позицию текущего трека для resume
   */
  crossfadeToMusic(newAlias, crossfadeDuration = 2000, savePosition = false) {
    console.log(`🎵 Crossfade to: ${newAlias}, duration: ${crossfadeDuration}ms, savePosition: ${savePosition}`);

    // Если уже идет crossfade, отменяем предыдущий
    if (this.isCrossfading && this.crossfadeTimeout) {
      clearTimeout(this.crossfadeTimeout);
    }

    this.isCrossfading = true;

    const oldMusicAlias = this.currentMusic; // 🔧 Сохраняем алиас для логов
    const oldMusic = this.currentMusic ? this.sounds.get(this.currentMusic) : null;
    const newMusic = this.sounds.get(newAlias);

    if (!newMusic) {
      console.warn(`⚠️ New music not found: ${newAlias}`);
      console.log(`Available sounds:`, Array.from(this.sounds.keys()));
      this.isCrossfading = false;
      return;
    }

    // 🎯 Сохраняем позицию текущего трека (для resume после бустера)
    if (savePosition && oldMusic && oldMusic.playing()) {
      this.currentMusicPosition = oldMusic.seek();
      console.log(`💾 Saved music position: ${this.currentMusicPosition}s`);
    }

    // 🔧 ИСПРАВЛЕНО: Используем индивидуальную громкость трека, а не глобальную
    // Каждый трек может иметь свою громкость (mainMusic: 0.4, bonusMusic: 0.9)
    const trackBaseVolume = newMusic._volume; // Оригинальная громкость трека
    const targetVolume = trackBaseVolume * this.masterVolume;
    console.log(`🔊 Track base volume: ${trackBaseVolume}, Master: ${this.masterVolume}, Target: ${targetVolume}`);

    // ✅ Шаг 1: Fade-out старого трека (если есть)
    if (oldMusic && oldMusic.playing()) {
      const currentVolume = oldMusic.volume();
      console.log(`🔉 Fading out ${oldMusicAlias} from ${currentVolume} to 0`);
      oldMusic.fade(currentVolume, 0, crossfadeDuration);
    }

    // 🆕 ВАЖНО: Обновляем currentMusic ДО запуска нового трека
    this.currentMusic = newAlias;

    // ✅ Шаг 2: Загружаем и fade-in нового трека
    console.log(`🔊 Fading in ${newAlias} from 0 to ${targetVolume}`);
    console.log(`📊 New music state: ${newMusic.state()}, loaded: ${newMusic._src}`);

    if (newMusic.state() === 'loaded') {
      this._startCrossfadePlayback(newMusic, newAlias, targetVolume, crossfadeDuration);
    } else {
      // Ждем загрузки
      console.log(`⏳ Waiting for ${newAlias} to load...`);
      newMusic.once('load', () => {
        console.log(`✅ ${newAlias} loaded, starting playback`);
        this._startCrossfadePlayback(newMusic, newAlias, targetVolume, crossfadeDuration);
      });
    }

    // ✅ Шаг 3: Останавливаем старый трек после fade-out
    this.crossfadeTimeout = setTimeout(() => {
      if (oldMusic) {
        oldMusic.stop();
        console.log(`⏹️ Old music stopped: ${oldMusicAlias}`);
      }
      this.isCrossfading = false;
    }, crossfadeDuration);
  }

  /**
   * Внутренний метод для запуска нового трека при crossfade
   * @private
   */
  _startCrossfadePlayback(music, alias, targetVolume, fadeDuration) {
    console.log(`🔊 [_startCrossfadePlayback] Starting ${alias}, targetVol: ${targetVolume}, fade: ${fadeDuration}ms`);

    music.volume(0); // Начинаем с нулевой громкости
    console.log(`🔊 [_startCrossfadePlayback] Volume set to 0, calling play()...`);

    const playId = music.play();
    console.log(`🔊 [_startCrossfadePlayback] play() returned ID: ${playId}`);

    if (playId !== null && playId !== undefined) {
      music.fade(0, targetVolume, fadeDuration);
      console.log(`🎶 Crossfade playing: ${alias} (target volume: ${targetVolume})`);
      console.log(`🎶 Music now playing: ${music.playing()}, seek: ${music.seek()}`);
    } else {
      console.error(`❌ Failed to play music ${alias} during crossfade - playId is null/undefined`);
    }
  }

  /**
   * 🆕 Возобновляет предыдущий трек с сохраненной позиции
   * Используется после окончания бустера для seamless transition
   * @param {string} alias - Имя трека для возобновления
   * @param {number} crossfadeDuration - Длительность crossfade (ms)
   */
  resumeMusicFromPosition(alias, crossfadeDuration = 2000) {
    console.log(`🔄 Resume music: ${alias} from position ${this.currentMusicPosition}s`);

    const oldMusicAlias = this.currentMusic; // 🔧 Сохраняем для логов

    // Останавливаем текущую музыку с fade-out
    if (this.currentMusic && this.currentMusic !== alias) {
      const currentTrack = this.sounds.get(this.currentMusic);
      if (currentTrack && currentTrack.playing()) {
        console.log(`🔉 Fading out ${this.currentMusic} before resume`);
        currentTrack.fade(currentTrack.volume(), 0, crossfadeDuration);
        setTimeout(() => {
          currentTrack.stop();
          console.log(`⏹️ Stopped ${oldMusicAlias} after fade-out`);
        }, crossfadeDuration);
      }
    }

    const music = this.sounds.get(alias);
    if (!music) {
      console.warn(`⚠️ Music not found for resume: ${alias}`);
      console.log(`Available sounds:`, Array.from(this.sounds.keys()));
      return;
    }

    // 🆕 ВАЖНО: Обновляем currentMusic ДО запуска
    this.currentMusic = alias;

    // 🔧 ИСПРАВЛЕНО: Используем индивидуальную громкость трека
    const trackBaseVolume = music._volume;
    const targetVolume = trackBaseVolume * this.masterVolume;

    console.log(`📊 Resume music state: ${music.state()}, base vol: ${trackBaseVolume}, target: ${targetVolume}`);

    // Загружаем трек и устанавливаем позицию
    if (music.state() === 'loaded') {
      this._startResumePlayback(music, alias, targetVolume, crossfadeDuration);
    } else {
      console.log(`⏳ Waiting for ${alias} to load for resume...`);
      music.once('load', () => {
        console.log(`✅ ${alias} loaded, resuming playback`);
        this._startResumePlayback(music, alias, targetVolume, crossfadeDuration);
      });
    }
  }

  /**
   * Внутренний метод для запуска трека с сохраненной позиции
   * @private
   */
  _startResumePlayback(music, alias, targetVolume, fadeDuration) {
    music.volume(0);
    const playId = music.play();

    if (playId !== null && playId !== undefined) {
      // Устанавливаем сохраненную позицию
      if (this.currentMusicPosition > 0) {
        music.seek(this.currentMusicPosition, playId);
        console.log(`⏩ Resumed from ${this.currentMusicPosition}s`);
      }

      // Fade-in с новой позиции
      music.fade(0, targetVolume, fadeDuration);
      console.log(`🎶 Music resumed: ${alias}`);

      // Сбрасываем сохраненную позицию
      this.currentMusicPosition = 0;
    } else {
      console.error(`❌ Failed to resume music ${alias}`);
    }
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
   * 🆕 VERTICAL LAYERING SYSTEM
   * Профессиональная техника из AAA игр (DOOM, Celeste, Subway Surfers)
   *
   * Два трека играют одновременно, меняется только громкость слоев.
   * Это обеспечивает seamless transitions без разрыва ритма.
   */

  /**
   * Инициализирует систему layered music
   * @param {string} baseAlias - Alias базового слоя (mainMusic)
   * @param {string} intensityAlias - Alias интенсивного слоя (bonusMusic)
   * @param {object} options - Опции
   */
  initLayeredMusic(baseAlias, intensityAlias, options = {}) {
    const {
      baseVolume = 0.6,      // Громкость base layer в нормальном режиме
      intensityVolume = 0.6, // Громкость intensity layer при бустере
      sync = true,           // Синхронизировать треки по времени
    } = options;

    this.layeredMusic = {
      baseAlias,
      intensityAlias,
      baseVolume,
      intensityVolume,
      isActive: false, // Активна ли система
    };

    const baseTrack = this.sounds.get(baseAlias);
    const intensityTrack = this.sounds.get(intensityAlias);

    if (!baseTrack || !intensityTrack) {
      console.error('❌ Layered music tracks not found');
      console.log('Available sounds:', Array.from(this.sounds.keys()));
      return;
    }

    console.log(`🎵 Starting layered music system...`);
    console.log(`   Base: ${baseAlias} (volume: ${baseVolume})`);
    console.log(`   Intensity: ${intensityAlias} (volume: ${intensityVolume})`);

    // Устанавливаем начальные громкости
    baseTrack.volume(baseVolume * this.masterVolume);
    intensityTrack.volume(0); // Intensity слой изначально выключен

    // Запускаем оба трека одновременно
    const baseId = baseTrack.play();
    const intensityId = intensityTrack.play();

    console.log(`🎵 Base track playing: ID ${baseId}`);
    console.log(`🎵 Intensity track playing (silent): ID ${intensityId}`);

    // 🎯 Синхронизация треков (если композитор создал их с одинаковым BPM)
    if (sync && baseId !== null && intensityId !== null) {
      const baseSeek = baseTrack.seek();
      intensityTrack.seek(baseSeek, intensityId);
      console.log(`🔄 Tracks synced at position: ${baseSeek}s`);
    }

    this.layeredMusic.isActive = true;
    this.currentMusic = baseAlias; // Для совместимости

    console.log(`✅ Layered music initialized successfully`);
  }

  /**
   * Переключает на intensity layer (при активации бустера)
   * @param {number} transitionDuration - Длительность перехода (ms)
   */
  transitionToIntensity(transitionDuration = 1500) {
    if (!this.layeredMusic || !this.layeredMusic.isActive) {
      console.warn('⚠️ Layered music not initialized');
      return;
    }

    const { baseAlias, intensityAlias, baseVolume, intensityVolume } = this.layeredMusic;
    const baseTrack = this.sounds.get(baseAlias);
    const intensityTrack = this.sounds.get(intensityAlias);

    if (!baseTrack || !intensityTrack) {
      console.error('❌ Layered tracks not found');
      return;
    }

    console.log(`🚀 Transition to INTENSITY mode (${transitionDuration}ms)`);
    console.log(`   Base: ${baseVolume} → ${baseVolume * 0.3} (fade down 70%)`);
    console.log(`   Intensity: 0 → ${intensityVolume} (fade in 100%)`);

    // Base layer уменьшаем до 30% (остается слышен, но тише)
    const targetBaseVolume = baseVolume * 0.3 * this.masterVolume;
    baseTrack.fade(
      baseTrack.volume(),
      targetBaseVolume,
      transitionDuration
    );

    // Intensity layer повышаем до 100%
    const targetIntensityVolume = intensityVolume * this.masterVolume;
    intensityTrack.fade(
      intensityTrack.volume(),
      targetIntensityVolume,
      transitionDuration
    );

    console.log(`🎵 Intensity transition started`);
  }

  /**
   * Возвращает к base layer (при окончании бустера)
   * @param {number} transitionDuration - Длительность перехода (ms)
   */
  transitionToBase(transitionDuration = 2000) {
    if (!this.layeredMusic || !this.layeredMusic.isActive) {
      console.warn('⚠️ Layered music not initialized');
      return;
    }

    const { baseAlias, intensityAlias, baseVolume } = this.layeredMusic;
    const baseTrack = this.sounds.get(baseAlias);
    const intensityTrack = this.sounds.get(intensityAlias);

    if (!baseTrack || !intensityTrack) {
      console.error('❌ Layered tracks not found');
      return;
    }

    console.log(`🎵 Transition to BASE mode (${transitionDuration}ms)`);
    console.log(`   Base: current → ${baseVolume} (fade up to 100%)`);
    console.log(`   Intensity: current → 0 (fade out)`);

    // Base layer возвращаем к 100%
    const targetBaseVolume = baseVolume * this.masterVolume;
    baseTrack.fade(
      baseTrack.volume(),
      targetBaseVolume,
      transitionDuration
    );

    // Intensity layer понижаем до 0%
    intensityTrack.fade(
      intensityTrack.volume(),
      0,
      transitionDuration
    );

    console.log(`🎵 Base transition started`);
  }

  /**
   * Останавливает layered music систему
   * @param {number} fadeDuration - Длительность fade-out (ms)
   */
  stopLayeredMusic(fadeDuration = 1000) {
    if (!this.layeredMusic || !this.layeredMusic.isActive) return;

    const { baseAlias, intensityAlias } = this.layeredMusic;
    const baseTrack = this.sounds.get(baseAlias);
    const intensityTrack = this.sounds.get(intensityAlias);

    console.log(`⏹️ Stopping layered music`);

    // Fade-out обоих треков
    if (baseTrack) {
      baseTrack.fade(baseTrack.volume(), 0, fadeDuration);
    }
    if (intensityTrack) {
      intensityTrack.fade(intensityTrack.volume(), 0, fadeDuration);
    }

    setTimeout(() => {
      if (baseTrack) baseTrack.stop();
      if (intensityTrack) intensityTrack.stop();
      this.layeredMusic.isActive = false;
      this.currentMusic = null;
      console.log(`✅ Layered music stopped`);
    }, fadeDuration);
  }

  /**
   * Пауза layered music
   */
  pauseLayeredMusic() {
    if (!this.layeredMusic || !this.layeredMusic.isActive) return;

    const { baseAlias, intensityAlias } = this.layeredMusic;
    const baseTrack = this.sounds.get(baseAlias);
    const intensityTrack = this.sounds.get(intensityAlias);

    if (baseTrack) baseTrack.pause();
    if (intensityTrack) intensityTrack.pause();

    console.log(`⏸️ Layered music paused`);
  }

  /**
   * Возобновление layered music
   */
  resumeLayeredMusic() {
    if (!this.layeredMusic || !this.layeredMusic.isActive) return;

    const { baseAlias, intensityAlias } = this.layeredMusic;
    const baseTrack = this.sounds.get(baseAlias);
    const intensityTrack = this.sounds.get(intensityAlias);

    if (baseTrack) baseTrack.play();
    if (intensityTrack) intensityTrack.play();

    console.log(`▶️ Layered music resumed`);
  }

  /**
   * Очистка ресурсов (при destroy игры)
   */
  destroy() {
    this.stopAll();

    // Очищаем crossfade timeout
    if (this.crossfadeTimeout) {
      clearTimeout(this.crossfadeTimeout);
      this.crossfadeTimeout = null;
    }

    // Очищаем layered music
    if (this.layeredMusic) {
      this.layeredMusic = null;
    }

    // Выгружаем все Howl instances
    this.sounds.forEach((sound) => {
      sound.unload();
    });

    this.sounds.clear();
    this.currentMusic = null;
    this.currentMusicPosition = 0;
    this.isCrossfading = false;

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
