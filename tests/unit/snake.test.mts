import { describe, expect, it } from 'vitest';
import {
  createState,
  placeFood,
  setNextDirection,
  step,
} from '../../src/lib/snake.mts';

describe('snake game logic', () => {
  it('moves the snake forward without growing', () => {
    const state = createState({
      gridWidth: 5,
      gridHeight: 5,
      snake: [
        { x: 2, y: 2 },
        { x: 1, y: 2 },
      ],
      direction: 'right',
      food: { x: 4, y: 4 },
      rngSeed: 1,
    });

    const next = step(state);
    expect(next.snake[0]).toEqual({ x: 3, y: 2 });
    expect(next.snake.length).toBe(2);
    expect(next.score).toBe(0);
    expect(next.gameOver).toBe(false);
  });

  it('grows and scores when eating food', () => {
    const state = createState({
      gridWidth: 5,
      gridHeight: 5,
      snake: [
        { x: 2, y: 2 },
        { x: 1, y: 2 },
      ],
      direction: 'right',
      food: { x: 3, y: 2 },
      rngSeed: 1,
    });

    const next = step(state);
    expect(next.snake[0]).toEqual({ x: 3, y: 2 });
    expect(next.snake.length).toBe(3);
    expect(next.score).toBe(1);
  });

  it('ends the game on wall collision', () => {
    const state = createState({
      gridWidth: 4,
      gridHeight: 4,
      snake: [
        { x: 3, y: 1 },
        { x: 2, y: 1 },
      ],
      direction: 'right',
      food: { x: 0, y: 0 },
      rngSeed: 1,
    });

    const next = step(state);
    expect(next.gameOver).toBe(true);
  });

  it('avoids reversing direction', () => {
    const state = createState({
      gridWidth: 6,
      gridHeight: 6,
      snake: [
        { x: 3, y: 3 },
        { x: 2, y: 3 },
      ],
      direction: 'right',
      food: { x: 5, y: 5 },
      rngSeed: 1,
    });

    const next = setNextDirection(state, 'left');
    expect(next.nextDirection).toBe('right');
  });

  it('places food on a free cell', () => {
    const state = createState({
      gridWidth: 2,
      gridHeight: 2,
      snake: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
      ],
      direction: 'right',
      food: { x: 1, y: 1 },
      rngSeed: 42,
    });

    const placed = placeFood(state);
    expect(placed.state.food).toEqual({ x: 1, y: 1 });
  });
});
