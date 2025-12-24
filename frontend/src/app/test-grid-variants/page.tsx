/**
 * Test page for BattleGrid variants.
 * Used to verify mini, preview, and full variants work correctly.
 */

'use client';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

import { BattleGrid, GridUnit } from '@/components/BattleGrid';
import { Navigation } from '@/components/Navigation';

// Mock units for testing
const mockUnits: GridUnit[] = [
  {
    unit: {
      id: 'knight',
      name: 'Knight',
      role: 'tank',
      cost: 5,
      stats: { hp: 150, atk: 12, atkCount: 1, armor: 8, speed: 2, initiative: 3, dodge: 0 },
      range: 1,
      abilities: [],
    },
    position: { x: 1, y: 0 },
    team: 'player',
  },
  {
    unit: {
      id: 'archer',
      name: 'Archer',
      role: 'ranged_dps',
      cost: 4,
      stats: { hp: 80, atk: 18, atkCount: 1, armor: 2, speed: 3, initiative: 4, dodge: 10 },
      range: 3,
      abilities: [],
    },
    position: { x: 3, y: 1 },
    team: 'player',
  },
  {
    unit: {
      id: 'mage',
      name: 'Mage',
      role: 'mage',
      cost: 6,
      stats: { hp: 70, atk: 25, atkCount: 1, armor: 1, speed: 2, initiative: 5, dodge: 5 },
      range: 2,
      abilities: [],
    },
    position: { x: 5, y: 0 },
    team: 'player',
  },
];

/**
 * Test page component for BattleGrid variants.
 */
export default function TestGridVariants() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">
          🧪 BattleGrid Variants Test
        </h1>
        
        <div className="space-y-12">
          {/* Full Variant */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Full Variant (Default)</h2>
            <p className="text-gray-400 mb-4">
              Standard 8×10 grid with all features: legend, zoom hint, coordinates.
            </p>
            <div className="bg-gray-800 p-6 rounded-lg">
              <BattleGrid
                variant="full"
                units={mockUnits}
                mode="team-builder"
                interactive={true}
                showCoordinates={true}
                onCellClick={(pos) => console.log('Full grid clicked:', pos)}
              />
            </div>
          </section>

          {/* Mini Variant */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Mini Variant (Mobile)</h2>
            <p className="text-gray-400 mb-4">
              Compact 8×2 grid showing only player zone (rows 0-1). 
              Optimized for mobile with horizontal scroll.
            </p>
            <div className="bg-gray-800 p-6 rounded-lg">
              <BattleGrid
                variant="mini"
                units={mockUnits}
                mode="team-builder"
                interactive={true}
                onCellClick={(pos) => console.log('Mini grid clicked:', pos)}
              />
            </div>
          </section>

          {/* Preview Variant */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Preview Variant (Thumbnails)</h2>
            <p className="text-gray-400 mb-4">
              Tiny 8×10 grid for saved team previews. No interactions, minimal styling.
            </p>
            <div className="bg-gray-800 p-6 rounded-lg">
              <div className="flex gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Team 1</h3>
                  <BattleGrid
                    variant="preview"
                    units={mockUnits}
                    mode="team-builder"
                    interactive={false}
                  />
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">Team 2</h3>
                  <BattleGrid
                    variant="preview"
                    units={mockUnits.slice(0, 2)}
                    mode="team-builder"
                    interactive={false}
                  />
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">Empty Team</h3>
                  <BattleGrid
                    variant="preview"
                    units={[]}
                    mode="team-builder"
                    interactive={false}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Mobile Responsive Test */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Mobile Responsive Test</h2>
            <p className="text-gray-400 mb-4">
              Test how variants look on different screen sizes. 
              Use browser DevTools to simulate mobile.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2">Desktop: Full</h3>
                <BattleGrid
                  variant="full"
                  units={mockUnits}
                  mode="team-builder"
                  className="hidden md:block"
                />
                <BattleGrid
                  variant="mini"
                  units={mockUnits}
                  mode="team-builder"
                  className="md:hidden"
                />
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2">Always Mini</h3>
                <BattleGrid
                  variant="mini"
                  units={mockUnits}
                  mode="team-builder"
                />
              </div>
            </div>
          </section>

          {/* Battle Mode Test */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Battle Mode with HP Bars</h2>
            <p className="text-gray-400 mb-4">
              Test how variants display HP bars in battle mode.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2">Full Battle</h3>
                <BattleGrid
                  variant="full"
                  units={mockUnits.map(unit => ({ 
                    ...unit, 
                    currentHp: Math.floor(unit.unit.stats.hp * 0.7) 
                  }))}
                  mode="battle"
                />
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2">Mini Battle</h3>
                <BattleGrid
                  variant="mini"
                  units={mockUnits.map(unit => ({ 
                    ...unit, 
                    currentHp: Math.floor(unit.unit.stats.hp * 0.7) 
                  }))}
                  mode="battle"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Instructions */}
        <div className="mt-12 bg-blue-900/20 border border-blue-600/30 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">🧪 Testing Instructions</h3>
          <ul className="space-y-2 text-gray-300">
            <li>• <strong>Desktop:</strong> All variants should display correctly</li>
            <li>• <strong>Mobile:</strong> Mini variant should have horizontal scroll</li>
            <li>• <strong>Touch:</strong> Tap cells to see console logs (open DevTools)</li>
            <li>• <strong>Preview:</strong> Should be very small, no interactions</li>
            <li>• <strong>Battle mode:</strong> Should show HP bars under units</li>
            <li>• <strong>Responsive:</strong> Test with DevTools mobile emulation</li>
          </ul>
        </div>
      </div>
    </div>
  );
}