export interface CullingBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface CullableEntity {
  shouldCull(threshold: number): boolean;
}
