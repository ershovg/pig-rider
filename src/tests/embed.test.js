// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('embed', () => {
  beforeEach(() => {
    vi.resetModules();
    delete window.PigRiderGame;
    document.body.innerHTML = '';
  });

  it('не стартует сам при импорте', async () => {
    await import('../embed.ts');
    expect(window.PigRiderGame).toBeDefined();
    expect(typeof window.PigRiderGame.mount).toBe('function');
    expect(document.querySelector('canvas')).toBeNull();
  });

  it('on возвращает функцию отписки', async () => {
    await import('../embed.ts');
    const off = window.PigRiderGame.on(() => {});
    expect(typeof off).toBe('function');
  });
});
