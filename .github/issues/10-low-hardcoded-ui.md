# [LOW] Hardcoded confirm() и alert() в production коде

**Labels:** `enhancement`, `low`, `ui`, `ux`
**Priority:** 🟢 LOW
**Files:** `src/ui/UIController.js:109, 156`

## ℹ️ Описание проблемы

Используются нативные браузерные `confirm()` и `alert()` вместо custom HTML UI, что выглядит непрофессионально и не соответствует дизайну игры.

## Код с проблемой

### 1. Booster Modal (confirm)

```javascript
// UIController.js:109
showBoosterModal() {
  return new Promise((resolve) => {
    // ❌ Hardcoded confirm
    const boosterAccepted = confirm('Вы получили бонус бустер!');

    // TODO: добавить когда будет готов в Webflow
    // if (this.boostScreen) {
    //   this.boostScreen.style.opacity = '1';
    //   // ...
    // }

    resolve(boosterAccepted);
  });
}
```

### 2. Lose Screen (alert)

```javascript
// UIController.js:156
showLoseScreen(score) {
  console.log(`💀 LOSE! Score: ${score}`);
  alert(`💀 LOSE! Score: ${score}`)  // ❌ Hardcoded alert

  this.hideAll();
  if (this.faildScreen) {
    this.faildScreen.style.display = 'flex';
  }
  // ...
}
```

## Последствия

- ⚠️ Выглядит непрофессионально
- ⚠️ Не соответствует дизайну игры
- ⚠️ Нельзя стилизовать или анимировать
- ⚠️ Блокирует весь UI браузера
- ⚠️ Плохой UX на мобильных устройствах

## Примеры как выглядит

**Текущая реализация:**
```
┌─────────────────────────────┐
│  localhost:3000 говорит:    │
│                             │
│  Вы получили бонус бустер!  │
│                             │
│    [Отмена]    [ОК]         │
└─────────────────────────────┘
```

**Желаемая реализация:**
```
╔═══════════════════════════════╗
║     🎉 БОНУС БУСТЕР! 🎉       ║
║                               ║
║  Вы получили power-up!        ║
║  Все препятствия исчезнут!    ║
║                               ║
║     [Активировать] [×]        ║
╚═══════════════════════════════╝
```

## Решение

### Вариант 1: Custom HTML Modal (рекомендуется)

```html
<!-- index.html - добавить в Webflow -->
<div class="game-ui game-boost" style="display: none;">
  <div class="boost-modal">
    <div class="boost-icon">🎉</div>
    <h2>БОНУС БУСТЕР!</h2>
    <p>Вы получили power-up!<br>Все препятствия исчезнут!</p>
    <button game-btn-boost-confirm>Активировать</button>
    <button game-btn-boost-cancel>×</button>
  </div>
</div>
```

```javascript
// UIController.js
showBoosterModal() {
  return new Promise((resolve) => {
    // ✅ Показываем custom modal
    if (this.boostScreen) {
      this.boostScreen.style.display = 'flex';

      // ✅ Анимация появления
      gsap.from(this.boostScreen.querySelector('.boost-modal'), {
        scale: 0.8,
        opacity: 0,
        duration: 0.3,
        ease: 'back.out(1.7)'
      });

      // ✅ Обработчики кнопок
      const confirmBtn = document.querySelector('[game-btn-boost-confirm]');
      const cancelBtn = document.querySelector('[game-btn-boost-cancel]');

      const handleConfirm = () => {
        this.hideBoosterModal();
        cleanup();
        resolve(true);
      };

      const handleCancel = () => {
        this.hideBoosterModal();
        cleanup();
        resolve(false);
      };

      const cleanup = () => {
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
      };

      confirmBtn.addEventListener('click', handleConfirm);
      cancelBtn.addEventListener('click', handleCancel);
    } else {
      // Fallback к confirm если modal не найден
      resolve(confirm('Вы получили бонус бустер!'));
    }
  });
}

hideBoosterModal() {
  if (this.boostScreen) {
    // ✅ Анимация скрытия
    gsap.to(this.boostScreen.querySelector('.boost-modal'), {
      scale: 0.8,
      opacity: 0,
      duration: 0.2,
      onComplete: () => {
        this.boostScreen.style.display = 'none';
      }
    });
  }
}
```

### Вариант 2: Использовать существующий lose screen вместо alert

```diff
// UIController.js:156
showLoseScreen(score) {
  console.log(`💀 LOSE! Score: ${score}`);
- alert(`💀 LOSE! Score: ${score}`)  // ❌ УДАЛИТЬ

  this.hideAll();
  if (this.faildScreen) {
    this.faildScreen.style.display = 'flex';
+
+   // ✅ Обновляем score в HTML
+   const scoreElement = this.faildScreen.querySelector('[game-final-score]');
+   if (scoreElement) {
+     scoreElement.textContent = score;
+   }
  }
  // ...
}
```

## Чек-лист исправления

### Booster Modal (Приоритет 1):
- [ ] Создать HTML разметку modal в Webflow
- [ ] Добавить CSS стили для modal
- [ ] Реализовать `showBoosterModal()` с custom UI
- [ ] Добавить анимации появления/скрытия
- [ ] Добавить обработчики кнопок
- [ ] Протестировать на desktop и mobile

### Lose Screen Alert (Приоритет 2):
- [ ] Удалить `alert()` из `showLoseScreen()`
- [ ] Добавить `[game-final-score]` элемент в HTML
- [ ] Обновлять score через `textContent`
- [ ] Протестировать отображение финального счета

## Связанные файлы

- `src/ui/UIController.js:109` - `showBoosterModal()` (требует изменений)
- `src/ui/UIController.js:156` - `showLoseScreen()` (требует изменений)
- `index.html` - добавить HTML разметку для modal
- `styles.css` - добавить стили (или в Webflow)

## Дополнительная информация

**Преимущества custom UI:**
- ✅ Полный контроль над дизайном
- ✅ Анимации и transitions
- ✅ Адаптивность под разные устройства
- ✅ Соответствие общему стилю игры
- ✅ Возможность добавить дополнительную информацию

**CSS пример для modal:**
```css
.game-boost {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.boost-modal {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  max-width: 400px;
}
```

## Приоритет

**LOW** - функциональность работает, но улучшает профессионализм и UX.
