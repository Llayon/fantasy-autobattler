#!/bin/bash
# Verify that core modules do not import from game-specific code
# This ensures core library remains reusable across projects

set -e

echo "🔍 Verifying core module imports..."

CORE_DIR="src/core"
ERRORS=0

# Patterns that should NOT appear in core modules
FORBIDDEN_PATTERNS=(
  "from '../game/"
  "from '../../game/"
  "from '@game/"
  "from '../unit/unit.data"
  "from '../abilities/ability.data"
  "from '../config/game.constants"
  "from '../types/game.types"
  "from '@nestjs/"
  "from 'typeorm"
  "from 'class-validator"
  "from 'class-transformer"
)

# Check each pattern
for pattern in "${FORBIDDEN_PATTERNS[@]}"; do
  matches=$(grep -r "$pattern" "$CORE_DIR" --include="*.ts" 2>/dev/null || true)
  if [ -n "$matches" ]; then
    echo "❌ Found forbidden import pattern: $pattern"
    echo "$matches"
    ERRORS=$((ERRORS + 1))
  fi
done

# Check for any imports from battle/ (except re-exports)
battle_imports=$(grep -r "from '../battle/" "$CORE_DIR" --include="*.ts" 2>/dev/null || true)
if [ -n "$battle_imports" ]; then
  echo "❌ Found imports from battle/ in core:"
  echo "$battle_imports"
  ERRORS=$((ERRORS + 1))
fi

# Check for any imports from entities/
entity_imports=$(grep -r "from '../entities/" "$CORE_DIR" --include="*.ts" 2>/dev/null || true)
if [ -n "$entity_imports" ]; then
  echo "❌ Found imports from entities/ in core:"
  echo "$entity_imports"
  ERRORS=$((ERRORS + 1))
fi

if [ $ERRORS -eq 0 ]; then
  echo "✅ Core modules have no forbidden imports!"
  exit 0
else
  echo ""
  echo "❌ Found $ERRORS forbidden import pattern(s) in core modules"
  echo "Core modules must be game-agnostic and framework-independent"
  exit 1
fi
