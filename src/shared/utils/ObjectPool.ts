export class ObjectPool<T> {
  private pool: T[] = [];
  private active: T[] = [];
  private maxSize: number;

  constructor(
    private createFn: () => T,
    private resetFn: (obj: T) => void,
    initialSize: number = 10,
    maxSize: number | null = null
  ) {
    this.maxSize = maxSize || initialSize * 2;

    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }

  acquire(): T | null {
    let obj: T;

    if (this.pool.length > 0) {
      obj = this.pool.pop()!;
    } else {
      const totalObjects = this.active.length + this.pool.length;

      if (totalObjects >= this.maxSize) {
        console.error(`[ObjectPool] Pool exhausted (max: ${this.maxSize})`);
        return null;
      }

      obj = this.createFn();

      if (totalObjects > this.maxSize * 0.8) {
        console.warn(`[ObjectPool] Near capacity: ${totalObjects + 1}/${this.maxSize}`);
      }
    }

    this.active.push(obj);
    return obj;
  }

  release(obj: T): void {
    const index = this.active.indexOf(obj);

    if (index > -1) {
      this.active.splice(index, 1);
      this.resetFn(obj);
      this.pool.push(obj);
    } else if (this.pool.includes(obj)) {
      console.warn('[ObjectPool] Double-release attempt');
    }
  }

  releaseAll(): void {
    while (this.active.length > 0) {
      const obj = this.active.pop()!;
      this.resetFn(obj);
      this.pool.push(obj);
    }
  }

  getActive(): T[] {
    return this.active;
  }

  getActiveCount(): number {
    return this.active.length;
  }

  getPooledCount(): number {
    return this.pool.length;
  }

  getTotalCount(): number {
    return this.pool.length + this.active.length;
  }

  getStats() {
    return {
      pooled: this.getPooledCount(),
      active: this.getActiveCount(),
      total: this.getTotalCount()
    };
  }
}
