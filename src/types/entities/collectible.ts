import { Collidable } from './base';

export interface Collectible extends Collidable {
  collect(): { type: string; value: number } | null;
}

export interface Poolable extends Collidable {
  reset(): void;
}
