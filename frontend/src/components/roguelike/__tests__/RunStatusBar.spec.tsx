/**
 * Tests for RunStatusBar component.
 *
 * @fileoverview Unit tests for run status bar component.
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { RunStatusBar, StatusBarLeader } from '../RunStatusBar';

// =============================================================================
// TEST DATA
// =============================================================================

const mockLeader: StatusBarLeader = {
  id: 'commander_aldric',
  name: 'Commander Aldric',
  nameRu: 'Командир Альдрик',
  portrait: 'leader-aldric',
  faction: 'humans',
};

// =============================================================================
// TESTS
// =============================================================================

describe('RunStatusBar', () => {
  describe('Rendering', () => {
    it('should render win slots', () => {
      render(
        <RunStatusBar
          wins={3}
          losses={1}
          gold={25}
          leader={mockLeader}
        />
      );

      // Should have 9 win slots total (3 filled + 6 empty)
      const filledWins = screen.getAllByLabelText(/^win \d+$/i);
      const emptyWins = screen.getAllByLabelText(/^Empty win slot \d+$/i);
      expect(filledWins.length + emptyWins.length).toBe(9);
    });

    it('should render loss slots', () => {
      render(
        <RunStatusBar
          wins={3}
          losses={1}
          gold={25}
          leader={mockLeader}
        />
      );

      // Should have 4 loss slots total (1 filled + 3 empty)
      const filledLosses = screen.getAllByLabelText(/^loss \d+$/i);
      const emptyLosses = screen.getAllByLabelText(/^Empty loss slot \d+$/i);
      expect(filledLosses.length + emptyLosses.length).toBe(4);
    });

    it('should display gold balance', () => {
      render(
        <RunStatusBar
          wins={3}
          losses={1}
          gold={25}
          leader={mockLeader}
        />
      );

      expect(screen.getByText('25')).toBeInTheDocument();
    });

    it('should display leader portrait', () => {
      render(
        <RunStatusBar
          wins={3}
          losses={1}
          gold={25}
          leader={mockLeader}
        />
      );

      expect(screen.getByLabelText('Commander Aldric')).toBeInTheDocument();
    });

    it('should display Russian leader name when useRussian is true', () => {
      render(
        <RunStatusBar
          wins={3}
          losses={1}
          gold={25}
          leader={mockLeader}
          useRussian
        />
      );

      expect(screen.getByLabelText('Командир Альдрик')).toBeInTheDocument();
    });
  });

  describe('Win/Loss Display', () => {
    it('should show correct number of filled win slots', () => {
      render(
        <RunStatusBar
          wins={5}
          losses={2}
          gold={30}
          leader={mockLeader}
        />
      );

      // 5 wins should be filled
      const filledWins = screen.getAllByLabelText(/^win \d+$/i);
      expect(filledWins).toHaveLength(5);
    });

    it('should show correct number of filled loss slots', () => {
      render(
        <RunStatusBar
          wins={3}
          losses={3}
          gold={20}
          leader={mockLeader}
        />
      );

      // 3 losses should be filled
      const filledLosses = screen.getAllByLabelText(/^loss \d+$/i);
      expect(filledLosses).toHaveLength(3);
    });

    it('should show all empty slots at start', () => {
      render(
        <RunStatusBar
          wins={0}
          losses={0}
          gold={10}
          leader={mockLeader}
        />
      );

      const emptyWinSlots = screen.getAllByLabelText(/Empty win slot/i);
      const emptyLossSlots = screen.getAllByLabelText(/Empty loss slot/i);

      expect(emptyWinSlots).toHaveLength(9);
      expect(emptyLossSlots).toHaveLength(4);
    });
  });

  describe('Streak Display', () => {
    it('should not show streak when consecutiveWins is 0', () => {
      render(
        <RunStatusBar
          wins={3}
          losses={1}
          gold={25}
          leader={mockLeader}
          consecutiveWins={0}
        />
      );

      expect(screen.queryByText('Streak')).not.toBeInTheDocument();
    });

    it('should show streak when consecutiveWins > 0', () => {
      render(
        <RunStatusBar
          wins={5}
          losses={1}
          gold={35}
          leader={mockLeader}
          consecutiveWins={3}
        />
      );

      expect(screen.getByText('Streak')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should show Russian streak label when useRussian is true', () => {
      render(
        <RunStatusBar
          wins={5}
          losses={1}
          gold={35}
          leader={mockLeader}
          consecutiveWins={3}
          useRussian
        />
      );

      expect(screen.getByText('Серия')).toBeInTheDocument();
    });
  });

  describe('Labels', () => {
    it('should show English labels by default', () => {
      render(
        <RunStatusBar
          wins={3}
          losses={1}
          gold={25}
          leader={mockLeader}
        />
      );

      expect(screen.getByText('Wins')).toBeInTheDocument();
      expect(screen.getByText('Losses')).toBeInTheDocument();
      expect(screen.getByText('Gold')).toBeInTheDocument();
    });

    it('should show Russian labels when useRussian is true', () => {
      render(
        <RunStatusBar
          wins={3}
          losses={1}
          gold={25}
          leader={mockLeader}
          useRussian
        />
      );

      expect(screen.getByText('Победы')).toBeInTheDocument();
      expect(screen.getByText('Поражения')).toBeInTheDocument();
      expect(screen.getByText('Золото')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have status role', () => {
      render(
        <RunStatusBar
          wins={3}
          losses={1}
          gold={25}
          leader={mockLeader}
        />
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should have descriptive aria-label', () => {
      render(
        <RunStatusBar
          wins={3}
          losses={1}
          gold={25}
          leader={mockLeader}
        />
      );

      const statusBar = screen.getByRole('status');
      expect(statusBar).toHaveAttribute('aria-label', 'Run status: 3 wins, 1 losses, 25 gold');
    });

    it('should have group roles for win/loss slots', () => {
      render(
        <RunStatusBar
          wins={3}
          losses={1}
          gold={25}
          leader={mockLeader}
        />
      );

      const groups = screen.getAllByRole('group');
      expect(groups.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Faction Colors', () => {
    it('should apply humans faction colors', () => {
      const { container } = render(
        <RunStatusBar
          wins={3}
          losses={1}
          gold={25}
          leader={mockLeader}
        />
      );

      // Check that blue colors are applied for humans faction
      const portrait = container.querySelector('.border-blue-500');
      expect(portrait).toBeInTheDocument();
    });

    it('should apply undead faction colors', () => {
      const undeadLeader: StatusBarLeader = {
        id: 'lich_king_malachar',
        name: 'Lich King Malachar',
        portrait: 'leader-malachar',
        faction: 'undead',
      };

      const { container } = render(
        <RunStatusBar
          wins={3}
          losses={1}
          gold={25}
          leader={undeadLeader}
        />
      );

      // Check that purple colors are applied for undead faction
      const portrait = container.querySelector('.border-purple-500');
      expect(portrait).toBeInTheDocument();
    });
  });
});
