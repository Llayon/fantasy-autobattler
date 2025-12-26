/**
 * Tests for DraftScreen component.
 *
 * @fileoverview Unit tests for draft screen component.
 */

import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { DraftScreen } from '../DraftScreen';
import { DraftCardData } from '../DraftCard';

// =============================================================================
// TEST DATA
// =============================================================================

const mockDraftOptions: DraftCardData[] = [
  {
    instanceId: 'card-1',
    unitId: 'footman',
    name: 'Footman',
    role: 'tank',
    tier: 1,
    cost: 3,
    stats: { hp: 100, atk: 15, armor: 10, speed: 2, initiative: 5, range: 1, attackCount: 1, dodge: 5 },
  },
  {
    instanceId: 'card-2',
    unitId: 'archer',
    name: 'Archer',
    role: 'ranged_dps',
    tier: 1,
    cost: 4,
    stats: { hp: 60, atk: 20, armor: 2, speed: 3, initiative: 8, range: 4, attackCount: 1, dodge: 10 },
  },
  {
    instanceId: 'card-3',
    unitId: 'priest',
    name: 'Priest',
    role: 'support',
    tier: 1,
    cost: 5,
    stats: { hp: 50, atk: 10, armor: 3, speed: 2, initiative: 6, range: 3, attackCount: 1, dodge: 5 },
  },
  {
    instanceId: 'card-4',
    unitId: 'knight',
    name: 'Knight',
    role: 'tank',
    tier: 1,
    cost: 5,
    stats: { hp: 120, atk: 18, armor: 15, speed: 2, initiative: 4, range: 1, attackCount: 1, dodge: 3 },
  },
  {
    instanceId: 'card-5',
    unitId: 'mage',
    name: 'Mage',
    role: 'mage',
    tier: 1,
    cost: 6,
    stats: { hp: 45, atk: 25, armor: 1, speed: 2, initiative: 7, range: 5, attackCount: 1, dodge: 8 },
  },
];

// =============================================================================
// TESTS
// =============================================================================

describe('DraftScreen', () => {
  describe('Rendering', () => {
    it('should render draft options', () => {
      render(
        <DraftScreen
          options={mockDraftOptions}
          selected={[]}
          isInitial={true}
          requiredPicks={3}
          remainingInDeck={9}
          onSelectionChange={jest.fn()}
          onSubmit={jest.fn()}
        />
      );

      // Check that all unit names are rendered (using getAllByText for duplicates)
      expect(screen.getAllByText('Footman').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Archer').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Priest').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Knight').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Mage').length).toBeGreaterThan(0);
    });

    it('should render initial draft title', () => {
      render(
        <DraftScreen
          options={mockDraftOptions}
          selected={[]}
          isInitial={true}
          requiredPicks={3}
          remainingInDeck={9}
          onSelectionChange={jest.fn()}
          onSubmit={jest.fn()}
        />
      );

      expect(screen.getByText('Initial Draft')).toBeInTheDocument();
      expect(screen.getByText('Choose 3 cards to add to your hand')).toBeInTheDocument();
    });

    it('should render post-battle draft title', () => {
      render(
        <DraftScreen
          options={mockDraftOptions.slice(0, 3)}
          selected={[]}
          isInitial={false}
          requiredPicks={1}
          remainingInDeck={6}
          onSelectionChange={jest.fn()}
          onSubmit={jest.fn()}
        />
      );

      expect(screen.getByText('Post-Battle Draft')).toBeInTheDocument();
      expect(screen.getByText('Choose 1 card to add to your hand')).toBeInTheDocument();
    });

    it('should render Russian titles when useRussian is true', () => {
      render(
        <DraftScreen
          options={mockDraftOptions}
          selected={[]}
          isInitial={true}
          requiredPicks={3}
          remainingInDeck={9}
          onSelectionChange={jest.fn()}
          onSubmit={jest.fn()}
          useRussian
        />
      );

      expect(screen.getByText('Начальный драфт')).toBeInTheDocument();
      expect(screen.getByText('Выберите 3 карты для добавления в руку')).toBeInTheDocument();
    });

    it('should display selection count', () => {
      render(
        <DraftScreen
          options={mockDraftOptions}
          selected={['card-1', 'card-2']}
          isInitial={true}
          requiredPicks={3}
          remainingInDeck={9}
          onSelectionChange={jest.fn()}
          onSubmit={jest.fn()}
        />
      );

      expect(screen.getByText('2/3')).toBeInTheDocument();
    });

    it('should display remaining deck count', () => {
      render(
        <DraftScreen
          options={mockDraftOptions}
          selected={[]}
          isInitial={true}
          requiredPicks={3}
          remainingInDeck={9}
          onSelectionChange={jest.fn()}
          onSubmit={jest.fn()}
        />
      );

      expect(screen.getByText('9')).toBeInTheDocument();
    });
  });

  describe('Selection', () => {
    it('should call onSelectionChange when card is clicked', () => {
      const onSelectionChange = jest.fn();
      render(
        <DraftScreen
          options={mockDraftOptions}
          selected={[]}
          isInitial={true}
          requiredPicks={3}
          remainingInDeck={9}
          onSelectionChange={onSelectionChange}
          onSubmit={jest.fn()}
        />
      );

      fireEvent.click(screen.getByText('Footman'));
      expect(onSelectionChange).toHaveBeenCalledWith('card-1');
    });

    it('should allow deselection of selected card', () => {
      const onSelectionChange = jest.fn();
      render(
        <DraftScreen
          options={mockDraftOptions}
          selected={['card-1']}
          isInitial={true}
          requiredPicks={3}
          remainingInDeck={9}
          onSelectionChange={onSelectionChange}
          onSubmit={jest.fn()}
        />
      );

      fireEvent.click(screen.getByText('Footman'));
      expect(onSelectionChange).toHaveBeenCalledWith('card-1');
    });

    it('should not allow selection beyond required picks', () => {
      const onSelectionChange = jest.fn();
      render(
        <DraftScreen
          options={mockDraftOptions}
          selected={['card-1', 'card-2', 'card-3']}
          isInitial={true}
          requiredPicks={3}
          remainingInDeck={9}
          onSelectionChange={onSelectionChange}
          onSubmit={jest.fn()}
        />
      );

      // Knight should be disabled since we already have 3 selections
      const knightButton = screen.getByRole('button', { name: /Knight/i });
      expect(knightButton).toBeDisabled();
    });
  });

  describe('Submit', () => {
    it('should disable submit button when not enough selections', () => {
      render(
        <DraftScreen
          options={mockDraftOptions}
          selected={['card-1']}
          isInitial={true}
          requiredPicks={3}
          remainingInDeck={9}
          onSelectionChange={jest.fn()}
          onSubmit={jest.fn()}
        />
      );

      const submitButton = screen.getByRole('button', { name: /Confirm Selection/i });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when required picks are made', () => {
      render(
        <DraftScreen
          options={mockDraftOptions}
          selected={['card-1', 'card-2', 'card-3']}
          isInitial={true}
          requiredPicks={3}
          remainingInDeck={9}
          onSelectionChange={jest.fn()}
          onSubmit={jest.fn()}
        />
      );

      const submitButton = screen.getByRole('button', { name: /Confirm Selection/i });
      expect(submitButton).not.toBeDisabled();
    });

    it('should call onSubmit when submit button is clicked', () => {
      const onSubmit = jest.fn();
      render(
        <DraftScreen
          options={mockDraftOptions}
          selected={['card-1', 'card-2', 'card-3']}
          isInitial={true}
          requiredPicks={3}
          remainingInDeck={9}
          onSelectionChange={jest.fn()}
          onSubmit={onSubmit}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /Confirm Selection/i }));
      expect(onSubmit).toHaveBeenCalled();
    });

    it('should show submitting state', () => {
      render(
        <DraftScreen
          options={mockDraftOptions}
          selected={['card-1', 'card-2', 'card-3']}
          isInitial={true}
          requiredPicks={3}
          remainingInDeck={9}
          onSelectionChange={jest.fn()}
          onSubmit={jest.fn()}
          isSubmitting
        />
      );

      expect(screen.getByText('Confirming...')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have listbox role', () => {
      render(
        <DraftScreen
          options={mockDraftOptions}
          selected={[]}
          isInitial={true}
          requiredPicks={3}
          remainingInDeck={9}
          onSelectionChange={jest.fn()}
          onSubmit={jest.fn()}
        />
      );

      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('should indicate multiselectable for initial draft', () => {
      render(
        <DraftScreen
          options={mockDraftOptions}
          selected={[]}
          isInitial={true}
          requiredPicks={3}
          remainingInDeck={9}
          onSelectionChange={jest.fn()}
          onSubmit={jest.fn()}
        />
      );

      const listbox = screen.getByRole('listbox');
      expect(listbox).toHaveAttribute('aria-multiselectable', 'true');
    });

    it('should indicate single select for post-battle draft', () => {
      render(
        <DraftScreen
          options={mockDraftOptions.slice(0, 3)}
          selected={[]}
          isInitial={false}
          requiredPicks={1}
          remainingInDeck={6}
          onSelectionChange={jest.fn()}
          onSubmit={jest.fn()}
        />
      );

      const listbox = screen.getByRole('listbox');
      expect(listbox).toHaveAttribute('aria-multiselectable', 'false');
    });
  });
});
