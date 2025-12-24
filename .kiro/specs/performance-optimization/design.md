# Performance Optimization - Design Document

## Overview

Этот документ описывает технический дизайн для оптимизации производительности Fantasy Autobattler, охватывающий backend и frontend оптимизации.

## Architecture

### Backend Performance Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     API Layer                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Cache     │  │   Rate      │  │   Performance       │  │
│  │   Layer     │  │   Limiter   │  │   Interceptor       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Optimized Battle Simulator              │    │
│  │  - Early exit pathfinding                           │    │
│  │  - Cached unit templates                            │    │
│  │  - Optimized turn order calculation                 │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   Data Layer                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  In-Memory  │  │  Connection │  │   Indexed           │  │
│  │  Unit Cache │  │  Pooling    │  │   Queries           │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Frontend Performance Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Entry Point                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Critical Path Bundle (~100KB)           │    │
│  │  - Navigation, TeamBuilder shell, Core UI           │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   Lazy Loaded Chunks                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Battle     │  │  Profile    │  │   History           │  │
│  │  Replay     │  │  Page       │  │   Page              │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   Optimized Components                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  React.memo + useMemo + useCallback                  │    │
│  │  - UnitCard (memoized)                              │    │
│  │  - BattleGrid (memoized cells)                      │    │
│  │  - EventLog (virtualized list)                      │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Component Design

### 1. Performance Interceptor (Backend)

```typescript
/**
 * NestJS interceptor for measuring request performance.
 * Logs timing metrics for all API requests.
 */
@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Performance');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const startTime = performance.now();

    return next.handle().pipe(
      tap(() => {
        const duration = performance.now() - startTime;
        this.logger.log(`${method} ${url} - ${duration.toFixed(2)}ms`);
        
        // Warn if slow
        if (duration > 200) {
          this.logger.warn(`Slow request: ${method} ${url} took ${duration.toFixed(2)}ms`);
        }
      }),
    );
  }
}
```

### 2. Unit Cache Service (Backend)

```typescript
/**
 * In-memory cache for static unit data.
 * Units don't change at runtime, so caching is safe.
 */
@Injectable()
export class UnitCacheService {
  private readonly unitCache: Map<string, UnitTemplate> = new Map();
  private readonly unitsByRole: Map<UnitRole, UnitTemplate[]> = new Map();
  private initialized = false;

  /**
   * Initialize cache on application startup.
   */
  onModuleInit(): void {
    this.initializeCache();
  }

  private initializeCache(): void {
    const allUnits = getAllUnitTemplates();
    
    // Cache by ID
    allUnits.forEach(unit => {
      this.unitCache.set(unit.id, unit);
    });

    // Cache by role
    const roles: UnitRole[] = ['tank', 'melee_dps', 'ranged_dps', 'mage', 'support', 'control'];
    roles.forEach(role => {
      this.unitsByRole.set(role, allUnits.filter(u => u.role === role));
    });

    this.initialized = true;
  }

  getUnit(id: string): UnitTemplate | undefined {
    return this.unitCache.get(id);
  }

  getUnitsByRole(role: UnitRole): UnitTemplate[] {
    return this.unitsByRole.get(role) ?? [];
  }

  getAllUnits(): UnitTemplate[] {
    return Array.from(this.unitCache.values());
  }
}
```

### 3. Lazy Components (Frontend)

```typescript
// frontend/src/components/LazyComponents.tsx
import dynamic from 'next/dynamic';
import { LoadingSpinner } from './LoadingStates';

/**
 * Lazy loaded BattleReplay component.
 * Only loaded when user navigates to battle page.
 */
export const LazyBattleReplay = dynamic(
  () => import('./BattleReplay').then(mod => ({ default: mod.BattleReplay })),
  {
    loading: () => <LoadingSpinner message="Loading battle replay..." />,
    ssr: false, // Battle replay doesn't need SSR
  }
);

/**
 * Lazy loaded BattleAnimations component.
 * Heavy animation logic loaded on demand.
 */
export const LazyBattleAnimations = dynamic(
  () => import('./BattleAnimations'),
  {
    loading: () => null,
    ssr: false,
  }
);

/**
 * Lazy loaded Profile page content.
 */
export const LazyProfileContent = dynamic(
  () => import('../app/profile/ProfilePageContent'),
  {
    loading: () => <LoadingSpinner message="Loading profile..." />,
  }
);
```

### 4. Memoized UnitCard (Frontend)

```typescript
// Optimized UnitCard with React.memo
import { memo, useMemo } from 'react';

interface UnitCardProps {
  unit: UnitTemplate;
  size: 'compact' | 'full';
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

/**
 * Memoized unit card component.
 * Only re-renders when props actually change.
 */
export const UnitCard = memo(function UnitCard({
  unit,
  size,
  selected = false,
  disabled = false,
  onClick,
}: UnitCardProps) {
  // Memoize expensive style calculations
  const cardStyles = useMemo(() => ({
    borderColor: selected ? 'border-yellow-400' : 'border-gray-600',
    opacity: disabled ? 'opacity-50' : 'opacity-100',
  }), [selected, disabled]);

  // Memoize role color
  const roleColor = useMemo(() => getRoleColor(unit.role), [unit.role]);

  return (
    <div 
      className={`${cardStyles.borderColor} ${cardStyles.opacity}`}
      onClick={disabled ? undefined : onClick}
    >
      {/* Card content */}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better memoization
  return (
    prevProps.unit.id === nextProps.unit.id &&
    prevProps.size === nextProps.size &&
    prevProps.selected === nextProps.selected &&
    prevProps.disabled === nextProps.disabled
  );
});
```

### 5. Performance Test Script (Backend)

```typescript
// backend/scripts/performance-test.ts
import { simulateBattle } from '../src/battle/battle.simulator';
import { generateBotTeam } from '../src/battle/bot-generator';

/**
 * Performance test script for battle simulation.
 * Measures average simulation time over multiple runs.
 */
async function runPerformanceTests(): Promise<void> {
  const iterations = 100;
  const times: number[] = [];

  console.log(`Running ${iterations} battle simulations...`);

  for (let i = 0; i < iterations; i++) {
    const team1 = generateBotTeam('hard', 30);
    const team2 = generateBotTeam('hard', 30);
    const seed = Date.now() + i;

    const start = performance.now();
    simulateBattle(team1, team2, seed);
    const duration = performance.now() - start;

    times.push(duration);
  }

  // Calculate statistics
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const sorted = [...times].sort((a, b) => a - b);
  const p50 = sorted[Math.floor(times.length * 0.5)];
  const p95 = sorted[Math.floor(times.length * 0.95)];
  const p99 = sorted[Math.floor(times.length * 0.99)];
  const max = sorted[sorted.length - 1];

  console.log('\n=== Battle Simulation Performance ===');
  console.log(`Iterations: ${iterations}`);
  console.log(`Average: ${avg.toFixed(2)}ms`);
  console.log(`P50: ${p50.toFixed(2)}ms`);
  console.log(`P95: ${p95.toFixed(2)}ms`);
  console.log(`P99: ${p99.toFixed(2)}ms`);
  console.log(`Max: ${max.toFixed(2)}ms`);
  console.log(`Target: < 50ms (P95)`);
  console.log(`Status: ${p95 < 50 ? '✅ PASS' : '❌ FAIL'}`);
}

runPerformanceTests().catch(console.error);
```

## Data Flow

### Request Performance Flow

```
Client Request
      │
      ▼
┌─────────────────┐
│ Performance     │ ─── Start Timer
│ Interceptor     │
└─────────────────┘
      │
      ▼
┌─────────────────┐
│ Cache Check     │ ─── Return cached if available
│ (Units API)     │
└─────────────────┘
      │
      ▼
┌─────────────────┐
│ Service Logic   │ ─── Execute business logic
└─────────────────┘
      │
      ▼
┌─────────────────┐
│ Performance     │ ─── Stop Timer, Log Duration
│ Interceptor     │
└─────────────────┘
      │
      ▼
Client Response
```

### Frontend Bundle Loading Flow

```
Initial Page Load
      │
      ▼
┌─────────────────┐
│ Critical Bundle │ ─── ~100KB (Navigation, Shell)
│ (Immediate)     │
└─────────────────┘
      │
      ▼
┌─────────────────┐
│ Route-based     │ ─── Load on navigation
│ Code Splitting  │
└─────────────────┘
      │
      ├──► /battle/[id] ──► LazyBattleReplay
      │
      ├──► /profile ──► LazyProfileContent
      │
      └──► /history ──► LazyHistoryContent
```

## Error Handling

### Performance Degradation Handling

```typescript
// Graceful degradation for slow operations
const TIMEOUT_MS = 5000;

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = TIMEOUT_MS
): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Operation timed out')), timeoutMs);
  });

  return Promise.race([promise, timeout]);
}

// Usage in battle simulation
try {
  const result = await withTimeout(simulateBattle(team1, team2, seed), 5000);
  return result;
} catch (error) {
  if (error.message === 'Operation timed out') {
    logger.error('Battle simulation timed out', { team1, team2, seed });
    throw new InternalServerErrorException('Battle simulation took too long');
  }
  throw error;
}
```

## Testing Strategy

### Performance Tests

1. **Backend Simulation Benchmark**
   - Run 100 battle simulations
   - Measure p50, p95, p99 latencies
   - Target: p95 < 50ms

2. **API Response Time Tests**
   - Test all endpoints under load
   - Measure response times
   - Target: p95 < 200ms

3. **Frontend Bundle Analysis**
   - Analyze bundle with `next-bundle-analyzer`
   - Identify large dependencies
   - Target: Initial bundle < 100KB

4. **Lighthouse CI**
   - Run Lighthouse on all pages
   - Track performance score over time
   - Target: Score > 90

### Test Commands

```bash
# Backend performance test
npm run perf:test

# Bundle analysis
npm run analyze

# Lighthouse CI
npm run lighthouse
```

## Migration Plan

### Phase 1: Profiling (Day 1)
1. Add performance interceptor to backend
2. Create performance test script
3. Run baseline measurements
4. Document current metrics

### Phase 2: Backend Optimization (Day 2)
1. Implement unit cache service
2. Add database indexes
3. Optimize pathfinding
4. Re-run performance tests

### Phase 3: Frontend Optimization (Day 3)
1. Add bundle analyzer
2. Implement lazy loading
3. Add React.memo to key components
4. Run Lighthouse audit

### Phase 4: Validation (Day 4)
1. Compare before/after metrics
2. Fix any regressions
3. Document improvements
4. Update monitoring

## Dependencies

### Backend
- No new dependencies (use built-in Node.js performance APIs)

### Frontend
- `@next/bundle-analyzer` - Bundle size analysis
- Already have: React DevTools, Chrome DevTools

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Cache invalidation issues | Medium | Units are static, no invalidation needed |
| Lazy loading flash | Low | Add proper loading states |
| Over-memoization | Low | Profile before/after to verify benefit |
| Bundle analyzer overhead | Low | Only run in development |
