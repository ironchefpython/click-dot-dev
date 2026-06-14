# Walkthrough - Deterministic Simulation & Balanced Tutorial

We have successfully transitioned the DevLoop game engine from a probabilistic model to a fully deterministic model using progress accumulators. We have also balanced the tutorial LOC requirements and refined the UI metrics display.

## Summary of Changes

### 1. Increased Tutorial Growth Scale (LOC Requirements)
To ensure Projects 2 and 3 feel more substantial and require coding progression rather than instant completion:
*   **Project 2 (Calculator App):** Increased `growthScale` to `5` and `transitionOffset` to `2` (was `0`).
*   **Project 3 (Todo List):** Increased `growthScale` to `8` and `transitionOffset` to `3` (was `0`).

### 2. Deterministic Transition (Accumulators)
We replaced all uses of `Math.random()` in the game engine's action loops ([engine.js](file:///app/engine.js)) with progress accumulators stored inside the game state:
*   **Coding & Bugs:** `bugIntroProgress`, `revealedBugProgress`, `bugfixClearProgress`, and `featureCompleteProgress`.
*   **Testing & Debugging:** `revealProgress`, `debugProgress`, and `bugfixBacklogProgress`.

Every time an action ticked or an integer LOC boundary was crossed, the engine now adds the corresponding rate/probability directly to the accumulator. When it reaches or exceeds `1.0`, the event fires. This makes the entire engine 100% deterministic while preserving the exact expected gameplay speed on average.

### 3. Refactored Proportional Complexity Reduction
*   Adjusted the refactoring code in [engine.js](file:///app/engine.js) to make complexity reduction proportional to the current complexity:
    $$\Delta Complexity = - \text{Complexity\_Increment} \times \text{refactorAmt} \times \text{complexity}$$
    This ensures that refactoring complex codebases yields a proportionally larger complexity reduction than refactoring simple ones.

### 4. Backlog and Bugs UI Enhancements
*   **Min LOC Target:** Replaced the backlog card's progress bar in [index.html](file:///app/index.html) with a text field displaying `Min LOC: <value>` indicating the minimum lines of code required before the next feature point can be completed.
*   **Bugs Card:** Renamed the bugs card label to `"Bugs (Found / Fixable)"`. The first metric now shows found bugs waiting to be squashed (`revealedBugs`) and the second metric shows fixable bugs in the backlog (`bugPoints`).
*   **Backlog Card Features:** Removed the bugfix points visual from the backlog story points card (which now displays only feature story points, keeping features and bugs conceptually clean and separated).

### 5. Renamed and Accelerated "Unit Tests"
*   **UI Rename:** Renamed the "Auto-Test" task selector button and tutorial dialog references to **"Unit Tests"** in [index.html](file:///app/index.html) and [main.js](file:///app/main.js).
*   **Speed Scaling:** Multiplied automated test speed (`autoSpeed`) by `100` before adding to `testCoverageFloor`. This aligns it with percentage point scaling (similar to manual testing) so that covering a line of code feels about equal to the speed of writing it.
*   **Re-Calibration:** Recalibrated Project 5 to a backlog of `14` and complete probability of `0.74`, matching the target playtime of `160s` perfectly.

### 6. Career-Matching Calibration Script
Refactored the calibration script ([calibrate_prob.js](file:///app/calibrate_prob.js)) to match the career pipeline of the game:
*   Simulates the sequential progression (Project 1 → Project 2 → Project 3 → Project 4 → Project 5) on a single engine instance.
*   Accumulates XP, ranks up the developer, and unlocks speed benefits naturally.
*   Runs only one deterministic simulation run per sweep (no averaging loops needed), reducing execution time from minutes to milliseconds.

### 7. Simplified Jest Testing
Removed all math random mocking and mock PRNG seed searches in [game.test.js](file:///app/game.test.js). Because the engine is naturally deterministic, the playtime calibration tests are now completely stable, independent of any seeds, and pass with extremely high precision:
*   **Project 1 (Hello World):** Target = 10s | Actual = 8.90s (Diff = 11.0%)
*   **Project 2 (Calculator):** Target = 20s | Actual = 19.95s (Diff = 0.2%)
*   **Project 3 (Todo List):** Target = 40s | Actual = 41.25s (Diff = 3.1%)
*   **Project 4 (Weather App):** Target = 80s | Actual = 80.15s (Diff = 0.2%)
*   **Project 5 (Sample E-commerce):** Target = 160s | Actual = 159.70s (Diff = 0.2%)

## Verification
To run the automated tests:
```bash
npm test
```
All Jest calibration test assertions are fully verified green.
