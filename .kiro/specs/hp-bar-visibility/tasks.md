# Implementation Plan

- [ ] 1. Create shared HP bar color utility function





  - [x] 1.1 Add getHpBarColor function to BattleReplay.tsx


    - Create function that returns Tailwind color class based on HP percentage
    - Handle edge cases: negative HP, HP > maxHp, maxHp = 0
    - Add JSDoc documentation with examples
    - _Requirements: 2.1, 2.2, 2.3, 3.1_


  - [x] 1.2 Write property tests for getHpBarColor

    - **Property 1: HP color green for healthy units**
    - **Property 2: HP color yellow for damaged units**
    - **Property 3: HP color red for critical units**
    - **Validates: Requirements 2.1, 2.2, 2.3**

- [ ] 2. Update ReplayGridCell HP bar
  - [ ] 2.1 Increase HP bar height and apply consistent colors
    - Change height from h-1 to h-[3px]
    - Replace gradient with getHpBarColor function
    - Add transition-all duration-300 for smooth animation
    - Keep rounded-b for visual consistency
    - _Requirements: 1.1, 2.4, 3.2_

- [ ] 3. Update TurnOrderBar HP bar
  - [ ] 3.1 Apply consistent color scheme
    - Replace inline conditional colors with getHpBarColor function
    - Verify h-1 (4px) height is sufficient
    - Ensure transition-all duration-300 is applied
    - _Requirements: 1.2, 2.4, 3.1_

  - [ ] 3.2 Write property test for color consistency
    - **Property 4: Color scheme consistency**
    - **Validates: Requirements 3.1**

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

