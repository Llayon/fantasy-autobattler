/**
 * UnitCard Variants Test Page
 * Showcases all three variants of the redesigned UnitCard component.
 * 
 * @fileoverview Test page for UnitCard list, grid, and compact variants.
 */

'use client';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { UnitTemplate, UnitRole } from '@/types/game';
import { UnitCard, UnitCardVariant } from '@/components/UnitCard';

// =============================================================================
// TEST DATA
// =============================================================================

/**
 * Sample unit templates for testing variants.
 */
const TEST_UNITS: UnitTemplate[] = [
  {
    id: 'knight',
    name: 'Рыцарь',
    role: 'tank' as UnitRole,
    cost: 5,
    stats: { hp: 150, atk: 12, atkCount: 1, armor: 8, speed: 2, initiative: 3, dodge: 5 },
    range: 1,
    abilities: ['Taunt', 'Shield Wall', 'Defensive Stance'],
  },
  {
    id: 'rogue',
    name: 'Разбойник',
    role: 'melee_dps' as UnitRole,
    cost: 4,
    stats: { hp: 80, atk: 22, atkCount: 2, armor: 2, speed: 4, initiative: 8, dodge: 15 },
    range: 1,
    abilities: ['Backstab', 'Stealth'],
  },
  {
    id: 'archer',
    name: 'Лучник',
    role: 'ranged_dps' as UnitRole,
    cost: 4,
    stats: { hp: 70, atk: 18, atkCount: 1, armor: 1, speed: 3, initiative: 6, dodge: 10 },
    range: 4,
    abilities: ['Aimed Shot', 'Multi Shot'],
  },
  {
    id: 'mage',
    name: 'Маг',
    role: 'mage' as UnitRole,
    cost: 5,
    stats: { hp: 60, atk: 25, atkCount: 1, armor: 0, speed: 2, initiative: 7, dodge: 5 },
    range: 3,
    abilities: ['Fireball', 'Magic Shield'],
  },
  {
    id: 'priest',
    name: 'Жрец',
    role: 'support' as UnitRole,
    cost: 4,
    stats: { hp: 90, atk: 8, atkCount: 1, armor: 3, speed: 2, initiative: 5, dodge: 8 },
    range: 2,
    abilities: ['Heal', 'Blessing'],
  },
  {
    id: 'enchanter',
    name: 'Чародей',
    role: 'control' as UnitRole,
    cost: 5,
    stats: { hp: 75, atk: 15, atkCount: 1, armor: 2, speed: 3, initiative: 9, dodge: 12 },
    range: 2,
    abilities: ['Sleep', 'Charm'],
  },
];

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * List variant showcase.
 */
function ListVariantShowcase() {
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-4">📋 List Variant</h2>
      <p className="text-gray-300 text-sm mb-6">
        Full information display for unit selection. Shows cost, role, name, key stats, and ability preview.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TEST_UNITS.map((unit) => (
          <UnitCard
            key={unit.id}
            unit={unit}
            variant="list"
            selected={selectedUnit === unit.id}
            onClick={() => setSelectedUnit(selectedUnit === unit.id ? null : unit.id)}
            onLongPress={() => alert(`Long press: ${unit.name}`)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Grid variant showcase.
 */
function GridVariantShowcase() {
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-4">⚔️ Grid Variant</h2>
      <p className="text-gray-300 text-sm mb-6">
        Minimal display for battle field. Shows only role icon and HP bar in compact format.
      </p>
      
      <div className="grid grid-cols-8 gap-2 max-w-md">
        {TEST_UNITS.map((unit) => (
          <UnitCard
            key={unit.id}
            unit={unit}
            variant="grid"
            selected={selectedUnit === unit.id}
            onClick={() => setSelectedUnit(selectedUnit === unit.id ? null : unit.id)}
          />
        ))}
        {/* Fill remaining grid cells */}
        {Array.from({ length: 10 }, (_, i) => (
          <div key={`empty-${i}`} className="w-16 h-20 border-2 border-dashed border-gray-600 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

/**
 * Compact variant showcase.
 */
function CompactVariantShowcase() {
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-4">💾 Compact Variant</h2>
      <p className="text-gray-300 text-sm mb-6">
        Minimal info for saved teams preview. Horizontal layout with role icon, cost, name, and key stats.
      </p>
      
      <div className="space-y-2 max-w-sm">
        {TEST_UNITS.map((unit) => (
          <UnitCard
            key={unit.id}
            unit={unit}
            variant="compact"
            selected={selectedUnit === unit.id}
            onClick={() => setSelectedUnit(selectedUnit === unit.id ? null : unit.id)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * State showcase (selected, disabled, hover).
 */
function StateShowcase() {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-4">🎭 State Showcase</h2>
      <p className="text-gray-300 text-sm mb-6">
        Different states: normal, selected, disabled. Hover effects: scale 1.02, shadow.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TEST_UNITS[0] && (
          <div>
            <h3 className="text-white font-medium mb-2">Normal</h3>
            <UnitCard
              unit={TEST_UNITS[0]}
              variant="list"
            />
          </div>
        )}
        
        {TEST_UNITS[1] && (
          <div>
            <h3 className="text-white font-medium mb-2">Selected</h3>
            <UnitCard
              unit={TEST_UNITS[1]}
              variant="list"
              selected={true}
            />
          </div>
        )}
        
        {TEST_UNITS[2] && (
          <div>
            <h3 className="text-white font-medium mb-2">Disabled</h3>
            <UnitCard
              unit={TEST_UNITS[2]}
              variant="list"
              disabled={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Interactive test section.
 */
function InteractiveTest() {
  const [variant, setVariant] = useState<UnitCardVariant>('list');
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [disabled, setDisabled] = useState(false);
  
  const testUnit = TEST_UNITS[0];
  if (!testUnit) return null;

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-4">🎮 Interactive Test</h2>
      
      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-white text-sm font-medium mb-2">Variant:</label>
          <select
            value={variant}
            onChange={(e) => setVariant(e.target.value as UnitCardVariant)}
            className="bg-gray-700 text-white rounded px-3 py-2"
          >
            <option value="list">List</option>
            <option value="grid">Grid</option>
            <option value="compact">Compact</option>
          </select>
        </div>
        
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-white">
            <input
              type="checkbox"
              checked={disabled}
              onChange={(e) => setDisabled(e.target.checked)}
              className="rounded"
            />
            Disabled
          </label>
        </div>
      </div>
      
      {/* Test unit */}
      <div className="flex justify-center">
        <UnitCard
          unit={testUnit}
          variant={variant}
          selected={selectedUnit === testUnit.id}
          disabled={disabled}
          onClick={() => setSelectedUnit(selectedUnit === testUnit.id ? null : testUnit.id)}
          onLongPress={() => alert('Long press detected!')}
        />
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * UnitCard variants test page.
 * Comprehensive showcase of all UnitCard variants and states.
 */
export default function UnitCardVariantsTestPage() {
  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">🃏 UnitCard Variants Test</h1>
          <p className="text-gray-400">
            Redesigned UnitCard component with list, grid, and compact variants
          </p>
        </div>

        {/* Variant showcases */}
        <ListVariantShowcase />
        <GridVariantShowcase />
        <CompactVariantShowcase />
        <StateShowcase />
        <InteractiveTest />

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>Click cards to select, long press for details. Hover for scale and shadow effects.</p>
        </div>
      </div>
    </div>
  );
}