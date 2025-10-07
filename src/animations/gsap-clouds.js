import { gsap } from 'gsap';

/**
 * GSAP анимация для облаков - движение справа налево (параллакс)
 * Облака летят навстречу свинке
 */
export function animateClouds(containerSelector = '#start-screen') {
  const clouds = document.querySelectorAll(`${containerSelector} .cloud`);

  clouds.forEach((cloud, index) => {
    // Начальная позиция (справа от экрана)
    const startX = window.innerWidth + 200;

    // Конечная позиция (слева от экрана)
    const endX = -300;

    // Разная скорость для эффекта параллакса
    const duration = 15 + index * 5;

    // Устанавливаем начальную позицию
    gsap.set(cloud, { x: startX });

    // Зацикленная анимация движения
    gsap.to(cloud, {
      x: endX,
      duration: duration,
      repeat: -1,
      ease: 'linear'
    });
  });

  return clouds;
}

/**
 * Остановка анимации облаков
 */
export function stopCloudsAnimation(containerSelector = '#start-screen') {
  const clouds = document.querySelectorAll(`${containerSelector} .cloud`);
  gsap.killTweensOf(clouds);
}
