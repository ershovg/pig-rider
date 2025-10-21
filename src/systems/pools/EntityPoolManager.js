import { ObjectPool } from '../../utils/ObjectPool.js';

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
  constructor(stage, decorationLayer = null) {
    this.stage = stage;
    this.decorationLayer = decorationLayer; // 🆕 ParticleContainer для декораций
    this.pools = new Map(); // Хранилище пулов: name -> ObjectPool
  }

  /**
   * Зарегистрировать новый пул объектов
   *
   * @param {string} name - Уникальное имя пула (например, 'obstacle', 'coin')
   * @param {Class} EntityClass - Класс объектов для создания
   * @param {number} initialSize - Начальный размер пула
   * @param {Object} entityConfig - Дополнительная конфигурация для объектов
   */
  registerPool(name, EntityClass, initialSize, entityConfig = {}) {
    if (this.pools.has(name)) {
      console.warn(`Pool "${name}" already registered. Skipping.`);
      return;
    }

    // 🆕 Определяем целевой контейнер для спрайтов
    // Декорации (cloud, star) → ParticleContainer, остальное → обычный stage
    const isDecoration = (name === 'cloud' || name === 'star');
    const targetContainer = isDecoration && this.decorationLayer
      ? this.decorationLayer
      : this.stage;

    // Factory функция для создания объектов
    // 🔥 ИЗМЕНЕНО: НЕ добавляем sprite в контейнер при создании
    // Вместо этого передаём контейнер в entity для управления lifecycle
    const factory = () => {
      const entity = new EntityClass(entityConfig.texture, targetContainer);

      // ❌ УБРАЛИ: addChild теперь вызывается в activate() каждого entity
      // if (entity.getSprite && typeof entity.getSprite === 'function') {
      //   targetContainer.addChild(entity.getSprite());
      // }

      return entity;
    };

    // Reset функция для возврата объектов в пул
    const reset = (entity) => {
      if (entity.reset) {
        entity.reset();
      } else if (entity.deactivate) {
        entity.deactivate();
      }
    };

    // Создаем пул с фабрикой и reset функцией
    // 🔴 CRITICAL: Set maxSize to prevent memory leaks
    // Different multipliers for different entity types
    let maxSize;
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
    const pool = new ObjectPool(factory, reset, initialSize, maxSize);

    this.pools.set(name, pool);

    console.log(`[PoolManager] Registered pool "${name}" with ${initialSize} objects (max: ${maxSize})`);
  }

  /**
   * Получить пул по имени
   * @param {string} name - Имя пула
   * @returns {ObjectPool}
   */
  getPool(name) {
    const pool = this.pools.get(name);
    if (!pool) {
      throw new Error(`Pool "${name}" not found. Did you forget to register it?`);
    }
    return pool;
  }

  /**
   * Взять объект из пула (shortcut)
   * @param {string} poolName - Имя пула
   * @returns {Object}
   */
  acquire(poolName) {
    return this.getPool(poolName).acquire();
  }

  /**
   * Вернуть объект в пул (shortcut)
   * @param {string} poolName - Имя пула
   * @param {Object} obj - Объект для возврата
   */
  release(poolName, obj) {
    this.getPool(poolName).release(obj);
  }

  /**
   * Вернуть все объекты в пул (shortcut)
   * @param {string} poolName - Имя пула
   */
  releaseAll(poolName) {
    this.getPool(poolName).releaseAll();
  }

  /**
   * Получить все активные объекты из пула
   * @param {string} poolName - Имя пула
   * @returns {Array}
   */
  getActiveObjects(poolName) {
    return this.getPool(poolName).getActive();
  }

  /**
   * Сбросить все пулы (вернуть все объекты в пулы)
   */
  resetAll() {
    this.pools.forEach((pool, name) => {
      pool.releaseAll();
      console.log(`[PoolManager] Reset pool "${name}"`);
    });
  }

  /**
   * Получить статистику всех пулов
   * @returns {Object} Объект с статистикой: { poolName: { active, pooled, total } }
   */
  getAllStats() {
    const stats = {};

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
  logStats() {
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
   * @param {string} name - Имя пула
   * @returns {boolean}
   */
  hasPool(name) {
    return this.pools.has(name);
  }

  /**
   * Удалить пул (редко используется)
   * @param {string} name - Имя пула
   */
  removePool(name) {
    if (this.pools.has(name)) {
      this.pools.get(name).releaseAll();
      this.pools.delete(name);
      console.log(`[PoolManager] Removed pool "${name}"`);
    }
  }

  /**
   * Получить количество зарегистрированных пулов
   * @returns {number}
   */
  getPoolCount() {
    return this.pools.size;
  }
}
