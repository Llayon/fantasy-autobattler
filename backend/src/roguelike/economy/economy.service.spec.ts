import { Test, TestingModule } from '@nestjs/testing';
import { EconomyService } from './economy.service';

describe('EconomyService', () => {
  let service: EconomyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EconomyService],
    }).compile();

    service = module.get<EconomyService>(EconomyService);
  });

  test('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateWinReward', () => {
    test('should return base reward for first win', () => {
      const result = service.calculateWinReward(1);

      expect(result.base).toBe(7);
      expect(result.streakBonus).toBe(0);
      expect(result.total).toBe(7);
      expect(result.isWin).toBe(true);
      expect(result.streak).toBe(1);
    });

    test('should return base reward for second win', () => {
      const result = service.calculateWinReward(2);

      expect(result.total).toBe(7);
      expect(result.streakBonus).toBe(0);
    });

    test('should add streak bonus starting from third win', () => {
      const result = service.calculateWinReward(3);

      expect(result.base).toBe(7);
      expect(result.streakBonus).toBe(2);
      expect(result.total).toBe(9);
    });

    test('should increase streak bonus for fourth win', () => {
      const result = service.calculateWinReward(4);

      expect(result.streakBonus).toBe(4);
      expect(result.total).toBe(11);
    });

    test('should increase streak bonus for fifth win', () => {
      const result = service.calculateWinReward(5);

      expect(result.streakBonus).toBe(6);
      expect(result.total).toBe(13);
    });
  });

  describe('calculateLossReward', () => {
    test('should return fixed consolation reward', () => {
      const result = service.calculateLossReward(1);

      expect(result.base).toBe(9);
      expect(result.streakBonus).toBe(0);
      expect(result.total).toBe(9);
      expect(result.isWin).toBe(false);
      expect(result.streak).toBe(1);
    });

    test('should return same reward regardless of loss streak', () => {
      const result1 = service.calculateLossReward(1);
      const result2 = service.calculateLossReward(3);

      expect(result1.total).toBe(result2.total);
    });
  });

  describe('calculateReward', () => {
    test('should call calculateWinReward for wins', () => {
      const result = service.calculateReward(true, 3);

      expect(result.isWin).toBe(true);
      expect(result.total).toBe(9); // 7 + 2 streak bonus
    });

    test('should call calculateLossReward for losses', () => {
      const result = service.calculateReward(false, 2);

      expect(result.isWin).toBe(false);
      expect(result.total).toBe(9);
    });
  });

  describe('canAfford', () => {
    test('should return true when gold >= cost', () => {
      expect(service.canAfford(10, 5)).toBe(true);
      expect(service.canAfford(5, 5)).toBe(true);
    });

    test('should return false when gold < cost', () => {
      expect(service.canAfford(4, 5)).toBe(false);
      expect(service.canAfford(0, 1)).toBe(false);
    });
  });

  describe('getStartingGold', () => {
    test('should return 10', () => {
      expect(service.getStartingGold()).toBe(10);
    });
  });

  describe('getConfig', () => {
    test('should return economy configuration', () => {
      const config = service.getConfig();

      expect(config.WIN_BASE_REWARD).toBe(7);
      expect(config.WIN_STREAK_BONUS).toBe(2);
      expect(config.WIN_STREAK_THRESHOLD).toBe(3);
      expect(config.LOSE_REWARD).toBe(9);
      expect(config.STARTING_GOLD).toBe(10);
    });
  });

  describe('projectGoldAfterWins', () => {
    test('should project gold after additional wins', () => {
      // Starting with 10 gold and 0 streak, project 3 wins
      const projected = service.projectGoldAfterWins(10, 0, 3);

      // Win 1: 7, Win 2: 7, Win 3: 9 (streak bonus starts)
      // Total: 10 + 7 + 7 + 9 = 33
      expect(projected).toBe(33);
    });

    test('should account for existing streak', () => {
      // Starting with 10 gold and 2 streak, project 2 wins
      const projected = service.projectGoldAfterWins(10, 2, 2);

      // Win 3: 9 (streak bonus), Win 4: 11
      // Total: 10 + 9 + 11 = 30
      expect(projected).toBe(30);
    });

    test('should return same gold for 0 additional wins', () => {
      expect(service.projectGoldAfterWins(25, 3, 0)).toBe(25);
    });
  });

  describe('calculateStreakTotal', () => {
    test('should calculate total gold from streak', () => {
      // 5 consecutive wins: 7 + 7 + 9 + 11 + 13 = 47
      const total = service.calculateStreakTotal(5);

      expect(total).toBe(47);
    });

    test('should return 0 for 0 streak', () => {
      expect(service.calculateStreakTotal(0)).toBe(0);
    });

    test('should return 7 for 1 win', () => {
      expect(service.calculateStreakTotal(1)).toBe(7);
    });

    test('should return 14 for 2 wins', () => {
      expect(service.calculateStreakTotal(2)).toBe(14);
    });
  });
});
