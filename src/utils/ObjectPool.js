/**
 * Generic Object Pool for reusing game objects
 * Reduces garbage collection by reusing objects
 */
export class ObjectPool {
  constructor(createFn, resetFn, initialSize = 10) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.pool = [];
    this.active = [];

    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }

  /**
   * Get an object from the pool
   */
  acquire() {
    let obj;

    if (this.pool.length > 0) {
      obj = this.pool.pop();
    } else {
      // Pool is empty, create new object
      obj = this.createFn();
    }

    this.active.push(obj);
    return obj;
  }

  /**
   * Return an object to the pool
   * 🔥 С защитой от double-release
   */
  release(obj) {
    const index = this.active.indexOf(obj);
    if (index > -1) {
      this.active.splice(index, 1);
      this.resetFn(obj);
      this.pool.push(obj);
    } else {
      // 🔥 SAFETY CHECK: Предотвращаем double-release
      // Если объект не найден в active, возможно он уже в пуле
      if (this.pool.includes(obj)) {
        console.warn('[ObjectPool] Attempted double-release of object. Ignoring.');
      } else {
        console.error('[ObjectPool] Attempted to release unknown object!');
      }
    }
  }

  /**
   * Release all active objects
   */
  releaseAll() {
    while (this.active.length > 0) {
      const obj = this.active.pop();
      this.resetFn(obj);
      this.pool.push(obj);
    }
  }

  /**
   * Get all active objects
   */
  getActive() {
    return this.active;
  }

  /**
   * Active objects count
   */
  getActiveCount() {
    return this.active.length;
  }

  /**
   * Pooled (available) objects count
   */
  getPooledCount() {
    return this.pool.length;
  }

  /**
   * Total managed objects count
   */
  getTotalCount() {
    return this.pool.length + this.active.length;
  }

  /**
   * Get pool stats
   */
  getStats() {
    return {
      pooled: this.getPooledCount(),
      active: this.getActiveCount(),
      total: this.getTotalCount()
    };
  }
}
