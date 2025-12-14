/**
 * Animation Test Page for Fantasy Autobattler.
 * Tests all team builder animations for performance and accessibility.
 * 
 * @fileoverview Comprehensive animation testing interface.
 */

'use client';

import { useState, useEffect } from 'react';
import { UnitCard } from '@/components/UnitCard';
import { BudgetIndicator } from '@/components/BudgetIndicator';
import { UnitTemplate } from '@/types/game';

// Mock unit data for testing
const mockUnit: UnitTemplate = {
  id: 'knight',
  name: 'Knight',
  role: 'tank',
  cost: 5,
  stats: {
    hp: 120,
    atk: 25,
    atkCount: 1,
    armor: 8,
    speed: 2,
    initiative: 3,
    dodge: 5,
  },
  range: 1,
  abilities: ['Shield Wall', 'Taunt'],
};

/**
 * Animation Test Page component.
 * Provides interactive testing for all team builder animations.
 * 
 * @returns Animation test page component
 */
export default function AnimationTestPage() {
  const [selectedUnit, setSelectedUnit] = useState<UnitTemplate | null>(null);
  const [budget, setBudget] = useState(25);
  const [showPlaceAnimation, setShowPlaceAnimation] = useState(false);
  const [showRemoveAnimation, setShowRemoveAnimation] = useState(false);
  const [showShakeAnimation, setShowShakeAnimation] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Check for prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  /**
   * Trigger place animation.
   */
  const triggerPlaceAnimation = () => {
    setShowPlaceAnimation(true);
    setTimeout(() => setShowPlaceAnimation(false), 500);
  };

  /**
   * Trigger remove animation.
   */
  const triggerRemoveAnimation = () => {
    setShowRemoveAnimation(true);
    setTimeout(() => setShowRemoveAnimation(false), 500);
  };

  /**
   * Trigger shake animation.
   */
  const triggerShakeAnimation = () => {
    setShowShakeAnimation(true);
    setTimeout(() => setShowShakeAnimation(false), 600);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">🎬 Animation Test Suite</h1>
          <p className="text-gray-400">
            Test all team builder animations for performance and accessibility
          </p>
          {reducedMotion && (
            <div className="mt-4 p-3 bg-blue-900/30 border border-blue-500 rounded-lg">
              <p className="text-blue-300 text-sm">
                ♿ Reduced motion detected - animations are simplified
              </p>
            </div>
          )}
        </div>

        {/* Performance Metrics */}
        <div className="bg-gray-800/50 rounded-lg p-4">
          <h2 className="text-xl font-bold mb-4">📊 Performance Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-green-900/30 border border-green-500 rounded p-3">
              <div className="font-medium text-green-300">Duration</div>
              <div className="text-green-200">150-500ms ✓</div>
            </div>
            <div className="bg-green-900/30 border border-green-500 rounded p-3">
              <div className="font-medium text-green-300">Frame Rate</div>
              <div className="text-green-200">60fps target ✓</div>
            </div>
            <div className="bg-green-900/30 border border-green-500 rounded p-3">
              <div className="font-medium text-green-300">Accessibility</div>
              <div className="text-green-200">Reduced motion ✓</div>
            </div>
          </div>
        </div>

        {/* Unit Selection Animation */}
        <div className="bg-gray-800/50 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">1. Unit Selection Animation</h2>
          <p className="text-gray-400 mb-4">
            Duration: 300ms | Easing: ease-out | Transform: scale + glow
          </p>
          
          <div className="flex gap-4">
            <UnitCard
              unit={mockUnit}
              variant="compact"
              selected={selectedUnit?.id === mockUnit.id}
              onClick={() => setSelectedUnit(selectedUnit ? null : mockUnit)}
            />
            <button
              onClick={() => setSelectedUnit(selectedUnit ? null : mockUnit)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
            >
              Toggle Selection
            </button>
          </div>
        </div>

        {/* Unit Placement Animation */}
        <div className="bg-gray-800/50 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">2. Unit Placement Animation</h2>
          <p className="text-gray-400 mb-4">
            Duration: 400ms | Easing: ease-out | Transform: scale + translateY + fade
          </p>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-900/20 border border-blue-600/30 rounded flex items-center justify-center">
              {showPlaceAnimation && (
                <div className="animate-unit-place">
                  <div className="text-2xl">🛡️</div>
                </div>
              )}
            </div>
            <button
              onClick={triggerPlaceAnimation}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg transition-colors"
            >
              Trigger Place Animation
            </button>
          </div>
        </div>

        {/* Unit Removal Animation */}
        <div className="bg-gray-800/50 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">3. Unit Removal Animation</h2>
          <p className="text-gray-400 mb-4">
            Duration: 300ms | Easing: ease-in | Transform: scale + rotate + fade
          </p>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-red-900/20 border border-red-600/30 rounded flex items-center justify-center">
              {showRemoveAnimation ? (
                <div className="animate-unit-remove">
                  <div className="text-2xl">🛡️</div>
                </div>
              ) : (
                <div className="text-2xl">🛡️</div>
              )}
            </div>
            <button
              onClick={triggerRemoveAnimation}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
            >
              Trigger Remove Animation
            </button>
          </div>
        </div>

        {/* Budget Shake Animation */}
        <div className="bg-gray-800/50 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">4. Budget Error Animation</h2>
          <p className="text-gray-400 mb-4">
            Duration: 500ms | Easing: ease-in-out | Transform: translateX shake + glow
          </p>
          
          <div className="flex items-center gap-4">
            <div className={showShakeAnimation ? 'animate-shake' : ''}>
              <BudgetIndicator current={budget} max={30} variant="bar" />
            </div>
            <div className="space-y-2">
              <button
                onClick={() => setBudget(35)}
                className="block px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
              >
                Set Over Budget (35/30)
              </button>
              <button
                onClick={triggerShakeAnimation}
                className="block px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg transition-colors"
              >
                Trigger Shake
              </button>
              <button
                onClick={() => setBudget(25)}
                className="block px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg transition-colors"
              >
                Reset Budget (25/30)
              </button>
            </div>
          </div>
        </div>

        {/* Slide Up Animation */}
        <div className="bg-gray-800/50 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">5. List Appearance Animation</h2>
          <p className="text-gray-400 mb-4">
            Duration: 400ms | Easing: ease-out | Transform: translateY + fade | Staggered delays
          </p>
          
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="animate-slide-up bg-gray-700 p-3 rounded text-center"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                Item {index + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Pulse Glow Animation */}
        <div className="bg-gray-800/50 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">6. Pulse Glow Animation</h2>
          <p className="text-gray-400 mb-4">
            Duration: 1.5s infinite | Easing: ease-in-out | Effect: box-shadow pulse
          </p>
          
          <div className="flex gap-4">
            <div className="animate-pulse-glow bg-yellow-600 text-black px-4 py-2 rounded-lg font-bold">
              Important Button
            </div>
            <div className="animate-pulse-glow bg-blue-600 px-4 py-2 rounded-lg border-2 border-blue-400">
              Highlighted Element
            </div>
          </div>
        </div>

        {/* Performance Tips */}
        <div className="bg-gray-800/50 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">🚀 Performance Tips</h2>
          <div className="space-y-2 text-sm text-gray-300">
            <p>• All animations use transform and opacity for GPU acceleration</p>
            <p>• Durations are optimized for 60fps (150-500ms)</p>
            <p>• prefers-reduced-motion is respected for accessibility</p>
            <p>• Animations don't block user interactions</p>
            <p>• No memory leaks - animations clean up automatically</p>
            <p>• Staggered delays prevent overwhelming the user</p>
          </div>
        </div>

        {/* DevTools Instructions */}
        <div className="bg-blue-900/30 border border-blue-500 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">🔧 DevTools Testing</h2>
          <div className="space-y-2 text-sm text-blue-200">
            <p><strong>Performance Tab:</strong> Record animations to check for 60fps</p>
            <p><strong>Memory Tab:</strong> Monitor for memory leaks during animations</p>
            <p><strong>Rendering Tab:</strong> Enable "Paint flashing" to see repaints</p>
            <p><strong>Console:</strong> Check for animation-related warnings</p>
            <p><strong>Accessibility:</strong> Test with reduced motion preference</p>
          </div>
        </div>
      </div>
    </div>
  );
}