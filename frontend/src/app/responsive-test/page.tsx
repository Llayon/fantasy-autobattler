/**
 * Responsive Design Test page for Fantasy Autobattler.
 * Tests all components across different screen sizes.
 * 
 * @fileoverview Comprehensive responsive design testing page.
 */

'use client';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { UnitCard } from '@/components/UnitCard';
import { EnhancedBattleGrid } from '@/components/EnhancedBattleGrid';
import { Navigation } from '@/components/Navigation';
import { ButtonLoader, Spinner } from '@/components/LoadingStates';
import { ErrorMessage } from '@/components/ErrorStates';
import { BudgetIndicator } from '@/components/BudgetIndicator';
import { ResponsiveValidator } from '@/components/ResponsiveValidator';

// Mock data for testing
const mockUnit = {
  id: 'knight' as const,
  name: 'Рыцарь',
  role: 'tank' as const,
  cost: 5,
  stats: {
    hp: 120,
    atk: 12,
    atkCount: 1,
    armor: 8,
    speed: 2,
    initiative: 4,
    dodge: 5,
  },
  range: 1,
  abilities: ['shield_wall'],
};

const mockGridUnits = [
  {
    unit: mockUnit,
    position: { x: 0, y: 0 },
    team: 'player' as const,
    alive: true,
  },
  {
    unit: { ...mockUnit, id: 'mage' as const, name: 'Маг' },
    position: { x: 1, y: 0 },
    team: 'player' as const,
    alive: true,
  },
];

/**
 * Responsive test page component.
 */
export default function ResponsiveTestPage() {
  const [selectedBreakpoint, setSelectedBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  
  const breakpoints = {
    mobile: { width: '375px', label: 'Mobile (375px)' },
    tablet: { width: '768px', label: 'Tablet (768px)' },
    desktop: { width: '1200px', label: 'Desktop (1200px)' },
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">📱 Responsive Design Test</h1>
          
          {/* Breakpoint selector */}
          <div className="flex gap-2 mb-4">
            {Object.entries(breakpoints).map(([key, { label }]) => (
              <button
                key={key}
                onClick={() => setSelectedBreakpoint(key as keyof typeof breakpoints)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedBreakpoint === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          
          {/* Current viewport info */}
          <div className="text-sm text-gray-400 mb-4">
            Current viewport: <span className="text-blue-400">{typeof window !== 'undefined' ? `${window.innerWidth}px × ${window.innerHeight}px` : 'Loading...'}</span>
          </div>
        </div>

        {/* Test container with selected width */}
        <div 
          className="mx-auto border-2 border-yellow-400 bg-gray-800 overflow-hidden"
          style={{ 
            width: breakpoints[selectedBreakpoint].width,
            minHeight: '600px'
          }}
        >
          <div className="p-4 space-y-6">
            {/* Navigation Test */}
            <section>
              <h2 className="text-xl font-bold mb-4">🧭 Navigation</h2>
              <Navigation />
            </section>

            {/* Button Tests */}
            <section>
              <h2 className="text-xl font-bold mb-4">🔘 Buttons (min 44x44px)</h2>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <ButtonLoader loading={false} size="sm">Small Button</ButtonLoader>
                  <ButtonLoader loading={false} size="md">Medium Button</ButtonLoader>
                  <ButtonLoader loading={false} size="lg">Large Button</ButtonLoader>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <button className="min-w-[44px] min-h-[44px] bg-blue-600 text-white rounded-lg px-3 py-2 text-sm">
                    44×44 Min
                  </button>
                  <button className="min-w-[44px] min-h-[44px] bg-green-600 text-white rounded-lg px-4 py-2">
                    ✅ Touch
                  </button>
                  <button className="min-w-[44px] min-h-[44px] bg-red-600 text-white rounded-lg px-4 py-2">
                    ❌ Cancel
                  </button>
                </div>
              </div>
            </section>

            {/* Text Readability */}
            <section>
              <h2 className="text-xl font-bold mb-4">📖 Text Readability</h2>
              <div className="space-y-2">
                <p className="text-xs">Extra Small Text (12px) - Should be readable</p>
                <p className="text-sm">Small Text (14px) - Good for secondary info</p>
                <p className="text-base">Base Text (16px) - Main content text</p>
                <p className="text-lg">Large Text (18px) - Headings and emphasis</p>
                <p className="text-xl">Extra Large Text (20px) - Major headings</p>
              </div>
            </section>

            {/* Unit Card Test */}
            <section>
              <h2 className="text-xl font-bold mb-4">🃏 Unit Cards</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <UnitCard unit={mockUnit} variant="compact" />
                  <UnitCard unit={mockUnit} variant="grid" />
                </div>
              </div>
            </section>

            {/* Battle Grid Test */}
            <section>
              <h2 className="text-xl font-bold mb-4">⚔️ Battle Grid</h2>
              <div className="bg-gray-700 p-4 rounded-lg">
                <EnhancedBattleGrid
                  units={mockGridUnits}
                  mode="team-builder"
                  interactive
                  disableZoom={selectedBreakpoint === 'mobile'}
                  gridId="test"
                />
              </div>
            </section>

            {/* Budget Indicator Test */}
            <section>
              <h2 className="text-xl font-bold mb-4">💰 Budget Indicator</h2>
              <BudgetIndicator current={25} max={30} variant="bar" />
            </section>

            {/* Loading States Test */}
            <section>
              <h2 className="text-xl font-bold mb-4">⏳ Loading States</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Spinner size="sm" />
                  <Spinner size="md" />
                  <Spinner size="lg" />
                  <Spinner size="xl" />
                </div>
                <ButtonLoader loading={true} loadingText="Загрузка...">
                  Loading Button
                </ButtonLoader>
              </div>
            </section>

            {/* Error States Test */}
            <section>
              <h2 className="text-xl font-bold mb-4">❌ Error States</h2>
              <ErrorMessage
                message="Тестовое сообщение об ошибке"
                severity="error"
                showRetry
                onRetry={() => alert('Retry clicked')}
              />
            </section>

            {/* Form Elements Test */}
            <section>
              <h2 className="text-xl font-bold mb-4">📝 Form Elements</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Text input (min 44px height)"
                  className="w-full min-h-[44px] px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
                <select className="w-full min-h-[44px] px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
                  <option>Select option (min 44px height)</option>
                  <option>Option 1</option>
                  <option>Option 2</option>
                </select>
                <textarea
                  placeholder="Textarea (min 44px height)"
                  className="w-full min-h-[88px] px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white resize-none"
                  rows={3}
                />
              </div>
            </section>

            {/* Touch Targets Test */}
            <section>
              <h2 className="text-xl font-bold mb-4">👆 Touch Targets</h2>
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 9 }, (_, i) => (
                  <button
                    key={i}
                    className="min-w-[44px] min-h-[44px] bg-purple-600 hover:bg-purple-500 text-white rounded-lg flex items-center justify-center text-sm"
                    onClick={() => alert(`Button ${i + 1} clicked`)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                All buttons should be minimum 44×44px for touch accessibility
              </p>
            </section>

            {/* Responsive Grid Test */}
            <section>
              <h2 className="text-xl font-bold mb-4">📐 Responsive Grids</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }, (_, i) => (
                  <div
                    key={i}
                    className="bg-blue-600 rounded-lg p-4 text-center text-white"
                  >
                    Item {i + 1}
                  </div>
                ))}
              </div>
            </section>

            {/* Overflow Test */}
            <section>
              <h2 className="text-xl font-bold mb-4">📏 Overflow Handling</h2>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="overflow-x-auto">
                  <div className="min-w-[600px] bg-gray-600 p-4 rounded">
                    <p>This content is wider than mobile screens and should scroll horizontally</p>
                    <div className="flex gap-4 mt-2">
                      {Array.from({ length: 10 }, (_, i) => (
                        <div key={i} className="min-w-[100px] bg-blue-600 p-2 rounded text-center text-white">
                          Item {i + 1}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Responsive Validator */}
        <ResponsiveValidator className="mt-8" />

        {/* Responsive Guidelines */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">📋 Responsive Design Checklist</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-bold mb-2 text-blue-400">📱 Mobile (320-480px)</h3>
              <ul className="text-sm space-y-1 text-gray-300">
                <li>✅ Single column layout</li>
                <li>✅ Touch targets ≥ 44×44px</li>
                <li>✅ Readable text ≥ 16px</li>
                <li>✅ Horizontal scrolling for wide content</li>
                <li>✅ Bottom navigation</li>
                <li>✅ Simplified interactions</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-2 text-green-400">📱 Tablet (481-768px)</h3>
              <ul className="text-sm space-y-1 text-gray-300">
                <li>✅ Two column layout</li>
                <li>✅ Larger touch targets</li>
                <li>✅ More content visible</li>
                <li>✅ Side navigation option</li>
                <li>✅ Grid layouts work better</li>
                <li>✅ Hover states available</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-2 text-purple-400">🖥️ Desktop (769px+)</h3>
              <ul className="text-sm space-y-1 text-gray-300">
                <li>✅ Multi-column layouts</li>
                <li>✅ Smaller, precise targets</li>
                <li>✅ Full feature set</li>
                <li>✅ Horizontal navigation</li>
                <li>✅ Complex interactions</li>
                <li>✅ Keyboard shortcuts</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}