/**
 * Базовый класс spawner'ов (Template Method Pattern)
 */
export class BaseSpawner {
  constructor({ pool, stage, baseInterval, getIntervalModifier = null }) {
    if (this.constructor === BaseSpawner) {
      throw new Error('BaseSpawner is abstract and cannot be instantiated directly');
    }
    this.pool = pool;
    this.stage = stage;
    this.baseInterval = baseInterval;
    this.getIntervalModifier = getIntervalModifier;
    this.timer = 0;
    this.enabled = true;
  }

  update(deltaTime, gameSpeed, context = {}) {
    if (!this.enabled) return;
    this.timer += deltaTime * 1000;
    const currentInterval = this.getCurrentInterval(context);
    if (this.timer >= currentInterval) {
      this.timer = 0;
      this.spawn(gameSpeed, context);
    }
    this.updateActiveObjects(deltaTime, gameSpeed, context);
  }

  getCurrentInterval(context) {
    if (this.getIntervalModifier) {
      const modifier = this.getIntervalModifier(context);
      return this.baseInterval * modifier;
    }
    return this.baseInterval;
  }

  updateActiveObjects(deltaTime, gameSpeed, context) {
    const objects = this.pool.getActive();
    let culled = 0;
    const cullThreshold = context?.cullThreshold ?? -200;

    // 🔍 DEBUG: ВСЕГДА логируем для Obstacles
    if (this.constructor.name === 'ObstacleSpawner') {
      const behindThreshold = objects.filter(obj => obj.currentX < cullThreshold).length;
      console.log(`🔍 [${this.constructor.name}] BEFORE: total=${objects.length}, behind=${behindThreshold}, threshold=${cullThreshold}`);
    }

    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];

      // 🔍 DEBUG: Логируем КАЖДУЮ проверку для первых 3 объектов
      if (this.constructor.name === 'ObstacleSpawner' && i < 3) {
        const shouldCull = this.shouldRecycle(obj, context);
        console.log(`🔍   obj[${i}]: x=${obj.currentX?.toFixed(0)}, shouldRecycle=${shouldCull}`);
      }

      // 🔥 ИСПРАВЛЕНИЕ: Проверяем culling ПЕРЕД update для более быстрого удаления
      if (this.shouldRecycle(obj, context)) {
        console.log(`🔥 [${this.constructor.name}] CULLING obj at x=${obj.currentX?.toFixed(0)}`);
        obj.deactivate(); // Деактивируем перед возвратом в пул
        this.pool.release(obj);
        culled++;
        continue; // Пропускаем update для culled объектов
      }

      // Обновляем только активные объекты
      obj.update(deltaTime, gameSpeed);
    }

    // 🔍 DEBUG: ВСЕГДА логируем результат для Obstacles
    if (this.constructor.name === 'ObstacleSpawner') {
      const stats = this.pool.getStats();
      console.log(`🔍 [${this.constructor.name}] AFTER: culled=${culled}, active=${stats.active}, pooled=${stats.pooled}, total=${stats.total}`);
    }
  }

  shouldRecycle(obj, context) {
    // Проверяем через Cullable interface (если есть)
    if (obj.shouldCull && typeof obj.shouldCull === 'function') {
      const cullThreshold = context.cullThreshold || -200;
      return obj.shouldCull(cullThreshold);
    }

    // Fallback: проверка isActive (старый способ)
    return !obj.isActive();
  }

  spawn(gameSpeed, context) {
    throw new Error('spawn() must be implemented by subclass');
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  reset() {
    this.timer = 0;
    this.pool.releaseAll();
  }

  getStats() {
    return {
      active: this.pool.getActiveCount(),
      pooled: this.pool.getPooledCount(),
      total: this.pool.getTotalCount()
    };
  }

  getActiveObjects() {
    return this.pool.getActive();
  }
}
