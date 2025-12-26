/**
 * SpellTimingPanel component for Roguelike Mode.
 * Container for configuring timing of 2 leader spells.
 *
 * @fileoverview Spell timing panel with two SpellTimingSelect components.
 */

'use client';

import { memo, useCallback } from 'react';
import { SpellTimingSelect, SpellTimingInfo, SpellTiming } from './SpellTimingSelect';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Spell timing configuration.
 */
export interface SpellTimingConfig {
  /** Spell ID */
  spellId: string;
  /** Selected timing */
  timing: SpellTiming;
}

/**
 * SpellTimingPanel component props.
 */
interface SpellTimingPanelProps {
  /** Leader's spells (2 spells) */
  spells: SpellTimingInfo[];
  /** Current timing configuration */
  timings: SpellTimingConfig[];
  /** Callback when timing changes */
  onTimingChange: (spellId: string, timing: SpellTiming) => void;
  /** Whether panel is disabled */
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
    title: 'Spell Timing',
    subtitle: 'Configure when your spells will trigger during battle',
    hint: 'Spells trigger automatically based on ally HP thresholds',
  },
  ru: {
    title: 'Время заклинаний',
    subtitle: 'Настройте когда заклинания сработают в бою',
    hint: 'Заклинания срабатывают автоматически по порогам HP союзников',
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

/**
 * Get timing for a spell from config.
 */
function getSpellTiming(timings: SpellTimingConfig[], spellId: string): SpellTiming {
  const config = timings.find((t) => t.spellId === spellId);
  return config?.timing ?? 'mid';
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * SpellTimingPanel component for configuring spell timings.
 * Displays two SpellTimingSelect components for leader's spells.
 *
 * @example
 * <SpellTimingPanel
 *   spells={leaderSpells}
 *   timings={spellTimings}
 *   onTimingChange={(spellId, timing) => updateTiming(spellId, timing)}
 * />
 */
const SpellTimingPanel = memo(function SpellTimingPanel({
  spells,
  timings,
  onTimingChange,
  disabled = false,
  useRussian = false,
  className = '',
}: SpellTimingPanelProps) {
  const labels = getLabels(useRussian);

  const handleTimingChange = useCallback(
    (spellId: string, timing: SpellTiming) => {
      if (!disabled) {
        onTimingChange(spellId, timing);
      }
    },
    [disabled, onTimingChange]
  );

  if (spells.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`} role="region" aria-label={labels.title}>
      {/* Header */}
      <div className="text-center space-y-1">
        <h3 className="text-xl font-bold text-white">{labels.title}</h3>
        <p className="text-sm text-gray-400">{labels.subtitle}</p>
      </div>

      {/* Spell Timing Selects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {spells.map((spell) => (
          <SpellTimingSelect
            key={spell.id}
            spell={spell}
            selectedTiming={getSpellTiming(timings, spell.id)}
            onChange={(timing) => handleTimingChange(spell.id, timing)}
            disabled={disabled}
            useRussian={useRussian}
          />
        ))}
      </div>

      {/* Hint */}
      <p className="text-center text-xs text-gray-500">{labels.hint}</p>
    </div>
  );
});

// =============================================================================
// EXPORTS
// =============================================================================

export { SpellTimingPanel };
export type { SpellTimingPanelProps };
