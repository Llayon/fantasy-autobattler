# Coding Rules for AI Assistants

## MUST Follow

### TypeScript
- Use explicit types, never `any`
- Prefer interfaces for objects, types for unions
- No non-null assertions (`!`)

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
