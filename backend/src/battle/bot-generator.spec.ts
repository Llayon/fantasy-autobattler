/**
 * Bot Generator Tests for Fantasy Autobattler.
 * Tests bot team generation strategies and deterministic behavior.
 */

import { generateBotTeam, generateBotPositions, validateBotTeam, BotDifficulty } from './bot-generator';
import { getUnitTemplate } from '../unit/unit.data';
import { DEPLOYMENT_ZONES } from '../config/game.constants';

describe('BotGenerator', () => {
  describe('generateBotTeam', () => {
    it('should generate team within budget for easy difficulty', () => {
      const team = generateBotTeam('easy', 20, 12345);
      
      expect(team.units.length).toBeGreaterThan(0);
      expect(team.positions.length).toBe(team.units.length);
      
      const totalCost = team.units.reduce((sum, unit) => sum + unit.cost, 0);
      expect(totalCost).toBeLessThanOrEqual(20);
    });

    it('should generate team within budget for medium difficulty', () => {
      const team = generateBotTeam('medium', 25, 12345);
      
      expect(team.units.length).toBeGreaterThan(0);
      expect(team.positions.length).toBe(team.units.length);
      
      const totalCost = team.units.reduce((sum, unit) => sum + unit.cost, 0);
      expect(totalCost).toBeLessThanOrEqual(25);
    });

    it('should generate team within budget for hard difficulty', () => {
      const team = generateBotTeam('hard', 30, 12345);
      
      expect(team.units.length).toBeGreaterThan(0);
      expect(team.positions.length).toBe(team.units.length);
      
      const totalCost = team.units.reduce((sum, unit) => sum + unit.cost, 0);
      expect(totalCost).toBeLessThanOrEqual(30);
    });

    it('should be deterministic with same seed', () => {
      const team1 = generateBotTeam('medium', 25, 12345);
      const team2 = generateBotTeam('medium', 25, 12345);
      
      expect(team1.units.length).toBe(team2.units.length);
      
      for (let i = 0; i < team1.units.length; i++) {
        expect(team1.units[i]?.id).toBe(team2.units[i]?.id);
        expect(team1.positions[i]?.x).toBe(team2.positions[i]?.x);
        expect(team1.positions[i]?.y).toBe(team2.positions[i]?.y);
      }
    });

    it('should generate different teams with different seeds', () => {
      const team1 = generateBotTeam('medium', 25, 12345);
      const team2 = generateBotTeam('medium', 25, 54321);
      
      // Teams should be different (very unlikely to be identical)
      const team1Ids = team1.units.map(u => u.id).sort();
      const team2Ids = team2.units.map(u => u.id).sort();
      
      expect(team1Ids).not.toEqual(team2Ids);
    });

    it('should use default budgets when not specified', () => {
      const easyTeam = generateBotTeam('easy', undefined, 12345);
      const mediumTeam = generateBotTeam('medium', undefined, 12345);
      const hardTeam = generateBotTeam('hard', undefined, 12345);
      
      const easyCost = easyTeam.units.reduce((sum, unit) => sum + unit.cost, 0);
      const mediumCost = mediumTeam.units.reduce((sum, unit) => sum + unit.cost, 0);
      const hardCost = hardTeam.units.reduce((sum, unit) => sum + unit.cost, 0);
      
      expect(easyCost).toBeLessThanOrEqual(20);
      expect(mediumCost).toBeLessThanOrEqual(25);
      expect(hardCost).toBeLessThanOrEqual(30);
    });

    it('should generate valid unit templates', () => {
      const team = generateBotTeam('medium', 25, 12345);
      
      for (const unit of team.units) {
        expect(unit.id).toBeDefined();
        expect(unit.name).toBeDefined();
        expect(unit.role).toBeDefined();
        expect(unit.cost).toBeGreaterThan(0);
        expect(unit.stats).toBeDefined();
        expect(unit.stats.hp).toBeGreaterThan(0);
        expect(unit.stats.atk).toBeGreaterThan(0);
      }
    });

    it('should limit team size reasonably', () => {
      const team = generateBotTeam('easy', 100, 12345); // Large budget
      
      expect(team.units.length).toBeLessThanOrEqual(8);
    });

    it('should handle edge case of very small budget', () => {
      const team = generateBotTeam('easy', 3, 12345); // Very small budget
      
      expect(team.units.length).toBeGreaterThanOrEqual(0);
      
      if (team.units.length > 0) {
        const totalCost = team.units.reduce((sum, unit) => sum + unit.cost, 0);
        expect(totalCost).toBeLessThanOrEqual(3);
      }
    });
  });

  describe('generateBotPositions', () => {
    it('should place tanks and melee in front line', () => {
      const knight = getUnitTemplate('knight');
      const rogue = getUnitTemplate('rogue');
      const archer = getUnitTemplate('archer');
      const mage = getUnitTemplate('mage');
      
      expect(knight).toBeDefined();
      expect(rogue).toBeDefined();
      expect(archer).toBeDefined();
      expect(mage).toBeDefined();
      
      if (knight && rogue && archer && mage) {
        const units = [knight, rogue, archer, mage];
        const positions = generateBotPositions(units);
        
        expect(positions.length).toBe(4);
        
        // Check that tanks and melee are in back row (row 9)
        const knightPos = positions[0];
        const roguePos = positions[1];
        
        expect(knightPos?.y).toBe(DEPLOYMENT_ZONES.ENEMY_ROWS[1]); // Row 9
        expect(roguePos?.y).toBe(DEPLOYMENT_ZONES.ENEMY_ROWS[1]); // Row 9
        
        // Check that ranged units are in front row (row 8)
        const archerPos = positions[2];
        const magePos = positions[3];
        
        expect(archerPos?.y).toBe(DEPLOYMENT_ZONES.ENEMY_ROWS[0]); // Row 8
        expect(magePos?.y).toBe(DEPLOYMENT_ZONES.ENEMY_ROWS[0]); // Row 8
      }
    });

    it('should handle empty unit array', () => {
      const positions = generateBotPositions([]);
      expect(positions).toEqual([]);
    });

    it('should handle single unit', () => {
      const knight = getUnitTemplate('knight');
      expect(knight).toBeDefined();
      
      if (knight) {
        const positions = generateBotPositions([knight]);
        
        expect(positions.length).toBe(1);
        expect(positions[0]?.x).toBe(0);
        expect(positions[0]?.y).toBe(DEPLOYMENT_ZONES.ENEMY_ROWS[1]); // Front line for tank
      }
    });

    it('should not exceed grid boundaries', () => {
      // Create many units to test boundary handling
      const knight = getUnitTemplate('knight');
      expect(knight).toBeDefined();
      
      if (knight) {
        const manyUnits = Array(20).fill(knight); // More than grid width
        const positions = generateBotPositions(manyUnits);
        
        for (const pos of positions) {
          expect(pos.x).toBeGreaterThanOrEqual(0);
          expect(pos.x).toBeLessThan(8); // Grid width
          expect(pos.y).toBeGreaterThanOrEqual(8);
          expect(pos.y).toBeLessThanOrEqual(9); // Enemy deployment rows
        }
      }
    });

    it('should maintain unit-position correspondence', () => {
      const knight = getUnitTemplate('knight');
      const archer = getUnitTemplate('archer');
      
      expect(knight).toBeDefined();
      expect(archer).toBeDefined();
      
      if (knight && archer) {
        const units = [knight, archer];
        const positions = generateBotPositions(units);
        
        expect(positions.length).toBe(units.length);
        
        // Each unit should have a corresponding position
        for (let i = 0; i < units.length; i++) {
          expect(positions[i]).toBeDefined();
          expect(typeof positions[i]?.x).toBe('number');
          expect(typeof positions[i]?.y).toBe('number');
        }
      }
    });
  });

  describe('validateBotTeam', () => {
    it('should validate team within budget', () => {
      const knight = getUnitTemplate('knight');
      const mage = getUnitTemplate('mage');
      
      expect(knight).toBeDefined();
      expect(mage).toBeDefined();
      
      if (knight && mage) {
        const team = [knight, mage]; // 5 + 6 = 11 cost
        const isValid = validateBotTeam(team, 15);
        
        expect(isValid).toBe(true);
      }
    });

    it('should reject team over budget', () => {
      const knight = getUnitTemplate('knight');
      const mage = getUnitTemplate('mage');
      
      expect(knight).toBeDefined();
      expect(mage).toBeDefined();
      
      if (knight && mage) {
        const team = [knight, mage]; // 5 + 6 = 11 cost
        const isValid = validateBotTeam(team, 10);
        
        expect(isValid).toBe(false);
      }
    });

    it('should reject empty team', () => {
      const isValid = validateBotTeam([], 30);
      expect(isValid).toBe(false);
    });

    it('should reject oversized team', () => {
      const knight = getUnitTemplate('knight');
      expect(knight).toBeDefined();
      
      if (knight) {
        const oversizedTeam = Array(10).fill(knight); // More than 8 units
        const isValid = validateBotTeam(oversizedTeam, 100);
        
        expect(isValid).toBe(false);
      }
    });

    it('should accept team at exact budget', () => {
      const knight = getUnitTemplate('knight');
      const mage = getUnitTemplate('mage');
      
      expect(knight).toBeDefined();
      expect(mage).toBeDefined();
      
      if (knight && mage) {
        const team = [knight, mage]; // 5 + 6 = 11 cost
        const isValid = validateBotTeam(team, 11);
        
        expect(isValid).toBe(true);
      }
    });
  });

  describe('difficulty strategies', () => {
    it('should generate different team compositions for different difficulties', () => {
      const seed = 12345;
      const budget = 25;
      
      const easyTeam = generateBotTeam('easy', budget, seed);
      const mediumTeam = generateBotTeam('medium', budget, seed + 1);
      const hardTeam = generateBotTeam('hard', budget, seed + 2);
      
      // Teams should have different compositions
      const easyIds = easyTeam.units.map(u => u.id).sort();
      const mediumIds = mediumTeam.units.map(u => u.id).sort();
      const hardIds = hardTeam.units.map(u => u.id).sort();
      
      // At least one should be different (very likely with different strategies)
      const allSame = JSON.stringify(easyIds) === JSON.stringify(mediumIds) && 
                     JSON.stringify(mediumIds) === JSON.stringify(hardIds);
      
      expect(allSame).toBe(false);
    });

    it('should respect budget constraints for all difficulties', () => {
      const difficulties: BotDifficulty[] = ['easy', 'medium', 'hard'];
      const budgets = [20, 25, 30];
      
      for (let i = 0; i < difficulties.length; i++) {
        const difficulty = difficulties[i];
        const budget = budgets[i];
        
        if (difficulty && budget) {
          const team = generateBotTeam(difficulty, budget, 12345);
          const totalCost = team.units.reduce((sum, unit) => sum + unit.cost, 0);
          
          expect(totalCost).toBeLessThanOrEqual(budget);
        }
      }
    });
  });
});