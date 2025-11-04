import { Renderable } from './Renderable';
import { Hitbox } from '../../../types/entities';

export abstract class Collidable extends Renderable {
  constructor() {
    super();
    if (this.constructor === Collidable) {
      throw new Error('Collidable is abstract and cannot be instantiated directly');
    }
  }

  abstract getHitbox(): Hitbox | null;
}
