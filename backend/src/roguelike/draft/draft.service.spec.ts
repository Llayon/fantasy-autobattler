import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DraftService } from './draft.service';
import { RoguelikeRunEntity, RUN_CONSTANTS } from '../entities/run.entity';
import {
  RunNotFoundException,
  RunAccessDeniedException,
  RunAlreadyCompletedException,
  InvalidDraftPickException,
  DraftNotAvailableException,
} from '../exceptions/roguelike.exceptions';
import { DeckCard } from '../types/unit.types';

describe('DraftService', () => {
  let service: DraftService;
  let repository: {
    findOne: jest.Mock;
    save: jest.Mock;
  };

  const mockPlayerId = 'player-uuid-123';
  const mockRunId = 'run-uuid-456';

  const createMockDeckCards = (count: number): DeckCard[] => {
    return Array.from({ length: count }, (_, i) => ({
      unitId: `unit-${i}`,
      tier: 1 as const,
      instanceId: `unit-${i}-1`,
    }));
  };

  const createMockRun = (overrides: Partial<RoguelikeRunEntity> = {}): RoguelikeRunEntity => {
    const run = new RoguelikeRunEntity();
    Object.assign(run, {
      id: mockRunId,
      playerId: mockPlayerId,
      faction: 'humans' as const,
      leaderId: 'commander_aldric',
      deck: createMockDeckCards(12),
      remainingDeck: createMockDeckCards(12),
      hand: [],
      field: [],
      spells: [{ spellId: 'holy_light' }, { spellId: 'rally' }],
      wins: 0,
      losses: 0,
      consecutiveWins: 0,
      consecutiveLosses: 0,
      gold: RUN_CONSTANTS.STARTING_GOLD,
      battleHistory: [],
      status: 'active' as const,
      rating: RUN_CONSTANTS.STARTING_RATING,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    });
    return run;
  };

  beforeEach(async () => {
    repository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DraftService,
        {
          provide: getRepositoryToken(RoguelikeRunEntity),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<DraftService>(DraftService);
  });

  test('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getInitialDraft', () => {
    test('should return 5 options for initial draft', async () => {
      const mockRun = createMockRun();
      repository.findOne.mockResolvedValue(mockRun);

      const result = await service.getInitialDraft(mockRunId, mockPlayerId);

      expect(result.cards).toHaveLength(5);
      expect(result.isInitial).toBe(true);
      expect(result.requiredPicks).toBe(3);
    });

    test('should throw DraftNotAvailableException if hand is not empty', async () => {
      const mockRun = createMockRun({
        hand: createMockDeckCards(3),
      });
      repository.findOne.mockResolvedValue(mockRun);

      await expect(
        service.getInitialDraft(mockRunId, mockPlayerId),
      ).rejects.toThrow(DraftNotAvailableException);
    });

    test('should throw RunNotFoundException if run does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.getInitialDraft(mockRunId, mockPlayerId),
      ).rejects.toThrow(RunNotFoundException);
    });

    test('should throw RunAccessDeniedException if player does not own run', async () => {
      const mockRun = createMockRun({ playerId: 'other-player' });
      repository.findOne.mockResolvedValue(mockRun);

      await expect(
        service.getInitialDraft(mockRunId, mockPlayerId),
      ).rejects.toThrow(RunAccessDeniedException);
    });
  });

  describe('getPostBattleDraft', () => {
    test('should return 3 options for post-battle draft', async () => {
      // Simulate: initial draft done (3 cards), 1 battle completed
      const mockRun = createMockRun({
        hand: createMockDeckCards(3),
        remainingDeck: createMockDeckCards(9),
        wins: 1,
        losses: 0,
      });
      repository.findOne.mockResolvedValue(mockRun);

      const result = await service.getPostBattleDraft(mockRunId, mockPlayerId);

      expect(result.cards).toHaveLength(3);
      expect(result.isInitial).toBe(false);
      expect(result.requiredPicks).toBe(1);
    });

    test('should throw DraftNotAvailableException if no cards remaining', async () => {
      const mockRun = createMockRun({
        hand: createMockDeckCards(12),
        remainingDeck: [],
        wins: 1,
      });
      repository.findOne.mockResolvedValue(mockRun);

      await expect(
        service.getPostBattleDraft(mockRunId, mockPlayerId),
      ).rejects.toThrow(DraftNotAvailableException);
    });

    test('should return fewer options if deck has less than 3 cards', async () => {
      // Simulate: 10 cards received (3 initial + 7 post-battle), 7 battles done
      const mockRun = createMockRun({
        hand: createMockDeckCards(10),
        remainingDeck: createMockDeckCards(2),
        wins: 8, // 8 battles = 3 initial + 8 post-battle = 11 expected, but only 10 received
        losses: 0,
      });
      repository.findOne.mockResolvedValue(mockRun);

      const result = await service.getPostBattleDraft(mockRunId, mockPlayerId);

      expect(result.cards).toHaveLength(2);
    });
  });

  describe('submitPicks', () => {
    test('should add picked cards to hand for initial draft', async () => {
      const remainingDeck = createMockDeckCards(12);
      const mockRun = createMockRun({ remainingDeck, hand: [] });
      repository.findOne.mockResolvedValue(mockRun);
      repository.save.mockImplementation((run) => Promise.resolve(run));

      const picks = remainingDeck.slice(0, 3).map((c) => c.instanceId);
      const result = await service.submitPicks(mockRunId, mockPlayerId, picks);

      expect(result.handSize).toBe(3);
      // 12 - 3 picked = 9 remaining (unpicked cards return to deck)
      expect(result.deckRemaining).toBe(9);
    });

    test('should return unpicked cards to end of deck', async () => {
      const remainingDeck = createMockDeckCards(12);
      const mockRun = createMockRun({ remainingDeck, hand: [] });
      repository.findOne.mockResolvedValue(mockRun);
      repository.save.mockImplementation((run) => Promise.resolve(run));

      // Pick cards 0, 1, 2 from options 0-4
      const picks = remainingDeck.slice(0, 3).map((c) => c.instanceId);
      const result = await service.submitPicks(mockRunId, mockPlayerId, picks);

      // Unpicked cards (3, 4) should be at the end of remaining deck
      const lastTwoCards = result.remainingDeck.slice(-2);
      expect(lastTwoCards[0]?.instanceId).toBe(remainingDeck[3]?.instanceId);
      expect(lastTwoCards[1]?.instanceId).toBe(remainingDeck[4]?.instanceId);
    });

    test('should add picked card to hand for post-battle draft', async () => {
      const hand = createMockDeckCards(3);
      const remainingDeck = createMockDeckCards(9).map((c, i) => ({
        ...c,
        instanceId: `remaining-${i}`,
      }));
      const mockRun = createMockRun({ hand, remainingDeck });
      repository.findOne.mockResolvedValue(mockRun);
      repository.save.mockImplementation((run) => Promise.resolve(run));

      const picks = [remainingDeck[0]?.instanceId ?? ''];
      const result = await service.submitPicks(mockRunId, mockPlayerId, picks);

      expect(result.handSize).toBe(4);
      // 9 - 1 picked = 8 remaining (2 unpicked return to deck)
      expect(result.deckRemaining).toBe(8);
    });

    test('should throw InvalidDraftPickException for wrong pick count', async () => {
      const mockRun = createMockRun();
      repository.findOne.mockResolvedValue(mockRun);

      await expect(
        service.submitPicks(mockRunId, mockPlayerId, ['unit-0-1']),
      ).rejects.toThrow(InvalidDraftPickException);
    });

    test('should throw InvalidDraftPickException for invalid picks', async () => {
      const mockRun = createMockRun();
      repository.findOne.mockResolvedValue(mockRun);

      await expect(
        service.submitPicks(mockRunId, mockPlayerId, ['invalid-1', 'invalid-2', 'invalid-3']),
      ).rejects.toThrow(InvalidDraftPickException);
    });

    test('should throw InvalidDraftPickException for duplicate picks', async () => {
      const remainingDeck = createMockDeckCards(12);
      const mockRun = createMockRun({ remainingDeck, hand: [] });
      repository.findOne.mockResolvedValue(mockRun);

      const firstCard = remainingDeck[0]?.instanceId ?? '';
      await expect(
        service.submitPicks(mockRunId, mockPlayerId, [firstCard, firstCard, firstCard]),
      ).rejects.toThrow(InvalidDraftPickException);
    });

    test('should throw RunAlreadyCompletedException for completed run', async () => {
      const mockRun = createMockRun({ status: 'won' });
      repository.findOne.mockResolvedValue(mockRun);

      await expect(
        service.submitPicks(mockRunId, mockPlayerId, ['unit-0-1', 'unit-1-1', 'unit-2-1']),
      ).rejects.toThrow(RunAlreadyCompletedException);
    });

    test('should eventually get all 12 cards to hand after full draft cycle', async () => {
      // Simulate full draft cycle: initial (3 from 5) + 9 post-battle (1 from 3 each)
      const remainingDeck = createMockDeckCards(12);
      let currentHand: DeckCard[] = [];
      let currentDeck = [...remainingDeck];

      // Initial draft: pick 3 from 5
      const mockRun1 = createMockRun({ remainingDeck: currentDeck, hand: currentHand });
      repository.findOne.mockResolvedValue(mockRun1);
      repository.save.mockImplementation((run) => {
        currentHand = run.hand;
        currentDeck = run.remainingDeck;
        return Promise.resolve(run);
      });

      const initialPicks = currentDeck.slice(0, 3).map((c) => c.instanceId);
      await service.submitPicks(mockRunId, mockPlayerId, initialPicks);
      expect(currentHand.length).toBe(3);
      expect(currentDeck.length).toBe(9);

      // 9 post-battle drafts: pick 1 from 3 each
      for (let i = 0; i < 9; i++) {
        const mockRun = createMockRun({ remainingDeck: currentDeck, hand: currentHand });
        repository.findOne.mockResolvedValue(mockRun);

        const postBattlePicks = [currentDeck[0]?.instanceId ?? ''];
        await service.submitPicks(mockRunId, mockPlayerId, postBattlePicks);
      }

      // All 12 cards should be in hand
      expect(currentHand.length).toBe(12);
      expect(currentDeck.length).toBe(0);
    });
  });

  describe('isDraftAvailable', () => {
    test('should return available=true and isInitial=true for new run', async () => {
      const mockRun = createMockRun();
      repository.findOne.mockResolvedValue(mockRun);

      const result = await service.isDraftAvailable(mockRunId, mockPlayerId);

      expect(result.available).toBe(true);
      expect(result.isInitial).toBe(true);
    });

    test('should return available=true and isInitial=false after battle (post-battle draft)', async () => {
      // After initial draft (3 cards) and 1 battle, player should have post-battle draft available
      // totalBattles = 1, totalCardsReceived = 3, expectedCards = 3 + 1 = 4
      // 3 < 4 = true, so draft is available
      const mockRun = createMockRun({
        hand: createMockDeckCards(3),
        remainingDeck: createMockDeckCards(9),
        wins: 1,
        losses: 0,
      });
      repository.findOne.mockResolvedValue(mockRun);

      const result = await service.isDraftAvailable(mockRunId, mockPlayerId);

      expect(result.available).toBe(true);
      expect(result.isInitial).toBe(false);
    });

    test('should return available=false after initial draft without battle', async () => {
      // After initial draft (3 cards) but no battle yet, draft should NOT be available
      const mockRun = createMockRun({
        hand: createMockDeckCards(3),
        remainingDeck: createMockDeckCards(9),
        wins: 0,
        losses: 0,
      });
      repository.findOne.mockResolvedValue(mockRun);

      const result = await service.isDraftAvailable(mockRunId, mockPlayerId);

      expect(result.available).toBe(false);
      expect(result.isInitial).toBe(false);
    });

    test('should return available=false when no cards remaining', async () => {
      const mockRun = createMockRun({
        hand: createMockDeckCards(12),
        remainingDeck: [],
      });
      repository.findOne.mockResolvedValue(mockRun);

      const result = await service.isDraftAvailable(mockRunId, mockPlayerId);

      expect(result.available).toBe(false);
      expect(result.reason).toBeDefined();
    });

    test('should return available=false for completed run', async () => {
      const mockRun = createMockRun({ status: 'lost' });
      repository.findOne.mockResolvedValue(mockRun);

      const result = await service.isDraftAvailable(mockRunId, mockPlayerId);

      expect(result.available).toBe(false);
      expect(result.reason).toBe('Забег завершен');
    });
  });
});
