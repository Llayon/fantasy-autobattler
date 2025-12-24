/**
 * TeamSummary Test Page for Fantasy Autobattler.
 * Tests both compact and full variants with different team compositions.
 * 
 * @fileoverview Comprehensive testing interface for TeamSummary component.
 */

'use client';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { TeamSummary, PlacedUnit } from '@/components/TeamSummary';
import { UnitTemplate } from '@/types/game';

// Mock unit templates for testing
const mockUnitTemplates: UnitTemplate[] = [
  // Tanks
  {
    id: 'knight',
    name: 'Knight',
    role: 'tank',
    cost: 5,
    stats: { hp: 120, atk: 25, atkCount: 1, armor: 8, speed: 2, initiative: 3, dodge: 5 },
    range: 1,
    abilities: ['Taunt', 'Shield Bash'],
  },
  {
    id: 'guardian',
    name: 'Guardian',
    role: 'tank',
    cost: 6,
    stats: { hp: 150, atk: 20, atkCount: 1, armor: 10, speed: 1, initiative: 2, dodge: 0 },
    range: 1,
    abilities: ['Fortress', 'Heal'],
  },
  // Melee DPS
  {
    id: 'rogue',
    name: 'Rogue',
    role: 'melee_dps',
    cost: 4,
    stats: { hp: 80, atk: 35, atkCount: 2, armor: 2, speed: 4, initiative: 8, dodge: 15 },
    range: 1,
    abilities: ['Backstab', 'Stealth'],
  },
  {
    id: 'assassin',
    name: 'Assassin',
    role: 'melee_dps',
    cost: 6,
    stats: { hp: 70, atk: 50, atkCount: 1, armor: 1, speed: 5, initiative: 9, dodge: 20 },
    range: 1,
    abilities: ['Critical Strike', 'Shadow Step'],
  },
  // Ranged DPS
  {
    id: 'archer',
    name: 'Archer',
    role: 'ranged_dps',
    cost: 4,
    stats: { hp: 90, atk: 30, atkCount: 2, armor: 3, speed: 3, initiative: 6, dodge: 10 },
    range: 4,
    abilities: ['Multi-Shot', 'Aimed Shot'],
  },
  // Mages
  {
    id: 'mage',
    name: 'Mage',
    role: 'mage',
    cost: 5,
    stats: { hp: 75, atk: 40, atkCount: 1, armor: 1, speed: 2, initiative: 5, dodge: 5 },
    range: 3,
    abilities: ['Fireball', 'Magic Shield'],
  },
  {
    id: 'warlock',
    name: 'Warlock',
    role: 'mage',
    cost: 6,
    stats: { hp: 85, atk: 45, atkCount: 1, armor: 2, speed: 2, initiative: 4, dodge: 8 },
    range: 3,
    abilities: ['Dark Bolt', 'Life Drain'],
  },
  // Support
  {
    id: 'priest',
    name: 'Priest',
    role: 'support',
    cost: 4,
    stats: { hp: 95, atk: 15, atkCount: 1, armor: 4, speed: 2, initiative: 3, dodge: 5 },
    range: 2,
    abilities: ['Heal', 'Blessing'],
  },
  // Control
  {
    id: 'enchanter',
    name: 'Enchanter',
    role: 'control',
    cost: 7,
    stats: { hp: 100, atk: 25, atkCount: 1, armor: 3, speed: 2, initiative: 7, dodge: 12 },
    range: 2,
    abilities: ['Charm', 'Slow', 'Dispel'],
  },
];

// Test team compositions
const testTeams: Record<string, PlacedUnit[]> = {
  empty: [],
  
  balanced: [
    { unitId: 'knight', position: { x: 0, y: 0 } },
    { unitId: 'rogue', position: { x: 1, y: 0 } },
    { unitId: 'archer', position: { x: 2, y: 0 } },
    { unitId: 'mage', position: { x: 3, y: 0 } },
    { unitId: 'priest', position: { x: 4, y: 0 } },
  ],
  
  tankHeavy: [
    { unitId: 'knight', position: { x: 0, y: 0 } },
    { unitId: 'guardian', position: { x: 1, y: 0 } },
    { unitId: 'knight', position: { x: 2, y: 0 } },
    { unitId: 'priest', position: { x: 3, y: 0 } },
  ],
  
  dpsRush: [
    { unitId: 'assassin', position: { x: 0, y: 0 } },
    { unitId: 'rogue', position: { x: 1, y: 0 } },
    { unitId: 'archer', position: { x: 2, y: 0 } },
    { unitId: 'mage', position: { x: 3, y: 0 } },
    { unitId: 'warlock', position: { x: 4, y: 0 } },
    { unitId: 'rogue', position: { x: 0, y: 1 } },
  ],
  
  magicControl: [
    { unitId: 'enchanter', position: { x: 0, y: 0 } },
    { unitId: 'mage', position: { x: 1, y: 0 } },
    { unitId: 'warlock', position: { x: 2, y: 0 } },
    { unitId: 'priest', position: { x: 3, y: 0 } },
  ],
  
  single: [
    { unitId: 'knight', position: { x: 0, y: 0 } },
  ],
};

/**
 * TeamSummary Test Page component.
 * 
 * @returns TeamSummary test page component
 */
export default function TeamSummaryTestPage() {
  const [selectedTeam, setSelectedTeam] = useState<string>('balanced');

  const currentUnits = testTeams[selectedTeam] || [];

  /**
   * Calculate expected values for validation.
   */
  const calculateExpected = (units: PlacedUnit[]) => {
    let totalHp = 0;
    let estimatedDps = 0;
    let totalInitiative = 0;
    const roles: Record<string, number> = {};

    units.forEach(unit => {
      const template = mockUnitTemplates.find(t => t.id === unit.unitId);
      if (template) {
        totalHp += template.stats.hp;
        estimatedDps += template.stats.atk * template.stats.atkCount;
        totalInitiative += template.stats.initiative;
        
        const role = template.role;
        roles[role] = (roles[role] || 0) + 1;
      }
    });

    return {
      unitCount: units.length,
      totalHp,
      estimatedDps,
      averageInitiative: units.length > 0 ? Math.round(totalInitiative / units.length) : 0,
      roles,
    };
  };

  const expected = calculateExpected(currentUnits);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">📊 TeamSummary Test Suite</h1>
          <p className="text-gray-400">
            Test both compact and full variants with different team compositions
          </p>
        </div>

        {/* Team Selection */}
        <div className="bg-gray-800/50 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">🎛️ Team Selection</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.keys(testTeams).map((teamKey) => (
              <button
                key={teamKey}
                onClick={() => setSelectedTeam(teamKey)}
                className={`
                  px-4 py-2 rounded-lg transition-all text-sm font-medium
                  ${selectedTeam === teamKey
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }
                `}
              >
                {teamKey.charAt(0).toUpperCase() + teamKey.slice(1)}
                <div className="text-xs opacity-75">
                  {testTeams[teamKey]?.length || 0} units
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Expected Values */}
        <div className="bg-gray-800/50 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">🧮 Expected Values</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-gray-700/50 rounded p-3">
              <div className="text-gray-400 mb-1">Unit Count</div>
              <div className="text-white font-bold">{expected.unitCount}</div>
            </div>
            <div className="bg-gray-700/50 rounded p-3">
              <div className="text-gray-400 mb-1">Total HP</div>
              <div className="text-green-400 font-bold">{expected.totalHp}</div>
            </div>
            <div className="bg-gray-700/50 rounded p-3">
              <div className="text-gray-400 mb-1">Est. DPS</div>
              <div className="text-orange-400 font-bold">{expected.estimatedDps}</div>
            </div>
            <div className="bg-gray-700/50 rounded p-3">
              <div className="text-gray-400 mb-1">Avg Initiative</div>
              <div className="text-yellow-400 font-bold">{expected.averageInitiative}</div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="text-gray-400 mb-2">Role Distribution:</div>
            <div className="text-sm">
              {Object.entries(expected.roles).map(([role, count]) => (
                <span key={role} className="mr-3">
                  {role}: {count}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Component Tests */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Compact Variant */}
          <div>
            <h2 className="text-xl font-bold mb-4">📱 Compact Variant</h2>
            
            <div className="space-y-4">
              <div className="bg-gray-800/30 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-3">Default Styling</h3>
                <TeamSummary
                  units={currentUnits}
                  unitTemplates={mockUnitTemplates}
                  variant="compact"
                />
              </div>
              
              <div className="bg-gray-800/30 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-3">In Header Context</h3>
                <div className="bg-gray-700/50 rounded p-3 flex items-center justify-between">
                  <span className="text-white font-medium">Team Status</span>
                  <TeamSummary
                    units={currentUnits}
                    unitTemplates={mockUnitTemplates}
                    variant="compact"
                  />
                </div>
              </div>
              
              <div className="bg-gray-800/30 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-3">In Card Context</h3>
                <div className="bg-blue-900/30 border border-blue-500 rounded p-3">
                  <div className="text-white font-medium mb-2">Active Team</div>
                  <TeamSummary
                    units={currentUnits}
                    unitTemplates={mockUnitTemplates}
                    variant="compact"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Full Variant */}
          <div>
            <h2 className="text-xl font-bold mb-4">📋 Full Variant</h2>
            
            <div className="space-y-4">
              <div className="bg-gray-800/30 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-3">Default Styling</h3>
                <TeamSummary
                  units={currentUnits}
                  unitTemplates={mockUnitTemplates}
                  variant="full"
                />
              </div>
              
              <div className="bg-gray-800/30 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-3">In Sidebar Context</h3>
                <div className="bg-gray-700/50 rounded p-4">
                  <div className="text-white font-medium mb-3">Team Statistics</div>
                  <TeamSummary
                    units={currentUnits}
                    unitTemplates={mockUnitTemplates}
                    variant="full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Team Composition Details */}
        <div className="bg-gray-800/50 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">🔍 Team Composition Details</h2>
          
          {currentUnits.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentUnits
                .map((unit, index) => {
                  const template = mockUnitTemplates.find(t => t.id === unit.unitId);
                  return template ? { unit, template, index } : null;
                })
                .filter((item): item is NonNullable<typeof item> => item !== null)
                .map(({ unit, template, index }) => (
                  <div key={index} className="bg-gray-700/50 rounded p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{template.role === 'tank' ? '🛡️' : 
                                                   template.role === 'melee_dps' ? '⚔️' : 
                                                   template.role === 'ranged_dps' ? '🏹' : 
                                                   template.role === 'mage' ? '🔮' : 
                                                   template.role === 'support' ? '💚' : '✨'}</span>
                      <span className="font-medium text-white">{template.name}</span>
                    </div>
                    <div className="text-xs text-gray-400 space-y-1">
                      <div>HP: {template.stats.hp} | ATK: {template.stats.atk}×{template.stats.atkCount}</div>
                      <div>Init: {template.stats.initiative} | Pos: ({unit.position.x}, {unit.position.y})</div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No units in selected team
            </div>
          )}
        </div>

        {/* Usage Examples */}
        <div className="bg-blue-900/30 border border-blue-500 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">💡 Usage Examples</h2>
          
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-medium text-blue-300 mb-2">Compact Variant - Single Line</h3>
              <pre className="bg-gray-800 rounded p-3 text-gray-300 overflow-x-auto">
{`<TeamSummary
  units={placedUnits}
  unitTemplates={availableUnits}
  variant="compact"
/>`}
              </pre>
              <p className="text-gray-400 mt-2">
                Perfect for headers, cards, and space-constrained areas. Shows unit count, total HP, and role icons.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-blue-300 mb-2">Full Variant - Detailed Grid</h3>
              <pre className="bg-gray-800 rounded p-3 text-gray-300 overflow-x-auto">
{`<TeamSummary
  units={placedUnits}
  unitTemplates={availableUnits}
  variant="full"
/>`}
              </pre>
              <p className="text-gray-400 mt-2">
                Ideal for sidebars and detailed views. Shows all metrics: unit count, HP, DPS, initiative, and role distribution.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}