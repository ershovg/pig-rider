import type { Entity } from './entities';

export interface CullingBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface CullableEntity extends Entity {
  shouldCull(threshold: number): boolean;
}
