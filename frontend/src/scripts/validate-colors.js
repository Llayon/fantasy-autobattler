/**
 * Color validation script for role colors.
 * Validates WCAG AA contrast compliance and color uniqueness.
 */

// Role color definitions (matching roleColors.ts)
const ROLE_COLORS = {
  tank: { bg: '#1E40AF', text: '#FFFFFF', name: 'Танк' },
  melee_dps: { bg: '#DC2626', text: '#FFFFFF', name: 'Ближний бой' },
  ranged_dps: { bg: '#15803D', text: '#FFFFFF', name: 'Дальний бой' },
  mage: { bg: '#9333EA', text: '#FFFFFF', name: 'Маг' },
  support: { bg: '#A16207', text: '#FFFFFF', name: 'Поддержка' },
  control: { bg: '#0E7490', text: '#FFFFFF', name: 'Контроль' },
};

/**
 * Calculate contrast ratio between two colors.
 */
function calculateContrastRatio(color1, color2) {
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return null;
    return {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    };
  };

  const getLuminance = (r, g, b) => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 1;

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Calculate color distance for uniqueness check.
 */
function calculateColorDistance(color1, color2) {
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return null;
    return {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    };
  };

  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 0;

  // Euclidean distance in RGB space
  return Math.sqrt(
    Math.pow(rgb2.r - rgb1.r, 2) +
    Math.pow(rgb2.g - rgb1.g, 2) +
    Math.pow(rgb2.b - rgb1.b, 2)
  );
}

/**
 * Validate all role colors.
 */
function validateRoleColors() {
  console.log('🎨 Role Color Validation Report');
  console.log('================================\n');

  // 1. Contrast validation
  console.log('1. WCAG AA Contrast Test (≥4.5:1)');
  console.log('----------------------------------');
  let contrastPassed = 0;
  const contrastResults = [];

  Object.entries(ROLE_COLORS).forEach(([role, colors]) => {
    const ratio = calculateContrastRatio(colors.bg, colors.text);
    const passes = ratio >= 4.5;
    const status = passes ? '✅ PASS' : '❌ FAIL';
    
    console.log(`${colors.name.padEnd(15)} | ${colors.bg} on ${colors.text} | ${ratio.toFixed(2)}:1 | ${status}`);
    
    if (passes) contrastPassed++;
    contrastResults.push({ role, ratio, passes });
  });

  console.log(`\nContrast Summary: ${contrastPassed}/6 roles pass WCAG AA\n`);

  // 2. Color uniqueness validation
  console.log('2. Color Uniqueness Test');
  console.log('------------------------');
  const roles = Object.keys(ROLE_COLORS);
  const minDistance = 100; // Minimum recommended distance
  let uniquenessPassed = 0;
  const totalPairs = (roles.length * (roles.length - 1)) / 2;

  for (let i = 0; i < roles.length; i++) {
    for (let j = i + 1; j < roles.length; j++) {
      const role1 = roles[i];
      const role2 = roles[j];
      const color1 = ROLE_COLORS[role1].bg;
      const color2 = ROLE_COLORS[role2].bg;
      const distance = calculateColorDistance(color1, color2);
      const passes = distance >= minDistance;
      const status = passes ? '✅' : '⚠️';
      
      console.log(`${ROLE_COLORS[role1].name} ↔ ${ROLE_COLORS[role2].name}: ${distance.toFixed(0)} ${status}`);
      
      if (passes) uniquenessPassed++;
    }
  }

  console.log(`\nUniqueness Summary: ${uniquenessPassed}/${totalPairs} pairs have sufficient distance\n`);

  // 3. Color list for manual testing
  console.log('3. Color Values for Manual Testing');
  console.log('----------------------------------');
  Object.entries(ROLE_COLORS).forEach(([role, colors]) => {
    console.log(`${colors.name}: ${colors.bg} (${role})`);
  });

  console.log('\n4. Manual Testing Instructions');
  console.log('------------------------------');
  console.log('• Test with WebAIM Color Contrast Checker: https://webaim.org/resources/contrastchecker/');
  console.log('• Test with Sim Daltonism (macOS) or Colorblinding (Chrome extension)');
  console.log('• Visit http://localhost:3000/test-color-scheme for visual testing');

  // Overall summary
  const overallPass = contrastPassed === 6 && uniquenessPassed >= (totalPairs * 0.8);
  console.log(`\n🎯 Overall Status: ${overallPass ? '✅ PASS' : '⚠️ NEEDS REVIEW'}`);
  
  return {
    contrast: { passed: contrastPassed, total: 6, results: contrastResults },
    uniqueness: { passed: uniquenessPassed, total: totalPairs },
    overall: overallPass
  };
}

// Run validation
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { validateRoleColors, ROLE_COLORS };
} else {
  validateRoleColors();
}