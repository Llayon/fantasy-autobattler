/**
 * Generic grid navigation hook.
 * @fileoverview Provides keyboard navigation for grid-based interfaces.
 */

import { useState, useCallback, useEffect } from 'react';
import { Position, GridConfig, DEFAULT_GRID_CONFIG } from '../types';

/**
 * Options for grid navigation hook.
 */
export interface UseGridNavigationOptions {
  /** Grid configuration */
  config?: GridConfig;
  /** Initial selected position */
  initialPosition?: Position;
  /** Callback when position changes */
  onPositionChange?: (position: Position) => void;
  /** Whether navigation is enabled */
  enabled?: boolean;
  /** Whether to wrap around edges */
  wrap?: boolean;
}

/**
 * Return type for grid navigation hook.
 */
export interface UseGridNavigationReturn {
  /** Currently selected position */
  position: Position;
  /** Set position directly */
  setPosition: (position: Position) => void;
  /** Move in a direction */
  move: (direction: 'up' | 'down' | 'left' | 'right') => void;
  /** Check if position is valid */
  isValidPosition: (position: Position) => boolean;
}

/**
 * Hook for keyboard navigation on a grid.
 * Handles arrow key navigation with optional wrapping.
 * 
 * @param options - Navigation options
 * @returns Navigation state and controls
 * @example
 * const { position, move } = useGridNavigation({
 *   config: { width: 8, height: 10, playerRows: [0, 1], enemyRows: [8, 9] },
 *   onPositionChange: (pos) => console.log('Moved to', pos),
 * });
 */
export function useGridNavigation(
  options: UseGridNavigationOptions = {}
): UseGridNavigationReturn {
  const {
    config = DEFAULT_GRID_CONFIG,
    initialPosition = { x: 0, y: 0 },
    onPositionChange,
    enabled = true,
    wrap = false,
  } = options;

  const [position, setPositionState] = useState<Position>(initialPosition);

  /**
   * Check if a position is within grid bounds.
   */
  const isValidPosition = useCallback(
    (pos: Position): boolean => {
      return (
        pos.x >= 0 &&
        pos.x < config.width &&
        pos.y >= 0 &&
        pos.y < config.height
      );
    },
    [config.width, config.height]
  );

  /**
   * Set position with validation.
   */
  const setPosition = useCallback(
    (newPosition: Position) => {
      if (isValidPosition(newPosition)) {
        setPositionState(newPosition);
        onPositionChange?.(newPosition);
      }
    },
    [isValidPosition, onPositionChange]
  );

  /**
   * Move in a direction.
   */
  const move = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right') => {
      if (!enabled) return;

      setPositionState((current) => {
        let newX = current.x;
        let newY = current.y;

        switch (direction) {
          case 'up':
            newY = current.y - 1;
            break;
          case 'down':
            newY = current.y + 1;
            break;
          case 'left':
            newX = current.x - 1;
            break;
          case 'right':
            newX = current.x + 1;
            break;
        }

        // Handle wrapping
        if (wrap) {
          if (newX < 0) newX = config.width - 1;
          if (newX >= config.width) newX = 0;
          if (newY < 0) newY = config.height - 1;
          if (newY >= config.height) newY = 0;
        }

        const newPosition = { x: newX, y: newY };

        if (isValidPosition(newPosition)) {
          onPositionChange?.(newPosition);
          return newPosition;
        }

        return current;
      });
    },
    [enabled, wrap, config.width, config.height, isValidPosition, onPositionChange]
  );

  // Keyboard event handler
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          move('up');
          break;
        case 'ArrowDown':
          event.preventDefault();
          move('down');
          break;
        case 'ArrowLeft':
          event.preventDefault();
          move('left');
          break;
        case 'ArrowRight':
          event.preventDefault();
          move('right');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, move]);

  return {
    position,
    setPosition,
    move,
    isValidPosition,
  };
}
