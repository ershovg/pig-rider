import type { Game } from './Game.js';
import { CONFIG } from './shared/config/constants';
import { GameEvents, type GamePublicEvent } from './features/core/events/GameEvents';

export type PigRiderGame = {
  mount(el: HTMLElement): Promise<void>;
  destroy(): void;
  on(listener: (event: GamePublicEvent) => void): () => void;
  start(): void;
  restart(): void;
  toggleMute(): void;
};

declare global {
  const PIXI: unknown;

  interface Window {
    PigRiderGame?: PigRiderGame;
    GAME_CONFIG?: Record<string, unknown>;
  }
}

let game: Game | null = null;

async function mount(el: HTMLElement): Promise<void> {
  if (game !== null) return;

  if (typeof PIXI === 'undefined') {
    throw new Error('PixiJS not loaded before the game bundle');
  }
  if (window.GAME_CONFIG) Object.assign(CONFIG, window.GAME_CONFIG);

  const canvas = document.createElement('canvas');
  canvas.id = 'game-canvas';
  el.appendChild(canvas);

  const { Game: GameClass } = await import('./Game.js');
  game = new GameClass();
  await game.init();
  GameEvents.publish('ready', {});
}

function destroy(): void {
  game?.destroy();
  game = null;
}

window.PigRiderGame = {
  mount,
  destroy,
  on: (listener: (event: GamePublicEvent) => void) => GameEvents.subscribe(listener),
  start: () => game?.startGame(),
  restart: () => game?.restartGame(),
  toggleMute: () => game?.registry.soundManager.toggleMute(),
};

document.addEventListener('visibilitychange', () => {
  if (game === null) return;
  if (document.hidden) game.pause();
  else if (!game.registry.isWaitingForUserInput) game.resume();
});
