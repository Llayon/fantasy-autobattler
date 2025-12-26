/**
 * Roguelike Mode Components
 *
 * Re-exports all roguelike-specific components for easy importing.
 *
 * @fileoverview Barrel export file for roguelike components.
 */

// =============================================================================
// SELECTION COMPONENTS
// =============================================================================

export { FactionSelect, FactionCard } from './FactionSelect';
export type { FactionSelectProps, FactionData, FactionBonus } from './FactionSelect';

export { LeaderSelect } from './LeaderSelect';
export type { LeaderSelectProps } from './LeaderSelect';

export { LeaderCard, SpellIcon } from './LeaderCard';
export type { LeaderCardProps, LeaderData, PassiveAbility, SpellInfo } from './LeaderCard';

// =============================================================================
// DRAFT COMPONENTS
// =============================================================================

export { DraftCard } from './DraftCard';
export type { DraftCardProps } from './DraftCard';
export type { DraftCardData, DraftUnitStats, DraftUnitAbility } from './DraftCard';

export { DraftScreen } from './DraftScreen';
export type { DraftScreenProps } from './DraftScreen';

// =============================================================================
// UPGRADE/SHOP COMPONENTS
// =============================================================================

export { UpgradeCard } from './UpgradeCard';
export type { UpgradeCardProps } from './UpgradeCard';
export type { UpgradeCardData } from './UpgradeCard';

export { UpgradeShop } from './UpgradeShop';
export type { UpgradeShopProps } from './UpgradeShop';

// =============================================================================
// SPELL TIMING COMPONENTS
// =============================================================================

export { SpellTimingSelect } from './SpellTimingSelect';
export type { SpellTimingSelectProps } from './SpellTimingSelect';
export type { SpellTimingInfo, SpellTiming } from './SpellTimingSelect';

export { SpellTimingPanel } from './SpellTimingPanel';
export type { SpellTimingPanelProps } from './SpellTimingPanel';
export type { SpellTimingConfig } from './SpellTimingPanel';
