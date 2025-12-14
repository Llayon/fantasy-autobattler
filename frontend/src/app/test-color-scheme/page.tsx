/**
 * Color Scheme Test Page
 * Comprehensive testing of role color system for accessibility and consistency.
 * 
 * @fileoverview Tests all role colors for WCAG AA compliance and visual consistency.
 */

'use client';

import React, { useState } from 'react';
import { UnitRole } from '@/types/game';
import { 
  ROLE_COLORS, 
  getRoleColor, 
  getRoleIcon, 
  getRoleName, 
  validateRoleColorContrast 
} from '@/lib/roleColors';
import { UnitCard } from '@/components/UnitCard';

// =============================================================================
// TEST DATA
// =============================================================================

/**
 * Sample unit templates for testing each role.
 */
const TEST_UNITS = {
  tank: {
    id: 'knight',
    name: 'Рыцарь',
    role: 'tank' as UnitRole,
    cost: 5,
    stats: { hp: 150, atk: 12, atkCount: 1, armor: 8, speed: 2, initiative: 3, dodge: 5 },
    range: 1,
    abilities: ['Taunt', 'Shield Wall'],
  },
  melee_dps: {
    id: 'rogue',
    name: 'Разбойник',
    role: 'melee_dps' as UnitRole,
    cost: 4,
    stats: { hp: 80, atk: 22, atkCount: 2, armor: 2, speed: 4, initiative: 8, dodge: 15 },
    range: 1,
    abilities: ['Backstab', 'Stealth'],
  },
  ranged_dps: {
    id: 'archer',
    name: 'Лучник',
    role: 'ranged_dps' as UnitRole,
    cost: 4,
    stats: { hp: 70, atk: 18, atkCount: 1, armor: 1, speed: 3, initiative: 6, dodge: 10 },
    range: 4,
    abilities: ['Aimed Shot', 'Multi Shot'],
  },
  mage: {
    id: 'mage',
    name: 'Маг',
    role: 'mage' as UnitRole,
    cost: 5,
    stats: { hp: 60, atk: 25, atkCount: 1, armor: 0, speed: 2, initiative: 7, dodge: 5 },
    range: 3,
    abilities: ['Fireball', 'Magic Shield'],
  },
  support: {
    id: 'priest',
    name: 'Жрец',
    role: 'support' as UnitRole,
    cost: 4,
    stats: { hp: 90, atk: 8, atkCount: 1, armor: 3, speed: 2, initiative: 5, dodge: 8 },
    range: 2,
    abilities: ['Heal', 'Blessing'],
  },
  control: {
    id: 'enchanter',
    name: 'Чародей',
    role: 'control' as UnitRole,
    cost: 5,
    stats: { hp: 75, atk: 15, atkCount: 1, armor: 2, speed: 3, initiative: 9, dodge: 12 },
    range: 2,
    abilities: ['Sleep', 'Charm'],
  },
};

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Color contrast test component.
 */
function ContrastTest() {
  const validation = validateRoleColorContrast();
  
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-4">🔍 WCAG AA Contrast Test</h2>
      <div className="space-y-3">
        {Object.entries(validation).map(([role, result]) => {
          const roleColor = getRoleColor(role as UnitRole);
          return (
            <div key={role} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-lg">{getRoleIcon(role as UnitRole)}</span>
                <span className="text-white font-medium">{getRoleName(role as UnitRole)}</span>
                <div 
                  className="px-3 py-1 rounded text-sm font-medium"
                  style={{ backgroundColor: roleColor.bg, color: roleColor.text }}
                >
                  Sample Text
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-300">Ratio: {result.ratio}:1</span>
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  result.passes ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                }`}>
                  {result.passes ? '✅ PASS' : '❌ FAIL'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 p-3 bg-blue-900/30 border border-blue-500 rounded-lg">
        <p className="text-blue-300 text-sm">
          <strong>WCAG AA Standard:</strong> Minimum contrast ratio of 4.5:1 for normal text.
          All role colors should pass this test for accessibility compliance.
        </p>
      </div>
    </div>
  );
}

/**
 * Color uniqueness test component.
 */
function UniquenessTest() {
  const roles = Object.keys(ROLE_COLORS) as UnitRole[];
  
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-4">🎨 Color Uniqueness Test</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {roles.map((role) => {
          const roleColor = getRoleColor(role);
          return (
            <div key={role} className="text-center">
              <div 
                className="w-20 h-20 rounded-lg mx-auto mb-2 flex items-center justify-center text-2xl font-bold"
                style={{ backgroundColor: roleColor.bg, color: roleColor.text }}
              >
                {getRoleIcon(role)}
              </div>
              <div className="text-white text-sm font-medium">{getRoleName(role)}</div>
              <div className="text-gray-400 text-xs font-mono">{roleColor.bg}</div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 p-3 bg-green-900/30 border border-green-500 rounded-lg">
        <p className="text-green-300 text-sm">
          <strong>Uniqueness Check:</strong> Each role should have a visually distinct color.
          Colors should be easily distinguishable even for users with color vision deficiencies.
        </p>
      </div>
    </div>
  );
}

/**
 * UnitCard integration test component.
 */
function UnitCardTest() {
  const [selectedRole, setSelectedRole] = useState<UnitRole | null>(null);
  const roles = Object.keys(TEST_UNITS) as UnitRole[];
  
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-4">🃏 UnitCard Integration Test</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => {
          const unit = TEST_UNITS[role];
          return (
            <UnitCard
              key={role}
              unit={unit}
              selected={selectedRole === role}
              onClick={() => setSelectedRole(selectedRole === role ? null : role)}
              size="compact"
            />
          );
        })}
      </div>
      <div className="mt-4 p-3 bg-purple-900/30 border border-purple-500 rounded-lg">
        <p className="text-purple-300 text-sm">
          <strong>Integration Test:</strong> UnitCard components should use the centralized color system.
          Click cards to test selection states and verify consistent role-based styling.
        </p>
      </div>
    </div>
  );
}

/**
 * Color blindness simulation info component.
 */
function ColorBlindnessInfo() {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-4">👁️ Color Blindness Testing</h2>
      <div className="space-y-4">
        <div className="p-4 bg-yellow-900/30 border border-yellow-500 rounded-lg">
          <h3 className="text-yellow-300 font-medium mb-2">Manual Testing Required</h3>
          <p className="text-gray-300 text-sm">
            To test color blindness compatibility, use tools like:
          </p>
          <ul className="text-gray-300 text-sm mt-2 space-y-1">
            <li>• <strong>Sim Daltonism</strong> (macOS app)</li>
            <li>• <strong>Colorblinding</strong> (Chrome extension)</li>
            <li>• <strong>WebAIM Color Contrast Checker</strong></li>
          </ul>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-red-900/20 border border-red-500 rounded-lg">
            <h4 className="text-red-300 font-medium">Protanopia</h4>
            <p className="text-gray-400 text-xs">Red-blind (1% of males)</p>
          </div>
          <div className="p-3 bg-green-900/20 border border-green-500 rounded-lg">
            <h4 className="text-green-300 font-medium">Deuteranopia</h4>
            <p className="text-gray-400 text-xs">Green-blind (1% of males)</p>
          </div>
          <div className="p-3 bg-blue-900/20 border border-blue-500 rounded-lg">
            <h4 className="text-blue-300 font-medium">Tritanopia</h4>
            <p className="text-gray-400 text-xs">Blue-blind (rare)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Consistency check component.
 */
function ConsistencyCheck() {
  const roles = Object.keys(ROLE_COLORS) as UnitRole[];
  
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-4">🔄 Consistency Check</h2>
      <div className="space-y-4">
        {roles.map((role) => {
          const roleColor = getRoleColor(role);
          return (
            <div key={role} className="p-4 bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getRoleIcon(role)}</span>
                  <span className="text-white font-medium">{getRoleName(role)}</span>
                </div>
                <div className="text-gray-400 text-sm font-mono">{role}</div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <div className="text-gray-400">Background</div>
                  <div className="font-mono text-white">{roleColor.bg}</div>
                  <div className="text-gray-500">{roleColor.bgClass}</div>
                </div>
                <div>
                  <div className="text-gray-400">Text</div>
                  <div className="font-mono text-white">{roleColor.text}</div>
                  <div className="text-gray-500">{roleColor.textClass}</div>
                </div>
                <div>
                  <div className="text-gray-400">Border</div>
                  <div className="text-gray-500">{roleColor.borderClass}</div>
                </div>
                <div>
                  <div className="text-gray-400">Icon</div>
                  <div className="text-2xl">{roleColor.icon}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Color scheme test page.
 * Comprehensive testing interface for role color system.
 */
export default function ColorSchemeTestPage() {
  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">🎨 Role Color Scheme Test</h1>
          <p className="text-gray-400">
            Comprehensive testing of role color system for accessibility and consistency
          </p>
        </div>

        {/* Test Sections */}
        <ContrastTest />
        <UniquenessTest />
        <UnitCardTest />
        <ColorBlindnessInfo />
        <ConsistencyCheck />

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>Use browser dev tools to inspect color values and Tailwind classes.</p>
        </div>
      </div>
    </div>
  );
}