import { ASSET_PATHS } from '../../../shared/config/constants.js';

export const DEFAULT_SOUND_CONFIG = {
  volumes: {
    master: 1.0,
    music: 0.6,
    sfx: 0.7,
  },

  music: [
    { id: 'mainMusic', path: ASSET_PATHS.MUSIC_MAIN, volume: 0.6 },
    { id: 'bonusMusic', path: ASSET_PATHS.MUSIC_BONUS, volume: 0.6 },
  ],

  sfx: [
    { id: 'coin', path: ASSET_PATHS.SFX_COIN, volume: 0.2 },
    { id: 'boosterCollect', path: ASSET_PATHS.SFX_BOOSTER_COLLECT, volume: 0.5 },
    { id: 'collision', path: ASSET_PATHS.SFX_COLLISION, volume: 0.6 },
    { id: 'win', path: ASSET_PATHS.SFX_WIN, volume: 0.7 },
    { id: 'lose', path: ASSET_PATHS.SFX_LOSE, volume: 0.6 },
  ],

  musicStates: {
    bpm: 130,
    beatsPerBar: 4,
    beatSync: true,
    gameplayBaseVolume: 0.6,
    gameplayIntensityVolume: 0.6,
    boosterIntensityVolume: 0.6,
    boosterFadeOut: 500,
    boosterFadeIn: 500,
  },
};
