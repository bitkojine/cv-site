import {
  chooseAutoDirection,
  createState,
  placeFood,
  placeFoodAvoiding,
  setNextDirection,
  step,
} from '../lib/snake.mts';

const wrapper = document.querySelector('.snake-background');
const canvas = wrapper?.querySelector('.snake-canvas');
if (
  !(wrapper instanceof HTMLElement) ||
  !(canvas instanceof HTMLCanvasElement)
) {
  throw new Error('Snake background not initialized');
}

const tickMs = Number(wrapper.dataset.tickMs || 120);
const ctx = canvas.getContext('2d');
if (!ctx) {
  throw new Error('Canvas context unavailable');
}

let gridWidth = 32;
let gridHeight = 20;
let cellWidth = 16;
let cellHeight = 16;
let state = createState({ gridWidth, gridHeight });
let offsetX = 0;
let offsetY = 0;
let restartAt = 0;
let lastTick = 0;

const getThemeColors = () => {
  const styles = getComputedStyle(document.documentElement);
  return {
    grid: styles.getPropertyValue('--snake-grid').trim() || 'rgba(0,0,0,0.08)',
    snake: styles.getPropertyValue('--snake-body').trim() || '#111',
    head: styles.getPropertyValue('--snake-head').trim() || '#111',
    food: styles.getPropertyValue('--snake-food').trim() || '#111',
  };
};

const resize = () => {
  const { innerWidth, innerHeight, devicePixelRatio } = window;
  const ratio = Math.max(1, Math.min(2, devicePixelRatio || 1));
  canvas.width = Math.floor(innerWidth * ratio);
  canvas.height = Math.floor(innerHeight * ratio);
  canvas.style.width = `${innerWidth}px`;
  canvas.style.height = `${innerHeight}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  const targetCell = Math.max(14, Math.min(20, Math.floor(innerWidth / 40)));
  const nextGridWidth = Math.max(12, Math.floor(innerWidth / targetCell));
  const nextGridHeight = Math.max(12, Math.floor(innerHeight / targetCell));
  const gridChanged =
    nextGridWidth !== gridWidth || nextGridHeight !== gridHeight;
  gridWidth = nextGridWidth;
  gridHeight = nextGridHeight;

  cellWidth = innerWidth / gridWidth;
  cellHeight = innerHeight / gridHeight;
  offsetX = 0;
  offsetY = 0;

  if (gridChanged) {
    state = createState({
      gridWidth,
      gridHeight,
      rngSeed: state.rngSeed,
    });
  }
  ensureFoodVisible();
};

const draw = () => {
  const colors = getThemeColors();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(offsetX, offsetY);

  ctx.strokeStyle = colors.grid;
  ctx.lineWidth = 1;
  for (let x = 0; x <= gridWidth; x += 1) {
    const px = x * cellWidth;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, gridHeight * cellHeight);
    ctx.stroke();
  }
  for (let y = 0; y <= gridHeight; y += 1) {
    const py = y * cellHeight;
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(gridWidth * cellWidth, py);
    ctx.stroke();
  }

  state.snake.forEach((segment, index) => {
    ctx.fillStyle = index === 0 ? colors.head : colors.snake;
    ctx.fillRect(
      segment.x * cellWidth + 1,
      segment.y * cellHeight + 1,
      cellWidth - 2,
      cellHeight - 2
    );
  });

  ctx.fillStyle = colors.food;
  ctx.fillRect(
    state.food.x * cellWidth + 3,
    state.food.y * cellHeight + 3,
    cellWidth - 6,
    cellHeight - 6
  );

  ctx.restore();
};

const toCellRange = (rect: DOMRect) => {
  const startX = Math.floor((rect.left - offsetX) / cellWidth);
  const endX = Math.ceil((rect.right - offsetX) / cellWidth) - 1;
  const startY = Math.floor((rect.top - offsetY) / cellHeight);
  const endY = Math.ceil((rect.bottom - offsetY) / cellHeight) - 1;
  return {
    startX: Math.max(0, startX),
    endX: Math.min(gridWidth - 1, endX),
    startY: Math.max(0, startY),
    endY: Math.min(gridHeight - 1, endY),
  };
};

const computeForbiddenCells = () => {
  const forbidden = new Set<string>();
  const elements = [
    document.querySelector('main'),
    document.querySelector('.controls-dock'),
  ].filter((el): el is HTMLElement => el instanceof HTMLElement);

  elements.forEach((element) => {
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const { startX, endX, startY, endY } = toCellRange(rect);
    for (let y = startY; y <= endY; y += 1) {
      for (let x = startX; x <= endX; x += 1) {
        forbidden.add(`${x},${y}`);
      }
    }
  });
  return forbidden;
};

const ensureFoodVisible = () => {
  const forbidden = computeForbiddenCells();
  if (forbidden.size === 0) return;
  const foodKey = `${state.food.x},${state.food.y}`;
  if (!forbidden.has(foodKey)) return;
  const placed = placeFoodAvoiding(state, forbidden);
  state = placed.placed ? placed.state : placeFood(state).state;
};

const tick = (now: number) => {
  if (!lastTick) lastTick = now;
  if (document.hidden) {
    lastTick = now;
    requestAnimationFrame(tick);
    return;
  }

  if (now - lastTick >= tickMs) {
    lastTick = now;
    if (state.gameOver) {
      if (!restartAt) {
        restartAt = now + 800;
      }
      if (now >= restartAt) {
        state = createState({
          gridWidth,
          gridHeight,
          rngSeed: state.rngSeed,
        });
        restartAt = 0;
      }
    } else {
      const autoDir = chooseAutoDirection(state);
      state = setNextDirection(state, autoDir);
      state = step(state);
      ensureFoodVisible();
    }
    draw();
  }
  requestAnimationFrame(tick);
};

window.addEventListener('resize', resize, { passive: true });

resize();
draw();
requestAnimationFrame(tick);
