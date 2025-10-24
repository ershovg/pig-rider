import { gsap } from 'gsap';

/**
 * GSAP анимация для кнопок - зацикленная пульсация
 * Используется для кнопок "Play now", "Try Again"
 */
export function animateButtonPulse(buttonSelector) {
  const button = document.querySelector(buttonSelector);

  if (!button) {
    console.warn(`Button ${buttonSelector} not found`);
    return null;
  }

  // Зацикленная пульсация через scale
  const animation = gsap.to(button, {
    scale: 1.1,
    duration: 0.8,
    repeat: -1, // Бесконечный повтор
    yoyo: true, // Туда-обратно
    ease: 'power1.inOut'
  });

  return animation;
}

/**
 * Остановка анимации кнопки и возврат к нормальному размеру
 */
export function stopButtonPulse(buttonSelector) {
  const button = document.querySelector(buttonSelector);

  if (!button) return;

  gsap.killTweensOf(button);
  gsap.to(button, {
    scale: 1,
    duration: 0.3,
    ease: 'power2.out'
  });
}

/**
 * Анимация клика на кнопку (juice эффект)
 */
export function animateButtonClick(buttonSelector, callback) {
  const button = document.querySelector(buttonSelector);

  if (!button) return;

  // Останавливаем пульсацию
  stopButtonPulse(buttonSelector);

  // Анимация нажатия
  gsap.timeline()
    .to(button, {
      scale: 0.9,
      duration: 0.1,
      ease: 'power2.in'
    })
    .to(button, {
      scale: 1.05,
      duration: 0.2,
      ease: 'back.out(2)'
    })
    .to(button, {
      scale: 1,
      duration: 0.1,
      onComplete: callback
    });
}
