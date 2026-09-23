// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { SpawnSystem } from '../features/spawning/SpawnSystem.ts';

/* Рестарт не должен оставлять на экране эффекты прошлого забега: reset() спавн-системы
   обязан чистить и их, иначе каждый вход в новый забег обязан помнить про отдельный
   вызов clearAllEffects — и один из них про это забыл. */
describe('SpawnSystem.reset', () => {
  function makeFake() {
    const fake = Object.create(SpawnSystem.prototype);
    fake.obstacleSpawner = { reset: vi.fn() };
    fake.coinSpawner = { reset: vi.fn() };
    fake.cloudSpawner = { reset: vi.fn() };
    fake.starSpawner = { reset: vi.fn() };
    fake.boosterSpawner = { reset: vi.fn() };
    fake.clearAllEffects = vi.fn();
    return fake;
  }

  it('сбрасывает все спавнеры', () => {
    const fake = makeFake();
    SpawnSystem.prototype.reset.call(fake);
    expect(fake.obstacleSpawner.reset).toHaveBeenCalledTimes(1);
    expect(fake.coinSpawner.reset).toHaveBeenCalledTimes(1);
    expect(fake.boosterSpawner.reset).toHaveBeenCalledTimes(1);
  });

  it('чистит активные эффекты', () => {
    const fake = makeFake();
    SpawnSystem.prototype.reset.call(fake);
    expect(fake.clearAllEffects).toHaveBeenCalledTimes(1);
  });
});
