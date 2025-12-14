/**
 * UndoRedoControls component for Fantasy Autobattler.
 * Provides undo/redo functionality with keyboard shortcuts.
 * 
 * @fileoverview Component for undo/redo controls with keyboard support.
 */

'use client';

import { useEffect, useCallback } from 'react';
import { useTeamStore } from '@/store/teamStore';

// =============================================================================
// TYPES
// =============================================================================

/**
 * UndoRedoControls component props.
 */
interface UndoRedoControlsProps {
  /** Custom CSS classes */
  className?: string;
  /** Display variant */
  variant?: 'buttons' | 'compact';
  /** Show keyboard shortcuts in tooltips */
  showShortcuts?: boolean;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * UndoRedoControls component for team building undo/redo functionality.
 * Supports keyboard shortcuts: Ctrl+Z (undo), Ctrl+Shift+Z (redo).
 * 
 * @param props - Component props
 * @returns Undo/redo controls component
 * @example
 * // Full buttons with shortcuts
 * <UndoRedoControls variant="buttons" showShortcuts />
 * 
 * // Compact icons only
 * <UndoRedoControls variant="compact" />
 */
export function UndoRedoControls({ 
  className = '', 
  variant = 'buttons',
  showShortcuts = true
}: UndoRedoControlsProps) {
  // Team store selectors and actions
  const canUndo = useTeamStore(state => state.canUndo);
  const canRedo = useTeamStore(state => state.canRedo);
  const { undo, redo } = useTeamStore();

  /**
   * Handle keyboard shortcuts for undo/redo.
   */
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Check for Ctrl+Z (undo) or Ctrl+Shift+Z (redo)
    if (event.ctrlKey || event.metaKey) {
      if (event.key === 'z' || event.key === 'Z') {
        event.preventDefault();
        
        if (event.shiftKey) {
          // Ctrl+Shift+Z = Redo
          if (canRedo) {
            redo();
          }
        } else {
          // Ctrl+Z = Undo
          if (canUndo) {
            undo();
          }
        }
      }
    }
  }, [canUndo, canRedo, undo, redo]);

  /**
   * Set up keyboard event listeners.
   */
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  /**
   * Handle undo button click.
   */
  const handleUndo = useCallback(() => {
    if (canUndo) {
      undo();
    }
  }, [canUndo, undo]);

  /**
   * Handle redo button click.
   */
  const handleRedo = useCallback(() => {
    if (canRedo) {
      redo();
    }
  }, [canRedo, redo]);

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1 ${className}`} role="group" aria-label="Undo and Redo controls">
        {/* Undo button */}
        <button
          type="button"
          onClick={handleUndo}
          disabled={!canUndo}
          aria-label={showShortcuts ? 'Undo last action (Ctrl+Z)' : 'Undo last action'}
          title={showShortcuts ? 'Undo (Ctrl+Z)' : 'Undo'}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed transition-colors rounded hover:bg-gray-700 disabled:hover:bg-transparent focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-gray-900"
        >
          <span className="text-sm" aria-hidden="true">↶</span>
        </button>
        
        {/* Redo button */}
        <button
          type="button"
          onClick={handleRedo}
          disabled={!canRedo}
          aria-label={showShortcuts ? 'Redo last undone action (Ctrl+Shift+Z)' : 'Redo last undone action'}
          title={showShortcuts ? 'Redo (Ctrl+Shift+Z)' : 'Redo'}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed transition-colors rounded hover:bg-gray-700 disabled:hover:bg-transparent focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-gray-900"
        >
          <span className="text-sm" aria-hidden="true">↷</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`} role="group" aria-label="Undo and Redo controls">
      {/* Undo button */}
      <button
        type="button"
        onClick={handleUndo}
        disabled={!canUndo}
        aria-label={showShortcuts ? 'Undo last action (Ctrl+Z)' : 'Undo last action'}
        title={showShortcuts ? 'Undo (Ctrl+Z)' : 'Undo'}
        className="min-w-[80px] min-h-[44px] px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white disabled:text-gray-500 disabled:cursor-not-allowed transition-colors rounded text-sm font-medium flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-gray-900"
      >
        <span aria-hidden="true">↶</span>
        <span>Undo</span>
      </button>
      
      {/* Redo button */}
      <button
        type="button"
        onClick={handleRedo}
        disabled={!canRedo}
        aria-label={showShortcuts ? 'Redo last undone action (Ctrl+Shift+Z)' : 'Redo last undone action'}
        title={showShortcuts ? 'Redo (Ctrl+Shift+Z)' : 'Redo'}
        className="min-w-[80px] min-h-[44px] px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white disabled:text-gray-500 disabled:cursor-not-allowed transition-colors rounded text-sm font-medium flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-gray-900"
      >
        <span aria-hidden="true">↷</span>
        <span>Redo</span>
      </button>
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export type { UndoRedoControlsProps };