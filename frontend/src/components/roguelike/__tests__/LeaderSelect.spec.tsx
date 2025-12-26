/**
 * Tests for LeaderSelect component.
 *
 * @fileoverview Unit tests for leader selection component.
 */

import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { LeaderSelect } from '../LeaderSelect';
import { LeaderData } from '../LeaderCard';

// =============================================================================
// TEST DATA
// =============================================================================

const mockLeaders: LeaderData[] = [
  {
    id: 'commander_aldric',
    name: 'Commander Aldric',
    nameRu: 'Командир Альдрик',
    faction: 'humans',
    passive: {
      id: 'formation_master',
      name: 'Formation Master',
      nameRu: 'Мастер построений',
      description: 'Adjacent allies gain +10% armor',
      descriptionRu: 'Соседние союзники получают +10% брони',
    },
    spells: [
      {
        id: 'holy_light',
        name: 'Holy Light',
        nameRu: 'Святой свет',
        description: 'Heals lowest HP ally for 30 HP',
        descriptionRu: 'Исцеляет союзника с наименьшим HP на 30 HP',
        icon: 'spell-holy-light',
        recommendedTiming: 'mid',
      },
      {
        id: 'rally',
        name: 'Rally',
        nameRu: 'Воодушевление',
        description: 'All allies gain +15% ATK for 2 turns',
        descriptionRu: 'Все союзники получают +15% ATK на 2 хода',
        icon: 'spell-rally',
        recommendedTiming: 'early',
      },
    ],
    portrait: 'leader-aldric',
    description: 'A veteran commander who leads from the front',
    descriptionRu: 'Ветеран-командир, ведущий войска в бой',
  },
  {
    id: 'lich_king_malachar',
    name: 'Lich King Malachar',
    nameRu: 'Король-лич Малахар',
    faction: 'undead',
    passive: {
      id: 'life_drain',
      name: 'Life Drain',
      nameRu: 'Похищение жизни',
      description: 'All undead units heal 10% of damage dealt',
      descriptionRu: 'Все юниты нежити исцеляются на 10% от нанесённого урона',
    },
    spells: [
      {
        id: 'death_coil',
        name: 'Death Coil',
        nameRu: 'Кольцо смерти',
        description: 'Deals 25 damage to enemy or heals undead ally for 25 HP',
        descriptionRu: 'Наносит 25 урона врагу или исцеляет союзника-нежить на 25 HP',
        icon: 'spell-death-coil',
        recommendedTiming: 'mid',
      },
      {
        id: 'raise_dead',
        name: 'Raise Dead',
        nameRu: 'Воскрешение мёртвых',
        description: 'Summons a Skeleton at random empty position',
        descriptionRu: 'Призывает Скелета на случайную свободную позицию',
        icon: 'spell-raise-dead',
        recommendedTiming: 'late',
      },
    ],
    portrait: 'leader-malachar',
    description: 'An ancient lich who commands the undead legions',
    descriptionRu: 'Древний лич, командующий легионами нежити',
  },
];

// =============================================================================
// TESTS
// =============================================================================

describe('LeaderSelect', () => {
  describe('Rendering', () => {
    it('should render leader cards', () => {
      const onSelect = jest.fn();
      render(
        <LeaderSelect
          leaders={mockLeaders}
          selectedLeaderId={null}
          onSelect={onSelect}
        />
      );

      expect(screen.getByText('Commander Aldric')).toBeInTheDocument();
      expect(screen.getByText('Lich King Malachar')).toBeInTheDocument();
    });

    it('should render title in English by default', () => {
      const onSelect = jest.fn();
      render(
        <LeaderSelect
          leaders={mockLeaders}
          selectedLeaderId={null}
          onSelect={onSelect}
        />
      );

      expect(screen.getByText('Select Leader')).toBeInTheDocument();
    });

    it('should render title in Russian when useRussian is true', () => {
      const onSelect = jest.fn();
      render(
        <LeaderSelect
          leaders={mockLeaders}
          selectedLeaderId={null}
          onSelect={onSelect}
          useRussian
        />
      );

      expect(screen.getByText('Выберите лидера')).toBeInTheDocument();
    });

    it('should render leader names in Russian when useRussian is true', () => {
      const onSelect = jest.fn();
      render(
        <LeaderSelect
          leaders={mockLeaders}
          selectedLeaderId={null}
          onSelect={onSelect}
          useRussian
        />
      );

      expect(screen.getByText('Командир Альдрик')).toBeInTheDocument();
      expect(screen.getByText('Король-лич Малахар')).toBeInTheDocument();
    });

    it('should show no leaders message when filtered list is empty', () => {
      const onSelect = jest.fn();
      render(
        <LeaderSelect
          leaders={mockLeaders}
          selectedLeaderId={null}
          onSelect={onSelect}
          factionFilter="elves"
        />
      );

      expect(screen.getByText('No leaders available for this faction')).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('should filter leaders by faction', () => {
      const onSelect = jest.fn();
      render(
        <LeaderSelect
          leaders={mockLeaders}
          selectedLeaderId={null}
          onSelect={onSelect}
          factionFilter="humans"
        />
      );

      expect(screen.getByText('Commander Aldric')).toBeInTheDocument();
      expect(screen.queryByText('Lich King Malachar')).not.toBeInTheDocument();
    });

    it('should show all leaders when no filter is applied', () => {
      const onSelect = jest.fn();
      render(
        <LeaderSelect
          leaders={mockLeaders}
          selectedLeaderId={null}
          onSelect={onSelect}
        />
      );

      expect(screen.getByText('Commander Aldric')).toBeInTheDocument();
      expect(screen.getByText('Lich King Malachar')).toBeInTheDocument();
    });
  });

  describe('Selection', () => {
    it('should call onSelect when leader is clicked', () => {
      const onSelect = jest.fn();
      render(
        <LeaderSelect
          leaders={mockLeaders}
          selectedLeaderId={null}
          onSelect={onSelect}
        />
      );

      fireEvent.click(screen.getByText('Commander Aldric'));
      expect(onSelect).toHaveBeenCalledWith('commander_aldric');
    });

    it('should highlight selected leader', () => {
      const onSelect = jest.fn();
      render(
        <LeaderSelect
          leaders={mockLeaders}
          selectedLeaderId="commander_aldric"
          onSelect={onSelect}
        />
      );

      const aldricButton = screen.getByRole('button', { name: /Commander Aldric/i });
      expect(aldricButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should not call onSelect when disabled', () => {
      const onSelect = jest.fn();
      render(
        <LeaderSelect
          leaders={mockLeaders}
          selectedLeaderId={null}
          onSelect={onSelect}
          disabled
        />
      );

      fireEvent.click(screen.getByText('Commander Aldric'));
      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have radiogroup role', () => {
      const onSelect = jest.fn();
      render(
        <LeaderSelect
          leaders={mockLeaders}
          selectedLeaderId={null}
          onSelect={onSelect}
        />
      );

      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });

    it('should support keyboard navigation with Enter', () => {
      const onSelect = jest.fn();
      render(
        <LeaderSelect
          leaders={mockLeaders}
          selectedLeaderId={null}
          onSelect={onSelect}
        />
      );

      const aldricButton = screen.getByRole('button', { name: /Commander Aldric/i });
      fireEvent.keyDown(aldricButton, { key: 'Enter' });
      expect(onSelect).toHaveBeenCalledWith('commander_aldric');
    });

    it('should support keyboard navigation with Space', () => {
      const onSelect = jest.fn();
      render(
        <LeaderSelect
          leaders={mockLeaders}
          selectedLeaderId={null}
          onSelect={onSelect}
        />
      );

      const aldricButton = screen.getByRole('button', { name: /Commander Aldric/i });
      fireEvent.keyDown(aldricButton, { key: ' ' });
      expect(onSelect).toHaveBeenCalledWith('commander_aldric');
    });
  });
});
