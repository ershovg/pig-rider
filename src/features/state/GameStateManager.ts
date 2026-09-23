import type { GameState } from '../../types';
import { GameEvents } from '../core/events/GameEvents';

export class GameStateManager {
  private state: GameState;

  constructor() {
    this.state = 'loading';
  }

  /* Публикуем отсюда, а не из стартующего кода: входов в забег два — обычный старт
     и RestartManager, и они сходятся только здесь. Win/lose публикует endGame,
     потому что исход известен только ему. */
  setState(newState: GameState): void {
    this.state = newState;

    if (newState === 'playing') {
      GameEvents.publish('state', { screen: 'running' });
    }
  }

  getState(): GameState {
    return this.state;
  }

  isPlaying(): boolean {
    return this.state === 'playing';
  }

  isPaused(): boolean {
    return this.state === 'paused';
  }

  isEnded(): boolean {
    return this.state === 'ended';
  }

  isMenu(): boolean {
    return this.state === 'menu';
  }
}
