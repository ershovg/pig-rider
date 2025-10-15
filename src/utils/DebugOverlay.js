/**
 * Debug overlay для визуализации culling boundaries
 *
 * Показывает две вертикальные линии:
 * - Левая граница (где объекты удаляются)
 * - Правая граница (где объекты появляются)
 *
 * Можно двигать мышью для настройки оптимальных значений
 * Toggle клавишей D
 */
export class DebugOverlay {
  constructor(renderer, cullingManager) {
    this.renderer = renderer;
    this.cullingManager = cullingManager;
    this.visible = false;
    this.dragging = null; // 'left' | 'right' | null

    // Позиции линий в % от ширины канваса
    this.leftMultiplier = 0.15;  // 15% за левым краем
    this.rightMultiplier = 1.15; // 115% от ширины (15% за правым)

    this.createOverlay();
    this.attachEventListeners();
  }

  createOverlay() {
    // Контейнер overlay
    this.container = document.createElement('div');
    this.container.id = 'debug-overlay';
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
      display: none;
    `;

    // Левая граница
    this.leftLine = this.createLine('left', '#ff3b30');
    this.leftLabel = this.createLabel('left');

    // Правая граница
    this.rightLine = this.createLine('right', '#34c759');
    this.rightLabel = this.createLabel('right');

    // Canvas boundary (для справки)
    this.canvasBorder = document.createElement('div');
    this.canvasBorder.style.cssText = `
      position: absolute;
      border: 2px dashed rgba(255, 255, 255, 0.3);
      pointer-events: none;
    `;

    // Info panel
    this.infoPanel = document.createElement('div');
    this.infoPanel.style.cssText = `
      position: absolute;
      top: 20px;
      left: 20px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 15px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 14px;
      line-height: 1.6;
      pointer-events: none;
    `;

    this.container.appendChild(this.canvasBorder);
    this.container.appendChild(this.leftLine);
    this.container.appendChild(this.leftLabel);
    this.container.appendChild(this.rightLine);
    this.container.appendChild(this.rightLabel);
    this.container.appendChild(this.infoPanel);

    document.body.appendChild(this.container);
  }

  createLine(side, color) {
    const line = document.createElement('div');
    line.className = `debug-line debug-line-${side}`;
    line.style.cssText = `
      position: absolute;
      top: 0;
      width: 3px;
      height: 100%;
      background: ${color};
      cursor: ew-resize;
      pointer-events: auto;
      box-shadow: 0 0 10px ${color};
      z-index: 10000;
    `;
    return line;
  }

  createLabel(side) {
    const label = document.createElement('div');
    label.className = `debug-label debug-label-${side}`;
    label.style.cssText = `
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-family: monospace;
      font-size: 13px;
      font-weight: bold;
      pointer-events: none;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    `;
    return label;
  }

  attachEventListeners() {
    // Toggle клавишей D
    document.addEventListener('keydown', (e) => {
      if (e.key === 'd' || e.key === 'D') {
        this.toggle();
      }
    });

    // Drag для левой линии
    this.leftLine.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.dragging = 'left';
    });

    // Drag для правой линии
    this.rightLine.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.dragging = 'right';
    });

    // Mouse move
    document.addEventListener('mousemove', (e) => {
      if (!this.dragging) return;

      const canvasRect = this.getCanvasRect();
      const canvasLeft = canvasRect.left;
      const canvasWidth = canvasRect.width;

      // Мышь относительно левого края канваса
      const mouseX = e.clientX - canvasLeft;

      if (this.dragging === 'left') {
        // Левая граница: от -50% до 0% ширины канваса
        const multiplier = Math.max(-0.5, Math.min(0, mouseX / canvasWidth));
        this.leftMultiplier = Math.abs(multiplier);
      } else if (this.dragging === 'right') {
        // Правая граница: от 100% до 150% ширины канваса
        const multiplier = Math.max(1.0, Math.min(1.5, mouseX / canvasWidth));
        this.rightMultiplier = multiplier;
      }

      this.updatePositions();
      this.updateCullingManager();
    });

    // Mouse up
    document.addEventListener('mouseup', () => {
      this.dragging = null;
    });

    // Window resize
    window.addEventListener('resize', () => {
      if (this.visible) {
        this.updatePositions();
      }
    });
  }

  getCanvasRect() {
    const canvas = document.getElementById('game-canvas');
    return canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0, width: 1920, height: 1080 };
  }

  updatePositions() {
    const canvasRect = this.getCanvasRect();
    const canvasLeft = canvasRect.left;
    const canvasTop = canvasRect.top;
    const canvasWidth = canvasRect.width;
    const canvasHeight = canvasRect.height;

    // Получаем реальную ширину renderer (PixiJS canvas)
    const rendererWidth = this.renderer.app?.screen?.width || this.renderer.app?.renderer?.width || 1920;

    // Canvas border
    this.canvasBorder.style.left = `${canvasLeft}px`;
    this.canvasBorder.style.top = `${canvasTop}px`;
    this.canvasBorder.style.width = `${canvasWidth}px`;
    this.canvasBorder.style.height = `${canvasHeight}px`;

    // Левая граница (отрицательная позиция)
    const leftX = canvasLeft - (this.leftMultiplier * canvasWidth);
    this.leftLine.style.left = `${leftX}px`;
    this.leftLabel.style.left = `${leftX + 10}px`;

    // Правая граница
    const rightX = canvasLeft + (this.rightMultiplier * canvasWidth);
    this.rightLine.style.left = `${rightX}px`;
    this.rightLabel.style.left = `${rightX + 10}px`;

    // Обновляем текст labels (используем rendererWidth для игровых координат)
    const leftPx = Math.round(-this.leftMultiplier * rendererWidth);
    const rightPx = Math.round(this.rightMultiplier * rendererWidth);

    this.leftLabel.textContent = `LEFT: ${leftPx}px (${(this.leftMultiplier * 100).toFixed(1)}%)`;
    this.rightLabel.textContent = `RIGHT: ${rightPx}px (${(this.rightMultiplier * 100).toFixed(1)}%)`;

    // Обновляем info panel
    this.updateInfoPanel();
  }

  updateInfoPanel() {
    const rendererWidth = this.renderer.app?.screen?.width || this.renderer.app?.renderer?.width || 1920;
    const rendererHeight = this.renderer.app?.screen?.height || this.renderer.app?.renderer?.height || 1080;

    const leftBoundary = -this.leftMultiplier * rendererWidth;
    const rightBoundary = this.rightMultiplier * rendererWidth;

    this.infoPanel.innerHTML = `
      <div style="margin-bottom: 10px; font-weight: bold; color: #ffd60a;">
        🎯 CULLING DEBUG MODE
      </div>
      <div><span style="color: #ff3b30;">●</span> Left Boundary: ${leftBoundary.toFixed(0)}px</div>
      <div><span style="color: #34c759;">●</span> Right Boundary: ${rightBoundary.toFixed(0)}px</div>
      <div style="margin-top: 8px; color: #888;">Canvas: ${rendererWidth}×${rendererHeight}px</div>
      <div style="margin-top: 8px; color: #888; font-size: 12px;">
        💡 Drag lines to adjust<br>
        Press D to hide
      </div>
    `;
  }

  updateCullingManager() {
    const rendererWidth = this.renderer.app?.screen?.width || this.renderer.app?.renderer?.width || 1920;
    const leftBoundary = -this.leftMultiplier * rendererWidth;
    this.cullingManager.setThreshold(leftBoundary);
  }

  toggle() {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  show() {
    this.visible = true;
    this.container.style.display = 'block';
    this.updatePositions();
    this.updateCullingManager();

    const rendererWidth = this.renderer.app?.screen?.width || this.renderer.app?.renderer?.width || 1920;
    const canvasRect = this.getCanvasRect();

    console.log('🎯 Debug Overlay: ON (Press D to hide)');
    console.log('📍 Canvas rect:', canvasRect);
    console.log('📐 Renderer width:', rendererWidth);
    console.log('📏 Left line position:', this.leftLine.style.left);
    console.log('📏 Right line position:', this.rightLine.style.left);
    console.log('🔢 Calculated Left X:', canvasRect.left - (this.leftMultiplier * canvasRect.width));
    console.log('🔢 Calculated Right X:', canvasRect.left + (this.rightMultiplier * canvasRect.width));
    console.log('🔍 Container display:', this.container.style.display);
    console.log('🔍 Container in DOM:', document.body.contains(this.container));
  }

  hide() {
    this.visible = false;
    this.container.style.display = 'none';
    console.log('🎯 Debug Overlay: OFF');
  }

  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
