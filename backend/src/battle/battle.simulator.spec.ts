import { simulateBattle, BattleResult } from './battle.simulator';
import { UnitType } from '../unit/unit.data';

describe('BattleSimulator', () => {
  describe('simulateBattle', () => {
    it('should return a valid battle result', () => {
      const playerTeam: UnitType[] = ['Warrior', 'Mage', 'Healer'];
      const botTeam: UnitType[] = ['Warrior', 'Mage', 'Healer'];

      const result = simulateBattle(playerTeam, botTeam);

      expect(result).toHaveProperty('playerTeam');
      expect(result).toHaveProperty('botTeam');
      expect(result).toHaveProperty('events');
      expect(result).toHaveProperty('winner');
      expect(['player', 'bot', 'draw']).toContain(result.winner);
    });

    it('should be deterministic - same input produces same output', () => {
      const playerTeam: UnitType[] = ['Warrior', 'Mage', 'Healer'];
      const botTeam: UnitType[] = ['Warrior', 'Warrior', 'Warrior'];

      const result1 = simulateBattle(playerTeam, botTeam);
      const result2 = simulateBattle(playerTeam, botTeam);

      expect(result1.events).toEqual(result2.events);
      expect(result1.winner).toEqual(result2.winner);
    });

    it('should generate events for each round', () => {
      const playerTeam: UnitType[] = ['Warrior'];
      const botTeam: UnitType[] = ['Warrior'];

      const result = simulateBattle(playerTeam, botTeam);

      expect(result.events.length).toBeGreaterThan(0);
      expect(result.events[0]).toHaveProperty('round');
      expect(result.events[0]).toHaveProperty('actor');
      expect(result.events[0]).toHaveProperty('action');
    });

    it('should end battle when one team is eliminated', () => {
      const playerTeam: UnitType[] = ['Mage', 'Mage', 'Mage'];
      const botTeam: UnitType[] = ['Healer'];

      const result = simulateBattle(playerTeam, botTeam);

      expect(result.winner).toBe('player');
    });

    it('should respect speed order - faster units act first', () => {
      const playerTeam: UnitType[] = ['Healer']; // SPD 10
      const botTeam: UnitType[] = ['Warrior']; // SPD 5

      const result = simulateBattle(playerTeam, botTeam);
      const firstEvent = result.events[0];

      // Healer (SPD 10) should act before Warrior (SPD 5)
      expect(firstEvent?.actor).toContain('Healer');
    });

    it('should have healer heal allies when they are damaged', () => {
      const playerTeam: UnitType[] = ['Warrior', 'Healer'];
      const botTeam: UnitType[] = ['Warrior'];

      const result = simulateBattle(playerTeam, botTeam);
      const healEvents = result.events.filter((e) => e.action === 'heal');

      // After warrior takes damage, healer should heal
      expect(healEvents.length).toBeGreaterThan(0);
    });

    it('should have mage attack multiple targets', () => {
      const playerTeam: UnitType[] = ['Mage'];
      const botTeam: UnitType[] = ['Warrior', 'Warrior'];

      const result = simulateBattle(playerTeam, botTeam);
      const splashEvents = result.events.filter((e) => e.action === 'splash');

      expect(splashEvents.length).toBeGreaterThan(0);
      if (splashEvents[0]) {
        expect(splashEvents[0].targets?.length).toBe(2);
      }
    });
  });
});
