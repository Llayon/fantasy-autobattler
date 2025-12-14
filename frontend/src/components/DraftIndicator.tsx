/**
 * DraftIndicator component for Fantasy Autobattler.
 * Shows draft status and provides clear draft functionality.
 * 
 * @fileoverview Component for managing team draft autosave status.
 */

'use client';

import { useCallback } from 'react';
import { useTeamStore } from '@/store/teamStore';

// =============================================================================
// TYPES
// =============================================================================

/**
 * DraftIndicator component props.
 */
interface DraftIndicatorProps {
  /** Custom CSS classes */
  className?: string;
  /** Display variant */
  variant?: 'full' | 'compact';
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * DraftIndicator component for showing autosave status and draft management.
 * Displays when a draft has been restored and provides clear draft functionality.
 * 
 * @param props - Component props
 * @returns Draft indicator component
 * @example
 * // Full variant with clear button
 * <DraftIndicator variant="full" />
 * 
 * // Compact variant for headers
 * <DraftIndicator variant="compact" />
 */
export function DraftIndicator({ 
  className = '', 
  variant = 'full' 
}: DraftIndicatorProps) {
  const draftRestored = useTeamStore(state => state.draftRestored);
  const currentTeam = useTeamStore(state => state.currentTeam);
  const clearDraft = useTeamStore(state => state.clearDraft);

  /**
   * Handle clearing the draft.
   */
  const handleClearDraft = useCallback(() => {
    if (window.confirm('Clear current draft? This will reset your team and remove autosave.')) {
      clearDraft();
    }
  }, [clearDraft]);

  // Don't show if no draft or no units
  if (!draftRestored && currentTeam.units.length === 0) {
    return null;
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 text-xs ${className}`}>
        {draftRestored && (
          <div className="flex items-center gap-1 text-blue-400">
            <span>💾</span>
            <span>Draft restored</span>
          </div>
        )}
        {currentTeam.units.length > 0 && (
          <div className="flex items-center gap-1 text-green-400">
            <span>🔄</span>
            <span>Autosaving</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-blue-900/30 border border-blue-500 rounded-lg p-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-blue-400">💾</span>
          <div>
            <div className="text-blue-300 font-medium text-sm">
              {draftRestored ? 'Draft Restored' : 'Auto-saving Draft'}
            </div>
            <div className="text-blue-200 text-xs">
              {draftRestored 
                ? 'Your previous team has been restored from autosave'
                : 'Your team is automatically saved as you build it'
              }
            </div>
          </div>
        </div>
        
        {currentTeam.units.length > 0 && (
          <button
            onClick={handleClearDraft}
            className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded transition-colors"
            title="Clear draft and reset team"
          >
            Clear Draft
          </button>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export type { DraftIndicatorProps };