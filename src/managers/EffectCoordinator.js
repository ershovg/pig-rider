export class EffectCoordinator {
  constructor(spawnSystem) {
    this.spawnSystem = spawnSystem;
  }

  emitCollisionEffect(x, y) {
    this.spawnSystem.emitCollisionEffect(x, y);
  }

  emitCoinCollectEffect(x, y) {
    // ✅ Проигрываем spritesheet анимацию сбора монеты
    this.spawnSystem.emitCoinCollectEffect(x, y);
  }
}
