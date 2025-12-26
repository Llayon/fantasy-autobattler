/**
 * Tests for FactionSelect component.
 *
 * @fileoverview Unit tests for faction selection component.
 */

import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { FactionSelect, FactionData } from '../FactionSelect';

// =============================================================================
// TEST DATA
// =============================================================================

const mockFactions: FactionData[] = [
  {
    id: 'humans',
    name: 'Humans',
    nameRu: 'Люди',
    description: 'Balanced faction with defensive bonuses',
    descriptionRu: 'Сбалансированная фракция с защитными бонусами',
    bonus: { stat: 'hp', value: 0.1 },
    icon: 'faction-humans',
  },
  {
    id: 'undead',
    name: 'Undead',
    nameRu: 'Нежить',
    description: 'Aggressive faction with attack bonuses',
    descriptionRu: 'Агрессивная фракция с бонусами к атаке',
    bonus: { stat: 'atk', value: 0.15 },
    icon: 'faction-undead',
  },
];

// =============================================================================
// TESTS
// =============================================================================

describe('FactionSelect', () => {
  describe('Rendering', () => {
    it('should render faction cards', () => {
      const onSelect = jest.fn();
      render(
        <FactionSelect
          factions={mockFactions}
          selectedFactionId={null}
          onSelect={onSelect}
        />
      );

      expect(screen.getByText('Humans')).toBeInTheDocument();
      expect(screen.getByText('Undead')).toBeInTheDocument();
    });

    it('should render title in English by default', () => {
      const onSelect = jest.fn();
      render(
        <FactionSelect
          factions={mockFactions}
          selectedFactionId={null}
          onSelect={onSelect}
        />
      );

      expect(screen.getByText('Select Faction')).toBeInTheDocument();
    });

    it('should render title in Russian when useRussian is true', () => {
      const onSelect = jest.fn();
      render(
        <FactionSelect
          factions={mockFactions}
          selectedFactionId={null}
          onSelect={onSelect}
          useRussian
        />
      );

      expect(screen.getByText('Выберите фракцию')).toBeInTheDocument();
    });

    it('should render faction names in Russian when useRussian is true', () => {
      const onSelect = jest.fn();
      render(
        <FactionSelect
          factions={mockFactions}
          selectedFactionId={null}
          onSelect={onSelect}
          useRussian
        />
      );

      expect(screen.getByText('Люди')).toBeInTheDocument();
      expect(screen.getByText('Нежить')).toBeInTheDocument();
    });

    it('should render bonus values correctly', () => {
      const onSelect = jest.fn();
      render(
        <FactionSelect
          factions={mockFactions}
          selectedFactionId={null}
          onSelect={onSelect}
        />
      );

      expect(screen.getByText('+10% HP')).toBeInTheDocument();
      expect(screen.getByText('+15% ATK')).toBeInTheDocument();
    });
  });

  describe('Selection', () => {
    it('should call onSelect when faction is clicked', () => {
      const onSelect = jest.fn();
      render(
        <FactionSelect
          factions={mockFactions}
          selectedFactionId={null}
          onSelect={onSelect}
        />
      );

      fireEvent.click(screen.getByText('Humans'));
      expect(onSelect).toHaveBeenCalledWith('humans');
    });

    it('should highlight selected faction', () => {
      const onSelect = jest.fn();
      render(
        <FactionSelect
          factions={mockFactions}
          selectedFactionId="humans"
          onSelect={onSelect}
        />
      );

      const humansButton = screen.getByRole('button', { name: /Humans/i });
      expect(humansButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should not call onSelect when disabled', () => {
      const onSelect = jest.fn();
      render(
        <FactionSelect
          factions={mockFactions}
          selectedFactionId={null}
          onSelect={onSelect}
          disabled
        />
      );

      fireEvent.click(screen.getByText('Humans'));
      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-labels', () => {
      const onSelect = jest.fn();
      render(
        <FactionSelect
          factions={mockFactions}
          selectedFactionId={null}
          onSelect={onSelect}
        />
      );

      const humansButton = screen.getByRole('button', { name: /Humans.*HP/i });
      expect(humansButton).toBeInTheDocument();
    });

    it('should support keyboard navigation with Enter', () => {
      const onSelect = jest.fn();
      render(
        <FactionSelect
          factions={mockFactions}
          selectedFactionId={null}
          onSelect={onSelect}
        />
      );

      const humansButton = screen.getByRole('button', { name: /Humans/i });
      fireEvent.keyDown(humansButton, { key: 'Enter' });
      expect(onSelect).toHaveBeenCalledWith('humans');
    });

    it('should support keyboard navigation with Space', () => {
      const onSelect = jest.fn();
      render(
        <FactionSelect
          factions={mockFactions}
          selectedFactionId={null}
          onSelect={onSelect}
        />
      );

      const humansButton = screen.getByRole('button', { name: /Humans/i });
      fireEvent.keyDown(humansButton, { key: ' ' });
      expect(onSelect).toHaveBeenCalledWith('humans');
    });

    it('should have radiogroup role', () => {
      const onSelect = jest.fn();
      render(
        <FactionSelect
          factions={mockFactions}
          selectedFactionId={null}
          onSelect={onSelect}
        />
      );

      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });
  });
});
