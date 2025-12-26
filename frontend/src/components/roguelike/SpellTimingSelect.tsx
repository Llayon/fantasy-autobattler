/**
 * SpellTimingSelect component for Roguelike Mode.
 * Allows selection of spell trigger timing (Early/Mid/Late).
 *
 * @fileoverview Spell timing selection with radio buttons and tooltips.
 */

'use client';

import { memo, useCallback, useId } from 'react';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Spell timing options.
 */
export type SpellTiming = 'early' | 'mid' | 'late';

/**
 * Spell info for display.
 */
export interface SpellTimingInfo {
  /** Spell ID */
  id: string;
  /** Spell name */
  name: string;
  /** Spell name (Russian) */
  nameRu?: string;
  /** Spell description */
  description: string;
  /** Spell description (Russian) */
  descriptionRu?: string;
  /** Spell icon */
  icon?: string;
  /** Recommended timing */
  recommendedTiming: SpellTiming;
}

/**
 * SpellTimingSelect component props.
 */
interface SpellTimingSelectProps {
  /** Spell information */
  spell: SpellTimingInfo;
  /** Currently selected timing */
  selectedTiming: SpellTiming;
  /** Callback when timing changes */
  onChange: (timing: SpellTiming) => void;
  /** Whether selection is disabled */
  disabled?: boolean;
  /** Use Russian language */
  useRussian?: boolean;
  /** Custom CSS classes */
  className?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Timing configuration.
 */
const TIMING_CONFIG: Record<
  SpellTiming,
  {
    label: { en: string; ru: string };
    description: { en: string; ru: string };
    color: string;
    bgColor: string;
    hpThreshold: string;
  }
> = {
  early: {
    label: { en: 'Early', ru: 'Рано' },
    description: {
      en: 'Triggers at battle start (100% HP)',
      ru: 'Срабатывает в начале боя (100% HP)',
    },
    color: 'text-green-400',
    bgColor: 'bg-green-900/30',
    hpThreshold: '100%',
  },
  mid: {
    label: { en: 'Mid', ru: 'Середина' },
    description: {
      en: 'Triggers when any ally drops below 70% HP',
      ru: 'Срабатывает когда союзник падает ниже 70% HP',
    },
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-900/30',
    hpThreshold: '70%',
  },
  late: {
    label: { en: 'Late', ru: 'Поздно' },
    description: {
      en: 'Triggers when any ally drops below 40% HP',
      ru: 'Срабатывает когда союзник падает ниже 40% HP',
    },
    color: 'text-red-400',
    bgColor: 'bg-red-900/30',
    hpThreshold: '40%',
  },
};

/**
 * Spell icon mapping.
 */
const SPELL_ICONS: Record<string, string> = {
  'spell-holy-light': '✨',
  'spell-rally': '📯',
  'spell-death-coil': '💀',
  'spell-raise-dead': '⚰️',
  default: '🔮',
};

const LABELS = {
  en: {
    timing: 'Timing',
    recommended: 'Recommended',
  },
  ru: {
    timing: 'Время',
    recommended: 'Рекомендуется',
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get spell icon.
 */
function getSpellIcon(icon?: string): string {
  if (!icon) return SPELL_ICONS.default ?? '🔮';
  return SPELL_ICONS[icon] ?? SPELL_ICONS.default ?? '🔮';
}

/**
 * Get localized labels.
 */
function getLabels(useRussian: boolean) {
  return useRussian ? LABELS.ru : LABELS.en;
}

// =============================================================================
// TIMING OPTION COMPONENT
// =============================================================================

interface TimingOptionProps {
  timing: SpellTiming;
  selected: boolean;
  recommended: boolean;
  onChange: () => void;
  disabled: boolean;
  useRussian: boolean;
  name: string;
}

const TimingOption = memo(function TimingOption({
  timing,
  selected,
  recommended,
  onChange,
  disabled,
  useRussian,
  name,
}: TimingOptionProps) {
  const config = TIMING_CONFIG[timing];
  const label = useRussian ? config.label.ru : config.label.en;
  const description = useRussian ? config.description.ru : config.description.en;
  const labels = getLabels(useRussian);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!disabled) {
          onChange();
        }
      }
    },
    [disabled, onChange]
  );

  return (
    <label
      className={`
        relative flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200
        ${selected ? `${config.bgColor} ${config.color} border-current` : 'bg-gray-800/30 border-gray-700'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-500'}
      `}
      title={description}
    >
      <input
        type="radio"
        name={name}
        value={timing}
        checked={selected}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="sr-only"
        aria-describedby={`${name}-${timing}-desc`}
      />

      {/* Radio indicator */}
      <div
        className={`
          w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
          ${selected ? `${config.color} border-current` : 'border-gray-500'}
        `}
      >
        {selected && <div className={`w-2 h-2 rounded-full bg-current`} />}
      </div>

      {/* Label and description */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-medium ${selected ? config.color : 'text-white'}`}>{label}</span>
          <span className="text-xs text-gray-500">({config.hpThreshold})</span>
          {recommended && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-blue-900/50 text-blue-400">
              {labels.recommended}
            </span>
          )}
        </div>
        <p id={`${name}-${timing}-desc`} className="text-xs text-gray-500 mt-0.5">
          {description}
        </p>
      </div>
    </label>
  );
});

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * SpellTimingSelect component for selecting spell trigger timing.
 * Displays spell info and three timing options with descriptions.
 *
 * @example
 * <SpellTimingSelect
 *   spell={holyLightSpell}
 *   selectedTiming="mid"
 *   onChange={(timing) => setSpellTiming(spell.id, timing)}
 * />
 */
const SpellTimingSelect = memo(function SpellTimingSelect({
  spell,
  selectedTiming,
  onChange,
  disabled = false,
  useRussian = false,
  className = '',
}: SpellTimingSelectProps) {
  const uniqueId = useId();
  const radioGroupName = `spell-timing-${spell.id}-${uniqueId}`;
  const labels = getLabels(useRussian);

  const spellName = useRussian && spell.nameRu ? spell.nameRu : spell.name;
  const spellDescription =
    useRussian && spell.descriptionRu ? spell.descriptionRu : spell.description;
  const spellIcon = getSpellIcon(spell.icon);

  const handleTimingChange = useCallback(
    (timing: SpellTiming) => {
      if (!disabled) {
        onChange(timing);
      }
    },
    [disabled, onChange]
  );

  const timings: SpellTiming[] = ['early', 'mid', 'late'];

  return (
    <div
      className={`p-4 rounded-xl bg-gray-800/50 border border-gray-700 ${className}`}
      role="group"
      aria-label={`${spellName} ${labels.timing}`}
    >
      {/* Spell Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-purple-900/30 border border-purple-500 flex items-center justify-center text-xl">
          {spellIcon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-white">{spellName}</h4>
          <p className="text-sm text-gray-400 truncate">{spellDescription}</p>
        </div>
      </div>

      {/* Timing Options */}
      <div className="space-y-2" role="radiogroup" aria-label={labels.timing}>
        {timings.map((timing) => (
          <TimingOption
            key={timing}
            timing={timing}
            selected={selectedTiming === timing}
            recommended={spell.recommendedTiming === timing}
            onChange={() => handleTimingChange(timing)}
            disabled={disabled}
            useRussian={useRussian}
            name={radioGroupName}
          />
        ))}
      </div>
    </div>
  );
});

// =============================================================================
// EXPORTS
// =============================================================================

export { SpellTimingSelect };
export type { SpellTimingSelectProps };
