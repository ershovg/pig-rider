import { CONFIG } from '../../../shared/config/constants.ts';
import type { SystemRegistry } from '../registry/SystemRegistry.ts';

export class RenderCoordinator {
  private registry: SystemRegistry;

  constructor(registry: SystemRegistry) {
    this.registry = registry;
  }

  render(alpha: number): void {
    if (!CONFIG.INTERPOLATION.ENABLED) return;

    this.registry.interpolationManager!.interpolate(alpha, [
      this.registry.spawnSystem!.getActiveObstacles(),
      this.registry.spawnSystem!.getActiveCoins(),
      this.registry.spawnSystem!.getActiveBoosters(),
      [this.registry.player!]
    ]);
  }
}
