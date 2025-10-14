import * as PIXI from 'pixi.js';

/**
 * Эффект сбора монеты - короткая анимация из 4 кадров
 * Проигрывается один раз при сборе монеты и автоматически деактивируется
 */
export class CoinCollectEffect {
  constructor(spritesheet) {
    // Создаем AnimatedSprite из спрайтшита coin-collect.json
    // Анимация "CoinCollect" содержит 4 кадра (CoinCollect_000 -> CoinCollect_003)
    const frames = spritesheet.animations['CoinCollect'];
    this.sprite = new PIXI.AnimatedSprite(frames);
    this.sprite.anchor.set(0.5);

    // Настройка анимации
    this.sprite.animationSpeed = 0.7; // 0.5 кадров за тик (60 FPS) = ~30 FPS анимация
    this.sprite.loop = false;          // Проиграть один раз

    // Размер эффекта (кадры 100x100px)
    const targetSize = 80; // Эффект чуть больше монеты (60px)
    const scale = targetSize / 100;
    this.sprite.scale.set(scale);

    this.active = false;
    this.sprite.visible = false;

    // Callback для автоматической деактивации после окончания
    this.sprite.onComplete = () => {
      this.deactivate();
    };
  }

  /**
   * Активировать эффект в указанной позиции
   * @param {number} x - X координата
   * @param {number} y - Y координата
   */
  activate(x, y) {
    this.active = true;
    this.sprite.x = x;
    this.sprite.y = y;
    this.sprite.visible = true;
    this.sprite.alpha = 1;

    // Сбрасываем scale перед анимацией
    const targetSize = 80;
    const scale = targetSize / 100;
    this.sprite.scale.set(scale);

    // 🆕 Запускаем только sprite sheet анимацию из coin-collect.json
    // 4 кадра (CoinCollect_000 -> CoinCollect_003) @ 30 FPS = ~133ms
    // Это красивая, профессиональная анимация "взрыва" монеты
    this.sprite.gotoAndPlay(0);
  }

  /**
   * Деактивировать эффект
   */
  deactivate() {
    this.active = false;
    this.sprite.visible = false;
    this.sprite.stop();
  }

  /**
   * Получить спрайт для добавления на stage
   */
  getSprite() {
    return this.sprite;
  }

  /**
   * Проверка активности
   */
  isActive() {
    return this.active;
  }

  /**
   * Reset для object pooling
   */
  reset() {
    this.deactivate();

    // 🆕 Сбрасываем scale (может накапливаться при переиспользовании из пула)
    const targetSize = 80;
    const scale = targetSize / 100;
    this.sprite.scale.set(scale);
  }
}
