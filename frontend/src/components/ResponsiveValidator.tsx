/**
 * Responsive Design Validator for Fantasy Autobattler.
 * Validates responsive design compliance across different screen sizes.
 * 
 * @fileoverview Component for testing and validating responsive design implementation.
 */

'use client';

import { useState, useEffect } from 'react';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Responsive validation result.
 */
interface ValidationResult {
  /** Test name */
  test: string;
  /** Whether test passed */
  passed: boolean;
  /** Test description */
  description: string;
  /** Current value */
  currentValue?: string;
  /** Expected value */
  expectedValue?: string;
}

/**
 * Breakpoint information.
 */
interface BreakpointInfo {
  /** Breakpoint name */
  name: string;
  /** Minimum width */
  minWidth: number;
  /** Maximum width */
  maxWidth?: number;
  /** Current status */
  active: boolean;
}

/**
 * ResponsiveValidator component props.
 */
interface ResponsiveValidatorProps {
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Breakpoint definitions */
const BREAKPOINTS: Omit<BreakpointInfo, 'active'>[] = [
  { name: 'Mobile', minWidth: 320, maxWidth: 480 },
  { name: 'Tablet', minWidth: 481, maxWidth: 768 },
  { name: 'Desktop', minWidth: 769 },
];

/** Minimum touch target size */
const MIN_TOUCH_TARGET = 44;

/** Minimum text size for readability */
const MIN_TEXT_SIZE = 16;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get current breakpoint information.
 * 
 * @param width - Current viewport width
 * @returns Array of breakpoints with active status
 */
function getBreakpointInfo(width: number): BreakpointInfo[] {
  return BREAKPOINTS.map(bp => ({
    ...bp,
    active: width >= bp.minWidth && (bp.maxWidth ? width <= bp.maxWidth : true),
  }));
}

/**
 * Validate touch targets on the page.
 * 
 * @returns Validation results for touch targets
 */
function validateTouchTargets(): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  // Find all interactive elements
  const interactiveElements = document.querySelectorAll(
    'button, a, input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])'
  );
  
  let totalElements = 0;
  let validElements = 0;
  
  interactiveElements.forEach((element) => {
    const rect = element.getBoundingClientRect();
    const isValid = rect.width >= MIN_TOUCH_TARGET && rect.height >= MIN_TOUCH_TARGET;
    
    if (isValid) validElements++;
    totalElements++;
  });
  
  results.push({
    test: 'Touch Targets',
    passed: validElements === totalElements,
    description: 'All interactive elements should be at least 44×44px',
    currentValue: `${validElements}/${totalElements} valid`,
    expectedValue: `${totalElements}/${totalElements} valid`,
  });
  
  return results;
}

/**
 * Validate text readability.
 * 
 * @returns Validation results for text readability
 */
function validateTextReadability(): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  // Find all text elements
  const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, label');
  
  let totalElements = 0;
  let validElements = 0;
  
  textElements.forEach((element) => {
    const styles = window.getComputedStyle(element);
    const fontSize = parseFloat(styles.fontSize);
    
    // Skip elements with no text content
    if (!element.textContent?.trim()) return;
    
    const isValid = fontSize >= MIN_TEXT_SIZE;
    
    if (isValid) validElements++;
    totalElements++;
  });
  
  results.push({
    test: 'Text Readability',
    passed: validElements >= totalElements * 0.9, // Allow 10% tolerance for decorative text
    description: 'Main text should be at least 16px for readability',
    currentValue: `${validElements}/${totalElements} valid (≥16px)`,
    expectedValue: `≥90% valid`,
  });
  
  return results;
}

/**
 * Validate horizontal scrolling.
 * 
 * @returns Validation results for horizontal scrolling
 */
function validateHorizontalScrolling(): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  const hasHorizontalScroll = document.documentElement.scrollWidth > document.documentElement.clientWidth;
  
  results.push({
    test: 'Horizontal Scrolling',
    passed: !hasHorizontalScroll,
    description: 'Page should not have horizontal scrolling',
    currentValue: hasHorizontalScroll ? 'Has horizontal scroll' : 'No horizontal scroll',
    expectedValue: 'No horizontal scroll',
  });
  
  return results;
}

/**
 * Validate grid responsiveness.
 * 
 * @returns Validation results for grid responsiveness
 */
function validateGridResponsiveness(): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  // Find battle grid
  const battleGrid = document.querySelector('[class*="grid-cols-8"]');
  
  if (battleGrid) {
    const rect = battleGrid.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const fitsInViewport = rect.width <= viewportWidth * 0.95; // Allow 5% margin
    
    results.push({
      test: 'Battle Grid Fit',
      passed: fitsInViewport,
      description: 'Battle grid should fit within viewport',
      currentValue: `${Math.round(rect.width)}px wide`,
      expectedValue: `≤${Math.round(viewportWidth * 0.95)}px`,
    });
  }
  
  return results;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * ResponsiveValidator component for testing responsive design compliance.
 * Provides real-time validation of responsive design best practices.
 * 
 * @param props - Component props
 * @returns Responsive validator component
 * @example
 * <ResponsiveValidator />
 */
export function ResponsiveValidator({ className = '' }: ResponsiveValidatorProps) {
  const [viewportWidth, setViewportWidth] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  
  /**
   * Update viewport dimensions.
   */
  const updateViewport = () => {
    setViewportWidth(window.innerWidth);
    setViewportHeight(window.innerHeight);
  };
  
  /**
   * Run all validation tests.
   */
  const runValidation = async () => {
    setIsValidating(true);
    
    // Small delay to ensure DOM is ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const results: ValidationResult[] = [
      ...validateTouchTargets(),
      ...validateTextReadability(),
      ...validateHorizontalScrolling(),
      ...validateGridResponsiveness(),
    ];
    
    setValidationResults(results);
    setIsValidating(false);
  };
  
  // Set up viewport tracking
  useEffect(() => {
    updateViewport();
    
    const handleResize = () => {
      updateViewport();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Run validation on mount and viewport changes
  useEffect(() => {
    const timer = setTimeout(runValidation, 500); // Debounce validation
    return () => clearTimeout(timer);
  }, [viewportWidth, viewportHeight]);
  
  const breakpoints = getBreakpointInfo(viewportWidth);
  const activeBreakpoint = breakpoints.find(bp => bp.active);
  const passedTests = validationResults.filter(r => r.passed).length;
  const totalTests = validationResults.length;
  const overallScore = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
  
  return (
    <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">📱 Responsive Design Validator</h2>
        <button
          onClick={runValidation}
          disabled={isValidating}
          className="min-h-[44px] px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg transition-colors touch-manipulation"
        >
          {isValidating ? '🔄 Validating...' : '🔍 Run Tests'}
        </button>
      </div>
      
      {/* Viewport Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="font-bold text-gray-300 mb-2">Viewport</h3>
          <p className="text-white text-lg">{viewportWidth} × {viewportHeight}px</p>
          <p className="text-sm text-gray-400">
            {activeBreakpoint ? activeBreakpoint.name : 'Unknown'} breakpoint
          </p>
        </div>
        
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="font-bold text-gray-300 mb-2">Test Score</h3>
          <p className={`text-2xl font-bold ${overallScore >= 90 ? 'text-green-400' : overallScore >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
            {overallScore}%
          </p>
          <p className="text-sm text-gray-400">
            {passedTests}/{totalTests} tests passed
          </p>
        </div>
        
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="font-bold text-gray-300 mb-2">Status</h3>
          <p className={`text-lg font-bold ${overallScore >= 90 ? 'text-green-400' : overallScore >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
            {overallScore >= 90 ? '✅ Excellent' : overallScore >= 70 ? '⚠️ Good' : '❌ Needs Work'}
          </p>
        </div>
      </div>
      
      {/* Breakpoint Status */}
      <div className="mb-6">
        <h3 className="font-bold text-gray-300 mb-3">Breakpoint Status</h3>
        <div className="flex flex-wrap gap-2">
          {breakpoints.map((bp) => (
            <div
              key={bp.name}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                bp.active 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-600 text-gray-300'
              }`}
            >
              {bp.name} ({bp.minWidth}px{bp.maxWidth ? `-${bp.maxWidth}px` : '+'})
            </div>
          ))}
        </div>
      </div>
      
      {/* Validation Results */}
      <div>
        <h3 className="font-bold text-gray-300 mb-3">Validation Results</h3>
        <div className="space-y-3">
          {validationResults.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-l-4 ${
                result.passed 
                  ? 'bg-green-900/20 border-green-500' 
                  : 'bg-red-900/20 border-red-500'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-white">
                  {result.passed ? '✅' : '❌'} {result.test}
                </h4>
                <span className={`text-sm font-medium ${
                  result.passed ? 'text-green-400' : 'text-red-400'
                }`}>
                  {result.passed ? 'PASS' : 'FAIL'}
                </span>
              </div>
              <p className="text-sm text-gray-300 mb-2">{result.description}</p>
              {(result.currentValue || result.expectedValue) && (
                <div className="text-xs text-gray-400">
                  {result.currentValue && <div>Current: {result.currentValue}</div>}
                  {result.expectedValue && <div>Expected: {result.expectedValue}</div>}
                </div>
              )}
            </div>
          ))}
          
          {validationResults.length === 0 && !isValidating && (
            <div className="text-center py-8 text-gray-400">
              Click "Run Tests" to validate responsive design
            </div>
          )}
          
          {isValidating && (
            <div className="text-center py-8 text-gray-400">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              Running validation tests...
            </div>
          )}
        </div>
      </div>
      
      {/* Recommendations */}
      {validationResults.length > 0 && overallScore < 90 && (
        <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-500 rounded-lg">
          <h3 className="font-bold text-yellow-400 mb-2">💡 Recommendations</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            {!validationResults.find(r => r.test === 'Touch Targets')?.passed && (
              <li>• Ensure all buttons and interactive elements are at least 44×44px</li>
            )}
            {!validationResults.find(r => r.test === 'Text Readability')?.passed && (
              <li>• Increase font size to at least 16px for main content</li>
            )}
            {!validationResults.find(r => r.test === 'Horizontal Scrolling')?.passed && (
              <li>• Remove horizontal scrolling by adjusting layout or adding responsive breakpoints</li>
            )}
            {!validationResults.find(r => r.test === 'Battle Grid Fit')?.passed && (
              <li>• Make battle grid responsive to fit within viewport on mobile devices</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export type { ResponsiveValidatorProps, ValidationResult, BreakpointInfo };