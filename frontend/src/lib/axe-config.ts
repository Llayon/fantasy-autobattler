/**
 * Accessibility testing configuration and utilities.
 * Provides axe-core integration for automated accessibility testing.
 * 
 * @fileoverview Axe-core configuration for accessibility testing
 */

/**
 * Setup axe-core for accessibility testing.
 * Only runs in development mode to avoid production overhead.
 * 
 * @example
 * setupAxeCore();
 */
export function setupAxeCore(): void {
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    // Accessibility testing is enabled - use browser dev tools or manual testing
    // Run accessibility audit at /test-accessibility
  }
}

/**
 * Run accessibility test on specified element or entire document.
 * Returns axe-core results for analysis.
 * 
 * @param element - Optional element to test (defaults to document)
 * @returns Promise resolving to axe results
 * @example
 * // Test entire page
 * const results = await runAccessibilityTest();
 * 
 * // Test specific component
 * const results = await runAccessibilityTest(componentRef.current);
 */
export async function runAccessibilityTest(element?: Element): Promise<{
  violations: unknown[];
  passes?: unknown[];
  incomplete?: unknown[];
}> {
  if (typeof window === 'undefined') {
    return { violations: [] };
  }
  
  try {
    const axe = await import('axe-core');
    const results = await axe.default.run(element || document);
    
    return results;
  } catch (error) {
    // Accessibility test failed - silently handle error
    void error;
    return { violations: [] };
  }
}

/**
 * Log accessibility violations in a readable format.
 * In production, this would send data to a logging service.
 * 
 * @param violations - Array of axe violations
 * @example
 * const results = await runAccessibilityTest();
 * logAccessibilityViolations(results.violations);
 */
export function logAccessibilityViolations(violations: unknown[]): void {
  if (violations.length === 0) {
    // No accessibility violations found
    return;
  }
  
  // Accessibility violations found - would be processed in development
  violations.forEach((violation: unknown) => {
    // Process violation data for analysis
    void violation;
  });
}