import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameStateManager } from '../features/state/GameStateManager.ts';
import { ProgressionManager } from '../features/progression/manager/ProgressionManager.ts';
import { GameEvents } from '../features/core/events/GameEvents.ts';
import { EventBus } from '../shared/utils/EventBus.ts';

/* Входов в забег два: обычный старт и RestartManager. Раньше событие публиковал
   только первый, и после Try Again интерфейс оставался на экране поражения.
   Публикация должна жить там, где оба пути сходятся. */
describe('состояние забега уходит наружу', () => {
  beforeEach(() => EventBus.clear());

  it('переход в playing публикует running', () => {
    const seen = vi.fn();
    GameEvents.subscribe(seen);
    new GameStateManager().setState('playing');
    expect(seen).toHaveBeenCalledWith({ type: 'state', screen: 'running' });
  });

  it('прочие состояния экран не переключают', () => {
    const seen = vi.fn();
    GameEvents.subscribe(seen);
    const sm = new GameStateManager();
    sm.setState('paused');
    sm.setState('ended');
    expect(seen).not.toHaveBeenCalled();
  });

  it('сброс прогресса обнуляет счётчик наружу', () => {
    const seen = vi.fn();
    GameEvents.subscribe(seen);
    new ProgressionManager({ updateCoinCount() {} }).reset();
    expect(seen).toHaveBeenCalledWith({ type: 'score', coins: 0 });
  });
});
