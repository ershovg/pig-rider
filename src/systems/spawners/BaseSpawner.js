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
    // 🆕 Имя спавнера для диагностики
    this.name = name || this.constructor.name;
  }

  update(deltaTime, gameSpeed, context = {}) {
    if (!this.enabled) return;

    // 🆕 ВАЖНО: Сначала выполняем culling и обновление объектов
    // Это освобождает место в пуле ПЕРЕД попыткой spawn новых объектов
    this.updateActiveObjects(deltaTime, gameSpeed, context);

    // 🆕 CRITICAL FIX: Use frame delta time for spawn timers
    // This prevents spawn accumulation during physics catch-up
    // frameDeltaTime = real time between visual frames
    // deltaTime = fixed physics timestep (can be called multiple times per frame)
    const timeForSpawnTimer = context.frameDeltaTime || deltaTime;
    this.timer += timeForSpawnTimer * 1000;

    const currentInterval = this.getCurrentInterval(context);

    // 🆕 Защита от множественного spawn за один frame
    // Спавним максимум ОДИН объект за update, даже если timer >> interval
    if (this.timer >= currentInterval) {
      // Сбрасываем timer полностью, а не вычитаем interval
      // Это предотвращает накопление и множественный spawn
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

    // 🔥 ДИАГНОСТИКА: логируем каждый 60-й кадр (раз в секунду при 60 FPS)
    this._frameCounter = (this._frameCounter || 0) + 1;
    if (this._frameCounter % 60 === 0) {
      const frameDelta = context.frameDeltaTime || deltaTime;
      const physicsCallsEstimate = Math.round(frameDelta / deltaTime);
      console.log(`[${this.name}] Update: objects=${objects.length}, cullThreshold=${cullThreshold}, frameDelta=${(frameDelta * 1000).toFixed(1)}ms, physics calls=${physicsCallsEstimate}`);
    }

    let culled = 0;

    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];

      // Обновляем объект
      obj.update(deltaTime, gameSpeed);

      // 🆕 Проверяем culling через Cullable interface ПЕРЕД проверкой isActive()
      if (cullThreshold !== undefined && obj.shouldCull && obj.shouldCull(cullThreshold)) {
        obj.deactivate();
        this.pool.release(obj);
        culled++;
        continue;
      }

      // ПОСЛЕ update проверяем, не деактивировался ли объект (fallback)
      if (!obj.isActive()) {
        this.pool.release(obj);
      }
    }

    // 🆕 Логирование для дебага
    if (culled > 0) {
      console.log(`[${this.name}] ✅ Culled ${culled} objects (threshold: ${cullThreshold}px)`);
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
