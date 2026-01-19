interface EffectEmitter {
  emitCollisionEffect(x: number, y: number): void;
  emitCoinCollectEffect(x: number, y: number): void;
}

export class EffectCoordinator {
  private spawnSystem: EffectEmitter;

  constructor(spawnSystem: EffectEmitter) {
    this.spawnSystem = spawnSystem;
  }

  emitCollisionEffect(x: number, y: number): void {
    this.spawnSystem.emitCollisionEffect(x, y);
  }

  emitCoinCollectEffect(x: number, y: number): void {
    this.spawnSystem.emitCoinCollectEffect(x, y);
  }
}
