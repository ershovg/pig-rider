import type { SoundRegistry, StateContext, PauseRestore } from '../../../types';
import type { MusicState } from '../../../types';
import type { MusicStateManagerConfig } from '../../../types';
import { GameplayState } from '../states/GameplayState.ts';
import { BoosterState } from '../states/BoosterState.ts';
import { VictoryState } from '../states/VictoryState.ts';
import { DefeatState } from '../states/DefeatState.ts';
import { CollisionState } from '../states/CollisionState.ts';
import { BeatSyncEngine } from '../core/BeatSyncEngine.ts';

export class MusicStateManager {
  private sounds: SoundRegistry;
  private config: MusicStateManagerConfig;
  private beatSyncEngine: BeatSyncEngine;
  private states: Map<string, MusicState>;
  private currentState: MusicState | null;
  private previousState: MusicState | null;

  constructor(sounds: SoundRegistry, config: MusicStateManagerConfig = {}) {
    this.sounds = sounds;
    this.config = config;

    this.beatSyncEngine = new BeatSyncEngine(
      config.bpm || 130,
      config.beatsPerBar || 4
    );

    this.states = new Map();
    this.currentState = null;
    this.previousState = null;

    this._initializeStates();
  }

  private _initializeStates(): void {
    this.states.set('gameplay', new GameplayState(this.sounds, {
      baseAlias: 'mainMusic',
      intensityAlias: 'bonusMusic',
      baseVolume: this.config.gameplayBaseVolume || 0.6,
      intensityVolume: this.config.gameplayIntensityVolume || 0.6,
      sync: true,
    }));

    this.states.set('booster', new BoosterState(this.sounds, this.beatSyncEngine, {
      intensityAlias: 'bonusMusic',
      intensityVolume: this.config.boosterIntensityVolume || 0.6,
      fadeOutDuration: this.config.boosterFadeOut || 500,
      fadeInDuration: this.config.boosterFadeIn || 500,
      beatSync: this.config.beatSync !== undefined ? this.config.beatSync : true,
    }));

    this.states.set('victory', new VictoryState(this.sounds, {
      victoryAlias: 'victoryMusic',
      victoryVolume: this.config.victoryVolume || 0.7,
    }));

    this.states.set('defeat', new DefeatState(this.sounds, {
      defeatAlias: 'defeatMusic',
      defeatVolume: this.config.defeatVolume || 0.6,
    }));

    this.states.set('collision', new CollisionState(this.sounds, {
      collisionAlias: 'collisionSound',
      collisionVolume: this.config.collisionVolume || 0.8,
    }));
  }

  async setState(stateName: string, context: StateContext = {}): Promise<void> {
    const newState = this.states.get(stateName);

    if (!newState) {
      console.error(`State not found: ${stateName}`);
      return;
    }

    const fullContext: StateContext = {
      ...context,
      masterVolume: this.config.masterVolume || 1.0,
    };

    if (this.currentState?.name === 'gameplay' && stateName === 'booster') {
      await this._transitionGameplayToBooster(fullContext);
    } else if (this.currentState?.name === 'booster' && stateName === 'gameplay') {
      await this._transitionBoosterToGameplay(fullContext);
    } else {
      if (this.currentState) {
        await this.currentState.exit(fullContext);
      }

      await newState.enter(fullContext);
    }

    this.previousState = this.currentState;
    this.currentState = newState;
  }

  private async _transitionGameplayToBooster(context: StateContext): Promise<void> {
    const gameplayState = this.states.get('gameplay');
    const boosterState = this.states.get('booster');

    const baseTrack = this.sounds.get('mainMusic');

    await boosterState!.enter({
      ...context,
      baseTrack,
    });

    // Gameplay state остается активным (base track продолжает играть беззвучно)
    // Не вызываем gameplayState.exit(), потому что нам нужен base track для возврата
  }

  private async _transitionBoosterToGameplay(context: StateContext): Promise<void> {
    const gameplayState = this.states.get('gameplay') as GameplayState;
    const boosterState = this.states.get('booster');

    const baseTrack = this.sounds.get('mainMusic');
    const baseVolume = gameplayState.config.baseVolume;

    await boosterState!.exit({
      ...context,
      baseTrack,
      baseVolume,
      fadeInDuration: 500,
    });

    gameplayState.isActive = true;
  }

  pause(): void {
    if (this.currentState) {
      this.currentState.pause();
    }
  }

  resume(): void {
    if (this.currentState) {
      this.currentState.resume();
    }
  }

  pauseSmooth(targetVolume: number = 0.3, fadeDuration: number = 300): PauseRestore {
    if (!this.currentState) {
      console.warn('No active music state to pause');
      return { restore: () => {} };
    }

    const savedVolumes = new Map<string, number>();

    this.sounds.forEach((sound, alias) => {
      if (sound.playing()) {
        const currentVol = sound.volume() as number;
        savedVolumes.set(alias, currentVol);

        const targetVol = currentVol * targetVolume;
        sound.fade(currentVol, targetVol, fadeDuration);
      }
    });

    return {
      restore: (restoreDuration: number = 300) => {
        savedVolumes.forEach((originalVol, alias) => {
          const sound = this.sounds.get(alias);
          if (sound && sound.playing()) {
            const currentVol = sound.volume() as number;
            sound.fade(currentVol, originalVol, restoreDuration);
          }
        });
      }
    };
  }

  pauseForModal(targetVolume: number = 0.3): PauseRestore {
    return this.pauseSmooth(targetVolume, 300);
  }

  setBPM(newBpm: number): void {
    this.beatSyncEngine.setBPM(newBpm);
  }

  setBeatSync(enabled: boolean): void {
    const boosterState = this.states.get('booster');
    if (boosterState) {
      boosterState.config.beatSync = enabled;
    }
  }

  getCurrentState(): string {
    return this.currentState?.name || 'none';
  }

  reset(): void {
    if (this.currentState) {
      this.currentState.isActive = false;
    }

    this.currentState = null;
    this.previousState = null;

    this.sounds.forEach((sound, alias) => {
      if (sound.playing()) {
        sound.stop();
      }
    });
  }

  getDebugInfo(): Record<string, any> {
    return {
      currentState: this.currentState?.name || 'none',
      previousState: this.previousState?.name || 'none',
      stateDetails: this.currentState?.getDebugInfo(),
      beatSync: this.beatSyncEngine,
    };
  }
}
