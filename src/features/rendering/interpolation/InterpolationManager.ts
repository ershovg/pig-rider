import type { Interpolatable } from '../../../types';

type EntityGroup = Interpolatable[];

export class InterpolationManager {
  saveStates(entityGroups: EntityGroup[]): void {
    for (const group of entityGroups) {
      if (!Array.isArray(group)) continue;

      for (const entity of group) {
        if (entity?.saveState && (!entity.isActive || entity.isActive())) {
          entity.saveState();
        }
      }
    }
  }

  interpolate(alpha: number, entityGroups: EntityGroup[]): void {
    for (const group of entityGroups) {
      if (!Array.isArray(group)) continue;

      for (const entity of group) {
        if (entity?.interpolate && (!entity.isActive || entity.isActive())) {
          entity.interpolate(alpha);
        }
      }
    }
  }
}
