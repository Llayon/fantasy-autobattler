/**
 * Tests for SpellTimingSelect component.
 *
 * @fileoverview Unit tests for spell timing selection component.
 */

import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { SpellTimingSelect, SpellTimingInfo } from '../SpellTimingSelect';

// =============================================================================
// TEST DATA
// =============================================================================

const mockSpell: SpellTimingInfo = {
  id: 'holy_light',
  name: 'Holy Light',
  nameRu: 'Святой свет',
  description: 'Heals lowest HP ally for 30 HP',
  descriptionRu: 'Исцеляет союзника с наименьшим HP на 30 HP',
  icon: 'spell-holy-light',
  recommendedTiming: 'mid',
};

const mockSpellNoRu: SpellTimingInfo = {
  id: 'death_coil',
  name: 'Death Coil',
  description: 'Deals 25 damage to enemy',
  recommendedTiming: 'late',
};

// =============================================================================
// TESTS
// =============================================================================

describe('SpellTimingSelect', () => {
  describe('Rendering', () => {
    it('should render spell name', () => {
      render(
        <SpellTimingSelect
          spell={mockSpell}
          selectedTiming="mid"
          onChange={jest.fn()}
        />
      );

      expect(screen.getByText('Holy Light')).toBeInTheDocument();
    });

    it('should render spell description', () => {
      render(
        <SpellTimingSelect
          spell={mockSpell}
          selectedTiming="mid"
          onChange={jest.fn()}
        />
      );

      expect(screen.getByText('Heals lowest HP ally for 30 HP')).toBeInTheDocument();
    });

    it('should render Russian spell name when useRussian is true', () => {
      render(
        <SpellTimingSelect
          spell={mockSpell}
          selectedTiming="mid"
          onChange={jest.fn()}
          useRussian
        />
      );

      expect(screen.getByText('Святой свет')).toBeInTheDocument();
    });

    it('should render Russian spell description when useRussian is true', () => {
      render(
        <SpellTimingSelect
          spell={mockSpell}
          selectedTiming="mid"
          onChange={jest.fn()}
          useRussian
        />
      );

      expect(screen.getByText('Исцеляет союзника с наименьшим HP на 30 HP')).toBeInTheDocument();
    });

    it('should fallback to English when Russian not available', () => {
      render(
        <SpellTimingSelect
          spell={mockSpellNoRu}
          selectedTiming="late"
          onChange={jest.fn()}
          useRussian
        />
      );

      expect(screen.getByText('Death Coil')).toBeInTheDocument();
    });

    it('should render all three timing options', () => {
      render(
        <SpellTimingSelect
          spell={mockSpell}
          selectedTiming="mid"
          onChange={jest.fn()}
        />
      );

      expect(screen.getByText('Early')).toBeInTheDocument();
      expect(screen.getByText('Mid')).toBeInTheDocument();
      expect(screen.getByText('Late')).toBeInTheDocument();
    });

    it('should render Russian timing labels when useRussian is true', () => {
      render(
        <SpellTimingSelect
          spell={mockSpell}
          selectedTiming="mid"
          onChange={jest.fn()}
          useRussian
        />
      );

      expect(screen.getByText('Рано')).toBeInTheDocument();
      expect(screen.getByText('Середина')).toBeInTheDocument();
      expect(screen.getByText('Поздно')).toBeInTheDocument();
    });

    it('should show HP thresholds', () => {
      render(
        <SpellTimingSelect
          spell={mockSpell}
          selectedTiming="mid"
          onChange={jest.fn()}
        />
      );

      expect(screen.getByText('(100%)')).toBeInTheDocument();
      expect(screen.getByText('(70%)')).toBeInTheDocument();
      expect(screen.getByText('(40%)')).toBeInTheDocument();
    });

    it('should show recommended badge for recommended timing', () => {
      render(
        <SpellTimingSelect
          spell={mockSpell}
          selectedTiming="early"
          onChange={jest.fn()}
        />
      );

      expect(screen.getByText('Recommended')).toBeInTheDocument();
    });

    it('should show Russian recommended badge when useRussian is true', () => {
      render(
        <SpellTimingSelect
          spell={mockSpell}
          selectedTiming="early"
          onChange={jest.fn()}
          useRussian
        />
      );

      expect(screen.getByText('Рекомендуется')).toBeInTheDocument();
    });
  });

  describe('Selection', () => {
    it('should call onChange when timing is selected', () => {
      const onChange = jest.fn();
      render(
        <SpellTimingSelect
          spell={mockSpell}
          selectedTiming="mid"
          onChange={onChange}
        />
      );

      fireEvent.click(screen.getByText('Early'));
      expect(onChange).toHaveBeenCalledWith('early');
    });

    it('should call onChange with late timing', () => {
      const onChange = jest.fn();
      render(
        <SpellTimingSelect
          spell={mockSpell}
          selectedTiming="mid"
          onChange={onChange}
        />
      );

      fireEvent.click(screen.getByText('Late'));
      expect(onChange).toHaveBeenCalledWith('late');
    });

    it('should not call onChange when disabled', () => {
      const onChange = jest.fn();
      render(
        <SpellTimingSelect
          spell={mockSpell}
          selectedTiming="mid"
          onChange={onChange}
          disabled
        />
      );

      fireEvent.click(screen.getByText('Early'));
      expect(onChange).not.toHaveBeenCalled();
    });

    it('should have correct radio checked state', () => {
      render(
        <SpellTimingSelect
          spell={mockSpell}
          selectedTiming="mid"
          onChange={jest.fn()}
        />
      );

      const radios = screen.getAllByRole('radio');
      const midRadio = radios.find((r) => r.getAttribute('value') === 'mid');
      expect(midRadio).toBeChecked();
    });
  });

  describe('Accessibility', () => {
    it('should have group role', () => {
      render(
        <SpellTimingSelect
          spell={mockSpell}
          selectedTiming="mid"
          onChange={jest.fn()}
        />
      );

      expect(screen.getByRole('group')).toBeInTheDocument();
    });

    it('should have radiogroup role', () => {
      render(
        <SpellTimingSelect
          spell={mockSpell}
          selectedTiming="mid"
          onChange={jest.fn()}
        />
      );

      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });

    it('should have proper aria-label on group', () => {
      render(
        <SpellTimingSelect
          spell={mockSpell}
          selectedTiming="mid"
          onChange={jest.fn()}
        />
      );

      const group = screen.getByRole('group');
      expect(group).toHaveAttribute('aria-label', 'Holy Light Timing');
    });

    it('should have Russian aria-label when useRussian is true', () => {
      render(
        <SpellTimingSelect
          spell={mockSpell}
          selectedTiming="mid"
          onChange={jest.fn()}
          useRussian
        />
      );

      const group = screen.getByRole('group');
      expect(group).toHaveAttribute('aria-label', 'Святой свет Время');
    });

    it('should support keyboard navigation with Enter', () => {
      const onChange = jest.fn();
      render(
        <SpellTimingSelect
          spell={mockSpell}
          selectedTiming="mid"
          onChange={onChange}
        />
      );

      const radios = screen.getAllByRole('radio');
      const earlyRadio = radios.find((r) => r.getAttribute('value') === 'early');
      if (earlyRadio) {
        fireEvent.keyDown(earlyRadio, { key: 'Enter' });
        expect(onChange).toHaveBeenCalledWith('early');
      }
    });

    it('should support keyboard navigation with Space', () => {
      const onChange = jest.fn();
      render(
        <SpellTimingSelect
          spell={mockSpell}
          selectedTiming="mid"
          onChange={onChange}
        />
      );

      const radios = screen.getAllByRole('radio');
      const lateRadio = radios.find((r) => r.getAttribute('value') === 'late');
      if (lateRadio) {
        fireEvent.keyDown(lateRadio, { key: ' ' });
        expect(onChange).toHaveBeenCalledWith('late');
      }
    });

    it('should have aria-describedby for each option', () => {
      render(
        <SpellTimingSelect
          spell={mockSpell}
          selectedTiming="mid"
          onChange={jest.fn()}
        />
      );

      const radios = screen.getAllByRole('radio');
      radios.forEach((radio) => {
        expect(radio).toHaveAttribute('aria-describedby');
      });
    });
  });

  describe('Disabled State', () => {
    it('should disable all radio inputs when disabled', () => {
      render(
        <SpellTimingSelect
          spell={mockSpell}
          selectedTiming="mid"
          onChange={jest.fn()}
          disabled
        />
      );

      const radios = screen.getAllByRole('radio');
      radios.forEach((radio) => {
        expect(radio).toBeDisabled();
      });
    });

    it('should not respond to keyboard when disabled', () => {
      const onChange = jest.fn();
      render(
        <SpellTimingSelect
          spell={mockSpell}
          selectedTiming="mid"
          onChange={onChange}
          disabled
        />
      );

      const radios = screen.getAllByRole('radio');
      const earlyRadio = radios.find((r) => r.getAttribute('value') === 'early');
      if (earlyRadio) {
        fireEvent.keyDown(earlyRadio, { key: 'Enter' });
        expect(onChange).not.toHaveBeenCalled();
      }
    });
  });

  describe('Spell Icon', () => {
    it('should render spell icon', () => {
      const { container } = render(
        <SpellTimingSelect
          spell={mockSpell}
          selectedTiming="mid"
          onChange={jest.fn()}
        />
      );

      // Holy Light icon is ✨
      expect(container.textContent).toContain('✨');
    });

    it('should render default icon when icon not found', () => {
      const spellWithUnknownIcon: SpellTimingInfo = {
        ...mockSpell,
        icon: 'unknown-icon',
      };

      const { container } = render(
        <SpellTimingSelect
          spell={spellWithUnknownIcon}
          selectedTiming="mid"
          onChange={jest.fn()}
        />
      );

      // Default icon is 🔮
      expect(container.textContent).toContain('🔮');
    });

    it('should render default icon when no icon provided', () => {
      const spellWithoutIcon: SpellTimingInfo = {
        id: 'test',
        name: 'Test Spell',
        description: 'Test description',
        recommendedTiming: 'early',
      };

      const { container } = render(
        <SpellTimingSelect
          spell={spellWithoutIcon}
          selectedTiming="early"
          onChange={jest.fn()}
        />
      );

      expect(container.textContent).toContain('🔮');
    });
  });
});
