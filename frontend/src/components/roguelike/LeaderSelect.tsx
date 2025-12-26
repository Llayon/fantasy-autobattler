/**
 * LeaderSelect component for Roguelike Mode.
 * Displays leader cards for selection after faction is chosen.
 *
 * @fileoverview Leader selection component with accessibility support.
 */

'use client';

import { memo, useCallback, useMemo } from 'react';
import { LeaderCard, LeaderData } from './LeaderCard';

// =============================================================================
// TYPES
// =============================================================================

/**
 * LeaderSelect component props.
 */
interface LeaderSelectProps {
  /** Available leaders to select from */
  leaders: LeaderData[];
  /** Currently selected leader ID */
  selectedLeaderId: string | null;
  /** Callback when leader is selected */
  onSelect: (leaderId: string) => void;
  /** Filter leaders by faction (optional) */
  factionFilter?: string;
  /** Whether selection is disabled */
  disabled?: boolean;
  /** Use Russian language */
  useRussian?: boolean;
  /** Custom CSS classes */
  className?: string;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * LeaderSelect component for selecting a leader at run start.
 * Displays leader cards with passives and spell options.
 * Can filter by faction to show only relevant leaders.
 *
 * @example
 * <LeaderSelect
 *   leaders={allLeaders}
 *   selectedLeaderId={selectedLeader}
 *   onSelect={(id) => setSelectedLeader(id)}
 *   factionFilter="humans"
 * />
 */
const LeaderSelect = memo(function LeaderSelect({
  leaders,
  selectedLeaderId,
  onSelect,
  factionFilter,
  disabled = false,
  useRussian = false,
  className = '',
}: LeaderSelectProps) {
  // Filter leaders by faction if filter is provided
  const filteredLeaders = useMemo(() => {
    if (!factionFilter) return leaders;
    return leaders.filter((leader) => leader.faction === factionFilter);
  }, [leaders, factionFilter]);

  const handleSelect = useCallback(
    (leaderId: string) => {
      if (!disabled) {
        onSelect(leaderId);
      }
    },
    [disabled, onSelect]
  );

  const title = useRussian ? 'Выберите лидера' : 'Select Leader';
  const noLeadersText = useRussian
    ? 'Нет доступных лидеров для этой фракции'
    : 'No leaders available for this faction';

  // Show message if no leaders available
  if (filteredLeaders.length === 0) {
    return (
      <div className={`space-y-6 ${className}`}>
        <h2 className="text-2xl font-bold text-white text-center">{title}</h2>
        <p className="text-gray-400 text-center">{noLeadersText}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`} role="group" aria-label={title}>
      {/* Title */}
      <h2 className="text-2xl font-bold text-white text-center">{title}</h2>

      {/* Leader Cards Grid */}
      <div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        role="radiogroup"
        aria-label={title}
      >
        {filteredLeaders.map((leader) => (
          <LeaderCard
            key={leader.id}
            leader={leader}
            selected={selectedLeaderId === leader.id}
            onClick={() => handleSelect(leader.id)}
            disabled={disabled}
            useRussian={useRussian}
          />
        ))}
      </div>
    </div>
  );
});

// =============================================================================
// EXPORTS
// =============================================================================

export { LeaderSelect };
export type { LeaderSelectProps };
