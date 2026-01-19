export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class MathUtils {
  static checkAABB(obj1: Rectangle, obj2: Rectangle): boolean {
    return (
      obj1.x < obj2.x + obj2.width &&
      obj1.x + obj1.width > obj2.x &&
      obj1.y < obj2.y + obj2.height &&
      obj1.y + obj1.height > obj2.y
    );
  }

  static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static randomFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  static lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
  }
}
