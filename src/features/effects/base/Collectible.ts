import { Collidable } from './Collidable';
import type { CollectResult } from '../../../types/collectibles';

export abstract class Collectible extends Collidable {
  constructor() {
    super();
    if (this.constructor === Collectible) {
      throw new Error('Collectible is abstract and cannot be instantiated directly');
    }
  }

  abstract collect(): CollectResult | null;
}
