/**
 * Music State Manager
 *
 * Оркестратор музыкальных состояний игры.
 * Следует State Pattern: каждое состояние инкапсулировано в отдельном классе.
 *
 * SOLID принципы:
 * - Single Responsibility: управляет только переходами между состояниями
 * - Open/Closed: легко добавлять новые состояния без изменения этого класса
 * - Dependency Inversion: зависит от абстракции BaseMusicState, а не конкретных реализаций
 */
import { GameplayState } from './states/GameplayState.js';
import { BoosterState } from './states/BoosterState.js';
import { VictoryState } from './states/VictoryState.js';
import { DefeatState } from './states/DefeatState.js';
import { CollisionState } from './states/CollisionState.js';
import { BeatSyncEngine } from './core/BeatSyncEngine.js';

export class MusicStateManager {
  /**
   * @param {Map} sounds - Ссылка на Map со всеми звуками
   * @param {object} config - Конфигурация состояний
   */
  constructor(sounds, config = {}) {
    this.sounds = sounds;
    this.config = config;

    // Beat-sync engine (для синхронизации с ритмом)
    this.beatSyncEngine = new BeatSyncEngine(
      config.bpm || 130,
      config.beatsPerBar || 4
    );

    // Регистр состояний
    this.states = new Map();

    // Текущее состояние
    this.currentState = null;
    this.previousState = null;

    // Инициализируем все состояния
    this._initializeStates();

    console.log('🎵 MusicStateManager initialized');
  }

  /**
   * Инициализирует все музыкальные состояния
   * @private
   */
  _initializeStates() {
    // Gameplay state (vertical layering)
    this.states.set('gameplay', new GameplayState(this.sounds, {
      baseAlias: 'mainMusic',
      intensityAlias: 'bonusMusic',
      baseVolume: this.config.gameplayBaseVolume || 0.6,
      intensityVolume: this.config.gameplayIntensityVolume || 0.6,
      sync: true,
    }));

    // Booster state (gap crossfade + beat sync)
    this.states.set('booster', new BoosterState(this.sounds, this.beatSyncEngine, {
      intensityAlias: 'bonusMusic',
      intensityVolume: this.config.boosterIntensityVolume || 0.6,
      fadeOutDuration: this.config.boosterFadeOut || 500,
      fadeInDuration: this.config.boosterFadeIn || 500,
      beatSync: this.config.beatSync !== undefined ? this.config.beatSync : true,
    }));

    // Victory state (TODO: когда будет трек)
    this.states.set('victory', new VictoryState(this.sounds, {
      victoryAlias: 'victoryMusic',
      victoryVolume: this.config.victoryVolume || 0.7,
    }));

    // Defeat state (TODO: когда будет трек)
    this.states.set('defeat', new DefeatState(this.sounds, {
      defeatAlias: 'defeatMusic',
      defeatVolume: this.config.defeatVolume || 0.6,
    }));

    // Collision state (TODO: когда будет звук)
    this.states.set('collision', new CollisionState(this.sounds, {
      collisionAlias: 'collisionSound',
      collisionVolume: this.config.collisionVolume || 0.8,
    }));

    console.log(`✅ Initialized ${this.states.size} music states`);
  }

  /**
   * Переключает состояние музыки
   * @param {string} stateName - Имя состояния (gameplay, booster, victory, defeat)
   * @param {object} context - Контекст для передачи состоянию
   * @returns {Promise<void>}
   */
  async setState(stateName, context = {}) {
    const newState = this.states.get(stateName);

    if (!newState) {
      console.error(`❌ State not found: ${stateName}`);
      return;
    }

    console.log(`🔄 Transitioning: ${this.currentState?.name || 'none'} → ${stateName}`);

    // Передаем дополнительный контекст
    const fullContext = {
      ...context,
      masterVolume: this.config.masterVolume || 1.0,
    };

    // Специальная логика для перехода gameplay ↔ booster
    if (this.currentState?.name === 'gameplay' && stateName === 'booster') {
      await this._transitionGameplayToBooster(fullContext);
    } else if (this.currentState?.name === 'booster' && stateName === 'gameplay') {
      await this._transitionBoosterToGameplay(fullContext);
    } else {
      // Обычный переход: выход из текущего → вход в новое
      if (this.currentState) {
        await this.currentState.exit(fullContext);
      }

      await newState.enter(fullContext);
    }

    this.previousState = this.currentState;
    this.currentState = newState;

    console.log(`✅ State changed to: ${stateName}`);
  }

  /**
   * Специальная логика перехода: Gameplay → Booster
   * @private
   */
  async _transitionGameplayToBooster(context) {
    const gameplayState = this.states.get('gameplay');
    const boosterState = this.states.get('booster');

    // Получаем base track из gameplay state для fade-out
    const baseTrack = this.sounds.get('mainMusic');

    // Запускаем booster state (он сделает gap crossfade)
    await boosterState.enter({
      ...context,
      baseTrack, // Передаем для fade-out
    });

    // Gameplay state остается активным (base track продолжает играть беззвучно)
    // Не вызываем gameplayState.exit(), потому что нам нужен base track для возврата
  }

  /**
   * Специальная логика перехода: Booster → Gameplay
   * @private
   */
  async _transitionBoosterToGameplay(context) {
    const gameplayState = this.states.get('gameplay');
    const boosterState = this.states.get('booster');

    // Получаем base track из gameplay state для fade-in
    const baseTrack = this.sounds.get('mainMusic');
    const baseVolume = gameplayState.config.baseVolume;

    // Выходим из booster state (он сделает gap crossfade обратно)
    await boosterState.exit({
      ...context,
      baseTrack, // Передаем для fade-in
      baseVolume,
      fadeInDuration: 500,
    });

    // Gameplay state уже был активен, просто обновляем флаг
    gameplayState.isActive = true;
  }

  /**
   * Пауза текущего состояния
   */
  pause() {
    if (this.currentState) {
      this.currentState.pause();
    }
  }

  /**
   * Возобновление текущего состояния
   */
  resume() {
    if (this.currentState) {
      this.currentState.resume();
    }
  }

  /**
   * Обновляет BPM (если музыка меняется)
   */
  setBPM(newBpm) {
    this.beatSyncEngine.setBPM(newBpm);
  }

  /**
   * Включает/выключает beat-sync
   */
  setBeatSync(enabled) {
    const boosterState = this.states.get('booster');
    if (boosterState) {
      boosterState.config.beatSync = enabled;
      console.log(`🎼 Beat-sync ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Получить текущее состояние (для отладки)
   */
  getCurrentState() {
    return this.currentState?.name || 'none';
  }

  /**
   * Debug info
   */
  getDebugInfo() {
    return {
      currentState: this.currentState?.name || 'none',
      previousState: this.previousState?.name || 'none',
      stateDetails: this.currentState?.getDebugInfo(),
      beatSync: this.beatSyncEngine,
    };
  }
}
