import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameEvents } from '../features/core/events/GameEvents.ts';
import { EventBus } from '../shared/utils/EventBus.ts';

describe('GameEvents', () => {
  beforeEach(() => EventBus.clear());

  it('доставляет опубликованное событие подписчику', () => {
    const seen = vi.fn();
    GameEvents.subscribe(seen);
    GameEvents.publish('state', { screen: 'running' });
    expect(seen).toHaveBeenCalledWith({ type: 'state', screen: 'running' });
  });

  it('unsubscribe снимает подписку', () => {
    const seen = vi.fn();
    const off = GameEvents.subscribe(seen);
    off();
    GameEvents.publish('score', { coins: 5 });
    expect(seen).not.toHaveBeenCalled();
  });

  it('несколько подписчиков получают одно событие', () => {
    const a = vi.fn();
    const b = vi.fn();
    GameEvents.subscribe(a);
    GameEvents.subscribe(b);
    GameEvents.publish('mute', { muted: true });
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });
});
