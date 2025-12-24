# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Documentation cleanup and reorganization
- `docs/archive/` for historical MVP documentation
- `docs/reports/` for validation and verification reports
- New `STEP_PROGRESS.md` for post-MVP tracking

### Changed
- Moved 46 validation reports to `docs/reports/`
- Archived MVP progress files to `docs/archive/`
- Consolidated step summaries into `MVP_SUMMARY.md`

### Planned
- Core library extraction (`backend/src/core/`)
- Roguelike run mode (6 factions, 18 leaders, spells)

---

## [0.1.0-mvp] - 2024-12-23

### Added

#### Battle System
- Complete battle simulation with 15 unique units
- Deterministic simulation with seeded PRNG
- A* pathfinding for unit movement
- 15 abilities (11 active, 4 passive)
- 10 synergy bonuses for team composition
- Role-based AI targeting strategies

#### Team Builder
- Drag-and-drop unit placement on 8×10 grid
- 30-point budget system
- Team saving and loading
- Synergy display with active bonuses

#### Battle Replay
- Full animation playback
- Active unit indicators (yellow border + arrow)
- Team color coding in event log (blue/red dots)
- Progress bar with clickable event markers
- Auto-scroll to current event
- Debug mode with grid coordinates
- Playback speed control (0.25x - 4x)

#### Player System
- Guest authentication (token-based)
- Player profiles with statistics
- Battle history with replay access
- ELO rating system

#### Matchmaking
- PvP queue with rating-based matching
- Bot opponent fallback
- Real-time queue status

#### UI/UX
- Mobile-responsive design
- Internationalization (Russian/English)
- Accessibility compliance (WCAG 2.1)
- Loading and error states
- Undo/redo for team changes
- Autosave functionality

### Technical
- 650+ unit tests
- NestJS 10 backend with TypeORM
- Next.js 14 frontend with App Router
- Zustand state management
- Docker containerization
- GitHub Actions CI/CD

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 0.1.0-mvp | 2024-12-23 | Initial MVP release |

---

*For detailed development history, see `docs/archive/STEP_PROGRESS_MVP.md`*
