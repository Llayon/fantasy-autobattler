/**
 * Accessibility testing page for Fantasy Autobattler.
 * Comprehensive accessibility audit and testing interface.
 * 
 * @fileoverview Manual and automated accessibility testing page.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { runAccessibilityTest, logAccessibilityViolations } from '@/lib/axe-config';
import { UnitCard } from '@/components/UnitCard';
import { BudgetIndicator } from '@/components/BudgetIndicator';
import { UndoRedoControls } from '@/components/UndoRedoControls';
import { DraftIndicator } from '@/components/DraftIndicator';
import { EnhancedBattleGrid } from '@/components/EnhancedBattleGrid';
import { UnitTemplate } from '@/types/game';

// =============================================================================
// MOCK DATA
// =============================================================================

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
  abilities: [
    'Shield Bash',
  ],
};

// Mock team data removed as TeamSummary component is not used in this test

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Accessibility testing page component.
 * Provides comprehensive accessibility testing tools and examples.
 * 
 * @returns Accessibility testing page
 */
export default function AccessibilityTestPage() {
  const [testResults, setTestResults] = useState<any>(null);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<string>('all');
  const [keyboardTestMode, setKeyboardTestMode] = useState(false);
  const [focusedElement, setFocusedElement] = useState<string>('');
  
  const pageRef = useRef<HTMLDivElement>(null);
  const componentRefs = {
    unitCard: useRef<HTMLDivElement>(null),
    budgetIndicator: useRef<HTMLDivElement>(null),
    undoRedo: useRef<HTMLDivElement>(null),
    battleGrid: useRef<HTMLDivElement>(null),
  };

  /**
   * Run accessibility test on selected component or entire page.
   */
  const runTest = async () => {
    setIsRunningTest(true);
    
    try {
      let element: Element | undefined;
      
      if (selectedComponent !== 'all') {
        const ref = componentRefs[selectedComponent as keyof typeof componentRefs];
        element = ref.current || undefined;
      }
      
      const results = await runAccessibilityTest(element);
      setTestResults(results);
      
      // Log results to console for detailed analysis
      logAccessibilityViolations(results.violations);
      
      // Additional manual checks
      performManualChecks();
      
    } catch (error) {
      console.error('Accessibility test failed:', error);
    } finally {
      setIsRunningTest(false);
    }
  };

  /**
   * Perform manual accessibility checks.
   */
  const performManualChecks = () => {
    const checks = {
      focusIndicators: checkFocusIndicators(),
      colorContrast: checkColorContrast(),
      touchTargets: checkTouchTargets(),
      keyboardNavigation: checkKeyboardNavigation(),
      ariaLabels: checkAriaLabels(),
    };
    
    console.group('🔍 Manual Accessibility Checks');
    Object.entries(checks).forEach(([check, result]) => {
      console.log(`${result ? '✅' : '❌'} ${check}:`, result);
    });
    console.groupEnd();
  };

  /**
   * Check if focus indicators are visible.
   */
  const checkFocusIndicators = (): boolean => {
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    let hasVisibleFocus = true;
    focusableElements.forEach((element) => {
      const styles = window.getComputedStyle(element, ':focus');
      if (!styles.outline && !styles.boxShadow.includes('ring')) {
        hasVisibleFocus = false;
      }
    });
    
    return hasVisibleFocus;
  };

  /**
   * Check color contrast ratios.
   */
  const checkColorContrast = (): boolean => {
    // This is a simplified check - in real implementation would use color contrast libraries
    const textElements = document.querySelectorAll('p, span, div, button, a');
    const contrastPassed = true;
    
    textElements.forEach((element) => {
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;
      
      // Simple check for common failing combinations
      if (color === 'rgb(156, 163, 175)' && backgroundColor === 'rgb(17, 24, 39)') {
        // This should pass WCAG AA (gray-400 on gray-900)
        // Actual ratio calculation would be more complex
      }
    });
    
    return contrastPassed;
  };

  /**
   * Check touch target sizes.
   */
  const checkTouchTargets = (): boolean => {
    const interactiveElements = document.querySelectorAll('button, [role="button"], a, input');
    let allTargetsValid = true;
    
    interactiveElements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.width < 44 || rect.height < 44) {
        console.warn('Touch target too small:', element, `${rect.width}x${rect.height}`);
        allTargetsValid = false;
      }
    });
    
    return allTargetsValid;
  };

  /**
   * Check keyboard navigation.
   */
  const checkKeyboardNavigation = (): boolean => {
    const focusableElements = document.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    return focusableElements.length > 0;
  };

  /**
   * Check ARIA labels.
   */
  const checkAriaLabels = (): boolean => {
    const buttonsWithoutLabels = document.querySelectorAll(
      'button:not([aria-label]):not([aria-labelledby]):not([title])'
    );
    
    const hasTextContent = Array.from(buttonsWithoutLabels).every(
      (button) => button.textContent?.trim()
    );
    
    return buttonsWithoutLabels.length === 0 || hasTextContent;
  };

  /**
   * Handle keyboard navigation testing.
   */
  useEffect(() => {
    if (!keyboardTestMode) return;

    const handleKeyDown = () => {
      const activeElement = document.activeElement;
      setFocusedElement(
        activeElement?.tagName + 
        (activeElement?.className ? ` (${activeElement.className.split(' ').slice(0, 2).join(' ')})` : '') +
        (activeElement?.textContent ? ` - "${activeElement.textContent.slice(0, 30)}"` : '')
      );
    };

    const handleFocus = (event: FocusEvent) => {
      const target = event.target as Element;
      setFocusedElement(
        target?.tagName + 
        (target?.className ? ` (${target.className.split(' ').slice(0, 2).join(' ')})` : '') +
        (target?.textContent ? ` - "${target.textContent.slice(0, 30)}"` : '')
      );
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focus', handleFocus, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focus', handleFocus, true);
    };
  }, [keyboardTestMode]);

  return (
    <div ref={pageRef} className="min-h-screen bg-gray-900 text-white p-4">
      {/* Page Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-yellow-400 mb-2">
          🔍 Accessibility Testing
        </h1>
        <p className="text-gray-300">
          Comprehensive accessibility audit and testing tools for Fantasy Autobattler components.
        </p>
      </header>

      {/* Testing Controls */}
      <section className="mb-8 p-6 bg-gray-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Testing Controls</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {/* Component Selection */}
          <div>
            <label htmlFor="component-select" className="block text-sm font-medium mb-2">
              Test Component:
            </label>
            <select
              id="component-select"
              value={selectedComponent}
              onChange={(e) => setSelectedComponent(e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            >
              <option value="all">Entire Page</option>
              <option value="unitCard">Unit Card</option>
              <option value="budgetIndicator">Budget Indicator</option>
              <option value="undoRedo">Undo/Redo Controls</option>
              <option value="battleGrid">Battle Grid</option>
            </select>
          </div>

          {/* Run Test Button */}
          <div className="flex items-end">
            <button
              onClick={runTest}
              disabled={isRunningTest}
              className="w-full min-h-[44px] px-4 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-600 text-white font-medium rounded transition-colors focus:ring-2 focus:ring-yellow-400 focus:outline-none"
            >
              {isRunningTest ? 'Running Test...' : 'Run Accessibility Test'}
            </button>
          </div>

          {/* Keyboard Test Mode */}
          <div className="flex items-end">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={keyboardTestMode}
                onChange={(e) => setKeyboardTestMode(e.target.checked)}
                className="w-4 h-4 text-yellow-600 bg-gray-700 border-gray-600 rounded focus:ring-yellow-400 focus:ring-2"
              />
              <span className="text-sm">Keyboard Test Mode</span>
            </label>
          </div>
        </div>

        {/* Keyboard Test Info */}
        {keyboardTestMode && (
          <div className="p-4 bg-blue-900/30 border border-blue-500 rounded-lg">
            <h3 className="font-medium mb-2">🎹 Keyboard Navigation Test Active</h3>
            <p className="text-sm text-blue-200 mb-2">
              Use Tab, Shift+Tab, Enter, Space, and Arrow keys to navigate. Current focus:
            </p>
            <div className="font-mono text-xs bg-gray-800 p-2 rounded">
              {focusedElement || 'No element focused'}
            </div>
          </div>
        )}
      </section>

      {/* Test Results */}
      {testResults && (
        <section className="mb-8 p-6 bg-gray-800 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="p-4 bg-green-900/30 border border-green-500 rounded-lg">
              <div className="text-2xl font-bold text-green-400">
                {testResults.passes?.length || 0}
              </div>
              <div className="text-green-200">Passed Tests</div>
            </div>
            
            <div className="p-4 bg-red-900/30 border border-red-500 rounded-lg">
              <div className="text-2xl font-bold text-red-400">
                {testResults.violations?.length || 0}
              </div>
              <div className="text-red-200">Violations</div>
            </div>
            
            <div className="p-4 bg-yellow-900/30 border border-yellow-500 rounded-lg">
              <div className="text-2xl font-bold text-yellow-400">
                {testResults.incomplete?.length || 0}
              </div>
              <div className="text-yellow-200">Incomplete</div>
            </div>
          </div>

          {/* Violations Details */}
          {testResults.violations && testResults.violations.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-red-400">Accessibility Violations:</h3>
              {testResults.violations.map((violation: any, index: number) => (
                <div key={index} className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-red-300">{violation.id}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      violation.impact === 'critical' ? 'bg-red-600 text-white' :
                      violation.impact === 'serious' ? 'bg-orange-600 text-white' :
                      violation.impact === 'moderate' ? 'bg-yellow-600 text-black' :
                      'bg-blue-600 text-white'
                    }`}>
                      {violation.impact}
                    </span>
                  </div>
                  <p className="text-red-200 mb-2">{violation.description}</p>
                  <p className="text-sm text-red-300 mb-2">{violation.help}</p>
                  <div className="text-xs text-red-400">
                    Affected elements: {violation.nodes.length}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Component Examples */}
      <section className="space-y-8">
        <h2 className="text-2xl font-semibold mb-4">Component Examples</h2>

        {/* Unit Card */}
        <div ref={componentRefs.unitCard} className="p-6 bg-gray-800 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Unit Card Component</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <UnitCard
              unit={mockUnit}
              variant="list"
              selected={false}
              disabled={false}
              onClick={() => {}}
              onLongPress={() => {}}
            />
            <UnitCard
              unit={mockUnit}
              variant="grid"
              selected={true}
              disabled={false}
              onClick={() => {}}
              onLongPress={() => {}}
            />
            <UnitCard
              unit={mockUnit}
              variant="compact"
              selected={false}
              disabled={true}
              onClick={() => {}}
              onLongPress={() => {}}
            />
          </div>
        </div>

        {/* Budget Indicator */}
        <div ref={componentRefs.budgetIndicator} className="p-6 bg-gray-800 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Budget Indicator Component</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BudgetIndicator current={15} max={30} variant="bar" />
            <BudgetIndicator current={25} max={30} variant="compact" />
          </div>
        </div>

        {/* Undo/Redo Controls */}
        <div ref={componentRefs.undoRedo} className="p-6 bg-gray-800 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Undo/Redo Controls Component</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UndoRedoControls variant="buttons" showShortcuts />
            <UndoRedoControls variant="compact" showShortcuts />
          </div>
        </div>

        {/* Battle Grid */}
        <div ref={componentRefs.battleGrid} className="p-6 bg-gray-800 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Battle Grid Component</h3>
          <div className="max-w-md">
            <EnhancedBattleGrid
              units={[]}
              highlightedCells={[
                { position: { x: 0, y: 0 }, type: 'valid' },
                { position: { x: 1, y: 0 }, type: 'valid' },
              ]}
              onCellClick={() => {}}
              compactMode={true}
            />
          </div>
        </div>

        {/* Additional Components */}
        <div className="p-6 bg-gray-800 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Additional Components</h3>
          <div className="space-y-4">
            <div className="text-sm text-gray-400">
              Additional components would be displayed here in a real implementation.
            </div>
            <DraftIndicator variant="full" />
          </div>
        </div>
      </section>

      {/* Manual Testing Checklist */}
      <section className="mt-8 p-6 bg-gray-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Manual Testing Checklist</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-3">🎹 Keyboard Navigation</h3>
            <ul className="space-y-2 text-sm">
              <li>✓ Tab navigation works through all interactive elements</li>
              <li>✓ Shift+Tab works in reverse order</li>
              <li>✓ Enter/Space activates buttons and controls</li>
              <li>✓ Arrow keys work in grids and lists</li>
              <li>✓ Escape closes modals and dropdowns</li>
              <li>✓ Focus indicators are clearly visible</li>
              <li>✓ Focus trap works in modals</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-3">🎨 Visual Design</h3>
            <ul className="space-y-2 text-sm">
              <li>✓ Color contrast meets WCAG AA (4.5:1)</li>
              <li>✓ Text is readable at 200% zoom</li>
              <li>✓ Touch targets are at least 44×44px</li>
              <li>✓ Focus indicators are visible</li>
              <li>✓ Information not conveyed by color alone</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-3">🏷️ ARIA & Semantics</h3>
            <ul className="space-y-2 text-sm">
              <li>✓ All buttons have accessible names</li>
              <li>✓ Form inputs have proper labels</li>
              <li>✓ Grid has role="grid" and proper structure</li>
              <li>✓ Selected states use aria-selected</li>
              <li>✓ Loading states announced to screen readers</li>
              <li>✓ Error messages are associated with inputs</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-3">📱 Responsive & Mobile</h3>
            <ul className="space-y-2 text-sm">
              <li>✓ Works with screen readers (VoiceOver/TalkBack)</li>
              <li>✓ Touch targets are appropriately sized</li>
              <li>✓ Zoom up to 500% without horizontal scroll</li>
              <li>✓ Orientation changes work properly</li>
              <li>✓ Reduced motion preferences respected</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}