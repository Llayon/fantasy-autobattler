# Performance Optimization (Steps 66-69)

## Introduction

Профилирование и оптимизация производительности приложения для обеспечения плавной работы на всех устройствах. Включает backend оптимизацию, frontend оптимизацию и code splitting.

## Glossary

- **FPS**: Frames Per Second - количество кадров в секунду при анимациях
- **p95 Latency**: 95-й перцентиль времени ответа API
- **Bundle Size**: Размер JavaScript бандла, загружаемого браузером
- **Code Splitting**: Разделение кода на чанки для ленивой загрузки
- **LCP**: Largest Contentful Paint - метрика Core Web Vitals
- **FCP**: First Contentful Paint - время до первого контента

## Requirements

### Requirement 1: Backend Performance Profiling (Step 66)

**User Story:** As a developer, I want to measure backend performance metrics, so that I can identify bottlenecks and optimize critical paths.

#### Acceptance Criteria

1. WHEN a battle simulation runs THEN the simulation time SHALL be less than 100ms
2. WHEN the performance test script runs THEN it SHALL output baseline metrics for comparison
3. WHEN profiling is complete THEN a report SHALL identify top 3 bottlenecks
4. WHEN the API responds THEN there SHALL be no memory leaks detected

---

### Requirement 2: Backend Optimization (Step 67)

**User Story:** As a player, I want fast API responses, so that the game feels responsive and smooth.

#### Acceptance Criteria

1. WHEN the API responds THEN the p95 latency SHALL be less than 200ms
2. WHEN a battle simulation runs after optimization THEN the time SHALL be less than 50ms
3. WHEN units data is requested THEN it SHALL be served from cache (units are static)
4. WHEN database queries run THEN there SHALL be no N+1 query problems
5. WHEN pathfinding runs THEN it SHALL use early exit optimization for unreachable targets

---

### Requirement 3: Frontend Performance Optimization (Step 68)

**User Story:** As a player on mobile device, I want smooth animations and fast page loads, so that I can enjoy the game without lag.

#### Acceptance Criteria

1. WHEN animations play THEN the FPS SHALL be 60 or higher
2. WHEN the page loads THEN the First Contentful Paint SHALL be less than 1.5 seconds
3. WHEN the bundle is analyzed THEN the gzipped size SHALL be less than 200KB
4. WHEN components re-render THEN there SHALL be no unnecessary re-renders (verified with React DevTools)
5. WHEN Lighthouse audit runs THEN the performance score SHALL be 90 or higher

---

### Requirement 4: Code Splitting (Step 69)

**User Story:** As a player, I want fast initial page load, so that I can start playing quickly.

#### Acceptance Criteria

1. WHEN the initial page loads THEN the initial JS bundle SHALL be less than 100KB
2. WHEN BattleReplay component loads THEN it SHALL be dynamically imported (lazy loaded)
3. WHEN a page loads THEN there SHALL be no flash of unstyled content
4. WHEN lazy components load THEN loading states SHALL be displayed

---

## Technical Notes

### Backend Profiling Tools
- Node.js built-in profiler (`--prof` flag)
- NestJS built-in performance interceptor
- Custom timing middleware

### Frontend Profiling Tools
- Chrome DevTools Performance tab
- React DevTools Profiler
- Lighthouse CI
- `next-bundle-analyzer` for bundle analysis

### Files to Create/Modify
- `backend/scripts/performance-test.ts` - Performance test script
- `frontend/next.config.js` - Bundle analyzer configuration
- `frontend/src/components/LazyComponents.tsx` - Lazy loaded components

### Optimization Strategies

#### Backend
1. Cache static unit data in memory
2. Add database indexes on frequently queried fields
3. Optimize pathfinding with early exit
4. Use connection pooling for PostgreSQL

#### Frontend
1. `React.memo` for frequently re-rendering components
2. `useMemo`/`useCallback` for expensive computations
3. Dynamic imports for heavy components (BattleReplay, BattleAnimations)
4. Image optimization with `next/image`

### Dependencies
- `@next/bundle-analyzer` for bundle analysis
- No new backend dependencies required

## Priority
- **High** - Performance directly impacts user experience

## Success Metrics
| Metric | Current | Target |
|--------|---------|--------|
| Battle Simulation | TBD | < 50ms |
| API p95 Latency | TBD | < 200ms |
| Initial Bundle | TBD | < 100KB |
| Lighthouse Score | TBD | > 90 |
| Animation FPS | TBD | 60 |
