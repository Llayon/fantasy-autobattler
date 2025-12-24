# Tasks: Documentation Cleanup

## Phase 1: Create Archive Structure

### Task 1: Create Archive Folders ✅
**Estimate**: 5 min | **Requirement**: REQ-4, REQ-5

- [x] 1.1 Create `docs/archive/` directory
- [x] 1.2 Create `docs/reports/` directory

### Task 2: Archive MVP Progress Files ✅
**Estimate**: 15 min | **Requirement**: REQ-4

- [x] 2.1 Move `STEP_PROGRESS.md` to `docs/archive/STEP_PROGRESS_MVP.md`
- [x] 2.2 Create new concise `STEP_PROGRESS.md` for post-MVP (template with Phase 6+)
- [x] 2.3 Consolidate `STEP*_SUMMARY.md` files into `docs/archive/MVP_SUMMARY.md`
- [x] 2.4 Consolidate `DEBUG_MODE_SUMMARY.md` into MVP_SUMMARY.md
- [x] 2.5 Delete original summary files from root

---

## Phase 2: Move Validation Reports

### Task 3: Move Frontend Reports ✅
**Estimate**: 20 min | **Requirement**: REQ-5

- [x] 3.1 Move all `frontend/src/components/*-Report.md` to `docs/reports/`
- [x] 3.2 Move all `frontend/src/components/*-ValidationReport.md` to `docs/reports/`
- [x] 3.3 Rename with `frontend-` prefix for clarity
- [x] 3.4 Update any internal links in moved files

### Task 4: Move Backend Reports ✅
**Estimate**: 10 min | **Requirement**: REQ-5

- [x] 4.1 Move `backend/src/battle/*_VERIFICATION.md` to `docs/reports/`
- [x] 4.2 Rename with `backend-` prefix for clarity

### Task 4.5: Archive Completed Feature Docs ✅
**Estimate**: 10 min | **Requirement**: REQ-4

- [x] 4.5.1 Move `docs/BATTLE_REPLAY_UX_ANALYSIS.md` to `docs/archive/`
- [x] 4.5.2 Move `docs/BATTLE_REPLAY_UX_EXPERT_ANALYSIS.md` to `docs/archive/`
- [x] 4.5.3 Move `docs/UI_REDESIGN_PLAN.md` to `docs/archive/`

### Task 4.6: Move README Files from Components ✅
**Estimate**: 15 min | **Requirement**: REQ-5

- [x] 4.6.1 Move `frontend/src/components/README-*.md` to `docs/reports/`
- [x] 4.6.2 Rename with `frontend-` prefix (remove README- prefix)
- [x] 4.6.3 Update any internal links

---

## Phase 3: Create New Documentation

### Task 5: Create CHANGELOG.md ✅
**Estimate**: 20 min | **Requirement**: REQ-6

- [x] 5.1 Create `CHANGELOG.md` in root
- [x] 5.2 Add v0.1.0-mvp release notes
- [x] 5.3 Add [Unreleased] section for current work
- [x] 5.4 Follow Keep a Changelog format

### Task 6: Create Core Library Documentation ✅
**Estimate**: 45 min | **Requirement**: REQ-2

- [x] 6.1 Create `docs/CORE_LIBRARY.md` with overview
- [x] 6.2 Document GridConfig and BattleConfig interfaces
- [x] 6.3 Add usage examples for each core module
- [x] 6.4 Document migration path from old imports
- [ ] 6.5 Create `backend/src/core/README.md` (placeholder until core-extraction)
- [ ] 6.6 Create `frontend/src/core/README.md` (placeholder until core-extraction)

### Task 7: Verify Roguelike Design Document ✅
**Estimate**: 15 min | **Requirement**: REQ-3

- [x] 7.1 Verify `docs/ROGUELIKE_DESIGN.md` exists (already created)
- [x] 7.2 Verify document includes 6 factions (25 units each, 150 total)
- [x] 7.3 Verify document includes 18 leaders (3 per faction)
- [x] 7.4 Verify document includes spell system with timing
- [x] 7.5 Verify document includes budget progression (10g → 65g)
- [x] 7.6 Verify document includes UI flow diagrams

---

## Phase 4: Update Existing Documentation

### Task 8: Update README.md ✅
**Estimate**: 20 min | **Requirement**: REQ-1

- [x] 8.1 Add "Architecture" section with core/game separation
- [x] 8.2 Update "Project Structure" with new folders
- [x] 8.3 Add links to CHANGELOG.md and CORE_LIBRARY.md
- [x] 8.4 Update quick start instructions if needed

### Task 9: Update docs/ARCHITECTURE.md ✅
**Estimate**: 30 min | **Requirement**: REQ-1

- [x] 9.1 Add "Core Library" section
- [x] 9.2 Update folder structure diagram
- [x] 9.3 Describe core/game/api layer separation
- [x] 9.4 Add dependency diagram between layers

### Task 10: Update docs/GAME_DESIGN_DOCUMENT.md ✅
**Estimate**: 15 min | **Requirement**: REQ-1

- [x] 10.1 Add "Game Modes" section
- [x] 10.2 Add "Roguelike Run" subsection with summary
- [x] 10.3 Reference docs/ROGUELIKE_DESIGN.md for full details

### Task 11: Update .kiro/steering/project-context.md ✅
**Estimate**: 20 min | **Requirement**: REQ-1

- [x] 11.1 Update "File Structure" section with core/ and game/
- [x] 11.2 Update "Documentation Files" table
- [x] 11.3 Add new specs to "Kiro Specs" section
- [x] 11.4 Update development progress percentage

### Task 12: Update docs/AI_DEVELOPMENT_PLAN.md ✅
**Estimate**: 30 min | **Requirement**: REQ-8

- [x] 12.1 Add Phase 8: Core Extraction (Steps 101-115)
- [x] 12.2 Add Phase 9: Roguelike Mode (Steps 116-150)
- [x] 12.3 Update summary table with new phases
- [x] 12.4 Reference specs for detailed implementation

---

## Phase 5: Mark Completed Specs

### Task 13: Archive Completed Specs ✅
**Estimate**: 10 min | **Requirement**: REQ-7

- [x] 13.1 Create `.kiro/specs/battle-replay-ux/COMPLETED.md` with completion date
- [x] 13.2 Create `.kiro/specs/hp-bar-visibility/COMPLETED.md` with completion date

---

## Phase 6: Cleanup Root Folder

### Task 14: Consolidate Mobile Documentation ✅
**Estimate**: 15 min | **Requirement**: REQ-4

- [x] 14.1 Create `docs/MOBILE_ACCESS.md` consolidating mobile docs
- [x] 14.2 Move content from `MOBILE_ACCESS_SETUP.md`
- [x] 14.3 Move content from `MOBILE_QUICK_START.md`
- [x] 14.4 Move content from `КАК_ПОДКЛЮЧИТЬСЯ_С_ТЕЛЕФОНА.txt`
- [x] 14.5 Delete original mobile files from root

### Task 15: Clean Up Obsolete Files ✅
**Estimate**: 10 min | **Requirement**: REQ-4

- [x] 15.1 Move `DEVELOPMENT_PLAN.md` to `docs/archive/DEVELOPMENT_PLAN_OLD.md`
- [x] 15.2 Add `battle_log.json` to `.gitignore` and delete
- [x] 15.3 Verify no orphaned markdown files in root
- [ ] 15.4 Delete `setup-mobile-access.ps1` if content moved to docs

---

## Phase 7: Verification

### Task 16: Verify Documentation Links ✅
**Estimate**: 15 min | **Requirement**: REQ-1

- [x] 16.1 Check all internal links in README.md
- [x] 16.2 Check all internal links in docs/*.md
- [x] 16.3 Fix any broken references

### Task 17: Final Review ✅
**Estimate**: 10 min | **Requirement**: All

- [x] 17.1 Verify root folder has ≤5 markdown files (3: README, CHANGELOG, STEP_PROGRESS)
- [x] 17.2 Verify docs/reports/ contains all validation reports (46 files)
- [x] 17.3 Verify docs/archive/ contains MVP history (6 files)
- [x] 17.4 Verify all new docs exist and are complete

---

## Summary

| Phase | Tasks | Time |
|-------|-------|------|
| Phase 1: Archive Structure | 1-2 | 20 min |
| Phase 2: Move Reports | 3-4.6 | 55 min |
| Phase 3: New Documentation | 5-7 | 80 min |
| Phase 4: Update Existing | 8-12 | 115 min |
| Phase 5: Mark Completed | 13 | 10 min |
| Phase 6: Cleanup Root | 14-15 | 25 min |
| Phase 7: Verification | 16-17 | 25 min |
| **Total** | **20 tasks** | **~6 hours** |

## Checkpoints

- [x] After Task 4: All reports moved to docs/reports/
- [x] After Task 7: All new documentation created
- [x] After Task 12: All existing docs updated
- [x] After Task 17: Full cleanup complete

## Dependencies

```
Task 1 → Task 2, 3, 4 (folders must exist first)
Task 6 → Depends on core-extraction spec completion for full content
Task 7 → docs/ROGUELIKE_DESIGN.md already exists (verify only)
```

## Notes

- `docs/ROGUELIKE_DESIGN.md` was already created with full GDD from roguelike-run spec
- Task 7 changed from "Create" to "Verify" since file exists
