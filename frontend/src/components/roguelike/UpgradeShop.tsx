/**
 * UpgradeShop component for Roguelike Mode.
 * Displays hand cards with upgrade options and gold balance.
 *
 * @fileoverview Upgrade shop screen with hand management and upgrade actions.
 */

'use client';

import { memo, useCallback } from 'react';
import { UpgradeCard, UpgradeCardData } from './UpgradeCard';

// =============================================================================
// TYPES
// =============================================================================

/**
 * UpgradeShop component props.
 */
interface UpgradeShopProps {
  /** Cards in hand */
  hand: UpgradeCardData[];
  /** Current gold balance */
  gold: number;
  /** Callback when upgrade is requested */
  onUpgrade: (instanceId: string) => void;
  /** Callback when shop is closed (proceed to battle) */
  onProceed: () => void;
  /** Instance ID currently being upgraded */
  upgradingId?: string | null;
  /** Whether proceed is disabled */
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
    title: 'Upgrade Shop',
    subtitle: 'Upgrade your units before battle',
    gold: 'Gold',
    handSize: 'Hand',
    proceed: 'Proceed to Battle',
    noCards: 'No cards in hand',
    upgradeHint: 'Click upgrade button to improve unit stats',
  },
  ru: {
    title: 'Магазин улучшений',
    subtitle: 'Улучшите юнитов перед боем',
    gold: 'Золото',
    handSize: 'Рука',
    proceed: 'Перейти к бою',
    noCards: 'Нет карт в руке',
    upgradeHint: 'Нажмите кнопку улучшения для повышения характеристик',
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
 * UpgradeShop component for managing unit upgrades.
 * Displays hand cards with upgrade options and gold balance.
 *
 * @example
 * <UpgradeShop
 *   hand={handCards}
 *   gold={currentGold}
 *   onUpgrade={(id) => upgradeUnit(id)}
 *   onProceed={() => goToBattle()}
 * />
 */
const UpgradeShop = memo(function UpgradeShop({
  hand,
  gold,
  onUpgrade,
  onProceed,
  upgradingId = null,
  disabled = false,
  useRussian = false,
  className = '',
}: UpgradeShopProps) {
  const labels = getLabels(useRussian);

  const handleUpgrade = useCallback(
    (instanceId: string) => {
      if (!disabled && upgradingId === null) {
        onUpgrade(instanceId);
      }
    },
    [disabled, upgradingId, onUpgrade]
  );

  const handleProceed = useCallback(() => {
    if (!disabled) {
      onProceed();
    }
  }, [disabled, onProceed]);

  // Calculate upgrade stats
  const upgradeableCount = hand.filter((card) => card.canUpgrade).length;
  const affordableCount = hand.filter(
    (card) => card.canUpgrade && card.upgradeCost !== undefined && gold >= card.upgradeCost
  ).length;

  return (
    <div className={`space-y-6 ${className}`} role="region" aria-label={labels.title}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">{labels.title}</h2>
        <p className="text-gray-400">{labels.subtitle}</p>
      </div>

      {/* Status Bar */}
      <div className="flex justify-between items-center px-4 py-3 bg-gray-800/50 rounded-lg">
        <div className="flex items-center gap-6">
          {/* Gold Display */}
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">
              💰
            </span>
            <div>
              <div className="text-xs text-gray-400">{labels.gold}</div>
              <div className="text-xl font-bold text-yellow-400">{gold}</div>
            </div>
          </div>

          {/* Hand Size */}
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">
              🃏
            </span>
            <div>
              <div className="text-xs text-gray-400">{labels.handSize}</div>
              <div className="text-xl font-bold text-blue-400">{hand.length}</div>
            </div>
          </div>
        </div>

        {/* Upgrade Stats */}
        {upgradeableCount > 0 && (
          <div className="text-sm text-gray-400">
            <span className="text-green-400 font-bold">{affordableCount}</span>
            <span className="text-gray-500">/</span>
            <span>{upgradeableCount}</span>
            <span className="ml-1">{useRussian ? 'доступно' : 'affordable'}</span>
          </div>
        )}
      </div>

      {/* Hand Cards Grid */}
      {hand.length > 0 ? (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          role="list"
          aria-label={labels.handSize}
        >
          {hand.map((card) => (
            <UpgradeCard
              key={card.instanceId}
              card={card}
              gold={gold}
              onUpgrade={() => handleUpgrade(card.instanceId)}
              isUpgrading={upgradingId === card.instanceId}
              disabled={disabled || (upgradingId !== null && upgradingId !== card.instanceId)}
              useRussian={useRussian}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4" aria-hidden="true">
            🃏
          </div>
          <p>{labels.noCards}</p>
        </div>
      )}

      {/* Hint */}
      {hand.length > 0 && upgradeableCount > 0 && (
        <p className="text-center text-sm text-gray-500">{labels.upgradeHint}</p>
      )}

      {/* Proceed Button */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleProceed}
          disabled={disabled}
          aria-label={labels.proceed}
          className={`
            px-8 py-3 rounded-lg font-bold text-lg transition-all duration-200
            ${!disabled
              ? 'bg-blue-600 text-white hover:bg-blue-500 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-900'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {labels.proceed}
        </button>
      </div>
    </div>
  );
});

// =============================================================================
// EXPORTS
// =============================================================================

export { UpgradeShop };
export type { UpgradeShopProps };
