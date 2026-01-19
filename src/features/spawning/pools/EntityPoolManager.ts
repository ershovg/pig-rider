import type * as PIXI from 'pixi.js';
import { ObjectPool } from '../../../shared/utils/ObjectPool';
import type {
  EntityFactory,
  EntityResetFn,
  PoolStats,
  PoolRegistrationConfig
} from '../../../types/spawning';

/**
 * EntityPoolManager - Централизованное управление всеми пулами объектов
 *
 * Паттерн: Registry + Factory
 *
 * Преимущества:
 * - Единая точка создания и управления пулами
 * - Легко добавлять новые типы объектов
 * - Централизованная статистика
 * - Упрощает отладку (один класс для всех пулов)
 *
 * Использование:
 * const manager = new EntityPoolManager(stage);
 * manager.registerPool('obstacle', Obstacle, 20);
 * const obstacle = manager.acquire('obstacle');
 */
export class EntityPoolManager {
  private stage: PIXI.Container;
  private decorationLayer: PIXI.Container | null;
  private effectsLayer: PIXI.Container | null;
  private pools: Map<string, ObjectPool<unknown>>;

  constructor(stage: PIXI.Container, decorationLayer: PIXI.Container | null = null, effectsLayer: PIXI.Container | null = null) {
    this.stage = stage;
    this.decorationLayer = decorationLayer; // 🔥 ИСПРАВЛЕНО: сохраняем decorationLayer
    this.effectsLayer = effectsLayer; // 🔥 ДОБАВЛЕНО: слой для эффектов (поверх всего)
    this.pools = new Map(); // Хранилище пулов: name -> ObjectPool
  }

  /**
   * Зарегистрировать новый пул объектов
   *
   * @param name - Уникальное имя пула (например, 'obstacle', 'coin')
   * @param EntityClass - Класс объектов для создания
   * @param initialSize - Начальный размер пула
   * @param entityConfig - Дополнительная конфигурация для объектов
   */
  registerPool<T extends object>(
    name: string,
    EntityClass: new (texture?: PIXI.Texture | PIXI.Spritesheet, container?: PIXI.Container) => T,
    initialSize: number,
    entityConfig: PoolRegistrationConfig = {}
  ): void {
    if (this.pools.has(name)) {
      console.warn(`Pool "${name}" already registered. Skipping.`);
      return;
    }

    // 🎨 Определяем целевой контейнер в зависимости от типа entity:
    // - Декорации (cloud, star) → decorationLayer (фон)
    // - Эффекты (coinCollectEffect, collisionEffect) → effectsLayer (поверх всего)
    // - Игровые объекты (obstacle, coin, booster, player) → stage (средний слой)
    const isDecoration = (name === 'cloud' || name === 'star');
    const isEffect = (name === 'coinCollectEffect' || name === 'collisionEffect');

    let targetContainer: PIXI.Container;
    if (isDecoration && this.decorationLayer) {
      targetContainer = this.decorationLayer;
    } else if (isEffect && this.effectsLayer) {
      targetContainer = this.effectsLayer;
    } else {
      targetContainer = this.stage;
    }

    // Factory функция для создания объектов
    // 🔥 ИЗМЕНЕНО: НЕ добавляем sprite в контейнер при создании
    // Вместо этого передаём контейнер в entity для управления lifecycle
    const factory: EntityFactory<T> = () => {
      const entity = new EntityClass(entityConfig.texture, targetContainer);

      // ❌ УБРАЛИ: addChild теперь вызывается в activate() каждого entity
      // if (entity.getSprite && typeof entity.getSprite === 'function') {
      //   targetContainer.addChild(entity.getSprite());
      // }

      return entity;
    };

    // Reset функция для возврата объектов в пул
    const reset: EntityResetFn<T> = (entity: T) => {
      if ('reset' in entity && typeof entity.reset === 'function') {
        entity.reset();
      } else if ('deactivate' in entity && typeof entity.deactivate === 'function') {
        entity.deactivate();
      }
    };

    // Создаем пул с фабрикой и reset функцией
    // 🔴 CRITICAL: Set maxSize to prevent memory leaks
    // Different multipliers for different entity types
    let maxSize: number;
    if (name === 'obstacle') {
      // Obstacles need more room due to spawn patterns
      maxSize = initialSize * 3;  // 60 for obstacles (was 30)
    } else if (name === 'coin' || name === 'star') {
      // Decorative items can have larger pools
      maxSize = initialSize * 2;  // 100 for coins, 60 for stars
    } else {
      // Default for other entities
      maxSize = Math.ceil(initialSize * 1.5);
    }
    const pool = new ObjectPool<T>(factory, reset, initialSize, maxSize);

    this.pools.set(name, pool as ObjectPool<unknown>);

    console.log(`[PoolManager] Registered pool "${name}" with ${initialSize} objects (max: ${maxSize})`);
  }

  /**
   * Получить пул по имени
   * @param name - Имя пула
   * @returns ObjectPool
   */
  getPool<T = unknown>(name: string): ObjectPool<T> {
    const pool = this.pools.get(name);
    if (!pool) {
      throw new Error(`Pool "${name}" not found. Did you forget to register it?`);
    }
    return pool as ObjectPool<T>;
  }

  /**
   * Взять объект из пула (shortcut)
   * @param poolName - Имя пула
   * @returns Объект из пула
   */
  acquire<T = unknown>(poolName: string): T | null {
    return this.getPool<T>(poolName).acquire();
  }

  /**
   * Вернуть объект в пул (shortcut)
   * @param poolName - Имя пула
   * @param obj - Объект для возврата
   */
  release<T = unknown>(poolName: string, obj: T): void {
    this.getPool<T>(poolName).release(obj);
  }

  /**
   * Вернуть все объекты в пул (shortcut)
   * @param poolName - Имя пула
   */
  releaseAll(poolName: string): void {
    this.getPool(poolName).releaseAll();
  }

  /**
   * Получить все активные объекты из пула
   * @param poolName - Имя пула
   * @returns Массив активных объектов
   */
  getActiveObjects<T = unknown>(poolName: string): T[] {
    return this.getPool<T>(poolName).getActive();
  }

  /**
   * Сбросить все пулы (вернуть все объекты в пулы)
   */
  resetAll(): void {
    this.pools.forEach((pool, name) => {
      pool.releaseAll();
      console.log(`[PoolManager] Reset pool "${name}"`);
    });
  }

  /**
   * Получить статистику всех пулов
   * @returns Объект с статистикой: { poolName: { active, pooled, total } }
   */
  getAllStats(): Record<string, PoolStats> {
    const stats: Record<string, PoolStats> = {};

    this.pools.forEach((pool, name) => {
      stats[name] = {
        active: pool.getActiveCount(),
        pooled: pool.getPooledCount(),
        total: pool.getTotalCount()
      };
    });

    return stats;
  }

  /**
   * Вывести статистику в консоль (для отладки)
   */
  logStats(): void {
    console.log('=== EntityPoolManager Stats ===');
    const stats = this.getAllStats();

    Object.entries(stats).forEach(([name, stat]) => {
      console.log(
        `${name.padEnd(12)} | Active: ${stat.active.toString().padStart(3)} | ` +
        `Pooled: ${stat.pooled.toString().padStart(3)} | ` +
        `Total: ${stat.total.toString().padStart(3)}`
      );
    });
    console.log('================================');
  }

  /**
   * Проверить, зарегистрирован ли пул
   * @param name - Имя пула
   * @returns true если пул существует
   */
  hasPool(name: string): boolean {
    return this.pools.has(name);
  }

  /**
   * Удалить пул (редко используется)
   * @param name - Имя пула
   */
  removePool(name: string): void {
    if (this.pools.has(name)) {
      this.pools.get(name)!.releaseAll();
      this.pools.delete(name);
      console.log(`[PoolManager] Removed pool "${name}"`);
    }
  }

  /**
   * Получить количество зарегистрированных пулов
   * @returns Количество пулов
   */
  getPoolCount(): number {
    return this.pools.size;
  }
}
