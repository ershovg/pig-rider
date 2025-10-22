/**
 * Базовый класс spawner'ов (Template Method Pattern)
 */
export class BaseSpawner {
  constructor({ pool, stage, baseInterval, getIntervalModifier = null, name = null }) {
    if (this.constructor === BaseSpawner) {
      throw new Error('BaseSpawner is abstract and cannot be instantiated directly');
    }
    this.pool = pool;
    this.stage = stage;
    this.baseInterval = baseInterval;
    this.getIntervalModifier = getIntervalModifier;
    this.timer = 0;
    this.enabled = true;
    this.name = name || this.constructor.name;
  }

  update(deltaTime, gameSpeed, context = {}) {
    if (!this.enabled) return;

    this.updateActiveObjects(deltaTime, gameSpeed, context);

    const timeForSpawnTimer = context.frameDeltaTime || deltaTime;
    this.timer += timeForSpawnTimer * 1000;

    const currentInterval = this.getCurrentInterval(context);

    if (this.timer >= currentInterval) {
      this.timer = 0;
      this.spawn(gameSpeed, context);
    }
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
    const cullThreshold = context.cullThreshold;

    let culled = 0;

    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];

      obj.update(deltaTime, gameSpeed);

      if (cullThreshold !== undefined && obj.shouldCull && obj.shouldCull(cullThreshold)) {
        obj.deactivate();
        this.pool.release(obj);
        culled++;
        continue;
      }

      if (!obj.isActive()) {
        this.pool.release(obj);
      }
    }

    if (culled > 0) {
      console.log(`[${this.name}] Culled ${culled} objects (threshold: ${cullThreshold}px)`);
    }
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
