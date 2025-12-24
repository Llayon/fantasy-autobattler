# Performance Optimization - Implementation Tasks

## Task 1: Backend Performance Profiling Setup

### Description
Создать инфраструктуру для измерения производительности backend, включая interceptor для логирования времени запросов и скрипт для тестирования симуляции боя.

### Requirements Addressed
- Requirement 1: Backend Performance Profiling (Step 66)

### Acceptance Criteria
- [ ] Performance interceptor создан и применён глобально
- [ ] Скрипт performance-test.ts создан и запускается
- [ ] Baseline метрики задокументированы
- [ ] Логи показывают время выполнения каждого запроса

### Implementation Steps

1. **Create Performance Interceptor**
   - File: `backend/src/common/interceptors/performance.interceptor.ts`
   - Measure request duration using `performance.now()`
   - Log slow requests (> 200ms) as warnings
   - Include request method and URL in logs

2. **Register Interceptor Globally**
   - File: `backend/src/main.ts`
   - Add `app.useGlobalInterceptors(new PerformanceInterceptor())`

3. **Create Performance Test Script**
   - File: `backend/scripts/performance-test.ts`
   - Run 100 battle simulations
   - Calculate p50, p95, p99, max latencies
   - Output results in readable format

4. **Add npm Script**
   - File: `backend/package.json`
   - Add `"perf:test": "ts-node scripts/performance-test.ts"`

5. **Document Baseline Metrics**
   - Run performance tests
   - Record current metrics in STEP_PROGRESS.md

### Estimated Time
30 minutes

---

## Task 2: Unit Cache Service Implementation

### Description
Создать сервис кэширования для статических данных юнитов, чтобы избежать повторных вычислений при каждом запросе.

### Requirements Addressed
- Requirement 2: Backend Optimization (Step 67)

### Acceptance Criteria
- [ ] UnitCacheService создан и инициализируется при старте
- [ ] Все 15 юнитов кэшируются в памяти
- [ ] Кэш по ролям работает корректно
- [ ] UnitsController использует кэш вместо прямого доступа

### Implementation Steps

1. **Create Unit Cache Service**
   - File: `backend/src/unit/unit-cache.service.ts`
   - Implement `onModuleInit` for cache initialization
   - Cache units by ID and by role
   - Add methods: `getUnit`, `getUnitsByRole`, `getAllUnits`

2. **Update Units Controller**
   - File: `backend/src/unit/units.controller.ts`
   - Inject UnitCacheService
   - Replace direct unit.data.ts calls with cache calls

3. **Register Service in Module**
   - File: `backend/src/unit/unit.module.ts`
   - Add UnitCacheService to providers

4. **Add Cache Headers**
   - Add `Cache-Control: public, max-age=3600` to units endpoints
   - Units are static, can be cached by browsers

### Estimated Time
25 minutes

---

## Task 3: Pathfinding Optimization

### Description
Оптимизировать алгоритм поиска пути с ранним выходом для недостижимых целей и кэшированием частых путей.

### Requirements Addressed
- Requirement 2: Backend Optimization (Step 67)

### Acceptance Criteria
- [ ] Early exit добавлен для недостижимых целей
- [ ] Максимальное количество итераций ограничено
- [ ] Время поиска пути уменьшилось на 20%+

### Implementation Steps

1. **Add Early Exit Check**
   - File: `backend/src/battle/pathfinding.ts`
   - Check if target is reachable before full A* search
   - Use BFS with limited depth for quick reachability check

2. **Optimize Priority Queue**
   - Review current implementation
   - Ensure O(log n) operations
   - Consider using array-based heap

3. **Add Iteration Limit**
   - Limit A* iterations to prevent infinite loops
   - Return empty path if limit exceeded

4. **Benchmark Improvements**
   - Run pathfinding benchmarks before/after
   - Document improvement percentage

### Estimated Time
35 minutes

---

## Task 4: Database Index Optimization

### Description
Добавить индексы на часто используемые поля в базе данных для ускорения запросов.

### Requirements Addressed
- Requirement 2: Backend Optimization (Step 67)

### Acceptance Criteria
- [ ] Индекс на `battle_log.player1_id` добавлен
- [ ] Индекс на `battle_log.player2_id` добавлен
- [ ] Индекс на `team.player_id` добавлен
- [ ] Индекс на `team.is_active` добавлен
- [ ] Запросы используют индексы (проверить EXPLAIN)

### Implementation Steps

1. **Add Indexes to Entities**
   - File: `backend/src/entities/battle-log.entity.ts`
   - Add `@Index()` decorators to player ID fields
   
   - File: `backend/src/entities/team.entity.ts`
   - Add `@Index()` to playerId and isActive fields

2. **Create Composite Index**
   - Add composite index on (playerId, createdAt) for battle history queries

3. **Verify Index Usage**
   - Run EXPLAIN on common queries
   - Ensure indexes are being used

### Estimated Time
20 minutes

---

## Task 5: Bundle Analyzer Setup

### Description
Настроить анализатор бандла для визуализации размера зависимостей и выявления возможностей оптимизации.

### Requirements Addressed
- Requirement 3: Frontend Performance Optimization (Step 68)

### Acceptance Criteria
- [ ] @next/bundle-analyzer установлен
- [ ] npm script для анализа добавлен
- [ ] Отчёт о текущем размере бандла создан
- [ ] Крупные зависимости идентифицированы

### Implementation Steps

1. **Install Bundle Analyzer**
   ```bash
   cd frontend
   npm install @next/bundle-analyzer
   ```

2. **Configure Next.js**
   - File: `frontend/next.config.js`
   - Wrap config with bundle analyzer
   - Enable only when ANALYZE=true

3. **Add npm Script**
   - File: `frontend/package.json`
   - Add `"analyze": "ANALYZE=true next build"`

4. **Run Analysis**
   - Execute `npm run analyze`
   - Screenshot/document current bundle composition
   - Identify top 5 largest dependencies

### Estimated Time
15 minutes

---

## Task 6: Lazy Loading Implementation

### Description
Реализовать ленивую загрузку для тяжёлых компонентов, чтобы уменьшить размер начального бандла.

### Requirements Addressed
- Requirement 4: Code Splitting (Step 69)

### Acceptance Criteria
- [ ] BattleReplay загружается лениво
- [ ] BattleAnimations загружается лениво
- [ ] Loading states отображаются при загрузке
- [ ] Начальный бандл уменьшился на 30%+

### Implementation Steps

1. **Create Lazy Components File**
   - File: `frontend/src/components/LazyComponents.tsx`
   - Export lazy versions of heavy components
   - Add loading fallbacks

2. **Update Battle Page**
   - File: `frontend/src/app/battle/[id]/page.tsx`
   - Replace direct import with LazyBattleReplay
   - Ensure loading state is user-friendly

3. **Update Profile Page**
   - File: `frontend/src/app/profile/page.tsx`
   - Lazy load profile content if heavy

4. **Verify Code Splitting**
   - Check Network tab for separate chunks
   - Verify initial bundle size decreased

### Estimated Time
30 minutes

---

## Task 7: Component Memoization

### Description
Добавить React.memo и useMemo/useCallback к компонентам, которые часто перерисовываются.

### Requirements Addressed
- Requirement 3: Frontend Performance Optimization (Step 68)

### Acceptance Criteria
- [ ] UnitCard обёрнут в React.memo
- [ ] BattleGrid cells мемоизированы
- [ ] Expensive computations используют useMemo
- [ ] Event handlers используют useCallback
- [ ] React DevTools показывает меньше re-renders

### Implementation Steps

1. **Memoize UnitCard**
   - File: `frontend/src/components/UnitCard.tsx`
   - Wrap with React.memo
   - Add custom comparison function
   - Memoize style calculations

2. **Memoize Grid Cells**
   - File: `frontend/src/components/BattleGrid.tsx`
   - Memoize cell rendering
   - Use useCallback for click handlers

3. **Optimize Event Log**
   - File: `frontend/src/components/BattleReplay.tsx`
   - Memoize event list items
   - Consider virtualization for long lists

4. **Profile with React DevTools**
   - Enable Profiler
   - Record interaction
   - Verify reduced re-renders

### Estimated Time
40 minutes

---

## Task 8: Lighthouse Audit and Fixes

### Description
Запустить Lighthouse аудит и исправить найденные проблемы производительности.

### Requirements Addressed
- Requirement 3: Frontend Performance Optimization (Step 68)

### Acceptance Criteria
- [ ] Lighthouse Performance score > 90
- [ ] FCP < 1.5s
- [ ] LCP < 2.5s
- [ ] CLS < 0.1
- [ ] Все критические проблемы исправлены

### Implementation Steps

1. **Run Initial Lighthouse Audit**
   - Use Chrome DevTools Lighthouse tab
   - Test on mobile and desktop
   - Document initial scores

2. **Fix Critical Issues**
   - Address any blocking resources
   - Optimize images with next/image
   - Add proper font loading

3. **Optimize Core Web Vitals**
   - Reduce CLS with proper image dimensions
   - Improve LCP with preloading
   - Reduce FID with code splitting

4. **Re-run Audit**
   - Verify improvements
   - Document final scores

### Estimated Time
45 minutes

---

## Task 9: Performance Documentation

### Description
Задокументировать все оптимизации и создать baseline для будущего мониторинга.

### Requirements Addressed
- All requirements

### Acceptance Criteria
- [ ] Before/after метрики задокументированы
- [ ] Оптимизации описаны в STEP_PROGRESS.md
- [ ] Performance budget установлен
- [ ] CI checks для performance добавлены (optional)

### Implementation Steps

1. **Document Metrics**
   - Create performance metrics table
   - Include before/after comparisons
   - Note improvement percentages

2. **Update STEP_PROGRESS.md**
   - Add Step 66-69 completion details
   - Include all metrics and changes

3. **Set Performance Budget**
   - Define acceptable thresholds
   - Document in project README or docs

4. **Optional: Add CI Checks**
   - Add Lighthouse CI to GitHub Actions
   - Set performance thresholds

### Estimated Time
20 minutes

---

## Summary

| Task | Time | Priority |
|------|------|----------|
| Task 1: Backend Profiling Setup | 30 min | High |
| Task 2: Unit Cache Service | 25 min | High |
| Task 3: Pathfinding Optimization | 35 min | Medium |
| Task 4: Database Indexes | 20 min | Medium |
| Task 5: Bundle Analyzer Setup | 15 min | High |
| Task 6: Lazy Loading | 30 min | High |
| Task 7: Component Memoization | 40 min | Medium |
| Task 8: Lighthouse Audit | 45 min | High |
| Task 9: Documentation | 20 min | Low |

**Total Estimated Time: ~4.5 hours**

## Execution Order

1. Task 1 (Profiling) - Establish baseline
2. Task 5 (Bundle Analyzer) - Understand current state
3. Task 2 (Unit Cache) - Quick backend win
4. Task 6 (Lazy Loading) - Biggest frontend impact
5. Task 4 (Database Indexes) - Database optimization
6. Task 3 (Pathfinding) - Algorithm optimization
7. Task 7 (Memoization) - Fine-tuning
8. Task 8 (Lighthouse) - Validation
9. Task 9 (Documentation) - Wrap up
