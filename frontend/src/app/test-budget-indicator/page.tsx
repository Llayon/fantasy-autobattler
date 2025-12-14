/**
 * Budget Indicator Test Page for Fantasy Autobattler.
 * Tests both variants and all color states with animations.
 * 
 * @fileoverview Comprehensive budget indicator testing interface.
 */

'use client';

import { useState, useEffect } from 'react';
import { BudgetIndicator } from '@/components/BudgetIndicator';

/**
 * Budget display variants.
 */
type BudgetVariant = 'bar' | 'compact';

/**
 * Budget Indicator Test Page component.
 * Provides interactive testing for both variants and all states.
 * 
 * @returns Budget indicator test page component
 */
export default function BudgetIndicatorTestPage() {
  const [budget, setBudget] = useState(15);
  const [variant, setVariant] = useState<BudgetVariant>('bar');
  const [autoDemo, setAutoDemo] = useState(false);
  const maxBudget = 30;

  // Auto demo that cycles through different budget values
  useEffect(() => {
    if (!autoDemo) return;

    const values = [5, 15, 20, 25, 28, 32, 35, 25, 15];
    let index = 0;

    const interval = setInterval(() => {
      const currentValue = values[index];
      if (currentValue !== undefined) {
        setBudget(currentValue);
      }
      index = (index + 1) % values.length;
    }, 2000);

    return () => clearInterval(interval);
  }, [autoDemo]);

  /**
   * Get status description based on budget percentage.
   */
  const getStatusDescription = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    
    if (percentage > 100) return 'Over Budget (>100%) - Red + Shake';
    if (percentage >= 80) return 'Danger (80-100%) - Orange';
    if (percentage >= 50) return 'Warning (50-80%) - Yellow';
    return 'Safe (0-50%) - Green';
  };

  const percentage = Math.round((budget / maxBudget) * 100);
  const statusDescription = getStatusDescription(budget, maxBudget);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">💰 Budget Indicator Test Suite</h1>
          <p className="text-gray-400">
            Test both variants with animated counters and color transitions
          </p>
        </div>

        {/* Controls */}
        <div className="bg-gray-800/50 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">🎛️ Controls</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Budget Slider */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Budget: {budget}/{maxBudget} ({percentage}%)
              </label>
              <input
                type="range"
                min="0"
                max="40"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value) || 0)}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0</span>
                <span>20</span>
                <span>30</span>
                <span>40</span>
              </div>
            </div>

            {/* Variant Toggle */}
            <div>
              <label className="block text-sm font-medium mb-2">Variant</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setVariant('bar')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    variant === 'bar'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Bar
                </button>
                <button
                  onClick={() => setVariant('compact')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    variant === 'compact'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Compact
                </button>
              </div>
            </div>
          </div>

          {/* Auto Demo Toggle */}
          <div className="mt-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoDemo}
                onChange={(e) => setAutoDemo(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Auto Demo (cycles through all states)</span>
            </label>
          </div>
        </div>

        {/* Current Status */}
        <div className="bg-gray-800/50 rounded-lg p-4">
          <h3 className="text-lg font-bold mb-2">📊 Current Status</h3>
          <p className="text-gray-300">{statusDescription}</p>
        </div>

        {/* Budget Indicator Display */}
        <div className="bg-gray-800/50 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">
            💰 Budget Indicator - {variant === 'bar' ? 'Bar Variant' : 'Compact Variant'}
          </h2>
          
          <div className="flex justify-center">
            <BudgetIndicator
              current={budget}
              max={maxBudget}
              variant={variant}
            />
          </div>
        </div>

        {/* Quick Test Buttons */}
        <div className="bg-gray-800/50 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">🚀 Quick Tests</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => setBudget(10)}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg transition-colors text-sm"
            >
              Safe (10/30)
            </button>
            <button
              onClick={() => setBudget(20)}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg transition-colors text-sm"
            >
              Warning (20/30)
            </button>
            <button
              onClick={() => setBudget(27)}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg transition-colors text-sm"
            >
              Danger (27/30)
            </button>
            <button
              onClick={() => setBudget(35)}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors text-sm"
            >
              Over (35/30)
            </button>
          </div>
        </div>

        {/* Both Variants Side by Side */}
        <div className="bg-gray-800/50 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">🔄 Both Variants Comparison</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Variant */}
            <div>
              <h3 className="text-lg font-medium mb-3 text-center">Bar Variant</h3>
              <BudgetIndicator
                current={budget}
                max={maxBudget}
                variant="bar"
              />
            </div>

            {/* Compact Variant */}
            <div>
              <h3 className="text-lg font-medium mb-3 text-center">Compact Variant</h3>
              <div className="flex justify-center">
                <BudgetIndicator
                  current={budget}
                  max={maxBudget}
                  variant="compact"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Color Specifications */}
        <div className="bg-gray-800/50 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">🎨 Color Specifications</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="bg-green-900/30 border border-green-500 rounded p-3">
              <div className="font-medium text-green-300">Safe (0-50%)</div>
              <div className="text-green-200">#22C55E</div>
            </div>
            <div className="bg-yellow-900/30 border border-yellow-500 rounded p-3">
              <div className="font-medium text-yellow-300">Warning (50-80%)</div>
              <div className="text-yellow-200">#EAB308</div>
            </div>
            <div className="bg-orange-900/30 border border-orange-500 rounded p-3">
              <div className="font-medium text-orange-300">Danger (80-100%)</div>
              <div className="text-orange-200">#F97316</div>
            </div>
            <div className="bg-red-900/30 border border-red-500 rounded p-3">
              <div className="font-medium text-red-300">Over (&gt;100%)</div>
              <div className="text-red-200">#EF4444 + Shake</div>
            </div>
          </div>
        </div>

        {/* Features List */}
        <div className="bg-gray-800/50 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">✨ Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div>
              <h3 className="font-medium text-white mb-2">Animations</h3>
              <ul className="space-y-1">
                <li>• Animated number counter (300ms)</li>
                <li>• Smooth progress bar fill (500ms)</li>
                <li>• Shake animation when over budget</li>
                <li>• Scale effect during counter animation</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-white mb-2">Variants</h3>
              <ul className="space-y-1">
                <li>• <strong>Bar:</strong> Full progress bar with details</li>
                <li>• <strong>Compact:</strong> Just "10/30" for mobile</li>
                <li>• Percentage-based color coding</li>
                <li>• Remaining budget display</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}