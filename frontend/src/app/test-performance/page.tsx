/**
 * Performance Test page for Fantasy Autobattler.
 * Tests and demonstrates performance optimizations.
 */

'use client';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Navigation, NavigationWrapper } from '@/components/Navigation';
import { UnitCard } from '@/components/UnitCard';
import { BudgetIndicator } from '@/components/BudgetIndicator';
import { VirtualizedUnitList } from '@/components/VirtualizedUnitList';
import { UnitTemplate, UnitRole } from '@/types/game';

/**
 * Generate mock units for performance testing.
 */
function generateMockUnits(count: number): UnitTemplate[] {
  const roles: UnitRole[] = ['tank', 'melee_dps', 'ranged_dps', 'mage', 'support', 'control'];
  const units: UnitTemplate[] = [];
  
  for (let i = 0; i < count; i++) {
    const role = roles[i % roles.length] as UnitRole;
    units.push({
      id: `unit-${i}` as any,
      name: `Test Unit ${i + 1}`,
      role,
      cost: Math.floor(Math.random() * 6) + 3,
      stats: {
        hp: Math.floor(Math.random() * 20) + 10,
        atk: Math.floor(Math.random() * 10) + 5,
        atkCount: 1,
        armor: Math.floor(Math.random() * 5),
        speed: Math.floor(Math.random() * 3) + 1,
        initiative: Math.floor(Math.random() * 10) + 1,
        dodge: Math.floor(Math.random() * 20),
      },
      range: Math.floor(Math.random() * 4) + 1,
      abilities: [],
    });
  }
  
  return units;
}

/**
 * Performance metrics tracker.
 */
interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  componentCount: number;
}

/**
 * Performance test page component.
 */
export default function TestPerformancePage() {
  const [unitCount, setUnitCount] = useState(50);
  const [selectedUnit, setSelectedUnit] = useState<UnitTemplate | null>(null);
  const [budget, setBudget] = useState(25);
  const [useVirtualization, setUseVirtualization] = useState(true);
  const [useMemoization, setUseMemoization] = useState(true);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  
  // Generate units with memoization
  const units = useMemo(() => {
    if (!useMemoization) {
      return generateMockUnits(unitCount);
    }
    return generateMockUnits(unitCount);
  }, [unitCount, useMemoization]);
  
  // Memoized handlers
  const handleUnitSelect = useCallback((unit: UnitTemplate) => {
    setSelectedUnit(unit);
  }, []);
  
  const handleUnitLongPress = useCallback((_unit: UnitTemplate) => {
    // Mock long press action
  }, []);
  
  // Performance measurement
  useEffect(() => {
    const startTime = performance.now();
    
    // Measure after render
    const measurePerformance = () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Get memory usage if available
      const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;
      
      setMetrics({
        renderTime,
        memoryUsage,
        componentCount: unitCount,
      });
    };
    
    // Use requestAnimationFrame to measure after render
    requestAnimationFrame(measurePerformance);
  }, [unitCount, useVirtualization, useMemoization]);
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navigation />
      
      <NavigationWrapper>
        <div className="container mx-auto p-6">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
              🚀 Performance Test
            </h1>
            <p className="text-gray-300 mb-4">
              Testing React.memo, useMemo, useCallback, and virtualization optimizations
            </p>
          </div>

          {/* Controls */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-4">🎛️ Test Controls</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Unit Count: {unitCount}
                </label>
                <input
                  type="range"
                  min="10"
                  max="200"
                  step="10"
                  value={unitCount}
                  onChange={(e) => setUnitCount(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Budget: {budget}/30
                </label>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={useVirtualization}
                    onChange={(e) => setUseVirtualization(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Use Virtualization</span>
                </label>
              </div>
              
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={useMemoization}
                    onChange={(e) => setUseMemoization(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Use Memoization</span>
                </label>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          {metrics && (
            <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4">📊 Performance Metrics</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-400">
                    {metrics.renderTime.toFixed(2)}ms
                  </div>
                  <div className="text-sm text-gray-400">Render Time</div>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-400">
                    {(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB
                  </div>
                  <div className="text-sm text-gray-400">Memory Usage</div>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-400">
                    {metrics.componentCount}
                  </div>
                  <div className="text-sm text-gray-400">Components</div>
                </div>
              </div>
            </div>
          )}

          {/* Budget Indicator Test */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-4">💰 Budget Indicator (React.memo)</h2>
            <BudgetIndicator current={budget} max={30} variant="bar" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Unit Cards Test */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4">
                🃏 Unit Cards ({useVirtualization ? 'Virtualized' : 'Regular'})
              </h2>
              
              {useVirtualization && unitCount >= 20 ? (
                <VirtualizedUnitList
                  units={units}
                  height={400}
                  onUnitSelect={handleUnitSelect}
                  onUnitLongPress={handleUnitLongPress}
                  selectedUnit={selectedUnit}
                  className="border border-gray-600 rounded"
                />
              ) : (
                <div className="h-96 overflow-y-auto border border-gray-600 rounded p-2 space-y-2">
                  {units.slice(0, 20).map((unit) => (
                    <UnitCard
                      key={unit.id}
                      unit={unit}
                      variant="list"
                      selected={selectedUnit?.id === unit.id}
                      onClick={() => handleUnitSelect(unit)}
                      onLongPress={() => handleUnitLongPress(unit)}
                    />
                  ))}
                  {unitCount > 20 && (
                    <div className="text-center text-gray-400 py-4">
                      ... and {unitCount - 20} more units
                      <br />
                      <span className="text-sm">
                        (Enable virtualization to see all)
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selected Unit Details */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4">🎯 Selected Unit</h2>
              
              {selectedUnit ? (
                <div className="space-y-4">
                  <UnitCard
                    unit={selectedUnit}
                    variant="grid"
                    selected={true}
                  />
                  
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="font-bold mb-2">Stats</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>HP: {selectedUnit.stats.hp}</div>
                      <div>ATK: {selectedUnit.stats.atk}</div>
                      <div>Armor: {selectedUnit.stats.armor}</div>
                      <div>Speed: {selectedUnit.stats.speed}</div>
                      <div>Initiative: {selectedUnit.stats.initiative}</div>
                      <div>Dodge: {selectedUnit.stats.dodge}%</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  Select a unit to see details
                </div>
              )}
            </div>
          </div>

          {/* Performance Tips */}
          <div className="bg-gray-800 rounded-lg p-6 mt-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-4">💡 Performance Tips</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h3 className="font-semibold text-green-400 mb-2">✅ Optimizations Applied</h3>
                <ul className="space-y-1 text-gray-300">
                  <li>• React.memo on UnitCard, BudgetIndicator, GridCell</li>
                  <li>• useMemo for filtered/sorted unit lists</li>
                  <li>• useCallback for event handlers</li>
                  <li>• Virtualization for 20+ units</li>
                  <li>• Bundle splitting in Next.js config</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-blue-400 mb-2">📈 Performance Targets</h3>
                <ul className="space-y-1 text-gray-300">
                  <li>• Render time: &lt; 16ms (60 FPS)</li>
                  <li>• Memory usage: &lt; 50MB</li>
                  <li>• Lighthouse score: &gt; 90</li>
                  <li>• First Contentful Paint: &lt; 1.5s</li>
                  <li>• Time to Interactive: &lt; 3s</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </NavigationWrapper>
    </div>
  );
}