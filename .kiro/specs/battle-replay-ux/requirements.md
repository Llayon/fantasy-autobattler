# Battle Replay UX Improvements

## Overview
Улучшение пользовательского опыта страницы реплея боя для повышения читаемости и понимания происходящего в бою.

## User Stories

### US-1: Убрать визуальный шум координат
**As a** player watching a battle replay  
**I want** the grid cells to be clean without coordinate labels  
**So that** I can focus on the battle action without visual clutter

**Acceptance Criteria:**
- [ ] Grid cells do not display coordinates (0,0), (1,0), etc. by default
- [ ] Optional debug mode toggle to show coordinates for developers
- [ ] Coordinates can be shown on hover (tooltip) as alternative

---

### US-2: Индикатор активного юнита на поле боя
**As a** player watching a battle replay  
**I want** to clearly see which unit is currently acting  
**So that** I can follow the battle flow easily

**Acceptance Criteria:**
- [ ] Active unit has a pulsing yellow border animation
- [ ] Active unit indicator is visible and distinct from selection
- [ ] Indicator updates correctly when event changes
- [ ] Works during both auto-play and manual navigation

---

### US-3: Цветовое кодирование команд в журнале событий
**As a** player watching a battle replay  
**I want** to see which team each event belongs to  
**So that** I can quickly understand whose units are acting

**Acceptance Criteria:**
- [ ] Each event in the log has a colored indicator (blue for player1, red for player2)
- [ ] Color indicator is a small dot or bar on the left side of the event
- [ ] Death events show the team of the dying unit
- [ ] Round headers remain neutral (no team color)

---

### US-4: Автопрокрутка журнала событий
**As a** player watching a battle replay in auto-play mode  
**I want** the event log to automatically scroll to the current event  
**So that** I don't have to manually scroll while watching

**Acceptance Criteria:**
- [ ] Event log auto-scrolls to current event during playback
- [ ] Auto-scroll can be toggled on/off with a button
- [ ] Manual scrolling by user temporarily disables auto-scroll
- [ ] Current event is centered in the visible area when scrolling

---

### US-5: Увеличить видимость HP-бара юнитов
**As a** player watching a battle replay  
**I want** to clearly see the health status of units  
**So that** I can understand how close units are to dying

**Acceptance Criteria:**
- [ ] HP bar height increased from 1px to 3px minimum
- [ ] HP bar color clearly indicates health percentage (green/yellow/red)
- [ ] HP bar is visible on both grid and turn order bar

---

## Technical Notes

### Files to Modify
- `frontend/src/components/BattleReplay.tsx` - Main replay component

### Related Documentation
- `docs/BATTLE_REPLAY_UX_ANALYSIS.md` - Full UX analysis with code examples

### Dependencies
- None (pure frontend changes)

## Priority
- **Phase 1 (High):** US-1, US-2, US-3
- **Phase 2 (Medium):** US-4, US-5
