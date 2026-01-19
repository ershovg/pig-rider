import { Howl } from 'howler';
import type { SoundRegistry, StateContext, PauseRestore } from '../../../types';
import { MusicStateManager } from './MusicStateManager.ts';
import { DEFAULT_SOUND_CONFIG } from '../config/defaultSounds.ts';

export class SoundManager {
  sounds: SoundRegistry;
  isMuted: boolean;
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  private audioUnlocked: boolean;
  private musicStateManager: MusicStateManager | null;

  static createWithDefaults(): SoundManager {
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

  constructor(config: { masterVolume?: number; musicVolume?: number; sfxVolume?: number } = {}) {
    this.sounds = new Map();

    this.isMuted = false;
    this.masterVolume = config.masterVolume || 1.0;
    this.musicVolume = config.musicVolume || 0.6;
    this.sfxVolume = config.sfxVolume || 0.7;
    this.audioUnlocked = false;

    this.musicStateManager = null;

    this.loadMuteState();
    this.setupAudioUnlock();

    console.log('🔊 SoundManager initialized (modular architecture)');
  }

  initMusicStates(config: Record<string, any> = {}): void {
    this.musicStateManager = new MusicStateManager(this.sounds, {
      masterVolume: this.masterVolume,
      bpm: config.bpm || 130,
      beatsPerBar: config.beatsPerBar || 4,
      beatSync: config.beatSync !== undefined ? config.beatSync : true,
      ...config,
    });

    console.log('✅ Music state system initialized');
  }

  private setupAudioUnlock(): void {
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

  private loadMuteState(): void {
    try {
      const saved = localStorage.getItem('pigRider_soundMuted');
      if (saved !== null) {
        this.isMuted = saved === 'true';
        console.log(`🔊 Restored mute state: ${this.isMuted ? 'muted' : 'unmuted'}`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load mute state from localStorage:', error);
    }
  }

  private saveMuteState(): void {
    try {
      localStorage.setItem('pigRider_soundMuted', this.isMuted.toString());
    } catch (error) {
      console.warn('⚠️ Failed to save mute state to localStorage:', error);
    }
  }

  loadSound(alias: string, src: string, options: Record<string, any> = {}): Howl {
    const sound = new Howl({
      volume: options.volume || this.sfxVolume,
      preload: true,
      html5: false,
      ...options,
      src,
    });

    if (this.isMuted) {
      sound.mute(true);
    }

    this.sounds.set(alias, sound);
    console.log(`🎵 Sound loaded: ${alias}`);

    return sound;
  }

  loadMusic(alias: string, src: string, options: Record<string, any> = {}): Howl {
    const music = new Howl({
      volume: options.volume || this.musicVolume,
      loop: true,
      preload: true,
      html5: false,
      ...options,
      src,
      onload: () => console.log(`✅ Music loaded: ${alias}`),
      onloaderror: (_id: any, error: any) => console.error(`❌ Error loading ${alias}:`, error),
    });

    if (this.isMuted) {
      music.mute(true);
    }

    this.sounds.set(alias, music);

    return music;
  }

  play(alias: string, options: { volume?: number } = {}): number | null {
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

  setMusicState(stateName: string, context: StateContext = {}): Promise<void> | undefined {
    if (!this.musicStateManager) {
      console.error('❌ Music state manager not initialized! Call initMusicStates() first');
      return;
    }

    return this.musicStateManager.setState(stateName, context);
  }

  pauseMusic(): void {
    if (this.musicStateManager) {
      this.musicStateManager.pause();
    }
  }

  resumeMusic(): void {
    if (this.musicStateManager) {
      this.musicStateManager.resume();
    }
  }

  pauseSmooth(targetVolume: number = 0.3, fadeDuration: number = 300): PauseRestore {
    if (!this.musicStateManager) {
      console.warn('⚠️ Music state manager not initialized');
      return { restore: () => {} };
    }

    return this.musicStateManager.pauseSmooth(targetVolume, fadeDuration);
  }

  pauseForModal(targetVolume: number = 0.3): PauseRestore {
    return this.pauseSmooth(targetVolume, 300);
  }

  stopAll(): void {
    this.sounds.forEach(sound => sound.stop());
    console.log('🔇 All sounds stopped');
  }

  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    console.log(`🔊 Master volume: ${this.masterVolume}`);
  }

  mute(): void {
    this.isMuted = true;
    this.sounds.forEach(sound => sound.mute(true));
    this.saveMuteState();
    console.log('🔇 Muted');
  }

  unmute(): void {
    this.isMuted = false;
    this.sounds.forEach(sound => sound.mute(false));
    this.saveMuteState();
    console.log('🔊 Unmuted');
  }

  toggleMute(): boolean {
    if (this.isMuted) {
      this.unmute();
    } else {
      this.mute();
    }
    return this.isMuted;
  }

  setBeatSync(enabled: boolean): void {
    if (this.musicStateManager) {
      this.musicStateManager.setBeatSync(enabled);
    }
  }

  setBPM(bpm: number): void {
    if (this.musicStateManager) {
      this.musicStateManager.setBPM(bpm);
    }
  }

  getCurrentMusicState(): string {
    return this.musicStateManager?.getCurrentState() || 'none';
  }

  getDebugInfo(): Record<string, any> {
    return {
      isMuted: this.isMuted,
      masterVolume: this.masterVolume,
      musicVolume: this.musicVolume,
      sfxVolume: this.sfxVolume,
      loadedSounds: Array.from(this.sounds.keys()),
      musicState: this.musicStateManager?.getDebugInfo(),
    };
  }

  destroy(): void {
    this.stopAll();

    this.sounds.forEach(sound => sound.unload());
    this.sounds.clear();

    this.musicStateManager = null;

    console.log('🗑️ SoundManager destroyed');
  }

  reset(): void {
    if (this.musicStateManager) {
      this.musicStateManager.reset();
    }

    this.stopAll();

    console.log('🔄 SoundManager reset complete');
  }
}
