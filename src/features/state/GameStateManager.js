/**
 * Управление состоянием игры (loading/menu/playing/paused/ended)
 */
export class GameStateManager {
  constructor() {
    this.state = 'loading';
  }

  setState(newState) {
    this.state = newState;
    console.log(`🎮 Game state: ${newState}`);
  }

  getState() {
    return this.state;
  }

  isPlaying() {
    return this.state === 'playing';
  }

  isPaused() {
    return this.state === 'paused';
  }

  isEnded() {
    return this.state === 'ended';
  }

  isMenu() {
    return this.state === 'menu';
  }
}
