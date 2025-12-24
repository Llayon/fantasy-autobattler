/**
 * Test page for BattleReplay component improvements.
 * Tests all the enhanced features: nicknames, turn order bar, event log, unit clicks, etc.
 */

'use client';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

import { BattleReplay } from '@/components/BattleReplay';
import { BattleLog, BattleEvent, UnitTemplate } from '@/types/game';

/**
 * Mock battle data for testing BattleReplay improvements.
 */
const mockBattleLog: BattleLog = {
  id: 'test-battle-123',
  player1Id: 'player-uuid-1',
  player2Id: 'bot-uuid-2',
  winnerId: 'player-uuid-1',
  winner: 'player1',
  rounds: 5,
  status: 'completed',
  seed: 12345,
  createdAt: '2024-12-14T10:00:00Z',
  updatedAt: '2024-12-14T10:05:00Z',
  
  // Player names for testing nickname display
  player1Name: 'Александр',
  player2Name: 'Бот Василий',
  
  // Team snapshots
  player1TeamSnapshot: {
    units: [
      {
        id: 'knight',
        name: 'Knight',
        role: 'tank',
        cost: 5,
        range: 1,
        abilities: [],
        stats: {
          hp: 120,
          atk: 25,
          atkCount: 1,
          armor: 8,
          speed: 2,
          initiative: 5,
          dodge: 10,
        },
      } as UnitTemplate,
      {
        id: 'archer',
        name: 'Archer',
        role: 'ranged_dps',
        cost: 4,
        range: 4,
        abilities: [],
        stats: {
          hp: 80,
          atk: 35,
          atkCount: 1,
          armor: 2,
          speed: 3,
          initiative: 7,
          dodge: 15,
        },
      } as UnitTemplate,
      {
        id: 'mage',
        name: 'Mage',
        role: 'mage',
        cost: 6,
        range: 3,
        abilities: ['fireball'],
        stats: {
          hp: 60,
          atk: 45,
          atkCount: 1,
          armor: 1,
          speed: 2,
          initiative: 8,
          dodge: 5,
        },
      } as UnitTemplate,
    ],
    positions: [
      { x: 1, y: 0 },
      { x: 3, y: 1 },
      { x: 5, y: 0 },
    ],
  },
  
  player2TeamSnapshot: {
    units: [
      {
        id: 'berserker',
        name: 'Berserker',
        role: 'tank',
        cost: 6,
        range: 1,
        abilities: ['rage'],
        stats: {
          hp: 100,
          atk: 40,
          atkCount: 2,
          armor: 4,
          speed: 3,
          initiative: 6,
          dodge: 5,
        },
      } as UnitTemplate,
      {
        id: 'rogue',
        name: 'Rogue',
        role: 'melee_dps',
        cost: 5,
        range: 1,
        abilities: ['stealth'],
        stats: {
          hp: 70,
          atk: 50,
          atkCount: 1,
          armor: 3,
          speed: 4,
          initiative: 9,
          dodge: 25,
        },
      } as UnitTemplate,
    ],
    positions: [
      { x: 2, y: 9 },
      { x: 4, y: 8 },
    ],
  },
  
  // Battle events for testing event log and animations
  events: [
    {
      round: 1,
      type: 'round_start',
      actorId: '',
    },
    {
      round: 1,
      type: 'move',
      actorId: 'bot_rogue_1',
      fromPosition: { x: 4, y: 8 },
      toPosition: { x: 4, y: 6 },
    },
    {
      round: 1,
      type: 'attack',
      actorId: 'player_archer_1',
      targetId: 'bot_rogue_1',
    },
    {
      round: 1,
      type: 'damage',
      actorId: 'player_archer_1',
      targetId: 'bot_rogue_1',
      damage: 32,
    },
    {
      round: 2,
      type: 'round_start',
      actorId: '',
    },
    {
      round: 2,
      type: 'move',
      actorId: 'player_knight_0',
      fromPosition: { x: 1, y: 0 },
      toPosition: { x: 1, y: 2 },
    },
    {
      round: 2,
      type: 'attack',
      actorId: 'bot_berserker_0',
      targetId: 'player_knight_0',
    },
    {
      round: 2,
      type: 'damage',
      actorId: 'bot_berserker_0',
      targetId: 'player_knight_0',
      damage: 24,
    },
    {
      round: 3,
      type: 'round_start',
      actorId: '',
    },
    {
      round: 3,
      type: 'ability',
      actorId: 'player_mage_2',
      targetId: 'bot_berserker_0',
      abilityId: 'fireball',
    },
    {
      round: 3,
      type: 'damage',
      actorId: 'player_mage_2',
      targetId: 'bot_berserker_0',
      damage: 45,
    },
    {
      round: 3,
      type: 'death',
      actorId: '',
      targetId: 'bot_berserker_0',
      killedUnits: ['bot_berserker_0'],
    },
    {
      round: 4,
      type: 'round_start',
      actorId: '',
    },
    {
      round: 4,
      type: 'attack',
      actorId: 'bot_rogue_1',
      targetId: 'player_archer_1',
    },
    {
      round: 4,
      type: 'damage',
      actorId: 'bot_rogue_1',
      targetId: 'player_archer_1',
      damage: 47,
    },
    {
      round: 5,
      type: 'round_start',
      actorId: '',
    },
    {
      round: 5,
      type: 'attack',
      actorId: 'player_knight_0',
      targetId: 'bot_rogue_1',
    },
    {
      round: 5,
      type: 'damage',
      actorId: 'player_knight_0',
      targetId: 'bot_rogue_1',
      damage: 17,
    },
    {
      round: 5,
      type: 'death',
      actorId: '',
      targetId: 'bot_rogue_1',
      killedUnits: ['bot_rogue_1'],
    },
    {
      round: 5,
      type: 'battle_end',
      actorId: '',
    },
  ] as BattleEvent[],
} as BattleLog;

/**
 * Test page component for BattleReplay improvements.
 */
export default function TestBattleReplayPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto p-4">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            🧪 BattleReplay Test Page
          </h1>
          <p className="text-gray-300 mb-4">
            Testing all BattleReplay improvements: nicknames, turn order bar, event log, unit clicks
          </p>
          
          {/* Test checklist */}
          <div className="bg-gray-800 rounded-lg p-4 text-left max-w-2xl mx-auto">
            <h2 className="text-lg font-semibold text-white mb-3">✅ Test Checklist</h2>
            <div className="space-y-2 text-sm text-gray-300">
              <div>1. ✅ Player names show as "Александр" vs "Бот Василий" (not UUIDs)</div>
              <div>2. ✅ Turn Order Bar has 48×48px unit icons with HP bars underneath</div>
              <div>3. ✅ Event log uses color coding: damage=red, movement=blue, abilities=yellow</div>
              <div>4. ✅ Event descriptions use unit names instead of coordinates</div>
              <div>5. ✅ Events are grouped by rounds with separators</div>
              <div>6. ✅ Click on units in grid shows popup with current stats</div>
              <div>7. ✅ Click on units in turn order bar shows tooltip with stats</div>
              <div>8. ✅ "← Назад" button in top-right corner</div>
              <div>9. ✅ Movement paths highlighted when units move</div>
              <div>10. ✅ Current active unit highlighted in turn order bar</div>
            </div>
          </div>
        </div>
        
        {/* BattleReplay component */}
        <BattleReplay battle={mockBattleLog} />
        
        {/* Mobile responsiveness test */}
        <div className="mt-8 bg-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-white mb-3">📱 Mobile Layout Test</h2>
          <p className="text-gray-300 text-sm mb-2">
            Resize your browser window to test mobile responsiveness:
          </p>
          <div className="space-y-1 text-xs text-gray-400">
            <div>• Grid should stack vertically on mobile</div>
            <div>• Turn order bar should scroll horizontally</div>
            <div>• Event log should remain readable</div>
            <div>• Controls should be touch-friendly</div>
            <div>• Unit popups should position correctly</div>
          </div>
        </div>
        
        {/* Performance test */}
        <div className="mt-4 bg-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-white mb-3">⚡ Performance Test</h2>
          <p className="text-gray-300 text-sm mb-2">
            Test 60fps performance during replay:
          </p>
          <div className="space-y-1 text-xs text-gray-400">
            <div>• Press Play and watch for smooth animations</div>
            <div>• Try different speeds (0.5x, 1x, 2x, 4x)</div>
            <div>• Check browser DevTools Performance tab</div>
            <div>• Animations should not drop below 60fps</div>
          </div>
        </div>
      </div>
    </div>
  );
}