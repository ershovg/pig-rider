export type GameEventMap = {
  'game:start': void;
  'game:pause': void;
  'game:resume': void;
  'game:win': { score: number; time: number };
  'game:lose': { score: number };
  'coin:collected': { x: number; y: number; value: number };
  'booster:activated': { duration: number };
  'booster:deactivated': void;
  'booster:lane-switched': { lane: number };
  'collision:obstacle': { playerLane: number };
  'difficulty:changed': { level: number; speed: number };
};

class EventBusClass<EventMap extends Record<string, any>> {
  private events = new Map<keyof EventMap, Array<(data: any) => void>>();

  on<K extends keyof EventMap>(
    event: K,
    callback: (data: EventMap[K]) => void
  ): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }

  off<K extends keyof EventMap>(
    event: K,
    callback: (data: EventMap[K]) => void
  ): void {
    if (!this.events.has(event)) return;

    const callbacks = this.events.get(event)!;
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
    if (!this.events.has(event)) return;

    const callbacks = this.events.get(event)!;
    callbacks.forEach(callback => callback(data));
  }

  clear(): void {
    this.events.clear();
  }
}

export const EventBus = new EventBusClass<GameEventMap>();
