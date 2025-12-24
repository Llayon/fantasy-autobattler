/**
 * Mobile UX Test Page for Fantasy Autobattler.
 * Comprehensive testing of mobile interactions and touch targets.
 */

'use client';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

import { useState, useRef, useEffect } from 'react';
import { ResponsiveTeamBuilder, TeamActions } from '@/components/ResponsiveTeamBuilder';
import { UnitTemplate, UnitId, Position } from '@/types/game';

// Mock data
const mockUnits: UnitTemplate[] = [
  {
    id: 'knight',
    name: 'Рыцарь',
    role: 'tank',
    cost: 5,
    stats: { hp: 120, atk: 25, atkCount: 1, armor: 8, speed: 2, initiative: 3, dodge: 5 },
    range: 1,
    abilities: ['Защитная стойка', 'Провокация'],
  },
  {
    id: 'rogue',
    name: 'Разбойник',
    role: 'melee_dps',
    cost: 4,
    stats: { hp: 80, atk: 35, atkCount: 1, armor: 2, speed: 4, initiative: 6, dodge: 15 },
    range: 1,
    abilities: ['Скрытность', 'Удар в спину'],
  },
  {
    id: 'archer',
    name: 'Лучник',
    role: 'ranged_dps',
    cost: 3,
    stats: { hp: 65, atk: 28, atkCount: 1, armor: 1, speed: 3, initiative: 5, dodge: 8 },
    range: 4,
    abilities: ['Точный выстрел'],
  },
  {
    id: 'mage',
    name: 'Маг',
    role: 'mage',
    cost: 6,
    stats: { hp: 55, atk: 40, atkCount: 1, armor: 0, speed: 2, initiative: 4, dodge: 3 },
    range: 3,
    abilities: ['Огненный шар', 'Щит маны'],
  },
];

const mockCurrentTeam = {
  units: [
    { unitId: 'knight' as UnitId, position: { x: 1, y: 0 } },
    { unitId: 'rogue' as UnitId, position: { x: 3, y: 1 } },
  ],
  totalCost: 9,
  isValid: true,
  errors: [],
};

const mockGridUnits = mockUnits.slice(0, 2).map((unit, index) => ({
  unit,
  position: index === 0 ? { x: 1, y: 0 } : { x: 3, y: 1 },
  team: 'player' as const,
  alive: true,
}));

const mockHighlightedCells = Array.from({ length: 16 }, (_, i) => ({
  position: { x: i % 8, y: Math.floor(i / 8) },
  type: 'valid' as const,
}));

export default function TestMobileUXPage() {
  const [selectedUnit, setSelectedUnit] = useState<UnitTemplate | null>(null);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [touchLog, setTouchLog] = useState<string[]>([]);
  const [viewportInfo, setViewportInfo] = useState<{
    width: number;
    height: number;
    devicePixelRatio: number;
    userAgent: string;
  } | null>(null);
  const testAreaRef = useRef<HTMLDivElement>(null);

  // Log touch events for debugging
  const logTouch = (event: string) => {
    setTouchLog(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${event}`]);
  };

  const teamActions: TeamActions = {
    onSave: () => {
      logTouch('Save button tapped');
      setTestResults(prev => ({ ...prev, saveButton: true }));
    },
    onClear: () => {
      logTouch('Clear button tapped');
      setTestResults(prev => ({ ...prev, clearButton: true }));
    },
    onStartBattle: () => {
      logTouch('Battle button tapped');
      setTestResults(prev => ({ ...prev, battleButton: true }));
    },
    onShowTeams: () => {
      logTouch('Teams button tapped');
      setTestResults(prev => ({ ...prev, teamsButton: true }));
    },
    canSave: true,
    canBattle: true,
    loading: false,
    teamCount: 3,
  };

  const handleUnitSelect = (unit: UnitTemplate | null) => {
    if (unit) {
      logTouch(`Unit selected: ${unit.name}`);
      setSelectedUnit(unit);
      setTestResults(prev => ({ ...prev, unitSelect: true }));
    } else {
      logTouch('Unit deselected');
      setSelectedUnit(null);
    }
  };

  const handleUnitLongPress = (unit: UnitTemplate) => {
    logTouch(`Unit long pressed: ${unit.name}`);
    setTestResults(prev => ({ ...prev, longPress: true }));
  };

  const handleGridCellClick = (position: Position) => {
    logTouch(`Grid cell tapped: (${position.x}, ${position.y})`);
    setTestResults(prev => ({ ...prev, gridTap: true }));
  };

  const handleMobileSheetToggle = () => {
    const newState = !isMobileSheetOpen;
    setIsMobileSheetOpen(newState);
    logTouch(`Mobile sheet ${newState ? 'opened' : 'closed'}`);
    setTestResults(prev => ({ ...prev, mobileSheet: true }));
  };

  // Collect viewport information
  useEffect(() => {
    setViewportInfo({
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      userAgent: navigator.userAgent,
    });
  }, []);

  // Test touch target sizes
  useEffect(() => {
    const checkTouchTargets = () => {
      const buttons = document.querySelectorAll('button');
      let allValid = true;
      const smallTargets: string[] = [];
      
      buttons.forEach(button => {
        const rect = button.getBoundingClientRect();
        if (rect.width < 44 || rect.height < 44) {
          const identifier = button.textContent?.slice(0, 10) || button.className.slice(0, 20);
          smallTargets.push(`${identifier}: ${Math.round(rect.width)}×${Math.round(rect.height)}`);
          allValid = false;
        }
      });
      
      if (!allValid) {
        logTouch(`Small targets found: ${smallTargets.join(', ')}`);
      }
      
      setTestResults(prev => ({ ...prev, touchTargets: allValid }));
    };

    // Check after component mounts and updates
    const timer = setTimeout(checkTouchTargets, 1000);
    return () => clearTimeout(timer);
  }, [isMobileSheetOpen]);

  // Test scroll behavior
  useEffect(() => {
    const testScrollBehavior = () => {
      const scrollableElements = document.querySelectorAll('[class*="overflow"], [class*="scroll"]');
      let scrollConflicts = false;
      
      scrollableElements.forEach(element => {
        const style = window.getComputedStyle(element);
        if (style.overflow === 'auto' || style.overflowY === 'auto') {
          // Check if element has touch-action set properly
          if (!style.touchAction.includes('pan-y') && !style.touchAction.includes('manipulation')) {
            scrollConflicts = true;
          }
        }
      });
      
      setTestResults(prev => ({ ...prev, scrollBehavior: !scrollConflicts }));
    };

    const timer = setTimeout(testScrollBehavior, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Test Status Panel */}
      <div className="fixed top-0 left-0 right-0 z-[10000] bg-black/90 text-white p-2 text-xs">
        <div className="flex flex-wrap gap-1 mb-2">
          <span className={`px-2 py-1 rounded text-[10px] ${testResults.touchTargets ? 'bg-green-600' : 'bg-red-600'}`}>
            Targets {testResults.touchTargets ? '✓' : '✗'}
          </span>
          <span className={`px-2 py-1 rounded text-[10px] ${testResults.scrollBehavior ? 'bg-green-600' : 'bg-yellow-600'}`}>
            Scroll {testResults.scrollBehavior ? '✓' : '⚠'}
          </span>
          <span className={`px-2 py-1 rounded text-[10px] ${testResults.unitSelect ? 'bg-green-600' : 'bg-gray-600'}`}>
            Select {testResults.unitSelect ? '✓' : '○'}
          </span>
          <span className={`px-2 py-1 rounded text-[10px] ${testResults.longPress ? 'bg-green-600' : 'bg-gray-600'}`}>
            Long {testResults.longPress ? '✓' : '○'}
          </span>
          <span className={`px-2 py-1 rounded text-[10px] ${testResults.gridTap ? 'bg-green-600' : 'bg-gray-600'}`}>
            Grid {testResults.gridTap ? '✓' : '○'}
          </span>
          <span className={`px-2 py-1 rounded text-[10px] ${testResults.mobileSheet ? 'bg-green-600' : 'bg-gray-600'}`}>
            Sheet {testResults.mobileSheet ? '✓' : '○'}
          </span>
        </div>
        
        {/* Viewport Info */}
        {viewportInfo && (
          <div className="text-[9px] opacity-70 mb-1">
            {viewportInfo.width}×{viewportInfo.height} • DPR: {viewportInfo.devicePixelRatio} • 
            {viewportInfo.userAgent.includes('Mobile') ? ' Mobile' : ' Desktop'}
          </div>
        )}
        
        {/* Touch Log */}
        <div className="text-[9px] opacity-80 max-h-12 overflow-y-auto">
          {touchLog.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      </div>

      {/* Main Content with top padding for test panel */}
      <div className="pt-20" ref={testAreaRef}>
        <ResponsiveTeamBuilder
          units={mockUnits}
          currentTeam={mockCurrentTeam}
          selectedUnit={selectedUnit}
          disabledUnits={['knight', 'rogue']}
          gridUnits={mockGridUnits}
          highlightedCells={mockHighlightedCells}
          teamActions={teamActions}
          onUnitSelect={handleUnitSelect}
          onUnitLongPress={handleUnitLongPress}
          onGridCellClick={handleGridCellClick}
          isMobileSheetOpen={isMobileSheetOpen}
          onMobileSheetToggle={handleMobileSheetToggle}
        />
      </div>

      {/* Test Instructions */}
      <div className="fixed bottom-0 left-0 right-0 bg-blue-900/90 text-white p-3 text-sm z-[9998]">
        <div className="font-bold mb-1">🧪 Mobile UX Test Checklist:</div>
        <div className="text-xs space-y-1">
          <div>✓ All buttons ≥ 44×44px touch targets</div>
          <div>✓ Tap "Выбрать юниты" → sheet opens smoothly</div>
          <div>✓ Long press unit (500ms) → detail modal</div>
          <div>✓ Tap grid cells → placement works</div>
          <div>✓ Scroll doesn't conflict with interactions</div>
          <div>✓ Pinch zoom works on grid</div>
          <div>✓ No accidental double-taps</div>
          <div>✓ Keyboard doesn't block UI</div>
        </div>
      </div>
    </div>
  );
}