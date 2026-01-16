# Coding Rules

## TypeScript
- Explicit types, never `any`
- Interfaces for objects, types for unions
- No non-null assertions (`!`)

## JSDoc (REQUIRED)
All public functions: `@param`, `@returns`, `@example`

```typescript
/**
 * Calculates physical damage. Formula: max(1, (ATK - armor) * atkCount)
 * @param attacker - Unit dealing damage
 * @param target - Unit receiving damage
 * @returns Damage value (min 1)
 */
function calculatePhysicalDamage(attacker: BattleUnit, target: BattleUnit): number
```

## Logging (REQUIRED)
NestJS Logger only, never console.log. Include context: `{ battleId, playerId, error }`

## Backend (NestJS)
- Controllers: HTTP only, delegate to services
- Services: Business logic + DI
- Use NestJS exceptions, TypeORM methods (no raw SQL)

## Frontend (Next.js)
- Components: Pure functions of props
- State: Zustand store only
- API calls: In store actions, not components
- Styles: Tailwind classes only

## Forbidden
- `any` type
- Business logic in controllers
- API calls in components
- Direct state mutation
- console.log
- Inline styles
- Fire-and-forget promises

## Reference Patterns
| Pattern | File |
|---------|------|
| Service | `backend/src/battle/battle.service.ts` |
| Controller | `backend/src/battle/battle.controller.ts` |
| Pure function | `backend/src/battle/battle.simulator.ts` |
| Component | `frontend/src/components/UnitCard.tsx` |
| Store | `frontend/src/store/gameStore.ts` |
