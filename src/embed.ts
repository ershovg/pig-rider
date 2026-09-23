import type { Game } from './Game.js';
import { CONFIG } from './shared/config/constants';
import { GameEvents, type GamePublicEvent } from './features/core/events/GameEvents';

export type MountOptions = {
  canvasLabel?: string;
};

export type PigRiderGame = {
  mount(el: HTMLElement, options?: MountOptions): Promise<void>;
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
let mounting: Promise<void> | null = null;

/*
  Поколение растёт на каждом mount и destroy. Инициализация асинхронная, а React
  в StrictMode прогоняет эффект дважды — без этой отметки поздний init дорисовал бы
  второй канвас в уже размонтированный слот.
*/
let generation = 0;

async function createGame(el: HTMLElement, options: MountOptions, gen: number): Promise<void> {
  if (typeof PIXI === 'undefined') {
    throw new Error('PixiJS not loaded before the game bundle');
  }
  if (window.GAME_CONFIG) Object.assign(CONFIG, window.GAME_CONFIG);

  const canvas = document.createElement('canvas');
  canvas.id = 'game-canvas';
  if (options.canvasLabel !== undefined) {
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', options.canvasLabel);
  }
  el.appendChild(canvas);

  const { Game: GameClass } = await import('./Game.js');
  const instance = new GameClass();
  await instance.init();

  if (gen !== generation) {
    instance.destroy();
    canvas.remove();
    return;
  }

  game = instance;
  GameEvents.publish('ready', {});
}

function mount(el: HTMLElement, options: MountOptions = {}): Promise<void> {
  if (mounting !== null) return mounting;

  const gen = ++generation;
  mounting = createGame(el, options, gen).catch((error: unknown) => {
    if (gen === generation) mounting = null;
    throw error;
  });

  return mounting;
}

function destroy(): void {
  const gen = ++generation;
  const pending = mounting;
  mounting = null;

  void Promise.resolve(pending)
    .catch(() => {})
    .then(() => {
      if (gen !== generation) return;
      game?.destroy();
      game = null;
      document.getElementById('game-canvas')?.remove();
    });
}

window.PigRiderGame = {
  mount,
  destroy,
  on: (listener: (event: GamePublicEvent) => void) => GameEvents.subscribe(listener),
  start: () => game?.startGame(),
  /* Полный рестарт: RestartManager сбрасывает звук, эффекты, пулы и флаги.
     Game.restartGame() — частичный путь, он оставлял эффекты прошлого забега
     и не перезапускал музыку. */
  restart: () => game?.handleRestart(),
  toggleMute: () => game?.registry.soundManager.toggleMute(),
};

document.addEventListener('visibilitychange', () => {
  if (game === null) return;
  if (document.hidden) game.pause();
  else game.resume();
});
