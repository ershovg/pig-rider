import { EventBus } from '../../../shared/utils/EventBus';

export type GameScreen = 'start' | 'running' | 'win' | 'lose';
export type BoosterPhase = 'active' | 'ended';
export type GameAnimation = 'tutorial' | 'booster';

export type GamePublicEvent =
  | { type: 'ready' }
  | { type: 'state'; screen: GameScreen }
  | { type: 'score'; coins: number }
  | { type: 'booster'; phase: BoosterPhase }
  | { type: 'anim'; name: GameAnimation }
  | { type: 'mute'; muted: boolean };

type Payload<T extends GamePublicEvent['type']> = Omit<
  Extract<GamePublicEvent, { type: T }>,
  'type'
>;

const CHANNEL = 'game:public';

export const GameEvents = {
  publish<T extends GamePublicEvent['type']>(type: T, payload: Payload<T>): void {
    EventBus.emit(CHANNEL, { type, ...payload } as GamePublicEvent);
  },

  subscribe(listener: (event: GamePublicEvent) => void): () => void {
    EventBus.on(CHANNEL, listener);
    return () => EventBus.off(CHANNEL, listener);
  },
};
