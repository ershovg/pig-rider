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
    const cullThreshold = context.cullThreshold;

    // 🔥 ДИАГНОСТИКА: логируем каждый 60-й кадр (раз в секунду при 60 FPS)
    this._frameCounter = (this._frameCounter || 0) + 1;
    if (this._frameCounter % 60 === 0) {
      console.log(`[BaseSpawner] Update: objects=${objects.length}, cullThreshold=${cullThreshold}`);
    }

    let culled = 0;

    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];

      // Обновляем объект
      obj.update(deltaTime, gameSpeed);

      // 🆕 Проверяем culling через Cullable interface ПЕРЕД проверкой isActive()
      if (cullThreshold !== undefined && obj.shouldCull && obj.shouldCull(cullThreshold)) {
        // 🔥 ДИАГНОСТИКА: логируем каждый culled объект
        console.log(`[BaseSpawner] 🔥 CULLING object at x=${obj.currentX}, threshold=${cullThreshold}`);
        obj.deactivate();
        this.pool.release(obj);
        culled++;
        continue;
      }

      // ПОСЛЕ update проверяем, не деактивировался ли объект (fallback)
      if (!obj.isActive()) {
        console.log(`[BaseSpawner] 📌 Fallback release (object deactivated itself)`);
        this.pool.release(obj);
      }
    }

    // 🆕 Логирование для дебага
    if (culled > 0) {
      console.log(`[BaseSpawner] ✅ Culled ${culled} objects (threshold: ${cullThreshold}px)`);
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
