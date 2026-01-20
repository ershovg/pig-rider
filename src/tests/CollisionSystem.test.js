import { describe, it, expect, beforeEach } from 'vitest';
import { CollisionSystem } from '../features/collision/system/CollisionSystem.ts';
import { MathUtils } from '../shared/utils/MathUtils.ts';

describe('Система коллизий - AABB проверка', () => {
    let collisionSystem;

    beforeEach(() => {
        collisionSystem = new CollisionSystem();
    });

    it('должен обнаружить столкновение когда игрок врезается в препятствие', () => {
        const player = { x: 100, y: 200, width: 80, height: 80 };
        const obstacle = { x: 120, y: 220, width: 100, height: 100 };
        expect(MathUtils.checkAABB(player, obstacle)).toBe(true);
    });

    it('НЕ должен обнаружить столкновение когда игрок далеко от препятствия', () => {
        const player = { x: 100, y: 200, width: 80, height: 80 };
        const obstacle = { x: 300, y: 200, width: 100, height: 100 };
        expect(MathUtils.checkAABB(player, obstacle)).toBe(false);
    });

    it('должен корректно учитывать масштаб хитбокса', () => {
        const playerHitbox = { x: 100, y: 100, width: 56, height: 56 };
        const coin = { x: 110, y: 110, width: 30, height: 30 };
        expect(MathUtils.checkAABB(playerHitbox, coin)).toBe(true);
    });

    it('НЕ должен обнаружить коллизию когда коробки касаются только краями', () => {
        const boxA = { x: 0, y: 0, width: 10, height: 10 };
        const boxB = { x: 10, y: 0, width: 10, height: 10 };
        expect(MathUtils.checkAABB(boxA, boxB)).toBe(false);
    });
});