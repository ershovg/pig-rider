/**
 * Базовый класс для собираемых объектов (монеты, бустеры)
 */
import { Collidable } from './Collidable.js';

export class Collectible extends Collidable {
  constructor() {
    super();
    if (this.constructor === Collectible) {
      throw new Error('Collectible is abstract and cannot be instantiated directly');
    }
  }

  collect() {
    throw new Error('collect() must be implemented by subclass');
  }
}
