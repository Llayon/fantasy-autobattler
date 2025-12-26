/**
 * Tests for UpgradeShop component.
 *
 * @fileoverview Unit tests for upgrade shop component.
 */

import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { UpgradeShop } from '../UpgradeShop';
import { UpgradeCardData } from '../UpgradeCard';

// =============================================================================
// TEST DATA
// =============================================================================

const mockHandCards: UpgradeCardData[] = [
  {
    instanceId: 'card-1',
    unitId: 'footman',
    name: 'Footman',
    role: 'tank',
    tier: 1,
    cost: 3,
    stats: { hp: 100, atk: 15, armor: 10, speed: 2, initiative: 5, range: 1, attackCount: 1, dodge: 5 },
    canUpgrade: true,
    upgradeCost: 2,
    nextTier: 2,
  },
  {
    instanceId: 'card-2',
    unitId: 'archer',
    name: 'Archer',
    role: 'ranged_dps',
    tier: 2,
    cost: 4,
    stats: { hp: 72, atk: 24, armor: 2, speed: 3, initiative: 8, range: 4, attackCount: 1, dodge: 10 },
    canUpgrade: true,
    upgradeCost: 3,
    nextTier: 3,
  },
  {
    instanceId: 'card-3',
    unitId: 'knight',
    name: 'Knight',
    role: 'tank',
    tier: 3,
    cost: 5,
    stats: { hp: 180, atk: 27, armor: 22, speed: 2, initiative: 4, range: 1, attackCount: 1, dodge: 3 },
    canUpgrade: false,
  },
];

// =============================================================================
// TESTS
// =============================================================================

describe('UpgradeShop', () => {
  describe('Rendering', () => {
    it('should render hand cards', () => {
      render(
        <UpgradeShop
          hand={mockHandCards}
          gold={10}
          onUpgrade={jest.fn()}
          onProceed={jest.fn()}
        />
      );

      expect(screen.getByText('Footman')).toBeInTheDocument();
      expect(screen.getByText('Archer')).toBeInTheDocument();
      expect(screen.getByText('Knight')).toBeInTheDocument();
    });

    it('should render title in English by default', () => {
      render(
        <UpgradeShop
          hand={mockHandCards}
          gold={10}
          onUpgrade={jest.fn()}
          onProceed={jest.fn()}
        />
      );

      expect(screen.getByText('Upgrade Shop')).toBeInTheDocument();
      expect(screen.getByText('Upgrade your units before battle')).toBeInTheDocument();
    });

    it('should render title in Russian when useRussian is true', () => {
      render(
        <UpgradeShop
          hand={mockHandCards}
          gold={10}
          onUpgrade={jest.fn()}
          onProceed={jest.fn()}
          useRussian
        />
      );

      expect(screen.getByText('Магазин улучшений')).toBeInTheDocument();
      expect(screen.getByText('Улучшите юнитов перед боем')).toBeInTheDocument();
    });

    it('should display gold balance', () => {
      render(
        <UpgradeShop
          hand={mockHandCards}
          gold={25}
          onUpgrade={jest.fn()}
          onProceed={jest.fn()}
        />
      );

      expect(screen.getByText('25')).toBeInTheDocument();
    });

    it('should display hand size', () => {
      render(
        <UpgradeShop
          hand={mockHandCards}
          gold={10}
          onUpgrade={jest.fn()}
          onProceed={jest.fn()}
        />
      );

      // Hand size is displayed in the header
      const handSizeElements = screen.getAllByText('3');
      expect(handSizeElements.length).toBeGreaterThan(0);
    });

    it('should show no cards message when hand is empty', () => {
      render(
        <UpgradeShop
          hand={[]}
          gold={10}
          onUpgrade={jest.fn()}
          onProceed={jest.fn()}
        />
      );

      expect(screen.getByText('No cards in hand')).toBeInTheDocument();
    });

    it('should show affordable count', () => {
      render(
        <UpgradeShop
          hand={mockHandCards}
          gold={10}
          onUpgrade={jest.fn()}
          onProceed={jest.fn()}
        />
      );

      // 2 cards can be upgraded (Footman: 2g, Archer: 3g), both affordable with 10g
      // The affordable count is displayed in the header
      const affordableElements = screen.getAllByText('2');
      expect(affordableElements.length).toBeGreaterThan(0);
    });
  });

  describe('Upgrade Actions', () => {
    it('should call onUpgrade when upgrade button is clicked', () => {
      const onUpgrade = jest.fn();
      render(
        <UpgradeShop
          hand={mockHandCards}
          gold={10}
          onUpgrade={onUpgrade}
          onProceed={jest.fn()}
        />
      );

      // Find and click the upgrade button for Footman
      const upgradeButtons = screen.getAllByRole('button', { name: /Upgrade/i });
      fireEvent.click(upgradeButtons[0]);
      expect(onUpgrade).toHaveBeenCalledWith('card-1');
    });

    it('should not call onUpgrade when disabled', () => {
      const onUpgrade = jest.fn();
      render(
        <UpgradeShop
          hand={mockHandCards}
          gold={10}
          onUpgrade={onUpgrade}
          onProceed={jest.fn()}
          disabled
        />
      );

      const upgradeButtons = screen.getAllByRole('button', { name: /Upgrade/i });
      fireEvent.click(upgradeButtons[0]);
      expect(onUpgrade).not.toHaveBeenCalled();
    });

    it('should show upgrading state for specific card', () => {
      render(
        <UpgradeShop
          hand={mockHandCards}
          gold={10}
          onUpgrade={jest.fn()}
          onProceed={jest.fn()}
          upgradingId="card-1"
        />
      );

      expect(screen.getByText('Upgrading...')).toBeInTheDocument();
    });
  });

  describe('Proceed Action', () => {
    it('should call onProceed when proceed button is clicked', () => {
      const onProceed = jest.fn();
      render(
        <UpgradeShop
          hand={mockHandCards}
          gold={10}
          onUpgrade={jest.fn()}
          onProceed={onProceed}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /Proceed to Battle/i }));
      expect(onProceed).toHaveBeenCalled();
    });

    it('should not call onProceed when disabled', () => {
      const onProceed = jest.fn();
      render(
        <UpgradeShop
          hand={mockHandCards}
          gold={10}
          onUpgrade={jest.fn()}
          onProceed={onProceed}
          disabled
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /Proceed to Battle/i }));
      expect(onProceed).not.toHaveBeenCalled();
    });
  });

  describe('Affordability', () => {
    it('should show not enough gold for expensive upgrades', () => {
      render(
        <UpgradeShop
          hand={mockHandCards}
          gold={1}
          onUpgrade={jest.fn()}
          onProceed={jest.fn()}
        />
      );

      // With only 1 gold, neither upgrade should be affordable
      expect(screen.getAllByText('Not enough gold').length).toBeGreaterThan(0);
    });

    it('should show max tier for T3 units', () => {
      render(
        <UpgradeShop
          hand={mockHandCards}
          gold={100}
          onUpgrade={jest.fn()}
          onProceed={jest.fn()}
        />
      );

      expect(screen.getByText('Max Tier')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have region role', () => {
      render(
        <UpgradeShop
          hand={mockHandCards}
          gold={10}
          onUpgrade={jest.fn()}
          onProceed={jest.fn()}
        />
      );

      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('should have list role for cards', () => {
      render(
        <UpgradeShop
          hand={mockHandCards}
          gold={10}
          onUpgrade={jest.fn()}
          onProceed={jest.fn()}
        />
      );

      expect(screen.getByRole('list')).toBeInTheDocument();
    });
  });
});
