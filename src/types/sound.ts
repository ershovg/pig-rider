import type { Howl } from 'howler';

export type HowlInstance = Howl;

export type SoundRegistry = Map<string, HowlInstance>;

export interface BeatSyncParams {
  bpm: number;
  beatsPerBar: number;
}

export interface StateContext {
  masterVolume?: number;
  baseTrack?: HowlInstance;
  baseVolume?: number;
  fadeDuration?: number;
  fadeInDuration?: number;
  fadeOutDuration?: number;
}

export interface PauseRestore {
  restore(fadeDuration?: number): void;
}

export interface SoundItem {
  id: string;
  path: string;
  volume: number;
}

export interface VolumeConfig {
  master: number;
  music: number;
  sfx: number;
}

export interface MusicStateConfig {
  bpm?: number;
  beatsPerBar?: number;
  beatSync?: boolean;
  gameplayBaseVolume?: number;
  gameplayIntensityVolume?: number;
  boosterIntensityVolume?: number;
  boosterFadeOut?: number;
  boosterFadeIn?: number;
  victoryVolume?: number;
  defeatVolume?: number;
  collisionVolume?: number;
}

export interface SoundConfig {
  volumes: VolumeConfig;
  music: SoundItem[];
  sfx: SoundItem[];
  musicStates: MusicStateConfig;
}

export interface BaseMusicStateConfig {
  [key: string]: any;
}

export interface GameplayStateConfig extends BaseMusicStateConfig {
  baseAlias?: string;
  intensityAlias?: string;
  baseVolume?: number;
  intensityVolume?: number;
  sync?: boolean;
}

export interface BoosterStateConfig extends BaseMusicStateConfig {
  intensityAlias?: string;
  intensityVolume?: number;
  fadeOutDuration?: number;
  fadeInDuration?: number;
  beatSync?: boolean;
}

export interface VictoryStateConfig extends BaseMusicStateConfig {
  victoryAlias?: string;
  victoryVolume?: number;
  fadeDuration?: number;
}

export interface DefeatStateConfig extends BaseMusicStateConfig {
  defeatAlias?: string;
  defeatVolume?: number;
  fadeDuration?: number;
}

export interface CollisionStateConfig extends BaseMusicStateConfig {
  collisionAlias?: string;
  collisionVolume?: number;
}

export interface MusicState {
  name: string;
  isActive: boolean;
  config: BaseMusicStateConfig;
  sounds: SoundRegistry;
  enter(context?: StateContext): Promise<void>;
  exit(context?: StateContext): Promise<void>;
  update?(deltaTime: number): void;
  pause(): void;
  resume(): void;
  getDebugInfo(): Record<string, any>;
}

export interface MusicStateManagerConfig extends MusicStateConfig {
  masterVolume?: number;
}
