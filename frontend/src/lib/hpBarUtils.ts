/**
 * HP Bar utility functions for consistent health visualization.
 * 
 * @fileoverview Shared utilities for HP bar color determination.
 */

/**
 * Determines HP bar color based on health percentage.
 * Returns Tailwind CSS color class for consistent HP visualization.
 * 
 * @param hpPercent - Current HP as percentage (0-100). Values outside range are clamped.
 * @returns Tailwind CSS background color class
 * 
 * @example
 * getHpBarColor(75) // returns 'bg-green-500' (healthy)
 * getHpBarColor(40) // returns 'bg-yellow-500' (damaged)
 * getHpBarColor(20) // returns 'bg-red-500' (critical)
 * getHpBarColor(-10) // returns 'bg-red-500' (clamped to 0)
 * getHpBarColor(150) // returns 'bg-green-500' (clamped to 100)
 */
export function getHpBarColor(hpPercent: number): string {
  // Clamp value to valid range
  const clampedPercent = Math.max(0, Math.min(100, hpPercent));
  
  if (clampedPercent > 50) return 'bg-green-500';
  if (clampedPercent > 25) return 'bg-yellow-500';
  return 'bg-red-500';
}
