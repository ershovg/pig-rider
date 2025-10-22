/**
 * Базовый класс для объектов с коллизиями
 */
import { Renderable } from './Renderable.js';

export class Collidable extends Renderable {
  constructor() {
    super();
    if (this.constructor === Collidable) {
      throw new Error('Collidable is abstract and cannot be instantiated directly');
    }
  }

  getHitbox() {
    throw new Error('getHitbox() must be implemented by subclass');
  }
}
