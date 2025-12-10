# 🤖 AI-Driven Development Plan — 100 Steps

План разработки Fantasy Autobattler с использованием AI (Claude Sonnet в Kiro IDE).
Каждый шаг содержит 2 промпта: для создания и для ревью.

---

## Условные обозначения

- 🔧 **CREATE** — промпт для создания/имплементации
- 🔍 **REVIEW** — промпт для проверки и улучшения
- ⏱️ **Time** — примерное время выполнения

---

## PHASE 1: FOUNDATION (Steps 1-15)

### Step 1: Project Structure Cleanup
⏱️ 15 min

🔧 **CREATE:**
```
Очисти проект от устаревших файлов. Удали:
- backend/src/database/ (memory.service.ts не нужен с TypeORM)
- backend/prisma/ (используем TypeORM)
Обнови импорты во всех файлах, которые ссылались на удалённые модули.
```

🔍 **REVIEW:**
```
Проверь, что после удаления файлов:
1. Backend компилируется без ошибок (npm run build)
2. Нет broken imports
3. Все модули корректно зарегистрированы в app.module.ts
Исправь найденные проблемы.
```

---

### Step 2: Constants & Configuration
⏱️ 20 min

🔧 **CREATE:**
```
Создай файл backend/src/config/game.constants.ts с константами игры:
- GRID_WIDTH = 8, GRID_HEIGHT = 10
- PLAYER_ROWS = [0, 1], ENEMY_ROWS = [8, 9]
- TEAM_BUDGET = 30
- MAX_ROUNDS = 100
- Все магические числа из GDD

Следуй правилам из docs/ENGINEERING_GUIDE.md — никаких magic numbers.
```

🔍 **REVIEW:**
```
Проверь backend/src/config/game.constants.ts:
1. Все константы имеют понятные имена
2. Значения соответствуют GDD (docs/GAME_DESIGN_DOCUMENT.md)
3. Константы экспортируются и типизированы
4. Нет дублирования с другими файлами
```

---

### Step 3: Unit Types & Interfaces
⏱️ 25 min

🔧 **CREATE:**
```
Создай backend/src/types/game.types.ts с интерфейсами:
- Position { x: number, y: number }
- UnitStats { hp, atk, atkCount, armor, speed, initiative, dodge }
- UnitTemplate { id, name, role, cost, stats, range, abilities }
- BattleUnit extends UnitTemplate { position, currentHp, team, alive }
- BattleEvent { round, type, actorId, targetId?, damage?, position? }
- BattleResult { events, winner, finalState }

Используй строгую типизацию, никаких any. Роли: 'tank' | 'melee_dps' | 'ranged_dps' | 'mage' | 'support' | 'control'
```

🔍 **REVIEW:**
```
Проверь backend/src/types/game.types.ts:
1. Все типы строго типизированы (no any)
2. Используются interface для объектов, type для unions
3. Типы соответствуют GDD (проверь все характеристики юнитов)
4. Экспорты корректны
Запусти npm run typecheck для проверки.
```

---

### Step 4: Unit Templates Data
⏱️ 30 min

🔧 **CREATE:**
```
Обнови backend/src/unit/unit.data.ts — добавь все 15 юнитов из GDD:

Танки (3): knight, guardian, berserker
Ближний урон (3): rogue, duelist, assassin  
Дальний урон (3): archer, crossbowman, hunter
Маги (3): mage, warlock, elementalist
Поддержка (2): priest, bard
Контроль (1): enchanter

Используй точные статы из docs/GAME_DESIGN_DOCUMENT.md секция 6.1.
Импортируй типы из types/game.types.ts.
```

🔍 **REVIEW:**
```
Сверь backend/src/unit/unit.data.ts с GDD:
1. Все 15 юнитов присутствуют
2. Статы точно соответствуют таблицам в GDD
3. Стоимость (cost) в диапазоне 3-8
4. Сумма статов сбалансирована относительно cost
5. Типы корректны, нет ошибок компиляции
```

---

### Step 5: Grid System
⏱️ 25 min

🔧 **CREATE:**
```
Создай backend/src/battle/grid.ts с функциями для работы с полем 8x10:
- createEmptyGrid(): GridCell[][]
- isValidPosition(pos: Position): boolean
- isWalkable(pos: Position, grid: Grid): boolean
- getNeighbors(pos: Position): Position[]
- manhattanDistance(a: Position, b: Position): number
- getUnitsInRange(center: Position, range: number, units: BattleUnit[]): BattleUnit[]

Все функции должны быть pure functions. Используй константы из game.constants.ts.
```

🔍 **REVIEW:**
```
Проверь backend/src/battle/grid.ts:
1. Все функции pure (нет side effects)
2. Граничные случаи обработаны (края поля, отрицательные координаты)
3. manhattanDistance корректно считает расстояние
4. getNeighbors возвращает только валидные позиции
Напиши 3-5 unit тестов для проверки.
```


---

### Step 6: Pathfinding (A* Algorithm)
⏱️ 40 min

🔧 **CREATE:**
```
Создай backend/src/battle/pathfinding.ts с A* алгоритмом:
- findPath(start: Position, goal: Position, grid: Grid, units: BattleUnit[]): Position[]
- Учитывай занятые клетки (другие юниты блокируют путь)
- Используй Manhattan distance как эвристику
- Возвращай пустой массив если путь не найден

Реализуй PriorityQueue для оптимальной производительности.
Функция должна быть pure, детерминированной.
```

🔍 **REVIEW:**
```
Проверь backend/src/battle/pathfinding.ts:
1. A* корректно находит кратчайший путь
2. Обходит препятствия (занятые клетки)
3. Возвращает [] когда путь невозможен
4. Детерминированный (одинаковый input = одинаковый output)
5. Производительность O(n log n)
Напиши тесты: прямой путь, путь с препятствием, невозможный путь.
```

---

### Step 7: Damage Calculator
⏱️ 20 min

🔧 **CREATE:**
```
Создай backend/src/battle/damage.ts с функциями расчёта урона:
- calculatePhysicalDamage(attacker: BattleUnit, target: BattleUnit): number
  // max(1, (atk - armor) * atkCount)
- calculateMagicDamage(attacker: BattleUnit, target: BattleUnit): number
  // atk * atkCount (игнорирует броню)
- rollDodge(target: BattleUnit, seed: number): boolean
  // Детерминированный dodge check с seed
- applyDamage(target: BattleUnit, damage: number): { newHp: number, killed: boolean }

Все функции pure. Используй seed для детерминизма вместо Math.random().
```

🔍 **REVIEW:**
```
Проверь backend/src/battle/damage.ts:
1. Формулы соответствуют GDD секция 5.2
2. Минимальный урон = 1 (не 0)
3. Магический урон игнорирует броню
4. rollDodge детерминирован при одинаковом seed
5. applyDamage не мутирует входной объект
Напиши тесты для edge cases: 0 armor, 100% dodge, overkill damage.
```

---

### Step 8: Turn Order System
⏱️ 20 min

🔧 **CREATE:**
```
Создай backend/src/battle/turn-order.ts:
- buildTurnQueue(units: BattleUnit[]): BattleUnit[]
  // Сортировка по: 1) initiative DESC, 2) speed DESC, 3) id ASC (tiebreaker)
- getNextUnit(queue: BattleUnit[]): BattleUnit | null
  // Возвращает первого живого юнита
- removeDeadUnits(queue: BattleUnit[]): BattleUnit[]

Порядок должен быть детерминированным. Следуй GDD секция 5.3.
```

🔍 **REVIEW:**
```
Проверь backend/src/battle/turn-order.ts:
1. Сортировка стабильная и детерминированная
2. При равной initiative сравнивается speed
3. При полном равенстве — алфавитный порядок id
4. Мёртвые юниты корректно исключаются
Тест: создай 3 юнита с одинаковой initiative, проверь порядок.
```

---

### Step 9: Target Selection
⏱️ 25 min

🔧 **CREATE:**
```
Создай backend/src/battle/targeting.ts:
- findNearestEnemy(unit: BattleUnit, enemies: BattleUnit[]): BattleUnit | null
  // Ближайший по Manhattan distance
- findWeakestEnemy(enemies: BattleUnit[]): BattleUnit | null
  // Наименьший currentHp
- findTauntTarget(unit: BattleUnit, enemies: BattleUnit[]): BattleUnit | null
  // Если есть враг с Taunt — атаковать его
- selectTarget(unit: BattleUnit, enemies: BattleUnit[], strategy: TargetStrategy): BattleUnit | null

TargetStrategy: 'nearest' | 'weakest' | 'highest_threat'
При равенстве — детерминированный tiebreaker по id.
```

🔍 **REVIEW:**
```
Проверь backend/src/battle/targeting.ts:
1. Taunt имеет приоритет над другими стратегиями
2. При равном расстоянии выбор детерминирован
3. Возвращает null если нет живых врагов
4. Не выбирает мёртвых юнитов
Тесты: taunt override, равное расстояние, пустой список врагов.
```

---

### Step 10: Unit Actions
⏱️ 30 min

🔧 **CREATE:**
```
Создай backend/src/battle/actions.ts:
- executeMove(unit: BattleUnit, path: Position[], maxSteps: number): MoveEvent
- executeAttack(attacker: BattleUnit, target: BattleUnit, seed: number): AttackEvent
- executeTurn(unit: BattleUnit, state: BattleState, seed: number): BattleEvent[]

executeTurn должен:
1. Найти цель
2. Если в range — атаковать
3. Если не в range — двигаться к цели, затем атаковать если возможно
4. Вернуть массив событий (move, attack, damage, kill)

Не мутировать state напрямую — возвращать новое состояние.
```

🔍 **REVIEW:**
```
Проверь backend/src/battle/actions.ts:
1. Юнит не двигается дальше своего speed
2. После движения проверяется возможность атаки
3. События содержат всю информацию для воспроизведения
4. State не мутируется (immutable updates)
5. Seed передаётся для детерминизма
```

---

### Step 11: Battle Simulator v2
⏱️ 45 min

🔧 **CREATE:**
```
Перепиши backend/src/battle/battle.simulator.ts используя новые модули:
- Импортируй grid, pathfinding, damage, turn-order, targeting, actions
- simulateBattle(playerTeam: TeamSetup, enemyTeam: TeamSetup, seed: number): BattleResult
- TeamSetup = { units: UnitTemplate[], positions: Position[] }
- Поле 8x10, игрок в рядах 0-1, враг в 8-9
- Максимум MAX_ROUNDS раундов
- Возвращай полный лог событий для replay

Функция должна быть pure и детерминированной.
```

🔍 **REVIEW:**
```
Проверь новый battle.simulator.ts:
1. Использует все созданные модули (grid, pathfinding, etc.)
2. Детерминирован: simulateBattle(team1, team2, 42) === simulateBattle(team1, team2, 42)
3. Корректно определяет победителя
4. События достаточны для воспроизведения боя
5. Не превышает MAX_ROUNDS
Запусти существующие тесты, обнови если нужно.
```

---

### Step 12: Battle Simulator Tests
⏱️ 30 min

🔧 **CREATE:**
```
Обнови backend/src/battle/battle.simulator.spec.ts:
- Тест детерминизма (одинаковый seed = одинаковый результат)
- Тест победы игрока (сильная команда vs слабая)
- Тест победы бота
- Тест ничьи (MAX_ROUNDS)
- Тест корректности событий (move, attack, damage, kill)
- Тест Taunt механики
- Тест дальних атак (archer не должен подходить вплотную)

Используй реальные юниты из unit.data.ts.
```

🔍 **REVIEW:**
```
Проверь тесты в battle.simulator.spec.ts:
1. Покрытие > 80% для simulator
2. Тесты независимы друг от друга
3. Нет flaky тестов (все детерминированы)
4. Edge cases покрыты
Запусти npm test и убедись что все проходят.
```

---

### Step 13: Team Entity
⏱️ 20 min

🔧 **CREATE:**
```
Создай backend/src/entities/team.entity.ts:
- id: UUID
- playerId: связь с Player
- name: string (название команды)
- units: JSON (массив { unitId: string, position: Position })
- totalCost: number (сумма стоимости юнитов)
- isActive: boolean (активная команда для matchmaking)
- createdAt, updatedAt

Добавь связь OneToMany в Player entity.
Добавь валидацию: totalCost <= TEAM_BUDGET.
```

🔍 **REVIEW:**
```
Проверь team.entity.ts:
1. Связь с Player корректна
2. JSON поле правильно типизировано
3. Индексы на playerId и isActive
4. Валидация бюджета на уровне entity
Запусти backend, проверь что таблица создаётся.
```

---

### Step 14: Team Module
⏱️ 35 min

🔧 **CREATE:**
```
Создай модуль team/:
- team.module.ts — регистрация в NestJS
- team.controller.ts:
  POST /team — создать команду
  GET /team — получить команды игрока
  GET /team/:id — получить команду по id
  PUT /team/:id — обновить команду
  DELETE /team/:id — удалить команду
  POST /team/:id/activate — сделать активной

- team.service.ts — бизнес-логика
- team.validator.ts — валидация бюджета и позиций

Следуй паттернам из docs/ENGINEERING_GUIDE.md.
```

🔍 **REVIEW:**
```
Проверь team module:
1. Controller только обрабатывает HTTP (нет логики)
2. Service содержит всю бизнес-логику
3. Валидация: бюджет <= 30, позиции в рядах 0-1, нет дублей юнитов
4. Используется GuestGuard для авторизации
5. Ошибки через NestJS exceptions
Протестируй endpoints через curl или Postman.
```

---

### Step 15: Team Validation
⏱️ 25 min

🔧 **CREATE:**
```
Реализуй backend/src/team/team.validator.ts:
- validateTeamBudget(units: UnitSelection[]): { valid: boolean, totalCost: number, error?: string }
- validatePositions(positions: Position[]): { valid: boolean, error?: string }
  // Все позиции в рядах 0-1, нет дублей
- validateNoDuplicateUnits(unitIds: string[]): { valid: boolean, error?: string }
- validateTeam(team: CreateTeamDto): ValidationResult

Возвращай понятные сообщения об ошибках для UI.
```

🔍 **REVIEW:**
```
Проверь team.validator.ts:
1. Бюджет считается корректно
2. Позиции проверяются на валидность (0 <= x < 8, y in [0,1])
3. Дубликаты юнитов запрещены
4. Сообщения об ошибках понятны пользователю
5. Функции pure, легко тестируются
Напиши unit тесты для каждой функции.
```


---

## PHASE 2: MATCHMAKING & BATTLES (Steps 16-30)

### Step 16: Matchmaking Entity
⏱️ 15 min

🔧 **CREATE:**
```
Создай backend/src/entities/matchmaking-queue.entity.ts:
- id: UUID
- playerId: связь с Player
- teamId: связь с Team
- rating: number (ELO рейтинг)
- joinedAt: timestamp
- status: 'waiting' | 'matched' | 'expired'

Индекс на status + joinedAt для быстрого поиска.
```

🔍 **REVIEW:**
```
Проверь matchmaking-queue.entity.ts:
1. Связи с Player и Team корректны
2. Индексы оптимальны для поиска противника
3. Status enum типизирован
4. joinedAt автоматически заполняется
```

---

### Step 17: Matchmaking Service
⏱️ 40 min

🔧 **CREATE:**
```
Создай backend/src/matchmaking/matchmaking.service.ts:
- joinQueue(playerId: string, teamId: string): QueueEntry
- leaveQueue(playerId: string): void
- findMatch(playerId: string): Match | null
  // Найти противника с близким рейтингом (±100 ELO)
  // Если нет — расширить диапазон каждые 10 секунд
- createBattle(player1: QueueEntry, player2: QueueEntry): Battle

Для MVP: простой random matching без ELO.
```

🔍 **REVIEW:**
```
Проверь matchmaking.service.ts:
1. Игрок не может быть в очереди дважды
2. Нельзя матчиться с самим собой
3. При нахождении матча оба игрока удаляются из очереди
4. Транзакционность: матч создаётся атомарно
5. Expired entries очищаются
```

---

### Step 18: Matchmaking Controller
⏱️ 20 min

🔧 **CREATE:**
```
Создай backend/src/matchmaking/matchmaking.controller.ts:
- POST /matchmaking/join — войти в очередь
- POST /matchmaking/leave — выйти из очереди
- GET /matchmaking/status — статус в очереди
- POST /matchmaking/find — найти матч (polling)

Все endpoints защищены GuestGuard.
Возвращай понятные статусы: 'queued', 'matched', 'not_in_queue'.
```

🔍 **REVIEW:**
```
Проверь matchmaking.controller.ts:
1. Нет бизнес-логики в контроллере
2. Корректные HTTP статусы (201 для join, 200 для status)
3. GuestGuard применён
4. DTO для request/response типизированы
```

---

### Step 19: Battle Entity Update
⏱️ 20 min

🔧 **CREATE:**
```
Обнови backend/src/entities/battle-log.entity.ts:
- Добавь поля:
  - player1Id, player2Id (оба игрока)
  - player1TeamSnapshot: JSON (команда на момент боя)
  - player2TeamSnapshot: JSON
  - seed: number (для воспроизведения)
  - status: 'pending' | 'simulated' | 'viewed'
  - viewedByPlayer1: boolean
  - viewedByPlayer2: boolean

Переименуй playerTeam/botTeam в player1Team/player2Team.
```

🔍 **REVIEW:**
```
Проверь обновлённый battle-log.entity.ts:
1. Поддерживает PvP (два игрока)
2. Snapshot сохраняет состояние команды на момент боя
3. Seed позволяет воспроизвести бой
4. Статусы корректны
5. Миграция не сломает существующие данные
```

---

### Step 20: Battle Service Update
⏱️ 35 min

🔧 **CREATE:**
```
Обнови backend/src/battle/battle.service.ts:
- startPvPBattle(player1Id: string, player2Id: string): BattleLog
  // Загрузить активные команды обоих игроков
  // Сгенерировать seed
  // Запустить симуляцию
  // Сохранить результат
- startPvEBattle(playerId: string, botDifficulty: 'easy' | 'medium' | 'hard'): BattleLog
  // Сгенерировать бота соответствующей сложности
- getBattlesForPlayer(playerId: string): BattleLog[]
- markAsViewed(battleId: string, playerId: string): void
```

🔍 **REVIEW:**
```
Проверь battle.service.ts:
1. PvP корректно загружает команды обоих игроков
2. Seed сохраняется для воспроизведения
3. Результат (winner) определяется корректно
4. PvE генерирует сбалансированного бота
5. Транзакции для атомарности
```

---

### Step 21: Bot Team Generator
⏱️ 30 min

🔧 **CREATE:**
```
Создай backend/src/battle/bot-generator.ts:
- generateBotTeam(difficulty: Difficulty, budget: number): TeamSetup
- Difficulty: 'easy' (20 budget), 'medium' (25), 'hard' (30)
- Стратегии:
  - Easy: случайные юниты
  - Medium: сбалансированный состав (танк + дпс + саппорт)
  - Hard: оптимальные комбинации
- generateBotPositions(units: UnitTemplate[]): Position[]
  // Танки впереди, дальники сзади

Детерминированный при одинаковом seed.
```

🔍 **REVIEW:**
```
Проверь bot-generator.ts:
1. Бюджет не превышается
2. Easy действительно проще Hard
3. Позиции логичны (танки защищают дальников)
4. Детерминирован с seed
5. Нет дублей юнитов
```

---

### Step 22: Rating System
⏱️ 25 min

🔧 **CREATE:**
```
Создай backend/src/rating/rating.service.ts:
- calculateEloChange(winnerRating: number, loserRating: number): { winnerDelta: number, loserDelta: number }
  // K-factor = 32 для новых игроков, 16 для опытных
- updateRatings(winnerId: string, loserId: string): void
- getLeaderboard(limit: number): Player[]
- getPlayerRank(playerId: string): number

Начальный рейтинг: 1000.
```

🔍 **REVIEW:**
```
Проверь rating.service.ts:
1. ELO формула корректна
2. При победе над сильным — больше очков
3. Рейтинг не уходит в минус (min 0)
4. Leaderboard сортирован по убыванию
5. Ничья: оба получают 0
```

---

### Step 23: Player Entity Update
⏱️ 15 min

🔧 **CREATE:**
```
Обнови backend/src/entities/player.entity.ts:
- Добавь поля:
  - rating: number (default 1000)
  - gamesPlayed: number
  - lastActiveAt: timestamp
- Добавь связь OneToMany с Team
- Добавь индекс на rating для leaderboard
```

🔍 **REVIEW:**
```
Проверь player.entity.ts:
1. Новые поля имеют defaults
2. Связь с Team корректна
3. Индекс на rating создан
4. Миграция безопасна
```

---

### Step 24: Units Endpoint
⏱️ 20 min

🔧 **CREATE:**
```
Создай backend/src/units/units.controller.ts:
- GET /units — список всех юнитов с полными статами
- GET /units/:id — конкретный юнит
- GET /units/roles/:role — юниты по роли

Данные берутся из unit.data.ts (статические, не из БД).
Не требует авторизации (публичный endpoint).
```

🔍 **REVIEW:**
```
Проверь units.controller.ts:
1. Возвращает все 15 юнитов
2. Статы соответствуют GDD
3. Фильтрация по роли работает
4. Нет авторизации (публичный)
5. Кэшируемый (можно добавить Cache-Control)
```

---

### Step 25: API Documentation
⏱️ 20 min

🔧 **CREATE:**
```
Добавь Swagger документацию:
1. npm install @nestjs/swagger swagger-ui-express
2. Настрой в main.ts
3. Добавь декораторы @ApiTags, @ApiOperation, @ApiResponse ко всем контроллерам
4. Создай DTO классы с @ApiProperty для всех endpoints

Swagger UI должен быть доступен на /api/docs.
```

🔍 **REVIEW:**
```
Проверь Swagger:
1. Открывается /api/docs
2. Все endpoints документированы
3. Request/Response schemas корректны
4. Можно выполнить запросы из UI
5. Авторизация (x-guest-token) настроена
```

---

### Step 26: Error Handling
⏱️ 25 min

🔧 **CREATE:**
```
Создай backend/src/common/filters/http-exception.filter.ts:
- Единый формат ошибок: { statusCode, message, error, timestamp, path }
- Логирование ошибок
- Скрытие stack trace в production

Создай backend/src/common/exceptions/game.exceptions.ts:
- InvalidTeamException
- BudgetExceededException
- MatchNotFoundException
- BattleAlreadyViewedException
```

🔍 **REVIEW:**
```
Проверь error handling:
1. Все ошибки имеют единый формат
2. Stack trace не утекает в production
3. HTTP статусы корректны (400 для валидации, 404 для not found)
4. Ошибки логируются
5. Custom exceptions используются в сервисах
```

---

### Step 27: Request Validation
⏱️ 20 min

🔧 **CREATE:**
```
Настрой глобальную валидацию:
1. npm install class-validator class-transformer
2. Включи ValidationPipe в main.ts
3. Создай DTO для всех endpoints:
   - CreateTeamDto
   - UpdateTeamDto
   - JoinQueueDto
   - StartBattleDto

Используй декораторы: @IsString, @IsArray, @IsNumber, @ValidateNested.
```

🔍 **REVIEW:**
```
Проверь валидацию:
1. Невалидные запросы возвращают 400
2. Сообщения об ошибках понятны
3. Вложенные объекты валидируются
4. Массивы проверяются
5. Нет возможности инъекции
```

---

### Step 28: Logging
⏱️ 20 min

🔧 **CREATE:**
```
Настрой структурированное логирование:
1. Используй встроенный NestJS Logger
2. Создай backend/src/common/interceptors/logging.interceptor.ts
   - Логируй: method, url, duration, statusCode
3. Добавь request ID для трейсинга
4. Разные уровни: debug для dev, info для prod

Убери все console.log — только Logger.
```

🔍 **REVIEW:**
```
Проверь логирование:
1. Нет console.log в коде
2. Каждый запрос логируется
3. Request ID присутствует
4. Время выполнения измеряется
5. Sensitive data не логируется (tokens, passwords)
```

---

### Step 29: Health Check
⏱️ 15 min

🔧 **CREATE:**
```
Создай backend/src/health/health.controller.ts:
- GET /health — общий статус
- GET /health/db — проверка подключения к БД
- GET /health/ready — готовность принимать трафик

Используй @nestjs/terminus для health checks.
Возвращай: { status: 'ok' | 'error', details: {...} }
```

🔍 **REVIEW:**
```
Проверь health checks:
1. /health возвращает 200 когда всё ок
2. /health/db проверяет реальное подключение
3. При проблемах — 503 Service Unavailable
4. Детали ошибки в response
5. Подходит для Kubernetes probes
```

---

### Step 30: Backend Integration Test
⏱️ 40 min

🔧 **CREATE:**
```
Создай backend/test/app.e2e-spec.ts:
1. Полный flow: создать гостя → создать команду → найти матч → получить результат
2. Тест валидации команды (превышение бюджета)
3. Тест PvE боя
4. Тест получения списка юнитов

Используй supertest, тестовую БД (SQLite in-memory или test PostgreSQL).
```

🔍 **REVIEW:**
```
Проверь e2e тесты:
1. Все тесты проходят
2. Тестовая БД изолирована
3. Cleanup после каждого теста
4. Покрыты основные user flows
5. CI запускает эти тесты
```


---

## PHASE 3: FRONTEND CORE (Steps 31-50)

### Step 31: Frontend Types Sync
⏱️ 15 min

🔧 **CREATE:**
```
Обнови frontend/src/types/game.ts — синхронизируй с backend:
- Все 15 юнитов с полными статами
- Position, BattleUnit, BattleEvent, BattleResult
- TeamSetup, CreateTeamDto
- MatchmakingStatus
- Роли юнитов

Типы должны точно соответствовать backend API.
```

🔍 **REVIEW:**
```
Проверь frontend/src/types/game.ts:
1. Типы идентичны backend
2. Нет any
3. Все поля обязательные/опциональные как в API
4. Enums соответствуют backend
```

---

### Step 32: API Client Update
⏱️ 25 min

🔧 **CREATE:**
```
Обнови frontend/src/lib/api.ts — добавь новые endpoints:
- getUnits(): Promise<UnitTemplate[]>
- createTeam(team: CreateTeamDto): Promise<Team>
- getTeams(): Promise<Team[]>
- updateTeam(id: string, team: UpdateTeamDto): Promise<Team>
- deleteTeam(id: string): Promise<void>
- joinMatchmaking(teamId: string): Promise<QueueStatus>
- leaveMatchmaking(): Promise<void>
- getMatchmakingStatus(): Promise<QueueStatus>
- getBattles(): Promise<BattleLog[]>

Обработка ошибок с понятными сообщениями.
```

🔍 **REVIEW:**
```
Проверь api.ts:
1. Все endpoints соответствуют backend
2. Типы возвращаемых значений корректны
3. Ошибки обрабатываются (try/catch)
4. Token передаётся во всех запросах
5. Нет дублирования кода
```

---

### Step 33: Game Store Refactor
⏱️ 35 min

🔧 **CREATE:**
```
Рефакторинг frontend/src/store/gameStore.ts:
- Раздели на слайсы: playerSlice, teamSlice, battleSlice, matchmakingSlice
- Или создай отдельные stores: usePlayerStore, useTeamStore, useBattleStore

State:
- units: UnitTemplate[] (все доступные юниты)
- teams: Team[] (команды игрока)
- currentTeam: TeamDraft (редактируемая команда)
- matchmakingStatus: QueueStatus
- currentBattle: BattleLog | null

Actions для каждой операции.
```

🔍 **REVIEW:**
```
Проверь store:
1. State нормализован (нет дублирования)
2. Actions не мутируют state напрямую
3. Async actions обрабатывают ошибки
4. Loading states для всех async операций
5. Селекторы для computed values
```

---

### Step 34: Grid Component
⏱️ 40 min

🔧 **CREATE:**
```
Создай frontend/src/components/BattleGrid.tsx:
- Отображает поле 8x10
- Props: units, onCellClick, highlightedCells, selectedUnit
- Визуализация: ряды игрока (0-1) синие, врага (8-9) красные
- Юниты отображаются на своих позициях
- Hover эффекты на клетках

Responsive: на мобильных — pinch-to-zoom.
Используй CSS Grid или Canvas.
```

🔍 **REVIEW:**
```
Проверь BattleGrid.tsx:
1. Корректно отображает 8x10 клеток
2. Юниты на правильных позициях
3. Клики работают
4. Responsive на мобильных
5. Производительность (нет лишних ре-рендеров)
```

---

### Step 35: Unit Card Component
⏱️ 25 min

🔧 **CREATE:**
```
Обнови frontend/src/components/UnitCard.tsx:
- Отображает все статы: HP, ATK, #ATK, BR, СК, ИН, УК, Range
- Цветовая индикация роли (танк=синий, dps=красный, support=зелёный)
- Стоимость юнита (cost)
- Иконка способности
- Compact mode для списка, expanded для деталей

Props: unit, size: 'compact' | 'full', onClick, selected
```

🔍 **REVIEW:**
```
Проверь UnitCard.tsx:
1. Все статы отображаются корректно
2. Цвета соответствуют ролям
3. Compact mode читаем на мобильных
4. Нет inline styles (только Tailwind)
5. Accessible (aria labels)
```

---

### Step 36: Unit List Component
⏱️ 20 min

🔧 **CREATE:**
```
Создай frontend/src/components/UnitList.tsx:
- Список всех доступных юнитов
- Фильтрация по роли
- Сортировка по cost/name/role
- Поиск по имени
- Drag source для drag-and-drop

Props: units, filter, onUnitSelect, disabledUnits (уже в команде)
```

🔍 **REVIEW:**
```
Проверь UnitList.tsx:
1. Фильтры работают корректно
2. Disabled юниты визуально отличаются
3. Поиск case-insensitive
4. Сортировка стабильная
5. Производительность при 15+ юнитах
```

---

### Step 37: Team Builder Page
⏱️ 45 min

🔧 **CREATE:**
```
Перепиши frontend/src/app/page.tsx как Team Builder:
- Слева: UnitList с фильтрами
- Справа: BattleGrid (ряды 0-1 активны)
- Сверху: бюджет (X/30), кнопки Save/Clear
- Drag-and-drop юнитов на поле
- Клик на юнита на поле — удалить

Mobile: вертикальный layout, bottom sheet для списка юнитов.
```

🔍 **REVIEW:**
```
Проверь Team Builder:
1. Drag-and-drop работает
2. Бюджет обновляется в реальном времени
3. Нельзя превысить 30 очков
4. Нельзя поставить юнита вне рядов 0-1
5. Mobile layout удобен
6. Save сохраняет команду на backend
```

---

### Step 38: Drag and Drop
⏱️ 35 min

🔧 **CREATE:**
```
Реализуй drag-and-drop для Team Builder:
- Используй @dnd-kit/core или react-beautiful-dnd
- Drag из UnitList на BattleGrid
- Drag между клетками на поле
- Drag с поля обратно в список (удаление)
- Visual feedback: ghost element, drop zone highlight

Touch support для мобильных.
```

🔍 **REVIEW:**
```
Проверь drag-and-drop:
1. Работает на desktop (mouse)
2. Работает на mobile (touch)
3. Visual feedback понятен
4. Нельзя drop на занятую клетку
5. Нельзя drop вне разрешённой зоны
6. Производительность (нет лагов)
```

---

### Step 39: Budget Indicator
⏱️ 15 min

🔧 **CREATE:**
```
Создай frontend/src/components/BudgetIndicator.tsx:
- Отображает текущий/максимальный бюджет (например, 18/30)
- Progress bar визуализация
- Цвет меняется: зелёный (<20), жёлтый (20-27), красный (28-30)
- Анимация при изменении

Props: current, max
```

🔍 **REVIEW:**
```
Проверь BudgetIndicator.tsx:
1. Числа корректны
2. Цвета меняются на правильных порогах
3. Анимация плавная
4. Accessible (aria-valuenow)
```

---

### Step 40: Team Save/Load
⏱️ 25 min

🔧 **CREATE:**
```
Добавь функционал сохранения команд:
- Кнопка "Save Team" — сохраняет на backend
- Кнопка "My Teams" — открывает список сохранённых команд
- Можно загрузить сохранённую команду в редактор
- Можно удалить команду
- Максимум 5 команд (для MVP)

Используй modal или side panel для списка.
```

🔍 **REVIEW:**
```
Проверь save/load:
1. Команда сохраняется корректно
2. Список команд загружается
3. Загрузка команды заполняет редактор
4. Удаление работает с подтверждением
5. Ошибки отображаются пользователю
```

---

### Step 41: Matchmaking UI
⏱️ 30 min

🔧 **CREATE:**
```
Создай frontend/src/components/MatchmakingPanel.tsx:
- Кнопка "Find Match" (активна если есть сохранённая команда)
- Статус: "Searching...", "Match Found!", "Error"
- Таймер ожидания
- Кнопка "Cancel" для выхода из очереди
- Анимация поиска

При нахождении матча — редирект на /battle/[id]
```

🔍 **REVIEW:**
```
Проверь MatchmakingPanel:
1. Нельзя искать без команды
2. Статус обновляется (polling каждые 2 сек)
3. Cancel работает
4. При матче — редирект
5. Ошибки отображаются
```

---

### Step 42: Battle Replay Refactor
⏱️ 45 min

🔧 **CREATE:**
```
Перепиши frontend/src/components/BattleReplay.tsx для нового формата:
- Поле 8x10 с юнитами обеих сторон
- Пошаговое воспроизведение событий
- Анимации: движение, атака, урон, смерть
- Контролы: Play/Pause, Step, Speed (1x/2x/4x), Skip to end
- Turn order bar сверху
- Event log снизу

Props: battle: BattleLog
```

🔍 **REVIEW:**
```
Проверь BattleReplay:
1. События воспроизводятся в правильном порядке
2. Анимации синхронизированы
3. Контролы работают
4. Speed влияет на скорость
5. Можно пересмотреть с начала
```

---

### Step 43: Battle Animations
⏱️ 40 min

🔧 **CREATE:**
```
Создай frontend/src/components/BattleAnimations.tsx:
- MoveAnimation: юнит плавно перемещается
- AttackAnimation: юнит "бьёт" в сторону цели
- DamageNumber: всплывающее число урона (-15)
- DeathAnimation: юнит исчезает
- HealAnimation: зелёные частицы

Используй CSS transitions или Framer Motion.
```

🔍 **REVIEW:**
```
Проверь анимации:
1. Движение плавное (не телепортация)
2. Атака направлена на цель
3. Числа урона читаемы
4. Смерть заметна
5. Производительность (60 fps)
```

---

### Step 44: Battle Result Screen
⏱️ 25 min

🔧 **CREATE:**
```
Создай frontend/src/components/BattleResult.tsx:
- Отображается после окончания боя
- "Victory!" / "Defeat!" / "Draw!"
- Статистика: урон нанесён, урон получен, юнитов потеряно
- Изменение рейтинга (+15 / -12)
- Кнопки: "Watch Replay", "New Battle", "Edit Team"

Анимация появления результата.
```

🔍 **REVIEW:**
```
Проверь BattleResult:
1. Правильно определяет победу/поражение
2. Статистика корректна
3. Рейтинг отображается
4. Кнопки работают
5. Анимация не раздражает
```

---

### Step 45: Battle History Page
⏱️ 25 min

🔧 **CREATE:**
```
Создай frontend/src/app/history/page.tsx:
- Список последних боёв игрока
- Для каждого: противник, результат, дата, изменение рейтинга
- Клик — переход к replay
- Пагинация (10 боёв на страницу)
- Фильтр: все / победы / поражения

Пустое состояние: "No battles yet"
```

🔍 **REVIEW:**
```
Проверь History page:
1. Бои загружаются с backend
2. Сортировка по дате (новые сверху)
3. Фильтры работают
4. Клик открывает replay
5. Пагинация работает
```

---

### Step 46: Profile Page
⏱️ 25 min

🔧 **CREATE:**
```
Создай frontend/src/app/profile/page.tsx:
- Имя игрока (редактируемое)
- Рейтинг и ранг
- Статистика: игр сыграно, побед, поражений, win rate
- Список команд
- Кнопка "Copy Profile Link"

Графики: win rate за последние 20 игр (опционально).
```

🔍 **REVIEW:**
```
Проверь Profile page:
1. Данные загружаются корректно
2. Имя можно изменить
3. Статистика точная
4. Команды отображаются
5. Copy link работает
```

---

### Step 47: Navigation
⏱️ 20 min

🔧 **CREATE:**
```
Создай frontend/src/components/Navigation.tsx:
- Tabs/Bottom nav: Team Builder, Battle, History, Profile
- Активный tab подсвечен
- Badge на History если есть непросмотренные бои
- Mobile: bottom navigation bar
- Desktop: top navigation

Используй Next.js Link для навигации.
```

🔍 **REVIEW:**
```
Проверь Navigation:
1. Все ссылки работают
2. Активный tab определяется по URL
3. Badge обновляется
4. Mobile/desktop layouts корректны
5. Нет layout shift при навигации
```

---

### Step 48: Loading States
⏱️ 20 min

🔧 **CREATE:**
```
Создай frontend/src/components/LoadingStates.tsx:
- Spinner: простой индикатор загрузки
- Skeleton: placeholder для контента
- FullPageLoader: оверлей на всю страницу
- ButtonLoader: спиннер внутри кнопки

Используй во всех местах где есть async операции.
```

🔍 **REVIEW:**
```
Проверь loading states:
1. Spinner анимирован
2. Skeleton похож на реальный контент
3. Нет "мигания" при быстрой загрузке
4. Accessible (aria-busy)
```

---

### Step 49: Error States
⏱️ 20 min

🔧 **CREATE:**
```
Создай frontend/src/components/ErrorStates.tsx:
- ErrorMessage: inline ошибка
- ErrorPage: полноэкранная ошибка с retry
- Toast: всплывающее уведомление
- NetworkError: специальный UI для проблем с сетью

Добавь error boundary для React errors.
```

🔍 **REVIEW:**
```
Проверь error states:
1. Сообщения понятны пользователю
2. Retry работает
3. Toast автоматически исчезает
4. Error boundary ловит crashes
5. Ошибки логируются
```

---

### Step 50: Responsive Design
⏱️ 35 min

🔧 **CREATE:**
```
Проверь и исправь responsive design на всех страницах:
- Mobile (320px - 480px)
- Tablet (481px - 768px)
- Desktop (769px+)

Особое внимание:
- BattleGrid должен помещаться на экран
- Drag-and-drop работает на touch
- Текст читаем
- Кнопки достаточно большие (min 44x44)
```

🔍 **REVIEW:**
```
Проверь responsive:
1. Протестируй на реальных устройствах или DevTools
2. Нет горизонтального скролла
3. Все элементы доступны
4. Touch targets >= 44px
5. Шрифты читаемы (min 14px)
```


---

## PHASE 4: ABILITIES & ADVANCED MECHANICS (Steps 51-65)

### Step 51: Ability System Types
⏱️ 20 min

🔧 **CREATE:**
```
Создай backend/src/types/ability.types.ts:
- AbilityType: 'active' | 'passive'
- TargetType: 'self' | 'ally' | 'enemy' | 'area' | 'all_enemies' | 'all_allies'
- EffectType: 'damage' | 'heal' | 'buff' | 'debuff' | 'stun' | 'taunt' | 'summon'
- Ability { id, name, type, targetType, cooldown, range, manaCost?, effects }
- AbilityEffect { type, value, duration?, areaSize? }
- ActiveAbility extends Ability
- PassiveAbility extends Ability
```

🔍 **REVIEW:**
```
Проверь ability.types.ts:
1. Типы покрывают все способности из GDD
2. Нет any
3. Опциональные поля помечены ?
4. Типы экспортируются
```

---

### Step 52: Ability Definitions
⏱️ 35 min

🔧 **CREATE:**
```
Создай backend/src/abilities/ability.data.ts:
Определи все способности из GDD:
- shield_wall (Knight): +50% armor на 2 хода
- taunt (Guardian): враги атакуют только этого юнита
- rage (Berserker): +ATK при HP < 50%
- backstab (Rogue): +100% damage если атакует сзади
- fireball (Mage): AoE damage в радиусе 1
- heal (Priest): восстановить 25 HP союзнику
- stun (Enchanter): цель пропускает ход
... и остальные 15 способностей

Каждая способность — объект с полными параметрами.
```

🔍 **REVIEW:**
```
Проверь ability.data.ts:
1. Все 15 способностей определены
2. Параметры соответствуют GDD
3. Cooldown сбалансированы
4. Типы корректны
```

---

### Step 53: Ability Executor
⏱️ 45 min

🔧 **CREATE:**
```
Создай backend/src/battle/ability.executor.ts:
- canUseAbility(unit: BattleUnit, ability: Ability, state: BattleState): boolean
- getValidTargets(unit: BattleUnit, ability: Ability, state: BattleState): BattleUnit[]
- executeAbility(unit: BattleUnit, ability: Ability, target: BattleUnit | Position, state: BattleState): AbilityEvent[]
- applyEffect(effect: AbilityEffect, target: BattleUnit): EffectResult

Обработка каждого типа эффекта: damage, heal, buff, debuff, stun.
Pure functions, детерминированные.
```

🔍 **REVIEW:**
```
Проверь ability.executor.ts:
1. Каждый тип эффекта обрабатывается
2. Cooldown проверяется
3. Range проверяется
4. AoE правильно находит цели
5. Детерминированность (seed для random эффектов)
```

---

### Step 54: Buff/Debuff System
⏱️ 30 min

🔧 **CREATE:**
```
Создай backend/src/battle/status-effects.ts:
- StatusEffect { id, type, value, duration, source }
- applyStatusEffect(unit: BattleUnit, effect: StatusEffect): BattleUnit
- tickStatusEffects(unit: BattleUnit): { unit: BattleUnit, expiredEffects: StatusEffect[] }
- getModifiedStats(unit: BattleUnit): UnitStats
  // Применяет все активные баффы/дебаффы к статам

Баффы: +armor, +atk, +speed
Дебаффы: -armor, -atk, stun (пропуск хода)
```

🔍 **REVIEW:**
```
Проверь status-effects.ts:
1. Баффы корректно модифицируют статы
2. Duration уменьшается каждый ход
3. Эффекты удаляются по истечении
4. Stun правильно пропускает ход
5. Несколько эффектов стакаются корректно
```

---

### Step 55: AI Decision Making
⏱️ 40 min

🔧 **CREATE:**
```
Создай backend/src/battle/ai.decision.ts:
- decideAction(unit: BattleUnit, state: BattleState): UnitAction
- UnitAction: { type: 'attack' | 'ability' | 'move', target?, abilityId? }

Логика принятия решений:
1. Если есть готовая способность и хорошая цель — использовать
2. Healer: приоритет лечению раненых союзников
3. Tank: двигаться к врагам, использовать taunt
4. DPS: атаковать слабейшего врага
5. Mage: использовать AoE если 2+ врага рядом

Детерминированный выбор (при равных приоритетах — по id).
```

🔍 **REVIEW:**
```
Проверь ai.decision.ts:
1. Healer лечит раненых, а не атакует
2. Tank использует taunt когда доступен
3. Mage использует AoE оптимально
4. Решения детерминированы
5. Нет бесконечных циклов
```

---

### Step 56: Battle Simulator with Abilities
⏱️ 45 min

🔧 **CREATE:**
```
Обнови backend/src/battle/battle.simulator.ts:
- Интегрируй ability.executor.ts
- Интегрируй status-effects.ts
- Интегрируй ai.decision.ts
- Каждый ход: tick status effects → decide action → execute action
- События включают использование способностей
- Cooldown отслеживается для каждого юнита

Сохрани обратную совместимость с существующими тестами.
```

🔍 **REVIEW:**
```
Проверь обновлённый simulator:
1. Способности используются в бою
2. Cooldown работает
3. Баффы/дебаффы применяются
4. События содержат информацию о способностях
5. Существующие тесты проходят
6. Новые тесты для способностей
```

---

### Step 57: Ability Tests
⏱️ 35 min

🔧 **CREATE:**
```
Создай backend/src/battle/ability.executor.spec.ts:
- Тест Fireball: урон всем в радиусе
- Тест Heal: восстановление HP (не выше максимума)
- Тест Stun: цель пропускает ход
- Тест Taunt: враги атакуют только танка
- Тест Rage: ATK увеличивается при низком HP
- Тест Cooldown: способность недоступна до восстановления

Используй реальные юниты и способности.
```

🔍 **REVIEW:**
```
Проверь тесты способностей:
1. Все основные способности протестированы
2. Edge cases покрыты
3. Тесты детерминированы
4. Покрытие > 80%
```

---

### Step 58: Passive Abilities
⏱️ 25 min

🔧 **CREATE:**
```
Реализуй пассивные способности в backend/src/battle/passive.abilities.ts:
- Evasion (Rogue): +15% dodge постоянно
- Rage (Berserker): +50% ATK когда HP < 50%
- Thorns (Guardian): отражает 20% полученного урона
- Lifesteal (Warlock): восстанавливает 20% нанесённого урона

Пассивки применяются автоматически, не требуют активации.
```

🔍 **REVIEW:**
```
Проверь passive.abilities.ts:
1. Пассивки применяются автоматически
2. Условные пассивки (Rage) проверяют условие
3. Thorns срабатывает при получении урона
4. Lifesteal восстанавливает HP
5. Пассивки не имеют cooldown
```

---

### Step 59: Ability UI Components
⏱️ 30 min

🔧 **CREATE:**
```
Создай frontend/src/components/AbilityIcon.tsx:
- Иконка способности
- Tooltip с описанием
- Индикатор cooldown (затемнение + число)
- Подсветка когда готова к использованию

Создай frontend/src/components/AbilityBar.tsx:
- Список способностей юнита
- Отображается при выборе юнита
```

🔍 **REVIEW:**
```
Проверь Ability UI:
1. Иконки различимы
2. Tooltip информативен
3. Cooldown понятен визуально
4. Работает на мобильных (long press для tooltip)
```

---

### Step 60: Status Effect Indicators
⏱️ 25 min

🔧 **CREATE:**
```
Создай frontend/src/components/StatusEffects.tsx:
- Иконки баффов/дебаффов над юнитом
- Цвет: зелёный для баффов, красный для дебаффов
- Число оставшихся ходов
- Tooltip с описанием эффекта

Отображается на BattleGrid и в BattleReplay.
```

🔍 **REVIEW:**
```
Проверь StatusEffects:
1. Баффы и дебаффы различимы
2. Duration отображается
3. Tooltip понятен
4. Не перекрывает юнита
5. Масштабируется на мобильных
```

---

### Step 61: Ability Animations
⏱️ 35 min

🔧 **CREATE:**
```
Добавь анимации способностей в BattleReplay:
- Fireball: огненный шар летит к цели, взрыв
- Heal: зелёные частицы на цели
- Stun: звёздочки над головой
- Buff: золотое свечение
- Debuff: фиолетовое свечение

Используй CSS animations или canvas.
```

🔍 **REVIEW:**
```
Проверь анимации способностей:
1. Каждая способность имеет уникальную анимацию
2. Анимации не слишком долгие
3. Понятно что произошло
4. Производительность (60 fps)
```

---

### Step 62: Ability Targeting Preview
⏱️ 30 min

🔧 **CREATE:**
```
Добавь preview при наведении на способность в Team Builder:
- Подсветка зоны действия (range)
- Для AoE — показать область поражения
- Предварительный расчёт урона
- Показать какие враги будут задеты

Работает в режиме просмотра юнита.
```

🔍 **REVIEW:**
```
Проверь targeting preview:
1. Range отображается корректно
2. AoE зона видна
3. Предварительный урон точен
4. Обновляется при движении мыши
```

---

### Step 63: Synergy System
⏱️ 35 min

🔧 **CREATE:**
```
Создай backend/src/battle/synergies.ts:
- Synergy { id, name, requiredRoles, bonus }
- Примеры:
  - "Frontline" (2+ tanks): +10% HP всем
  - "Magic Circle" (2+ mages): +15% magic damage
  - "Balanced" (tank + dps + support): +5% all stats
- calculateSynergies(team: UnitTemplate[]): Synergy[]
- applySynergyBonuses(units: BattleUnit[], synergies: Synergy[]): BattleUnit[]
```

🔍 **REVIEW:**
```
Проверь synergies.ts:
1. Синергии определяются корректно
2. Бонусы применяются правильно
3. Несколько синергий стакаются
4. Отображается в UI команды
```

---

### Step 64: Synergy UI
⏱️ 20 min

🔧 **CREATE:**
```
Создай frontend/src/components/SynergyIndicator.tsx:
- Список активных синергий команды
- Иконка + название + бонус
- Подсветка при добавлении юнита, активирующего синергию
- Tooltip с деталями

Отображается в Team Builder.
```

🔍 **REVIEW:**
```
Проверь SynergyIndicator:
1. Синергии обновляются при изменении команды
2. Бонусы понятны
3. Визуально привлекательно
4. Помогает в сборке команды
```

---

### Step 65: Balance Adjustments
⏱️ 30 min

🔧 **CREATE:**
```
Проведи первичную балансировку:
1. Запусти 1000 симуляций случайных команд
2. Собери статистику win rate по юнитам
3. Выяви outliers (win rate < 40% или > 60%)
4. Скорректируй статы проблемных юнитов
5. Повтори симуляцию

Создай скрипт backend/scripts/balance-test.ts для автоматизации.
```

🔍 **REVIEW:**
```
Проверь баланс:
1. Все юниты в диапазоне 45-55% win rate
2. Нет auto-win комбинаций
3. Все роли полезны
4. Дорогие юниты сильнее дешёвых
5. Документируй изменения
```


---

## PHASE 5: POLISH & OPTIMIZATION (Steps 66-80)

### Step 66: Performance Profiling
⏱️ 25 min

🔧 **CREATE:**
```
Профилируй производительность:
1. Backend: измерь время симуляции боя (должно быть < 100ms)
2. Frontend: измерь FPS во время анимаций (должно быть 60)
3. Найди bottlenecks используя Chrome DevTools / Node profiler
4. Создай backend/scripts/performance-test.ts

Запиши baseline метрики для сравнения.
```

🔍 **REVIEW:**
```
Проверь результаты профилирования:
1. Симуляция < 100ms для стандартного боя
2. Нет memory leaks
3. FPS стабильный
4. Определены области для оптимизации
```

---

### Step 67: Backend Optimization
⏱️ 35 min

🔧 **CREATE:**
```
Оптимизируй backend:
1. Кэширование юнитов (они статичны)
2. Оптимизация pathfinding (кэш путей, early exit)
3. Batch database operations
4. Индексы на часто используемые поля
5. Connection pooling для PostgreSQL

Используй Redis для кэширования если нужно.
```

🔍 **REVIEW:**
```
Проверь оптимизации:
1. Время ответа API < 200ms (p95)
2. Симуляция < 50ms после оптимизации
3. Нет N+1 queries
4. Кэш работает корректно
5. Нет race conditions
```

---

### Step 68: Frontend Optimization
⏱️ 35 min

🔧 **CREATE:**
```
Оптимизируй frontend:
1. React.memo для компонентов, которые часто ре-рендерятся
2. useMemo/useCallback для дорогих вычислений
3. Виртуализация списков (если > 50 элементов)
4. Lazy loading для страниц
5. Image optimization (next/image)
6. Bundle size analysis (next-bundle-analyzer)
```

🔍 **REVIEW:**
```
Проверь оптимизации:
1. Lighthouse score > 90
2. First Contentful Paint < 1.5s
3. Bundle size < 200KB (gzipped)
4. Нет лишних ре-рендеров
5. Анимации 60 FPS
```

---

### Step 69: Code Splitting
⏱️ 20 min

🔧 **CREATE:**
```
Настрой code splitting:
1. Dynamic imports для тяжёлых компонентов (BattleReplay)
2. Route-based splitting (уже есть в Next.js)
3. Lazy load анимации
4. Separate chunk для game logic

Проверь что initial bundle минимален.
```

🔍 **REVIEW:**
```
Проверь code splitting:
1. Initial JS < 100KB
2. Страницы загружаются быстро
3. Нет flash of unstyled content
4. Loading states для lazy компонентов
```

---

### Step 70: Accessibility (a11y)
⏱️ 30 min

🔧 **CREATE:**
```
Улучши accessibility:
1. Все интерактивные элементы доступны с клавиатуры
2. ARIA labels для иконок и кнопок
3. Контраст текста >= 4.5:1
4. Focus indicators видимы
5. Screen reader support для важных событий
6. Reduced motion для анимаций

Используй axe-core для автоматической проверки.
```

🔍 **REVIEW:**
```
Проверь accessibility:
1. axe-core не находит ошибок
2. Tab navigation работает
3. Screen reader озвучивает важное
4. Контраст достаточный
5. Анимации отключаются при prefers-reduced-motion
```

---

### Step 71: Internationalization (i18n) Setup
⏱️ 25 min

🔧 **CREATE:**
```
Настрой i18n для будущей локализации:
1. npm install next-intl
2. Создай frontend/messages/en.json с всеми строками
3. Вынеси все hardcoded строки в messages
4. Настрой locale detection

Пока только английский, но структура готова для других языков.
```

🔍 **REVIEW:**
```
Проверь i18n setup:
1. Нет hardcoded строк в компонентах
2. messages/en.json полный
3. Форматирование чисел/дат через i18n
4. Легко добавить новый язык
```

---

### Step 72: Sound Effects
⏱️ 30 min

🔧 **CREATE:**
```
Добавь звуковые эффекты:
1. Создай frontend/src/lib/audio.ts — audio manager
2. Звуки: атака, урон, смерть, победа, поражение, UI клики
3. Используй Web Audio API или Howler.js
4. Настройки громкости в localStorage
5. Mute кнопка в UI

Звуки должны быть короткими (< 1 сек) и не раздражающими.
```

🔍 **REVIEW:**
```
Проверь звуки:
1. Звуки воспроизводятся в нужные моменты
2. Громкость настраивается
3. Mute работает
4. Нет задержки при воспроизведении
5. Файлы оптимизированы (< 50KB каждый)
```

---

### Step 73: Visual Polish
⏱️ 40 min

🔧 **CREATE:**
```
Улучши визуальный стиль:
1. Единая цветовая палитра (fantasy theme)
2. Иконки для всех юнитов (можно emoji или простые SVG)
3. Фоны для экранов
4. Hover/active states для всех кнопок
5. Тени и градиенты для глубины
6. Анимации появления элементов

Создай frontend/src/styles/theme.ts с переменными.
```

🔍 **REVIEW:**
```
Проверь визуальный стиль:
1. Консистентность цветов
2. Все состояния кнопок стилизованы
3. Нет "сырых" элементов
4. Выглядит профессионально
5. Читаемость сохранена
```

---

### Step 74: Tutorial / Onboarding
⏱️ 35 min

🔧 **CREATE:**
```
Создай onboarding для новых игроков:
1. frontend/src/components/Tutorial.tsx
2. Шаги: объяснение юнитов → сборка команды → первый бой
3. Подсветка UI элементов (spotlight)
4. Пропуск для опытных игроков
5. Сохранение прогресса в localStorage

Показывается только при первом входе.
```

🔍 **REVIEW:**
```
Проверь tutorial:
1. Понятен без предварительных знаний
2. Можно пропустить
3. Не показывается повторно
4. Spotlight не блокирует UI
5. Охватывает основные механики
```

---

### Step 75: Tooltips System
⏱️ 25 min

🔧 **CREATE:**
```
Создай единую систему tooltips:
1. frontend/src/components/Tooltip.tsx
2. Позиционирование: auto (не выходит за экран)
3. Задержка появления (300ms)
4. Touch support (long press)
5. Rich content (HTML, не только текст)

Используй для: юнитов, способностей, статов, кнопок.
```

🔍 **REVIEW:**
```
Проверь tooltips:
1. Не выходят за границы экрана
2. Задержка комфортная
3. Работают на touch устройствах
4. Контент информативен
5. Стиль консистентен
```

---

### Step 76: Notifications
⏱️ 20 min

🔧 **CREATE:**
```
Создай систему уведомлений:
1. frontend/src/components/Notifications.tsx
2. Типы: success, error, info, warning
3. Auto-dismiss через 5 секунд
4. Можно закрыть вручную
5. Стек уведомлений (макс 3 одновременно)

Используй для: сохранение команды, ошибки API, матч найден.
```

🔍 **REVIEW:**
```
Проверь notifications:
1. Появляются в нужные моменты
2. Не перекрывают важный контент
3. Auto-dismiss работает
4. Можно закрыть
5. Стек не переполняется
```

---

### Step 77: Offline Support
⏱️ 30 min

🔧 **CREATE:**
```
Добавь базовую offline поддержку:
1. Service Worker для кэширования статики
2. Показывать сохранённые команды offline
3. Индикатор "Offline" в UI
4. Graceful degradation (нельзя искать матч offline)
5. Sync при восстановлении соединения

Используй next-pwa или workbox.
```

🔍 **REVIEW:**
```
Проверь offline support:
1. Приложение открывается offline
2. Статика закэширована
3. Индикатор offline виден
4. Нет crashes при потере сети
5. Данные синхронизируются при reconnect
```

---

### Step 78: Error Tracking
⏱️ 20 min

🔧 **CREATE:**
```
Настрой error tracking:
1. Интегрируй Sentry (или аналог)
2. Frontend: ловить JS errors, React errors
3. Backend: ловить unhandled exceptions
4. Source maps для читаемых stack traces
5. User context (playerId) для отладки

Не отправляй sensitive data.
```

🔍 **REVIEW:**
```
Проверь error tracking:
1. Ошибки появляются в Sentry
2. Stack traces читаемы
3. User context присутствует
4. Нет sensitive data
5. Алерты настроены
```

---

### Step 79: Analytics
⏱️ 25 min

🔧 **CREATE:**
```
Добавь базовую аналитику:
1. События: game_started, team_saved, battle_completed, battle_watched
2. Метрики: DAU, games per user, average session
3. Используй простой подход (собственный endpoint) или Plausible
4. Не собирай PII

Создай backend/src/analytics/analytics.service.ts
```

🔍 **REVIEW:**
```
Проверь analytics:
1. События отправляются
2. Данные сохраняются
3. Нет PII
4. Не влияет на производительность
5. Можно построить базовые отчёты
```

---

### Step 80: Security Audit
⏱️ 35 min

🔧 **CREATE:**
```
Проведи security audit:
1. npm audit для обоих проектов
2. Проверь CORS настройки
3. Rate limiting на API
4. Input validation везде
5. SQL injection (TypeORM защищает, но проверь)
6. XSS protection (React защищает, но проверь)
7. Secure headers (helmet)

Исправь найденные проблемы.
```

🔍 **REVIEW:**
```
Проверь security:
1. npm audit clean (или обоснованные исключения)
2. CORS только для нужных origins
3. Rate limiting работает
4. Нет SQL injection
5. Нет XSS
6. Headers безопасны
```


---

## PHASE 6: TESTING & QUALITY (Steps 81-90)

### Step 81: Unit Tests Coverage
⏱️ 40 min

🔧 **CREATE:**
```
Доведи покрытие unit тестами до 80%:
1. Backend: все сервисы, все pure functions
2. Приоритет: battle simulator, damage calculator, pathfinding
3. Используй jest --coverage для отчёта
4. Добавь coverage threshold в jest.config.js

Фокус на бизнес-логике, не на boilerplate.
```

🔍 **REVIEW:**
```
Проверь coverage:
1. npm test --coverage показывает >= 80%
2. Критичные модули покрыты на 90%+
3. Нет flaky тестов
4. Тесты быстрые (< 30 сек total)
```

---

### Step 82: Integration Tests
⏱️ 35 min

🔧 **CREATE:**
```
Создай integration тесты для backend:
1. Auth flow: создание гостя, валидация токена
2. Team flow: создание, обновление, удаление команды
3. Battle flow: создание боя, получение результата
4. Matchmaking flow: вход в очередь, поиск матча

Используй тестовую БД, очищай между тестами.
```

🔍 **REVIEW:**
```
Проверь integration тесты:
1. Все flows покрыты
2. Тесты изолированы
3. БД очищается
4. Можно запустить параллельно
```

---

### Step 83: E2E Tests
⏱️ 45 min

🔧 **CREATE:**
```
Создай E2E тесты с Playwright или Cypress:
1. Полный user journey: открыть → собрать команду → сохранить → найти бой → посмотреть replay
2. Тест на мобильном viewport
3. Тест error states (backend недоступен)
4. Тест offline mode

Настрой запуск в CI.
```

🔍 **REVIEW:**
```
Проверь E2E тесты:
1. Тесты проходят локально
2. Тесты проходят в CI
3. Screenshots при падении
4. Время выполнения < 5 минут
```

---

### Step 84: Load Testing
⏱️ 30 min

🔧 **CREATE:**
```
Проведи нагрузочное тестирование:
1. Используй k6 или artillery
2. Сценарии:
   - 100 concurrent users создают команды
   - 50 concurrent battles
   - 200 requests/sec на /units
3. Измерь: latency p50/p95/p99, error rate, throughput

Создай backend/scripts/load-test.js
```

🔍 **REVIEW:**
```
Проверь результаты:
1. p95 latency < 500ms при 100 users
2. Error rate < 1%
3. Нет memory leaks при длительной нагрузке
4. БД справляется
```

---

### Step 85: Visual Regression Tests
⏱️ 25 min

🔧 **CREATE:**
```
Настрой visual regression testing:
1. Используй Playwright screenshots или Percy
2. Снимки ключевых экранов: Team Builder, Battle, Profile
3. Сравнение с baseline при каждом PR
4. Порог различия: 0.1%

Интегрируй в CI.
```

🔍 **REVIEW:**
```
Проверь visual tests:
1. Baseline screenshots созданы
2. Изменения детектируются
3. False positives минимальны
4. Легко обновить baseline
```

---

### Step 86: API Contract Tests
⏱️ 25 min

🔧 **CREATE:**
```
Создай contract тесты для API:
1. Используй OpenAPI spec как source of truth
2. Проверяй что responses соответствуют schema
3. Проверяй что frontend использует правильные типы
4. Автогенерация типов из OpenAPI (optional)

Создай backend/test/contract.spec.ts
```

🔍 **REVIEW:**
```
Проверь contract тесты:
1. Все endpoints покрыты
2. Schema актуальна
3. Frontend типы синхронизированы
4. CI падает при несоответствии
```

---

### Step 87: Mutation Testing
⏱️ 30 min

🔧 **CREATE:**
```
Проведи mutation testing для оценки качества тестов:
1. Используй Stryker для TypeScript
2. Запусти на критичных модулях: battle simulator, damage calculator
3. Mutation score должен быть > 70%
4. Добавь тесты для "выживших" мутантов

npm install @stryker-mutator/core
```

🔍 **REVIEW:**
```
Проверь mutation testing:
1. Mutation score > 70%
2. Критичные мутанты убиты
3. Тесты действительно проверяют логику
4. Документируй выжившие мутанты
```

---

### Step 88: Code Quality Gates
⏱️ 20 min

🔧 **CREATE:**
```
Настрой quality gates в CI:
1. Lint: 0 errors, 0 warnings
2. TypeScript: strict mode, 0 errors
3. Tests: 100% pass, coverage >= 80%
4. Build: успешный
5. Bundle size: < 200KB

PR не мержится если gates не пройдены.
Обнови .github/workflows/ci.yml
```

🔍 **REVIEW:**
```
Проверь quality gates:
1. CI блокирует плохой код
2. Все checks обязательны
3. Время CI < 10 минут
4. Понятные сообщения об ошибках
```

---

### Step 89: Documentation Review
⏱️ 25 min

🔧 **CREATE:**
```
Обнови всю документацию:
1. README.md — актуальные инструкции
2. API docs — все endpoints документированы
3. ARCHITECTURE.md — отражает текущее состояние
4. ENGINEERING_GUIDE.md — добавь новые паттерны
5. Inline comments для сложной логики

Удали устаревшую информацию.
```

🔍 **REVIEW:**
```
Проверь документацию:
1. README позволяет запустить проект с нуля
2. API docs полные и актуальные
3. Архитектура соответствует коду
4. Нет TODO в документации
```

---

### Step 90: Pre-release Checklist
⏱️ 30 min

🔧 **CREATE:**
```
Создай и пройди pre-release checklist:
1. [ ] Все тесты проходят
2. [ ] Coverage >= 80%
3. [ ] Нет критичных багов
4. [ ] Performance targets достигнуты
5. [ ] Security audit пройден
6. [ ] Документация актуальна
7. [ ] Mobile тестирование пройдено
8. [ ] Accessibility проверена
9. [ ] Error tracking настроен
10. [ ] Backup/restore протестирован

Создай docs/RELEASE_CHECKLIST.md
```

🔍 **REVIEW:**
```
Проверь checklist:
1. Все пункты выполнены
2. Нет блокеров для релиза
3. Команда согласна с готовностью
4. Rollback план есть
```

---

## PHASE 7: DEPLOYMENT & LAUNCH (Steps 91-100)

### Step 91: Environment Configuration
⏱️ 25 min

🔧 **CREATE:**
```
Настрой environment конфигурацию:
1. .env.example для обоих проектов
2. Разные конфиги: development, staging, production
3. Секреты через environment variables
4. Валидация env при старте приложения

Создай backend/src/config/configuration.ts с @nestjs/config
```

🔍 **REVIEW:**
```
Проверь конфигурацию:
1. Нет секретов в коде
2. .env.example полный
3. Валидация работает
4. Разные environments изолированы
```

---

### Step 92: Docker Setup
⏱️ 30 min

🔧 **CREATE:**
```
Создай Docker конфигурацию для production:
1. backend/Dockerfile — multi-stage build
2. frontend/Dockerfile — Next.js standalone
3. docker-compose.prod.yml — полный стек
4. Оптимизация размера образов
5. Health checks в containers

Образы должны быть < 200MB.
```

🔍 **REVIEW:**
```
Проверь Docker:
1. Образы собираются
2. Контейнеры запускаются
3. Health checks работают
4. Размер оптимален
5. Нет секретов в образах
```

---

### Step 93: Database Migrations
⏱️ 25 min

🔧 **CREATE:**
```
Настрой миграции для production:
1. TypeORM migrations вместо synchronize
2. Создай начальную миграцию
3. Скрипт для применения миграций
4. Rollback стратегия
5. Seed data для начального состояния

npm run migration:generate -- -n InitialSchema
```

🔍 **REVIEW:**
```
Проверь миграции:
1. Миграции применяются корректно
2. Rollback работает
3. Нет data loss
4. Seed data создаётся
5. CI запускает миграции
```

---

### Step 94: CI/CD Pipeline
⏱️ 35 min

🔧 **CREATE:**
```
Расширь CI/CD pipeline:
1. Build → Test → Security Scan → Deploy to Staging
2. Manual approval для Production
3. Автоматический rollback при ошибках
4. Slack/Discord notifications
5. Deploy previews для PR

Обнови .github/workflows/
```

🔍 **REVIEW:**
```
Проверь CI/CD:
1. Pipeline проходит полностью
2. Staging деплоится автоматически
3. Production требует approval
4. Notifications работают
5. Rollback протестирован
```

---

### Step 95: Monitoring Setup
⏱️ 30 min

🔧 **CREATE:**
```
Настрой мониторинг:
1. Metrics: response time, error rate, active users
2. Logs: centralized logging (Loki, CloudWatch)
3. Alerts: high error rate, slow responses, downtime
4. Dashboard: Grafana или аналог
5. Uptime monitoring (external)

Создай backend/src/common/metrics.ts
```

🔍 **REVIEW:**
```
Проверь мониторинг:
1. Метрики собираются
2. Логи доступны
3. Алерты срабатывают
4. Dashboard информативен
5. Uptime мониторится извне
```

---

### Step 96: Backup Strategy
⏱️ 20 min

🔧 **CREATE:**
```
Настрой backup стратегию:
1. Автоматический backup БД каждые 6 часов
2. Retention: 7 дней daily, 4 недели weekly
3. Тест восстановления из backup
4. Документация процедуры восстановления
5. Offsite backup (другой регион)

Создай scripts/backup.sh и scripts/restore.sh
```

🔍 **REVIEW:**
```
Проверь backups:
1. Backup создаётся по расписанию
2. Restore работает
3. Данные целостны после restore
4. Offsite копия существует
5. Документация полная
```

---

### Step 97: Staging Deployment
⏱️ 30 min

🔧 **CREATE:**
```
Задеплой на staging environment:
1. Выбери платформу: Railway, Render, DigitalOcean, AWS
2. Настрой домен: staging.yourgame.com
3. SSL сертификат
4. Environment variables
5. Подключи мониторинг

Протестируй полный flow на staging.
```

🔍 **REVIEW:**
```
Проверь staging:
1. Приложение доступно
2. SSL работает
3. API отвечает
4. БД подключена
5. Полный flow работает
```

---

### Step 98: Production Deployment
⏱️ 35 min

🔧 **CREATE:**
```
Задеплой на production:
1. Отдельный environment от staging
2. Домен: yourgame.com
3. CDN для статики
4. Auto-scaling (если платформа поддерживает)
5. Финальная проверка всех систем

Создай runbook для операций.
```

🔍 **REVIEW:**
```
Проверь production:
1. Приложение работает
2. Производительность в норме
3. Мониторинг активен
4. Backups работают
5. Runbook актуален
```

---

### Step 99: Launch Checklist
⏱️ 25 min

🔧 **CREATE:**
```
Финальный launch checklist:
1. [ ] Production стабилен 24+ часа
2. [ ] Нет критичных багов
3. [ ] Мониторинг настроен
4. [ ] On-call rotation определён
5. [ ] Rollback план готов
6. [ ] Коммуникация с пользователями готова
7. [ ] Social media / landing page готовы
8. [ ] Analytics работает
9. [ ] Legal (Terms, Privacy) на месте
10. [ ] Support channel готов

Создай docs/LAUNCH_CHECKLIST.md
```

🔍 **REVIEW:**
```
Проверь launch readiness:
1. Все пункты выполнены
2. Команда готова к поддержке
3. Нет блокеров
4. Go/No-go решение принято
```

---

### Step 100: Post-Launch
⏱️ 30 min

🔧 **CREATE:**
```
Post-launch активности:
1. Мониторинг первые 48 часов (усиленный)
2. Сбор feedback от первых пользователей
3. Hotfix процесс для критичных багов
4. Метрики: DAU, retention, session length
5. Планирование следующих фич

Создай docs/POST_LAUNCH_PLAN.md с приоритетами.
```

🔍 **REVIEW:**
```
Проверь post-launch:
1. Система стабильна
2. Feedback собирается
3. Метрики в норме
4. Команда не выгорела
5. Roadmap для v1.1 готов
```

---

## 📊 Summary

| Phase | Steps | Focus |
|-------|-------|-------|
| 1. Foundation | 1-15 | Core types, grid, battle logic |
| 2. Matchmaking | 16-30 | PvP, rating, API |
| 3. Frontend Core | 31-50 | UI components, pages |
| 4. Abilities | 51-65 | Skills, buffs, AI |
| 5. Polish | 66-80 | Performance, UX, security |
| 6. Testing | 81-90 | Quality assurance |
| 7. Launch | 91-100 | Deployment, monitoring |

**Estimated Total Time:** 80-120 hours (2-3 weeks full-time)

---

## 🚀 How to Use This Plan

1. Копируй промпт CREATE в Kiro
2. Дождись выполнения
3. Копируй промпт REVIEW
4. Исправь найденные проблемы
5. Commit и переходи к следующему шагу

**Tip:** Можно выполнять несколько независимых шагов параллельно (например, backend и frontend).
