// Math utility functions for game calculations

export class MathUtils {
  /**
   * Check AABB collision between two rectangular objects
   */
  static checkAABB(obj1, obj2) {
    return (
      obj1.x < obj2.x + obj2.width &&
      obj1.x + obj1.width > obj2.x &&
      obj1.y < obj2.y + obj2.height &&
      obj1.y + obj1.height > obj2.y
    );
  }

  /**
   * Get random integer between min and max (inclusive)
   */
  static randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Get random float between min and max
   */
  static randomFloat(min, max) {
    return Math.random() * (max - min) + min;
  }

  /**
   * Clamp value between min and max
   */
  static clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  /**
   * Linear interpolation
   */
  static lerp(start, end, t) {
    return start + (end - start) * t;
  }
}
