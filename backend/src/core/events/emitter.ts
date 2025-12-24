/**
 * Battle Event Emitter for Core Library.
 * Provides a simple event emitter interface for battle events.
 *
 * @fileoverview Framework-agnostic event emitter for battle simulation.
 */

import { BattleEvent, BattleEventType } from '../types/event.types';

// =============================================================================
// EVENT EMITTER INTERFACE
// =============================================================================

/**
 * Event handler function type.
 *
 * @template T - Event type
 */
export type EventHandler<T extends BattleEvent = BattleEvent> = (event: T) => void;

/**
 * Battle event emitter interface.
 * Allows subscribing to and emitting battle events.
 */
export interface BattleEventEmitter {
  /**
   * Subscribe to a specific event type.
   *
   * @param eventType - Type of event to subscribe to
   * @param handler - Handler function to call when event occurs
   * @returns Unsubscribe function
   */
  on(eventType: BattleEventType, handler: EventHandler): () => void;

  /**
   * Subscribe to all events.
   *
   * @param handler - Handler function to call for any event
   * @returns Unsubscribe function
   */
  onAny(handler: EventHandler): () => void;

  /**
   * Emit a battle event.
   *
   * @param event - Event to emit
   */
  emit(event: BattleEvent): void;

  /**
   * Remove all event handlers.
   */
  clear(): void;
}

// =============================================================================
// EVENT EMITTER IMPLEMENTATION
// =============================================================================

/**
 * Create a new battle event emitter.
 *
 * @returns New BattleEventEmitter instance
 * @example
 * const emitter = createEventEmitter();
 *
 * // Subscribe to move events
 * const unsubscribe = emitter.on('move', (event) => {
 *   console.log(`Unit ${event.actorId} moved`);
 * });
 *
 * // Emit an event
 * emitter.emit({ type: 'move', round: 1, actorId: 'unit_1', ... });
 *
 * // Unsubscribe
 * unsubscribe();
 */
export function createEventEmitter(): BattleEventEmitter {
  const handlers = new Map<BattleEventType, Set<EventHandler>>();
  const anyHandlers = new Set<EventHandler>();

  return {
    on(eventType: BattleEventType, handler: EventHandler): () => void {
      if (!handlers.has(eventType)) {
        handlers.set(eventType, new Set());
      }
      const typeHandlers = handlers.get(eventType);
      if (typeHandlers) {
        typeHandlers.add(handler);
      }

      return () => {
        const typeHandlers = handlers.get(eventType);
        if (typeHandlers) {
          typeHandlers.delete(handler);
        }
      };
    },

    onAny(handler: EventHandler): () => void {
      anyHandlers.add(handler);

      return () => {
        anyHandlers.delete(handler);
      };
    },

    emit(event: BattleEvent): void {
      // Call type-specific handlers
      const typeHandlers = handlers.get(event.type);
      if (typeHandlers) {
        typeHandlers.forEach((handler) => handler(event));
      }

      // Call any-event handlers
      anyHandlers.forEach((handler) => handler(event));
    },

    clear(): void {
      handlers.clear();
      anyHandlers.clear();
    },
  };
}

// =============================================================================
// EVENT COLLECTOR
// =============================================================================

/**
 * Create an event collector that accumulates events.
 * Useful for collecting all events during battle simulation.
 *
 * @returns Object with emitter and collected events array
 * @example
 * const { emitter, events } = createEventCollector();
 *
 * // Use emitter during battle simulation
 * emitter.emit(moveEvent);
 * emitter.emit(attackEvent);
 *
 * // Get all collected events
 * console.log(events); // [moveEvent, attackEvent]
 */
export function createEventCollector(): {
  emitter: BattleEventEmitter;
  events: BattleEvent[];
} {
  const events: BattleEvent[] = [];
  const emitter = createEventEmitter();

  emitter.onAny((event) => {
    events.push(event);
  });

  return { emitter, events };
}
