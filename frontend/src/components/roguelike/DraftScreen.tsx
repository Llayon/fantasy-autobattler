/**
 * DraftScreen component for Roguelike Mode.
 * Displays draft options and handles card selection.
 *
 * @fileoverview Draft screen with multi-select for initial draft and single-select for post-battle.
 */

'use client';

import { memo, useCallback, useMemo } from 'react';
import { DraftCard, DraftCardData } from './DraftCard';

// =============================================================================
// TYPES
// =============================================================================

/**
 * DraftScreen component props.
 */
interface DraftScreenProps {
  /** Available draft options */
  options: DraftCardData[];
  /** Selected card instance IDs */
  selected: string[];
  /** Whether this is the initial draft (pick 3) or post-battle (pick 1) */
  isInitial: boolean;
  /** Required number of picks */
  requiredPicks: number;
  /** Remaining cards in deck */
  remainingInDeck: number;
  /** Callback when card selection changes */
  onSelectionChange: (instanceId: string) => void;
  /** Callback when draft is submitted */
  onSubmit: () => void;
  /** Whether submission is in progress */
  isSubmitting?: boolean;
  /** Whether draft is disabled */
  disabled?: boolean;
  /** Use Russian language */
  useRussian?: boolean;
  /** Custom CSS classes */
  className?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const LABELS = {
  en: {
    initialTitle: 'Initial Draft',
    postBattleTitle: 'Post-Battle Draft',
    initialSubtitle: 'Choose 3 cards to add to your hand',
    postBattleSubtitle: 'Choose 1 card to add to your hand',
    selected: 'Selected',
    remaining: 'Remaining in deck',
    submit: 'Confirm Selection',
    submitting: 'Confirming...',
    selectMore: 'Select {count} more',
  },
  ru: {
    initialTitle: 'Начальный драфт',
    postBattleTitle: 'Драфт после боя',
    initialSubtitle: 'Выберите 3 карты для добавления в руку',
    postBattleSubtitle: 'Выберите 1 карту для добавления в руку',
    selected: 'Выбрано',
    remaining: 'Осталось в колоде',
    submit: 'Подтвердить выбор',
    submitting: 'Подтверждение...',
    selectMore: 'Выберите ещё {count}',
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get localized labels.
 */
function getLabels(useRussian: boolean) {
  return useRussian ? LABELS.ru : LABELS.en;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * DraftScreen component for draft card selection.
 * Supports initial draft (pick 3 from 5) and post-battle draft (pick 1 from 3).
 *
 * @example
 * <DraftScreen
 *   options={draftOptions}
 *   selected={selectedCards}
 *   isInitial={true}
 *   requiredPicks={3}
 *   remainingInDeck={9}
 *   onSelectionChange={(id) => toggleSelection(id)}
 *   onSubmit={() => submitDraft()}
 * />
 */
const DraftScreen = memo(function DraftScreen({
  options,
  selected,
  isInitial,
  requiredPicks,
  remainingInDeck,
  onSelectionChange,
  onSubmit,
  isSubmitting = false,
  disabled = false,
  useRussian = false,
  className = '',
}: DraftScreenProps) {
  const labels = getLabels(useRussian);
  const title = isInitial ? labels.initialTitle : labels.postBattleTitle;
  const subtitle = isInitial ? labels.initialSubtitle : labels.postBattleSubtitle;

  const remainingPicks = requiredPicks - selected.length;
  const canSubmit = remainingPicks === 0 && !isSubmitting && !disabled;

  const handleCardClick = useCallback(
    (instanceId: string) => {
      if (disabled || isSubmitting) return;

      const isSelected = selected.includes(instanceId);

      // If already selected, allow deselection
      if (isSelected) {
        onSelectionChange(instanceId);
        return;
      }

      // If not at max selections, allow selection
      if (selected.length < requiredPicks) {
        onSelectionChange(instanceId);
      }
    },
    [disabled, isSubmitting, selected, requiredPicks, onSelectionChange]
  );

  const handleSubmit = useCallback(() => {
    if (canSubmit) {
      onSubmit();
    }
  }, [canSubmit, onSubmit]);

  const selectMoreText = useMemo(() => {
    return labels.selectMore.replace('{count}', String(remainingPicks));
  }, [labels.selectMore, remainingPicks]);

  return (
    <div className={`space-y-6 ${className}`} role="region" aria-label={title}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <p className="text-gray-400">{subtitle}</p>
      </div>

      {/* Status Bar */}
      <div className="flex justify-between items-center px-4 py-3 bg-gray-800/50 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="text-gray-400">{labels.selected}: </span>
            <span className="text-yellow-400 font-bold">
              {selected.length}/{requiredPicks}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-gray-400">{labels.remaining}: </span>
            <span className="text-blue-400 font-bold">{remainingInDeck}</span>
          </div>
        </div>

        {remainingPicks > 0 && (
          <div className="text-sm text-orange-400">{selectMoreText}</div>
        )}
      </div>

      {/* Draft Cards Grid */}
      <div
        className={`grid gap-4 ${
          options.length <= 3
            ? 'grid-cols-1 md:grid-cols-3'
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'
        }`}
        role="listbox"
        aria-label={title}
        aria-multiselectable={requiredPicks > 1}
      >
        {options.map((card) => (
          <DraftCard
            key={card.instanceId}
            card={card}
            selected={selected.includes(card.instanceId)}
            onClick={() => handleCardClick(card.instanceId)}
            disabled={
              disabled ||
              isSubmitting ||
              (!selected.includes(card.instanceId) && selected.length >= requiredPicks)
            }
            useRussian={useRussian}
          />
        ))}
      </div>

      {/* Submit Button */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          aria-label={isSubmitting ? labels.submitting : labels.submit}
          className={`
            px-8 py-3 rounded-lg font-bold text-lg transition-all duration-200
            ${canSubmit
              ? 'bg-yellow-500 text-black hover:bg-yellow-400 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-gray-900'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {isSubmitting ? labels.submitting : labels.submit}
        </button>
      </div>
    </div>
  );
});

// =============================================================================
// EXPORTS
// =============================================================================

export { DraftScreen };
export type { DraftScreenProps };
