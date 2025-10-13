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
    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];
      obj.update(deltaTime, gameSpeed);
      if (this.shouldRecycle(obj, context)) {
        this.pool.release(obj);
      }
    }
  }

  shouldRecycle(obj, context) {
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
