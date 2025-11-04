/**
 * RenderCoordinator - Управление рендерингом и интерполяцией.
 * Сглаживает движение объектов между fixed timestep updates (60 FPS) для плавности на любом мониторе.
 */

import { CONFIG } from '../../../shared/config/constants.ts';

export class RenderCoordinator {
  constructor(registry) {
    this.registry = registry;
  }

  render(alpha) {
    if (!CONFIG.INTERPOLATION.ENABLED) return;

    this.registry.interpolationManager.interpolate(alpha, [
      this.registry.spawnSystem.getActiveObstacles(),
      this.registry.spawnSystem.getActiveCoins(),
      this.registry.spawnSystem.getActiveBoosters(),
      [this.registry.player]
    ]);
  }
}
