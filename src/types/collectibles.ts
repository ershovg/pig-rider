export type CollectibleType = 'coin' | 'booster' | 'shield' | 'magnet' | 'doubler';

export interface CollectResult {
  type: CollectibleType;
  value: number;
}
