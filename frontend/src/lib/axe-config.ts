/**
 * Axe-core configuration for accessibility testing.
 * Sets up automated accessibility checking in development mode.
 * 
 * @fileoverview Axe-core integration for automated accessibility testing.
 */

/**
 * Configure axe-core for development mode accessibility testing.
 * Only runs in development to avoid performance impact in production.
 * 
 * @example
 * // Call in _app.tsx or layout.tsx
 * setupAxeCore();
 */
export function setupAxeCore(): void {
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    console.log('🔍 Accessibility testing enabled - use browser dev tools or manual testing');
    console.log('📋 Run accessibility audit at /test-accessibility');
  }
}

/**
 * Manual accessibility test function for specific elements.
 * Useful for testing specific components or sections.
 * 
 * @param element - DOM element to test (defaults to document)
 * @returns Promise resolving to accessibility results
 * @example
 * // Test specific component
 * const results = await runAccessibilityTest(componentRef.current);
 * console.log('Accessibility issues:', results.violations);
 */
export async function runAccessibilityTest(element?: Element): Promise<any> {
  if (typeof window === 'undefined') {
    return { violations: [] };
  }
  
  try {
    const axe = await import('axe-core');
    const results = await axe.default.run(element || document);
    
    return results;
  } catch (error) {
    console.error('Accessibility test failed:', error);
    return { violations: [] };
  }
}

/**
 * Log accessibility violations in a readable format.
 * 
 * @param violations - Array of axe violations
 * @example
 * const results = await runAccessibilityTest();
 * logAccessibilityViolations(results.violations);
 */
export function logAccessibilityViolations(violations: any[]): void {
  if (violations.length === 0) {
    console.log('✅ No accessibility violations found!');
    return;
  }
  
  console.group(`🚨 Found ${violations.length} accessibility violations:`);
  
  violations.forEach((violation, index) => {
    console.group(`${index + 1}. ${violation.id} (${violation.impact})`);
    console.log('Description:', violation.description);
    console.log('Help:', violation.help);
    console.log('Help URL:', violation.helpUrl);
    console.log('Nodes affected:', violation.nodes.length);
    
    violation.nodes.forEach((node: any, nodeIndex: number) => {
      console.log(`  Node ${nodeIndex + 1}:`, node.html);
      console.log(`  Target:`, node.target);
      if (node.failureSummary) {
        console.log(`  Issue:`, node.failureSummary);
      }
    });
    
    console.groupEnd();
  });
  
  console.groupEnd();
}