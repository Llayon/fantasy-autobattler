/**
 * Test page for Ability Animations in Fantasy Autobattler.
 * Demonstrates all ability animation types with interactive controls.
 * 
 * @fileoverview Comprehensive test page for ability animations including fireball, heal, stun, buff, and debuff effects.
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Position } from '@/types/game';
import { AbilityAnimation } from '@/components/AbilityAnimations';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

/**
 * Animation test configuration.
 */
interface AnimationTest {
  /** Test identifier */
  id: string;
  /** Display name */
  name: string;
  /** Animation type */
  type: 'fireball' | 'heal' | 'stun' | 'buff' | 'debuff' | 'shield' | 'lightning' | 'explosion';
  /** Description */
  description: string;
  /** Whether animation requires source position */
  requiresSource: boolean;
  /** Default configuration */
  defaultConfig: {
    fromPosition?: Position;
    toPosition: Position;
    radius?: number;
    value?: number;
  };
}

/**
 * Active animation state.
 */
interface ActiveAnimation {
  /** Animation ID */
  id: string;
  /** Animation type */
  type: 'fireball' | 'heal' | 'stun' | 'buff' | 'debuff' | 'shield' | 'lightning' | 'explosion';
  /** Animation configuration */
  config: {
    fromPosition?: Position;
    toPosition: Position;
    radius?: number;
    value?: number;
  };
  /** Start timestamp */
  startTime: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Grid dimensions for testing */
const GRID_WIDTH = 8;
const GRID_HEIGHT = 10;

/** Available animation tests */
const ANIMATION_TESTS: AnimationTest[] = [
  {
    id: 'fireball',
    name: '🔥 Fireball',
    type: 'fireball',
    description: 'Огненный шар летит к цели и взрывается',
    requiresSource: true,
    defaultConfig: {
      fromPosition: { x: 1, y: 1 },
      toPosition: { x: 6, y: 8 },
      value: 25,
    },
  },
  {
    id: 'heal',
    name: '💚 Heal',
    type: 'heal',
    description: 'Зелёные частицы исцеления на цели',
    requiresSource: false,
    defaultConfig: {
      toPosition: { x: 4, y: 5 },
      radius: 1,
      value: 15,
    },
  },
  {
    id: 'stun',
    name: '💫 Stun',
    type: 'stun',
    description: 'Звёздочки кружатся над головой',
    requiresSource: false,
    defaultConfig: {
      toPosition: { x: 3, y: 7 },
    },
  },
  {
    id: 'buff',
    name: '✨ Buff',
    type: 'buff',
    description: 'Золотое свечение усиления',
    requiresSource: false,
    defaultConfig: {
      toPosition: { x: 2, y: 3 },
      radius: 1,
    },
  },
  {
    id: 'debuff',
    name: '⬇️ Debuff',
    type: 'debuff',
    description: 'Фиолетовое свечение ослабления',
    requiresSource: false,
    defaultConfig: {
      toPosition: { x: 5, y: 6 },
      radius: 1,
    },
  },
  {
    id: 'shield',
    name: '🛡️ Shield',
    type: 'shield',
    description: 'Защитный барьер с искрами',
    requiresSource: false,
    defaultConfig: {
      toPosition: { x: 1, y: 8 },
    },
  },
  {
    id: 'lightning',
    name: '⚡ Lightning',
    type: 'lightning',
    description: 'Молния между позициями',
    requiresSource: true,
    defaultConfig: {
      fromPosition: { x: 0, y: 0 },
      toPosition: { x: 7, y: 9 },
      value: 30,
    },
  },
  {
    id: 'explosion',
    name: '💥 Explosion',
    type: 'explosion',
    description: 'Взрыв с ударной волной',
    requiresSource: false,
    defaultConfig: {
      toPosition: { x: 4, y: 4 },
      radius: 2,
      value: 40,
    },
  },
];

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generate unique animation ID.
 * 
 * @returns Unique identifier
 */
function generateAnimationId(): string {
  return `anim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get cell background color based on position.
 * 
 * @param position - Grid position
 * @returns CSS class string
 */
function getCellBackground(position: Position): string {
  const isPlayerZone = position.y <= 1;
  const isEnemyZone = position.y >= 8;
  
  if (isPlayerZone) return 'bg-blue-900/20 border-blue-600';
  if (isEnemyZone) return 'bg-red-900/20 border-red-600';
  return 'bg-gray-800/50 border-gray-600';
}

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Grid cell component for animation testing.
 */
function TestGridCell({
  position,
  onClick,
  isSelected = false,
  isSource = false,
  isTarget = false,
}: {
  position: Position;
  onClick: (position: Position) => void;
  isSelected?: boolean;
  isSource?: boolean;
  isTarget?: boolean;
}) {
  const baseClasses = 'relative w-12 h-12 border transition-all duration-200 cursor-pointer hover:bg-white/10';
  const backgroundClasses = getCellBackground(position);
  const stateClasses = [
    isSelected ? 'ring-2 ring-yellow-400' : '',
    isSource ? 'bg-green-500/30 border-green-400' : '',
    isTarget ? 'bg-red-500/30 border-red-400' : '',
  ].join(' ');
  
  return (
    <div
      className={`${baseClasses} ${backgroundClasses} ${stateClasses}`}
      onClick={() => onClick(position)}
      title={`Position (${position.x}, ${position.y})`}
    >
      {/* Grid coordinates */}
      <div className="absolute top-0 left-0 text-xs text-gray-400 leading-none">
        {position.x},{position.y}
      </div>
      
      {/* Position indicators */}
      {isSource && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-green-400 text-lg">📍</div>
        </div>
      )}
      
      {isTarget && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-red-400 text-lg">🎯</div>
        </div>
      )}
    </div>
  );
}

/**
 * Animation control panel component.
 */
function AnimationControls({
  selectedTest,
  onTestSelect,
  onTriggerAnimation,
  activeAnimations,
}: {
  selectedTest: AnimationTest | null;
  onTestSelect: (test: AnimationTest) => void;
  onTriggerAnimation: () => void;
  activeAnimations: ActiveAnimation[];
}) {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">🎮 Animation Controls</h2>
      
      {/* Animation type selector */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Select Animation Type:</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {ANIMATION_TESTS.map((test) => (
            <button
              key={test.id}
              onClick={() => onTestSelect(test)}
              className={`
                p-3 rounded-lg border-2 transition-all duration-200 text-left
                ${selectedTest?.id === test.id
                  ? 'border-blue-400 bg-blue-900/30 text-blue-300'
                  : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500 hover:bg-gray-700'
                }
              `}
            >
              <div className="font-medium text-sm">{test.name}</div>
              <div className="text-xs text-gray-400 mt-1">{test.description}</div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Selected animation info */}
      {selectedTest && (
        <div className="mb-6 p-4 bg-gray-700/50 rounded-lg">
          <h4 className="font-medium mb-2">{selectedTest.name}</h4>
          <p className="text-sm text-gray-300 mb-3">{selectedTest.description}</p>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Requires Source:</span>
              <span className="ml-2 text-white">
                {selectedTest.requiresSource ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Type:</span>
              <span className="ml-2 text-white capitalize">{selectedTest.type}</span>
            </div>
          </div>
          
          {selectedTest.requiresSource && (
            <div className="mt-3 p-2 bg-blue-900/20 border border-blue-600 rounded text-xs text-blue-300">
              💡 Click on grid to set source position (green), then target position (red)
            </div>
          )}
        </div>
      )}
      
      {/* Trigger button */}
      <div className="mb-6">
        <button
          onClick={onTriggerAnimation}
          disabled={!selectedTest}
          className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-600 disabled:opacity-50 text-white font-medium rounded-lg transition-all duration-200"
        >
          {selectedTest ? `🚀 Trigger ${selectedTest.name}` : '⚠️ Select Animation Type'}
        </button>
      </div>
      
      {/* Active animations */}
      <div>
        <h4 className="font-medium mb-2">Active Animations ({activeAnimations.length})</h4>
        {activeAnimations.length === 0 ? (
          <div className="text-sm text-gray-400 italic">No active animations</div>
        ) : (
          <div className="space-y-1">
            {activeAnimations.map((anim) => (
              <div key={anim.id} className="text-xs text-gray-300 bg-gray-700/30 px-2 py-1 rounded">
                {anim.type} - {Date.now() - anim.startTime}ms ago
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Test page for ability animations.
 * 
 * @returns JSX element
 */
export default function TestAbilityAnimationsPage(): JSX.Element {
  const [selectedTest, setSelectedTest] = useState<AnimationTest | null>(ANIMATION_TESTS[0]);
  const [sourcePosition, setSourcePosition] = useState<Position>({ x: 1, y: 1 });
  const [targetPosition, setTargetPosition] = useState<Position>({ x: 6, y: 8 });
  const [isSelectingSource, setIsSelectingSource] = useState(true);
  const [activeAnimations, setActiveAnimations] = useState<ActiveAnimation[]>([]);

  /**
   * Handle test selection.
   */
  const handleTestSelect = useCallback((test: AnimationTest) => {
    setSelectedTest(test);
    setSourcePosition(test.defaultConfig.fromPosition || { x: 1, y: 1 });
    setTargetPosition(test.defaultConfig.toPosition);
    setIsSelectingSource(test.requiresSource);
  }, []);

  /**
   * Handle grid cell click for position selection.
   */
  const handleCellClick = useCallback((position: Position) => {
    if (!selectedTest) return;

    if (selectedTest.requiresSource) {
      if (isSelectingSource) {
        setSourcePosition(position);
        setIsSelectingSource(false);
      } else {
        setTargetPosition(position);
        setIsSelectingSource(true);
      }
    } else {
      setTargetPosition(position);
    }
  }, [selectedTest, isSelectingSource]);

  /**
   * Trigger animation with current settings.
   */
  const handleTriggerAnimation = useCallback(() => {
    if (!selectedTest) return;

    const animationId = generateAnimationId();
    const newAnimation: ActiveAnimation = {
      id: animationId,
      type: selectedTest.type,
      config: {
        fromPosition: selectedTest.requiresSource ? sourcePosition : undefined,
        toPosition: targetPosition,
        radius: selectedTest.defaultConfig.radius,
        value: selectedTest.defaultConfig.value,
      },
      startTime: Date.now(),
    };

    setActiveAnimations(prev => [...prev, newAnimation]);
  }, [selectedTest, sourcePosition, targetPosition]);

  /**
   * Handle animation completion.
   */
  const handleAnimationComplete = useCallback((animationId: string) => {
    setActiveAnimations(prev => prev.filter(anim => anim.id !== animationId));
  }, []);

  /**
   * Generate grid cells.
   */
  const gridCells = [];
  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      const position = { x, y };
      const isSource = selectedTest?.requiresSource && 
                      sourcePosition.x === x && sourcePosition.y === y;
      const isTarget = targetPosition.x === x && targetPosition.y === y;
      
      gridCells.push(
        <TestGridCell
          key={`${x}-${y}`}
          position={position}
          onClick={handleCellClick}
          isSource={isSource}
          isTarget={isTarget}
        />
      );
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">🎭 Ability Animations Test</h1>
          <p className="text-gray-300 text-lg">
            Interactive testing environment for all ability animation types.
            Click on grid cells to set positions, select animation types, and trigger effects.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Animation Controls */}
          <div className="lg:col-span-1">
            <AnimationControls
              selectedTest={selectedTest}
              onTestSelect={handleTestSelect}
              onTriggerAnimation={handleTriggerAnimation}
              activeAnimations={activeAnimations}
            />
          </div>

          {/* Battle Grid */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">⚔️ Battle Grid (8×10)</h2>
                {selectedTest && (
                  <div className="text-sm text-gray-400">
                    {selectedTest.requiresSource ? (
                      isSelectingSource ? (
                        <span className="text-green-400">📍 Click to set source position</span>
                      ) : (
                        <span className="text-red-400">🎯 Click to set target position</span>
                      )
                    ) : (
                      <span className="text-blue-400">🎯 Click to set target position</span>
                    )}
                  </div>
                )}
              </div>

              {/* Grid Container */}
              <div className="relative">
                <div 
                  className="grid gap-1 mx-auto"
                  style={{ 
                    gridTemplateColumns: `repeat(${GRID_WIDTH}, minmax(0, 1fr))`,
                    maxWidth: `${GRID_WIDTH * 3.5}rem`
                  }}
                >
                  {gridCells}
                </div>

                {/* Animation Overlay */}
                <div 
                  className="absolute top-0 left-0 pointer-events-none"
                  style={{ 
                    width: `${GRID_WIDTH * 3.5}rem`,
                    height: `${GRID_HEIGHT * 3.5}rem`,
                    margin: '0 auto',
                    left: '50%',
                    transform: 'translateX(-50%)'
                  }}
                >
                  {activeAnimations.map((animation) => (
                    <AbilityAnimation
                      key={animation.id}
                      abilityType={animation.type}
                      config={animation.config}
                      onComplete={() => handleAnimationComplete(animation.id)}
                      duration={1200}
                    />
                  ))}
                </div>
              </div>

              {/* Grid Legend */}
              <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-900/20 border border-blue-600 rounded"></div>
                  <span className="text-gray-300">Player Zone (0-1)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-800/50 border border-gray-600 rounded"></div>
                  <span className="text-gray-300">Neutral Zone (2-7)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-900/20 border border-red-600 rounded"></div>
                  <span className="text-gray-300">Enemy Zone (8-9)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Animation Details */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">📋 Animation Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {ANIMATION_TESTS.map((test) => (
              <div key={test.id} className="bg-gray-700/50 rounded-lg p-4">
                <div className="font-medium text-lg mb-2">{test.name}</div>
                <div className="text-sm text-gray-300 mb-3">{test.description}</div>
                
                <div className="space-y-1 text-xs">
                  <div>
                    <span className="text-gray-400">Type:</span>
                    <span className="ml-2 text-white capitalize">{test.type}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Source Required:</span>
                    <span className="ml-2 text-white">
                      {test.requiresSource ? 'Yes' : 'No'}
                    </span>
                  </div>
                  {test.defaultConfig.radius && (
                    <div>
                      <span className="text-gray-400">Radius:</span>
                      <span className="ml-2 text-white">{test.defaultConfig.radius}</span>
                    </div>
                  )}
                  {test.defaultConfig.value && (
                    <div>
                      <span className="text-gray-400">Value:</span>
                      <span className="ml-2 text-white">{test.defaultConfig.value}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-900/20 border border-blue-600 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-3">📖 Instructions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">🎯 How to Test:</h4>
              <ol className="list-decimal list-inside space-y-1 text-gray-300">
                <li>Select an animation type from the control panel</li>
                <li>Click on grid cells to set positions (source and/or target)</li>
                <li>Click "Trigger" button to start the animation</li>
                <li>Watch the animation play on the grid</li>
                <li>Try different positions and animation types</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium mb-2">🎨 Animation Types:</h4>
              <ul className="space-y-1 text-gray-300">
                <li><strong>Fireball:</strong> Projectile with explosion</li>
                <li><strong>Heal:</strong> Green particles and glow</li>
                <li><strong>Stun:</strong> Circling stars effect</li>
                <li><strong>Buff:</strong> Golden sparkles and glow</li>
                <li><strong>Debuff:</strong> Purple energy and particles</li>
                <li><strong>Shield:</strong> Protective barrier with sparkles</li>
                <li><strong>Lightning:</strong> Electric bolt between positions</li>
                <li><strong>Explosion:</strong> Area blast with shockwave</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}