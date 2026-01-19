import type { GameState } from '../../types';

export class GameStateManager {
  private state: GameState;

  constructor() {
    this.state = 'loading';
  }

  setState(newState: GameState): void {
    this.state = newState;
    console.log(`🎮 Game state: ${newState}`);
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
