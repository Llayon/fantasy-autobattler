# Coding Rules for AI Assistants

## MUST Follow

### TypeScript
- Use explicit types, never `any`
- Prefer interfaces for objects, types for unions
- No non-null assertions (`!`)

### JSDoc Documentation (REQUIRED)
- ALL public functions MUST have JSDoc comments
- Include: @description, @param, @returns, @throws, @example
- Interfaces and types MUST have descriptions
- Complex logic MUST have inline comments explaining WHY

```typescript
/**
 * Calculates physical damage dealt by attacker to target.
 * Formula: max(1, (ATK - armor) * atkCount)
 * 
 * @param attacker - The unit dealing damage
 * @param target - The unit receiving damage
 * @returns Calculated damage value (minimum 1)
 * @example
 * const damage = calculatePhysicalDamage(warrior, enemy);
 */
function calculatePhysicalDamage(attacker: BattleUnit, target: BattleUnit): number
```

### Logging & Error Tracking (REQUIRED)
- Use NestJS Logger, never console.log
- Log ALL errors with context (userId, battleId, etc.)
- Log important business events (battle started, team saved)
- Include correlation ID for request tracing
- Log levels: error (bugs), warn (issues), log (events), debug (dev)

```typescript
// ✅ CORRECT logging
this.logger.error(`Battle simulation failed`, {
  battleId,
  playerId,
  error: error.message,
  stack: error.stack,
});

this.logger.log(`Battle completed`, { battleId, winner, rounds });

// ❌ WRONG
console.log('error', error);
```

### Backend (NestJS)
- Controllers: HTTP handling ONLY, delegate to services
- Services: All business logic, use dependency injection
- Use NestJS exceptions (`NotFoundException`, `BadRequestException`)
- Never use raw SQL, always TypeORM methods

### Frontend (Next.js)
- Components are pure functions of props
- State management via Zustand store only
- API calls in store actions, not components
- Use Tailwind classes, no inline styles

### General
- No magic numbers - use named constants
- No console.log - use proper logging
- No commented-out code
- Handle all promise rejections

## MUST NOT Do

1. ❌ Business logic in controllers
2. ❌ Direct database access in controllers
3. ❌ API calls in React components
4. ❌ Using `any` type
5. ❌ Type assertions without validation
6. ❌ Raw SQL queries
7. ❌ Direct state mutation
8. ❌ Inline styles
9. ❌ Fire-and-forget promises
10. ❌ Exposing sensitive data in responses

## Reference Files

When creating new code, follow patterns from:
- `backend/src/battle/battle.service.ts` - Service pattern
- `backend/src/battle/battle.controller.ts` - Controller pattern
- `backend/src/battle/battle.simulator.ts` - Pure function pattern
- `frontend/src/components/UnitCard.tsx` - Component pattern
- `frontend/src/store/gameStore.ts` - Store pattern
- `frontend/src/lib/api.ts` - API client pattern
