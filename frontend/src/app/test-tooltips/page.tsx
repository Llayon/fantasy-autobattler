/**
 * Test page for Tooltip system verification.
 * Demonstrates all tooltip features and variants.
 * 
 * @fileoverview Tooltip testing and verification page.
 */

'use client';

import { useState } from 'react';
import {
  Tooltip,
  UnitTooltip,
  AbilityTooltip,
  StatTooltip,
  InfoTooltip,
  TooltipPlacement,
  TooltipTheme,
} from '@/components/Tooltip';

/** All placement options for testing */
const PLACEMENTS: TooltipPlacement[] = [
  'top', 'bottom', 'left', 'right',
  'top-start', 'top-end', 'bottom-start', 'bottom-end',
];

/** All theme options for testing */
const THEMES: TooltipTheme[] = ['dark', 'light', 'info', 'warning', 'error', 'success'];

/**
 * Tooltip test page component.
 * 
 * @returns Test page component
 */
export default function TooltipTestPage() {
  const [controlledOpen, setControlledOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-yellow-400 mb-2">
            💬 Tooltip System Test
          </h1>
          <p className="text-gray-400">
            Testing auto-positioning, delays, touch support, and rich content
          </p>
        </div>

        <div className="grid gap-8">
          {/* Basic Tooltips */}
          <section className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-400">
              Basic Tooltips
            </h2>
            <div className="flex flex-wrap gap-4">
              <Tooltip content="Simple text tooltip">
                <button className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500">
                  Hover me
                </button>
              </Tooltip>
              
              <Tooltip content="Click to toggle" trigger="click">
                <button className="px-4 py-2 bg-green-600 rounded hover:bg-green-500">
                  Click me
                </button>
              </Tooltip>
              
              <Tooltip content="Focus tooltip" trigger="focus">
                <input 
                  type="text" 
                  placeholder="Focus me"
                  className="px-4 py-2 bg-gray-700 rounded border border-gray-600"
                />
              </Tooltip>
            </div>
          </section>


          {/* Placement Options */}
          <section className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-green-400">
              Placement Options
            </h2>
            <div className="grid grid-cols-4 gap-4 place-items-center py-12">
              {PLACEMENTS.map((placement) => (
                <Tooltip 
                  key={placement} 
                  content={`Placement: ${placement}`}
                  placement={placement}
                >
                  <button className="px-3 py-2 bg-gray-700 rounded hover:bg-gray-600 text-sm">
                    {placement}
                  </button>
                </Tooltip>
              ))}
            </div>
          </section>

          {/* Theme Variants */}
          <section className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-purple-400">
              Theme Variants
            </h2>
            <div className="flex flex-wrap gap-4">
              {THEMES.map((theme) => (
                <Tooltip 
                  key={theme} 
                  content={`This is a ${theme} themed tooltip`}
                  theme={theme}
                >
                  <button className={`px-4 py-2 rounded capitalize ${
                    theme === 'dark' ? 'bg-gray-700' :
                    theme === 'light' ? 'bg-gray-200 text-gray-900' :
                    theme === 'info' ? 'bg-blue-600' :
                    theme === 'warning' ? 'bg-yellow-600' :
                    theme === 'error' ? 'bg-red-600' :
                    'bg-green-600'
                  }`}>
                    {theme}
                  </button>
                </Tooltip>
              ))}
            </div>
          </section>

          {/* Rich Content */}
          <section className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-orange-400">
              Rich Content Tooltips
            </h2>
            <div className="flex flex-wrap gap-4">
              <Tooltip 
                content={
                  <div className="space-y-2">
                    <h4 className="font-bold text-yellow-400">Rich Content</h4>
                    <p className="text-sm">This tooltip contains HTML elements:</p>
                    <ul className="text-xs list-disc list-inside">
                      <li>Formatted text</li>
                      <li>Multiple lines</li>
                      <li>Custom styling</li>
                    </ul>
                  </div>
                }
                maxWidth={250}
              >
                <button className="px-4 py-2 bg-orange-600 rounded hover:bg-orange-500">
                  Rich Content
                </button>
              </Tooltip>

              <Tooltip 
                content={
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🎮</span>
                    <div>
                      <div className="font-bold">Game Info</div>
                      <div className="text-xs text-gray-400">With emoji and layout</div>
                    </div>
                  </div>
                }
              >
                <button className="px-4 py-2 bg-purple-600 rounded hover:bg-purple-500">
                  With Emoji
                </button>
              </Tooltip>
            </div>
          </section>

          {/* Specialized Tooltips */}
          <section className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-cyan-400">
              Specialized Tooltips
            </h2>
            <div className="flex flex-wrap gap-6">
              {/* Unit Tooltip */}
              <UnitTooltip
                name="Knight"
                role="Tank"
                cost={5}
                stats={{
                  hp: 100,
                  atk: 15,
                  armor: 8,
                  speed: 2,
                  initiative: 3,
                  dodge: 5,
                  range: 1,
                  atkCount: 1,
                }}
                abilities={['Shield Wall', 'Taunt']}
              >
                <div className="p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600">
                  <div className="text-2xl mb-1">🛡️</div>
                  <div className="font-bold">Knight</div>
                  <div className="text-xs text-gray-400">Hover for stats</div>
                </div>
              </UnitTooltip>

              {/* Ability Tooltip */}
              <AbilityTooltip
                name="Fireball"
                description="Launches a ball of fire at the target, dealing magical damage"
                type="active"
                cooldown={3}
                value={50}
                targetType="Single Enemy"
              >
                <div className="p-4 bg-red-900/50 rounded-lg cursor-pointer hover:bg-red-900/70 border border-red-700">
                  <div className="text-2xl mb-1">🔥</div>
                  <div className="font-bold">Fireball</div>
                  <div className="text-xs text-gray-400">Hover for details</div>
                </div>
              </AbilityTooltip>

              {/* Stat Tooltip */}
              <StatTooltip
                name="Attack Power"
                value={25}
                description="Base damage dealt per attack. Reduced by target's armor for physical attacks."
                bonus={5}
              >
                <div className="p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600">
                  <div className="text-sm text-gray-400">ATK</div>
                  <div className="text-2xl font-bold text-red-400">25 <span className="text-green-400 text-sm">+5</span></div>
                </div>
              </StatTooltip>

              {/* Info Tooltip */}
              <div className="flex items-center gap-2 p-4 bg-gray-700 rounded-lg">
                <span>Budget System</span>
                <InfoTooltip 
                  content="Each team has a 30-point budget. Units cost 3-8 points based on their power level."
                />
              </div>
            </div>
          </section>

          {/* Delay & Interactive */}
          <section className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-pink-400">
              Delay & Interactive Options
            </h2>
            <div className="flex flex-wrap gap-4">
              <Tooltip content="No delay (0ms)" showDelay={0}>
                <button className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600">
                  No Delay
                </button>
              </Tooltip>

              <Tooltip content="Short delay (100ms)" showDelay={100}>
                <button className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600">
                  100ms Delay
                </button>
              </Tooltip>

              <Tooltip content="Default delay (300ms)" showDelay={300}>
                <button className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600">
                  300ms Delay
                </button>
              </Tooltip>

              <Tooltip content="Long delay (500ms)" showDelay={500}>
                <button className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600">
                  500ms Delay
                </button>
              </Tooltip>

              <Tooltip 
                content={
                  <div>
                    <p>This tooltip is interactive!</p>
                    <button className="mt-2 px-2 py-1 bg-blue-600 rounded text-xs">
                      Click me
                    </button>
                  </div>
                }
                interactive
              >
                <button className="px-4 py-2 bg-blue-700 rounded hover:bg-blue-600">
                  Interactive
                </button>
              </Tooltip>
            </div>
          </section>

          {/* Controlled Tooltip */}
          <section className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-yellow-400">
              Controlled Tooltip
            </h2>
            <div className="flex items-center gap-4">
              <Tooltip 
                content="This tooltip is controlled externally"
                isOpen={controlledOpen}
                onOpenChange={setControlledOpen}
                trigger="manual"
              >
                <button className="px-4 py-2 bg-yellow-600 rounded hover:bg-yellow-500">
                  Controlled Target
                </button>
              </Tooltip>

              <button 
                onClick={() => setControlledOpen(!controlledOpen)}
                className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
              >
                {controlledOpen ? 'Hide' : 'Show'} Tooltip
              </button>
            </div>
          </section>

          {/* Touch Support Info */}
          <section className="bg-blue-900/30 border border-blue-500 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-3 text-blue-300">
              📱 Touch Support
            </h2>
            <div className="text-sm text-blue-200 space-y-2">
              <p>On touch devices, tooltips support:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Long press (500ms) to show tooltip on hover-triggered elements</li>
                <li>Tap to toggle for click-triggered tooltips</li>
                <li>Tap outside to dismiss</li>
              </ul>
            </div>
          </section>

          {/* Auto-positioning Demo */}
          <section className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-green-400">
              Auto-Positioning (Edge Cases)
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Tooltips automatically reposition when they would overflow the viewport.
              Try hovering near the edges:
            </p>
            <div className="flex justify-between">
              <Tooltip content="I prefer top but will flip if needed" placement="top">
                <button className="px-3 py-2 bg-gray-700 rounded hover:bg-gray-600 text-sm">
                  Left Edge
                </button>
              </Tooltip>
              
              <Tooltip content="I prefer top but will flip if needed" placement="top">
                <button className="px-3 py-2 bg-gray-700 rounded hover:bg-gray-600 text-sm">
                  Center
                </button>
              </Tooltip>
              
              <Tooltip content="I prefer top but will flip if needed" placement="top">
                <button className="px-3 py-2 bg-gray-700 rounded hover:bg-gray-600 text-sm">
                  Right Edge
                </button>
              </Tooltip>
            </div>
          </section>
        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}