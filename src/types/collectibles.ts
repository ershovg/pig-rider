/**
 * Типы собираемых объектов в игре
 * Используется для различения разных типов collectibles и их обработки
 */

export type CollectibleType = 'coin' | 'booster' | 'shield' | 'magnet' | 'doubler';

export interface CollectResult {
  type: CollectibleType;
  value: number;
}

/**
 * Примеры будущих типов:
 * - coin: обычная монета (+1 score)
 * - booster: текущий бустер (mode с заполнением полосы монетами)
 * - shield: защита от столкновений (N секунд неуязвимости)
 * - magnet: магнит для монет (автосбор в радиусе)
 * - doubler: удвоитель очков (×2 score на N секунд)
 */
