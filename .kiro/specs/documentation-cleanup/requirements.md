# Requirements: Documentation Cleanup

## Introduction

Reorganize and clean up project documentation after MVP completion. Archive outdated files, create new documentation for core library and roguelike mode, and establish a clear documentation structure for future development.

## Glossary

- **MVP**: Minimum Viable Product (v0.1.0-mvp tag)
- **Core Library**: Reusable game engine modules extracted from MVP
- **Roguelike Run**: New progression mode with 9 wins / 4 losses format
- **Validation Report**: Development-time verification documents
- **Spec**: Feature specification in `.kiro/specs/` folder

## Requirements

### Requirement 1

**User Story:** As a developer, I want updated main documentation, so that I can understand the current project architecture and features.

#### Acceptance Criteria

1. WHEN a developer reads README.md THEN the Documentation System SHALL display current architecture overview with core/game separation
2. WHEN a developer reads docs/ARCHITECTURE.md THEN the Documentation System SHALL describe the three-layer structure (core/game/api)
3. WHEN a developer reads docs/GAME_DESIGN_DOCUMENT.md THEN the Documentation System SHALL include Roguelike Run mode mechanics
4. WHEN a developer reads .kiro/steering/project-context.md THEN the Documentation System SHALL reflect current folder structure and modules

### Requirement 2

**User Story:** As a developer, I want new documentation for core library, so that I can reuse engine code in other projects.

#### Acceptance Criteria

1. WHEN a developer needs core library info THEN the Documentation System SHALL provide docs/CORE_LIBRARY.md with API reference
2. WHEN a developer reads docs/CORE_LIBRARY.md THEN the Documentation System SHALL include usage examples for GridConfig and BattleConfig
3. WHEN a developer reads backend/src/core/README.md THEN the Documentation System SHALL describe each core module purpose
4. WHEN a developer reads frontend/src/core/README.md THEN the Documentation System SHALL list reusable components and hooks

### Requirement 3

**User Story:** As a developer, I want roguelike mode documentation, so that I can understand the new progression system.

#### Acceptance Criteria

1. WHEN a developer needs roguelike info THEN the Documentation System SHALL provide docs/ROGUELIKE_DESIGN.md
2. WHEN a developer reads docs/ROGUELIKE_DESIGN.md THEN the Documentation System SHALL describe 6 factions with 25 units each (150 total)
3. WHEN a developer reads docs/ROGUELIKE_DESIGN.md THEN the Documentation System SHALL describe 18 leaders with passives and spells
4. WHEN a developer reads docs/ROGUELIKE_DESIGN.md THEN the Documentation System SHALL include spell timing system (Early/Mid/Late)
5. WHEN a developer reads docs/ROGUELIKE_DESIGN.md THEN the Documentation System SHALL include budget progression (10g → 65g)

### Requirement 4

**User Story:** As a developer, I want archived MVP progress files, so that the root folder stays clean while history is preserved.

#### Acceptance Criteria

1. WHEN STEP_PROGRESS.md exceeds 5000 lines THEN the Documentation System SHALL archive it to docs/archive/STEP_PROGRESS_MVP.md
2. WHEN archiving is complete THEN the Documentation System SHALL create a new concise STEP_PROGRESS.md for post-MVP development
3. WHEN STEP*_SUMMARY.md files exist THEN the Documentation System SHALL consolidate them into docs/archive/MVP_SUMMARY.md

### Requirement 5

**User Story:** As a developer, I want validation reports organized, so that development artifacts don't clutter component folders.

#### Acceptance Criteria

1. WHEN *-Report.md or *-ValidationReport.md files exist in frontend/src/components/ THEN the Documentation System SHALL move them to docs/reports/
2. WHEN *-Report.md files exist in backend/src/battle/ THEN the Documentation System SHALL move them to docs/reports/
3. WHEN reports are moved THEN the Documentation System SHALL preserve original filenames with folder prefix

### Requirement 6

**User Story:** As a developer, I want version history tracking, so that I can understand project evolution.

#### Acceptance Criteria

1. WHEN a new version is released THEN the Documentation System SHALL update CHANGELOG.md
2. WHEN CHANGELOG.md is read THEN the Documentation System SHALL show v0.1.0-mvp as initial release
3. WHEN CHANGELOG.md is read THEN the Documentation System SHALL follow Keep a Changelog format

### Requirement 7

**User Story:** As a developer, I want completed specs archived, so that active specs are easy to find.

#### Acceptance Criteria

1. WHEN a spec is fully implemented THEN the Documentation System SHALL mark it with COMPLETED.md status file
2. WHEN .kiro/specs/battle-replay-ux/ is complete THEN the Documentation System SHALL add COMPLETED.md marker
3. WHEN .kiro/specs/hp-bar-visibility/ is complete THEN the Documentation System SHALL add COMPLETED.md marker

### Requirement 8

**User Story:** As a developer, I want updated development plan, so that I can see next steps after MVP.

#### Acceptance Criteria

1. WHEN a developer reads docs/AI_DEVELOPMENT_PLAN.md THEN the Documentation System SHALL include steps 66-100 for current phase
2. WHEN roguelike mode is planned THEN the Documentation System SHALL add steps 101-130 for roguelike implementation

## Success Criteria

1. Root folder has ≤5 markdown files (README, CHANGELOG, STEP_PROGRESS, etc.)
2. All validation reports moved to docs/reports/
3. docs/CORE_LIBRARY.md exists with complete API reference
4. docs/ROGUELIKE_DESIGN.md exists with game design
5. CHANGELOG.md tracks version history
6. Completed specs have COMPLETED.md marker

## Out of Scope

- Actual code changes (handled by core-extraction spec)
- New feature implementation
- Test file reorganization
