import { Collidable } from './Collidable';

export abstract class Collectible extends Collidable {
  constructor() {
    super();
    if (this.constructor === Collectible) {
      throw new Error('Collectible is abstract and cannot be instantiated directly');
    }
  }

  abstract collect(): { type: string; value: number } | null;
}
