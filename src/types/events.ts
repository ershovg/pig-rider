export interface CoinCollectedEvent {
  x: number;
  y: number;
  value: number;
}

export interface BoosterCollectedEvent {
  x: number;
  y: number;
}

export interface BoosterActivatedEvent {
  duration: number;
}

export interface BoosterDeactivatedEvent {
  totalCoinsCollected: number;
}

export interface CollisionEvent {
  x: number;
  y: number;
  entityType: string;
}

export interface GameStateChangeEvent {
  from: string;
  to: string;
}

export interface ScoreUpdateEvent {
  current: number;
  target: number;
}
