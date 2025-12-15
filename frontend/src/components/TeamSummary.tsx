/**
 * TeamSummary component for Fantasy Autobattler.
 * Displays team statistics and composition analysis.
 * 
 * @fileoverview Component for showing team metrics with full and compact variants.
 */

'use client';

import { useMemo } from 'react';
import { UnitTemplate, UnitId, UnitRole } from '@/types/game';
import { getRoleIcon } from '@/lib/roleColors';
import { SynergyDisplay } from './SynergyDisplay';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Placed unit interface for team analysis.
 */
export interface PlacedUnit {
  /** Unit identifier */
  unitId: UnitId;
  /** Unit position on battlefield */
  position: { x: number; y: number };
}

/**
 * Team summary display variants.
 */
export type TeamSummaryVariant = 'full' | 'compact';

/**
 * TeamSummary component props.
 */
interface TeamSummaryProps {
  /** Array of placed units in the team */
  units: PlacedUnit[];
  /** Available unit templates for stats lookup */
  unitTemplates: UnitTemplate[];
  /** Display variant */
  variant?: TeamSummaryVariant;
  /** Custom CSS classes */
  className?: string;
}

/**
 * Team statistics interface.
 */
interface TeamStats {
  /** Total number of units */
  unitCount: number;
  /** Total hit points of all units */
  totalHp: number;
  /** Estimated damage per second */
  estimatedDps: number;
  /** Average initiative across all units */
  averageInitiative: number;
  /** Role distribution with counts */
  roleDistribution: Record<string, number>;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Unit role mapping for UI display */
const UNIT_ROLES: Record<UnitId, string> = {
  // Tanks
  knight: 'tank',
  guardian: 'tank', 
  berserker: 'tank',
  // Melee DPS
  rogue: 'melee_dps',
  duelist: 'melee_dps',
  assassin: 'melee_dps',
  // Ranged DPS
  archer: 'ranged_dps',
  crossbowman: 'ranged_dps',
  hunter: 'ranged_dps',
  // Mages
  mage: 'mage',
  warlock: 'mage',
  elementalist: 'mage',
  // Support
  priest: 'support',
  bard: 'support',
  // Control
  enchanter: 'control',
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate comprehensive team statistics.
 * 
 * @param units - Array of placed units
 * @param unitTemplates - Available unit templates
 * @returns Calculated team statistics
 */
function calculateTeamStats(units: PlacedUnit[], unitTemplates: UnitTemplate[]): TeamStats {
  const roleDistribution: Record<string, number> = {};
  let totalHp = 0;
  let estimatedDps = 0;
  let totalInitiative = 0;

  units.forEach(placedUnit => {
    const template = unitTemplates.find(t => t.id === placedUnit.unitId);
    if (!template) return;

    // Accumulate stats
    totalHp += template.stats.hp;
    estimatedDps += template.stats.atk * template.stats.atkCount;
    totalInitiative += template.stats.initiative;

    // Count roles
    const role = UNIT_ROLES[placedUnit.unitId];
    if (role) {
      roleDistribution[role] = (roleDistribution[role] || 0) + 1;
    }
  });

  return {
    unitCount: units.length,
    totalHp,
    estimatedDps,
    averageInitiative: units.length > 0 ? Math.round(totalInitiative / units.length) : 0,
    roleDistribution,
  };
}

/**
 * Format role distribution as icon string with counts.
 * 
 * @param roleDistribution - Role counts object
 * @returns Formatted string with role icons and counts
 * @example
 * formatRoleDistribution({ tank: 2, mage: 1 }) // "🛡️2 🔮1"
 */
function formatRoleDistribution(roleDistribution: Record<string, number>): string {
  return Object.entries(roleDistribution)
    .map(([role, count]) => `${getRoleIcon(role as UnitRole)}${count}`)
    .join(' ');
}

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Compact team summary component (single line).
 */
interface CompactSummaryProps {
  stats: TeamStats;
  className?: string;
}

function CompactSummary({ stats, className = '' }: CompactSummaryProps) {
  const roleIcons = formatRoleDistribution(stats.roleDistribution);

  return (
    <div className={`flex items-center gap-3 text-sm ${className}`}>
      {/* Unit count */}
      <div className="flex items-center gap-1">
        <span className="text-blue-400">👥</span>
        <span className="text-white font-medium">{stats.unitCount}</span>
      </div>

      {/* Total HP */}
      <div className="flex items-center gap-1">
        <span className="text-red-400">❤️</span>
        <span className="text-green-400 font-medium">{stats.totalHp}</span>
      </div>

      {/* Role distribution */}
      {roleIcons && (
        <div className="flex items-center gap-1">
          <span className="text-lg">{roleIcons}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Full team summary component (grid layout).
 */
interface FullSummaryProps {
  stats: TeamStats;
  units: PlacedUnit[];
  unitTemplates: UnitTemplate[];
  className?: string;
}

function FullSummary({ stats, units, unitTemplates, className = '' }: FullSummaryProps) {
  const roleIcons = formatRoleDistribution(stats.roleDistribution);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Team Statistics Grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        {/* Unit count */}
        <div className="flex items-center justify-between">
          <span className="text-gray-400 flex items-center gap-1">
            <span className="text-blue-400">👥</span> Units
          </span>
          <span className="text-white font-medium">{stats.unitCount}</span>
        </div>

        {/* Total HP */}
        <div className="flex items-center justify-between">
          <span className="text-gray-400 flex items-center gap-1">
            <span className="text-red-400">❤️</span> Total HP
          </span>
          <span className="text-green-400 font-medium">{stats.totalHp}</span>
        </div>

        {/* Estimated DPS */}
        <div className="flex items-center justify-between">
          <span className="text-gray-400 flex items-center gap-1">
            <span className="text-orange-400">⚔️</span> Est. DPS
          </span>
          <span className="text-orange-400 font-medium">{stats.estimatedDps}</span>
        </div>

        {/* Average Initiative */}
        <div className="flex items-center justify-between">
          <span className="text-gray-400 flex items-center gap-1">
            <span className="text-yellow-400">⚡</span> Avg Init
          </span>
          <span className="text-yellow-400 font-medium">{stats.averageInitiative}</span>
        </div>

        {/* Role distribution - spans both columns */}
        <div className="col-span-2 flex items-center justify-between">
          <span className="text-gray-400 flex items-center gap-1">
            <span className="text-purple-400">🎭</span> Roles
          </span>
          <span className="text-lg">{roleIcons || 'None'}</span>
        </div>
      </div>

      {/* Synergies Section */}
      <div className="border-t border-gray-700 pt-3">
        <SynergyDisplay
          units={units}
          unitTemplates={unitTemplates}
          variant="full"
        />
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * TeamSummary component for displaying team statistics and composition.
 * Provides comprehensive analysis of team strength and role distribution.
 * 
 * @param props - Component props
 * @returns Team summary component
 * @example
 * // Compact variant (single line)
 * <TeamSummary
 *   units={placedUnits}
 *   unitTemplates={availableUnits}
 *   variant="compact"
 * />
 * 
 * // Full variant (detailed grid)
 * <TeamSummary
 *   units={placedUnits}
 *   unitTemplates={availableUnits}
 *   variant="full"
 * />
 */
export function TeamSummary({
  units,
  unitTemplates,
  variant = 'full',
  className = '',
}: TeamSummaryProps) {
  /**
   * Calculate team statistics with memoization for performance.
   */
  const stats = useMemo(() => {
    return calculateTeamStats(units, unitTemplates);
  }, [units, unitTemplates]);

  // Empty state
  if (units.length === 0) {
    return (
      <div className={`text-center text-gray-500 text-sm py-2 ${className}`}>
        {variant === 'compact' ? 'No units' : 'No units in team'}
      </div>
    );
  }

  // Render based on variant
  if (variant === 'compact') {
    return <CompactSummary stats={stats} className={className} />;
  }

  return (
    <FullSummary 
      stats={stats} 
      units={units}
      unitTemplates={unitTemplates}
      className={className} 
    />
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export type { TeamSummaryProps };