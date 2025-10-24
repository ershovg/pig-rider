import { Container, Graphics } from 'pixi.js';

/**
 * CoinSparkle - Particle effect при сборе монет
 *
 * Архитектура:
 * - Container с 8 частицами (звездочки)
 * - Разлетаются радиально от точки сбора монеты
 * - Fade out + гравитация для естественного движения
 * - Object pooling friendly (activate/deactivate pattern)
 */
export class CoinSparkle extends Container {
  constructor() {
    super();

    // Конфигурация частиц
    this.particleCount = 8; // 8 частиц разлетаются во все стороны
    this.particles = [];
    this.active = false;

    // Создаем pool из частиц
    for (let i = 0; i < this.particleCount; i++) {
      const particle = this.createParticle();
      this.particles.push(particle);
      this.addChild(particle.sprite);
    }
  }

  /**
   * Создает одну частицу-звездочку
   */
  createParticle() {
    const sprite = new Graphics();

    // Рисуем звездочку (5 лучей)
    const outerRadius = 8;
    const innerRadius = 4;
    const points = 5;

    sprite.moveTo(outerRadius, 0);

    for (let i = 0; i <= points * 2; i++) {
      const angle = (Math.PI / points) * i;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      sprite.lineTo(x, y);
    }

    // Золотистый цвет с градиентом (желтый → оранжевый)
    sprite.fill({ color: 0xFFD700 });
    sprite.visible = false;

    return {
      sprite,
      vx: 0,    // velocity X
      vy: 0,    // velocity Y
      life: 0,  // оставшееся время жизни (в кадрах)
      maxLife: 0
    };
  }

  /**
   * Активирует эффект в указанной позиции
   * @param {number} x - X координата сбора монеты
   * @param {number} y - Y координата сбора монеты
   */
  activate(x, y) {
    this.position.set(x, y);
    this.active = true;

    const maxLife = 30; // 0.5 секунды при 60 FPS
    const baseSpeed = 4; // базовая скорость разлета

    this.particles.forEach((particle, i) => {
      const sprite = particle.sprite;

      // Сбрасываем позицию в центр
      sprite.position.set(0, 0);
      sprite.visible = true;
      sprite.alpha = 1;
      sprite.scale.set(1);

      // Радиальное направление (360° / 8 частиц = 45° между каждой)
      const angle = (Math.PI * 2 / this.particleCount) * i;

      // Добавляем небольшую случайность к скорости (±20%)
      const speedVariation = baseSpeed * (0.8 + Math.random() * 0.4);

      particle.vx = Math.cos(angle) * speedVariation;
      particle.vy = Math.sin(angle) * speedVariation;
      particle.life = maxLife;
      particle.maxLife = maxLife;
    });
  }

  /**
   * Деактивирует эффект и возвращает в pool
   */
  deactivate() {
    this.active = false;
    this.particles.forEach(particle => {
      particle.sprite.visible = false;
    });
  }

  /**
   * Обновление физики частиц
   * @param {number} dt - Delta time (обычно 1/60)
   */
  update(dt) {
    if (!this.active) return;

    let allDead = true;

    this.particles.forEach(particle => {
      if (!particle.sprite.visible) return;

      const sprite = particle.sprite;

      // Физика движения
      sprite.x += particle.vx;
      sprite.y += particle.vy;

      // Гравитация (частицы падают вниз)
      particle.vy += 0.25;

      // Небольшое затухание горизонтальной скорости (air resistance)
      particle.vx *= 0.98;

      // Уменьшаем время жизни
      particle.life--;

      // Fade out + scale down в конце жизни
      const lifeProgress = particle.life / particle.maxLife;
      sprite.alpha = lifeProgress;
      sprite.scale.set(lifeProgress);

      // Смерть частицы
      if (particle.life <= 0) {
        sprite.visible = false;
      } else {
        allDead = false;
      }
    });

    // Если все частицы умерли, деактивируем весь эффект
    if (allDead) {
      this.deactivate();
    }
  }

  /**
   * Проверка активности (для pooling)
   */
  isActive() {
    return this.active;
  }
}
