export type Direction = 'up' | 'down' | 'left' | 'right';

export type Point = {
  x: number;
  y: number;
};

export type GameState = {
  gridWidth: number;
  gridHeight: number;
  snake: Point[];
  direction: Direction;
  nextDirection: Direction;
  food: Point;
  score: number;
  gameOver: boolean;
  rngSeed: number;
};

export type GameInit = Partial<
  Pick<
    GameState,
    'snake' | 'direction' | 'food' | 'score' | 'gameOver' | 'rngSeed'
  >
> & {
  gridWidth: number;
  gridHeight: number;
};

const RNG_MULTIPLIER = 1664525;
const RNG_INCREMENT = 1013904223;
const RNG_MODULUS = 2 ** 32;

const DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right'];

const directionVectors: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export function createState(init: GameInit): GameState {
  const gridWidth = init.gridWidth;
  const gridHeight = init.gridHeight;
  const rngSeed = init.rngSeed ?? Date.now() >>> 0;
  const direction = init.direction ?? 'right';
  const snake = init.snake ?? createDefaultSnake(gridWidth, gridHeight);
  const score = init.score ?? 0;
  const gameOver = init.gameOver ?? false;
  const base: GameState = {
    gridWidth,
    gridHeight,
    snake,
    direction,
    nextDirection: direction,
    food: init.food ?? { x: 0, y: 0 },
    score,
    gameOver,
    rngSeed,
  };

  return init.food ? base : placeFood(base).state;
}

export function setNextDirection(state: GameState, next: Direction): GameState {
  if (isOpposite(state.direction, next)) {
    return state;
  }
  return { ...state, nextDirection: next };
}

export function step(state: GameState): GameState {
  if (state.gameOver) {
    return state;
  }

  const direction = state.nextDirection;
  const vector = directionVectors[direction];
  const head = state.snake[0];
  const nextHead = { x: head.x + vector.x, y: head.y + vector.y };

  if (
    nextHead.x < 0 ||
    nextHead.x >= state.gridWidth ||
    nextHead.y < 0 ||
    nextHead.y >= state.gridHeight
  ) {
    return { ...state, gameOver: true, direction };
  }

  const willEat = isSamePoint(nextHead, state.food);
  const nextSnake = [nextHead, ...state.snake];
  if (!willEat) {
    nextSnake.pop();
  }

  if (isCollision(nextHead, nextSnake.slice(1))) {
    return { ...state, gameOver: true, direction };
  }

  let nextState: GameState = {
    ...state,
    snake: nextSnake,
    direction,
    nextDirection: direction,
    score: willEat ? state.score + 1 : state.score,
  };

  if (willEat) {
    const placed = placeFood(nextState);
    nextState = placed.state;
  }

  return nextState;
}

export function chooseAutoDirection(state: GameState): Direction {
  const safeMoves = DIRECTIONS.filter((dir) => isSafeMove(state, dir));
  if (safeMoves.length === 0) {
    const fallback = DIRECTIONS.find(
      (dir) => !isOpposite(state.direction, dir)
    );
    return fallback ?? state.direction;
  }

  const direct = getDirectFoodMove(state, safeMoves);
  if (direct) {
    return direct;
  }

  const scored = safeMoves
    .map((dir) => scoreMove(state, dir))
    .filter((entry) => entry !== null);
  if (scored.length === 0) {
    return safeMoves[0];
  }
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.dir ?? safeMoves[0];
}

export function placeFood(state: GameState): {
  state: GameState;
  placed: boolean;
} {
  return placeFoodAvoiding(state, new Set());
}

export function placeFoodAvoiding(
  state: GameState,
  forbidden: Set<string>
): {
  state: GameState;
  placed: boolean;
} {
  const occupied = new Set(
    state.snake.map((segment) => `${segment.x},${segment.y}`)
  );
  const available: Point[] = [];
  for (let y = 0; y < state.gridHeight; y += 1) {
    for (let x = 0; x < state.gridWidth; x += 1) {
      const key = `${x},${y}`;
      if (!occupied.has(key) && !forbidden.has(key)) {
        available.push({ x, y });
      }
    }
  }

  if (available.length === 0) {
    return { state, placed: false };
  }

  const { seed, value } = nextRandom(state.rngSeed);
  const index = Math.floor(value * available.length);
  const food = available[index] ?? available[0];

  return {
    state: {
      ...state,
      food,
      rngSeed: seed,
    },
    placed: true,
  };
}

export function nextRandom(seed: number): { seed: number; value: number } {
  const nextSeed = (seed * RNG_MULTIPLIER + RNG_INCREMENT) % RNG_MODULUS;
  return { seed: nextSeed, value: nextSeed / RNG_MODULUS };
}

function createDefaultSnake(gridWidth: number, gridHeight: number): Point[] {
  const startX = Math.floor(gridWidth / 2);
  const startY = Math.floor(gridHeight / 2);
  return [
    { x: startX, y: startY },
    { x: startX - 1, y: startY },
    { x: startX - 2, y: startY },
  ];
}

function isOpposite(a: Direction, b: Direction): boolean {
  return (
    (a === 'up' && b === 'down') ||
    (a === 'down' && b === 'up') ||
    (a === 'left' && b === 'right') ||
    (a === 'right' && b === 'left')
  );
}

function isSamePoint(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}

function isCollision(head: Point, body: Point[]): boolean {
  return body.some((segment) => isSamePoint(segment, head));
}

function isSafeMove(state: GameState, direction: Direction): boolean {
  if (isOpposite(state.direction, direction)) {
    return false;
  }
  const vector = directionVectors[direction];
  const head = state.snake[0];
  const nextHead = { x: head.x + vector.x, y: head.y + vector.y };
  if (
    nextHead.x < 0 ||
    nextHead.x >= state.gridWidth ||
    nextHead.y < 0 ||
    nextHead.y >= state.gridHeight
  ) {
    return false;
  }

  const willEat = isSamePoint(nextHead, state.food);
  const nextSnake = [nextHead, ...state.snake];
  if (!willEat) {
    nextSnake.pop();
  }

  return !isCollision(nextHead, nextSnake.slice(1));
}

function simulateMove(
  state: GameState,
  direction: Direction
): {
  head: Point;
  body: Point[];
  willEat: boolean;
} {
  const vector = directionVectors[direction];
  const head = state.snake[0];
  const nextHead = { x: head.x + vector.x, y: head.y + vector.y };
  const willEat = isSamePoint(nextHead, state.food);
  const nextSnake = [nextHead, ...state.snake];
  if (!willEat) {
    nextSnake.pop();
  }
  return { head: nextHead, body: nextSnake, willEat };
}

function buildBlockedSet(body: Point[], allowTail: boolean): Set<string> {
  const blocked = new Set<string>();
  const lastIndex = body.length - 1;
  body.forEach((segment, index) => {
    if (allowTail && index === lastIndex) {
      return;
    }
    blocked.add(`${segment.x},${segment.y}`);
  });
  return blocked;
}

function bfsDistance(
  start: Point,
  target: Point,
  width: number,
  height: number,
  blocked: Set<string>
): number | null {
  const key = (p: Point) => `${p.x},${p.y}`;
  if (blocked.has(key(start))) {
    return null;
  }
  const queue: Array<{ point: Point; dist: number }> = [
    { point: start, dist: 0 },
  ];
  const visited = new Set<string>([key(start)]);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    const { point, dist } = current;
    if (point.x === target.x && point.y === target.y) {
      return dist;
    }
    for (const dir of DIRECTIONS) {
      const vector = directionVectors[dir];
      const next = { x: point.x + vector.x, y: point.y + vector.y };
      if (next.x < 0 || next.x >= width || next.y < 0 || next.y >= height) {
        continue;
      }
      const nextKey = key(next);
      if (blocked.has(nextKey) || visited.has(nextKey)) {
        continue;
      }
      visited.add(nextKey);
      queue.push({ point: next, dist: dist + 1 });
    }
  }

  return null;
}

function canReachTailAfterMove(
  state: GameState,
  direction: Direction
): boolean {
  const { head, body, willEat } = simulateMove(state, direction);
  const tail = body[body.length - 1];
  const blocked = buildBlockedSet(body, !willEat);
  const distance = bfsDistance(
    head,
    tail,
    state.gridWidth,
    state.gridHeight,
    blocked
  );
  return distance !== null;
}

function scoreMove(
  state: GameState,
  direction: Direction
): { dir: Direction; score: number } | null {
  const { head, body, willEat } = simulateMove(state, direction);
  const blocked = buildBlockedSet(body, !willEat);
  const canReachTail = canReachTailAfterMove(state, direction);
  if (!canReachTail) {
    return null;
  }

  const freeArea = countReachableCells(
    head,
    state.gridWidth,
    state.gridHeight,
    blocked
  );
  const distanceToFood = bfsDistance(
    head,
    state.food,
    state.gridWidth,
    state.gridHeight,
    blocked
  );

  const length = state.snake.length;
  const aggression = length < 8 ? 4 : length < 16 ? 2 : 1;
  const distanceScore =
    distanceToFood === null
      ? -2000
      : Math.max(0, 900 * aggression - distanceToFood * 14 * aggression);
  const eatBonus = willEat ? 500 * aggression : 0;
  const score = freeArea * (length < 10 ? 1 : 3) + distanceScore + eatBonus;

  return { dir: direction, score };
}

function countReachableCells(
  start: Point,
  width: number,
  height: number,
  blocked: Set<string>
): number {
  const key = (p: Point) => `${p.x},${p.y}`;
  if (blocked.has(key(start))) {
    return 0;
  }
  const queue: Point[] = [start];
  const visited = new Set<string>([key(start)]);

  while (queue.length > 0) {
    const point = queue.shift();
    if (!point) break;
    for (const dir of DIRECTIONS) {
      const vector = directionVectors[dir];
      const next = { x: point.x + vector.x, y: point.y + vector.y };
      if (next.x < 0 || next.x >= width || next.y < 0 || next.y >= height) {
        continue;
      }
      const nextKey = key(next);
      if (blocked.has(nextKey) || visited.has(nextKey)) {
        continue;
      }
      visited.add(nextKey);
      queue.push(next);
    }
  }

  return visited.size;
}

function getDirectFoodMove(
  state: GameState,
  safeMoves: Direction[]
): Direction | null {
  const head = state.snake[0];
  const dx = state.food.x - head.x;
  const dy = state.food.y - head.y;

  const preferred: Direction[] = [];
  if (dx > 0) preferred.push('right');
  if (dx < 0) preferred.push('left');
  if (dy > 0) preferred.push('down');
  if (dy < 0) preferred.push('up');

  for (const dir of preferred) {
    if (safeMoves.includes(dir)) {
      return dir;
    }
  }

  return null;
}
