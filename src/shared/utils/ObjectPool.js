/**
 * Generic Object Pool for reusing game objects
 * Reduces garbage collection by reusing objects
 */
export class ObjectPool {
  constructor(createFn, resetFn, initialSize = 10, maxSize = null) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.pool = [];
    this.active = [];
    // 🔴 CRITICAL: Set max size to prevent infinite growth
    // Default to 2x initial size if not specified
    this.maxSize = maxSize || initialSize * 2;

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
      // console.log(`[ObjectPool] ✅ Acquired from pool (pooled: ${this.pool.length}, active: ${this.active.length + 1})`);
    } else {
      // 🔴 CRITICAL FIX: Prevent infinite object creation
      const totalObjects = this.active.length + this.pool.length;
      if (totalObjects < this.maxSize) {
        // Create new object only if under max size
        obj = this.createFn();
        if (totalObjects > this.maxSize * 0.8) {
          console.warn(`[ObjectPool] ⚠️ Pool near capacity: ${totalObjects + 1}/${this.maxSize}`);
        }
      } else {
        // Pool is at max capacity - return null to prevent memory leak
        console.error(`[ObjectPool] ❌ POOL EXHAUSTED! Max capacity (${this.maxSize}) reached. Spawn skipped.`);
        return null;
      }
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
      // Removed verbose logging to reduce console spam
      // console.log(`[ObjectPool] ✅ Released object (pooled: ${this.pool.length}, active: ${this.active.length})`);
    } else {
      // 🔥 SAFETY CHECK: Предотвращаем double-release
      // Если объект не найден в active, возможно он уже в пуле
      if (this.pool.includes(obj)) {
        console.warn('[ObjectPool] ⚠️ Attempted double-release of object. Ignoring.');
      } else {
        console.error('[ObjectPool] ❌ FAILED to release - object NOT in active array!');
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
