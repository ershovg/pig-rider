import { gsap } from 'gsap';

/**
 * GSAP анимация для звёзд - случайное мигание
 * Используется на всех экранах (start, game, win, lose)
 */
export function animateStars(containerSelector = '#start-screen') {
  const stars = document.querySelectorAll(`${containerSelector} .star`);

  stars.forEach((star) => {
    // Случайная задержка для каждой звезды
    const randomDelay = Math.random() * 2;

    // Случайная длительность анимации
    const randomDuration = 0.5 + Math.random() * 1;

    // Зацикленная анимация мигания через opacity и scale
    gsap.to(star, {
      autoAlpha: Math.random() * 0.3 + 0.3, // от 0.3 до 0.6
      scale: Math.random() * 0.5 + 0.7, // от 0.7 до 1.2
      duration: randomDuration,
      delay: randomDelay,
      repeat: -1, // Бесконечный повтор
      yoyo: true, // Туда-обратно
      ease: 'power1.inOut'
    });
  });

  return stars; // Возвращаем для возможности остановки анимации
}

/**
 * Остановка анимации звёзд
 */
export function stopStarsAnimation(containerSelector = '#start-screen') {
  const stars = document.querySelectorAll(`${containerSelector} .star`);
  gsap.killTweensOf(stars);
}
