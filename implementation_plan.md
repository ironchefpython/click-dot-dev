# Implementation Plan - Deterministic Engine Formulas & Tutorial Balance

We will transition the Solo Coder game engine from a probabilistic model (which relies on `Math.random()` and requires slow simulation-based calibration sweeps) to a fully deterministic model using fractional progress accumulators. We will also increase the LOC requirements (growth scale) for tutorial projects 2 and 3.

## Proposed Changes

### 1. Tutorial Project Balance (Increased Growth Scale)
We will increase the LOC requirements of tutorial projects 2 and 3 to make them feel more substantial:
*   **Project 2 (Calculator App):** 
    *   Set `growthScale: 5` (was `0`)
    *   Set `transitionOffset: 2` (was `0`)
*   **Project 3 (Todo List):** 
    *   Set `growthScale: 8` (was `0`)
    *   Set `transitionOffset: 3` (was `0`)

### 2. Deterministic Formulas (Progress Accumulators)
We will replace all `Math.random()` calls in the tick handler of [engine.js](file:///app/engine.js) with deterministic accumulators stored in the game state. Every time we tick, we add a fractional increment to the respective accumulator. When it crosses `1.0`, the event fires.

The accumulators to be added to the engine state:
1.  `bugIntroProgress` (for introducing new bugs when coding)
2.  `revealedBugProgress` (for determining if an introduced bug is hidden vs. revealed)
3.  `bugfixClearProgress` (for clearing a bugfix point when coding)
4.  `featureCompleteProgress` (for completing a feature point when coding)
5.  `revealProgress` (for revealing a hidden bug during manual testing)
6.  `debugProgress` (for squashing a revealed bug during debugging)
7.  `bugfixBacklogProgress` (for determining if a squashed bug creates a backlog bugfix point)

#### Accumulator Reset
All accumulators will be initialized to `0.0` inside the `loadContract(index)` method of the engine, ensuring a clean state for each project.

#### Conversion of Random Logic to Accumulators

| Event | Current Probabilistic Code | Suggested Deterministic Code |
| :--- | :--- | :--- |
| **Bug Intro** | `if (Math.random() < bugIntroProb)` | `this.state.bugIntroProgress += bugIntroProb;`<br>`if (this.state.bugIntroProgress >= 1.0) {`<br>&nbsp;&nbsp;`this.state.bugIntroProgress -= 1.0;`<br>&nbsp;&nbsp;`/* Trigger Bug Placement */`<br>`}` |
| **Bug Placement** | `if (Math.random() < foundProb)` | `this.state.revealedBugProgress += foundProb;`<br>`if (this.state.revealedBugProgress >= 1.0) {`<br>&nbsp;&nbsp;`this.state.revealedBugProgress -= 1.0;`<br>&nbsp;&nbsp;`this.state.revealedBugs++;`<br>`} else {`<br>&nbsp;&nbsp;`this.state.hiddenBugs++;`<br>`}` |
| **Bugfix Clear** | `if (Math.random() < bugfixClearProb)` | `this.state.bugfixClearProgress += bugfixClearProb;`<br>`if (this.state.bugfixClearProgress >= 1.0) {`<br>&nbsp;&nbsp;`this.state.bugfixClearProgress -= 1.0;`<br>&nbsp;&nbsp;`this.state.bugPoints = Math.max(0, this.state.bugPoints - 1);`<br>`}` |
| **Feature Complete** | `if (Math.random() < featureCompleteProb)` | `this.state.featureCompleteProgress += featureCompleteProb;`<br>`if (this.state.featureCompleteProgress >= 1.0) {`<br>&nbsp;&nbsp;`this.state.featureCompleteProgress -= 1.0;`<br>&nbsp;&nbsp;`this.state.featurePoints = Math.max(0, this.state.featurePoints - 1);`<br>`}` |
| **Hidden Bug Reveal** | `if (Math.random() < pReveal)` | `this.state.revealProgress += pReveal;`<br>`if (this.state.revealProgress >= 1.0) {`<br>&nbsp;&nbsp;`this.state.revealProgress -= 1.0;`<br>&nbsp;&nbsp;`this.state.hiddenBugs = Math.max(0, this.state.hiddenBugs - 1);`<br>&nbsp;&nbsp;`this.state.revealedBugs++;`<br>`}` |
| **Bug Squash** | `if (Math.random() < pDebug)` | `this.state.debugProgress += pDebug;`<br>`if (this.state.debugProgress >= 1.0) {`<br>&nbsp;&nbsp;`this.state.debugProgress -= 1.0;`<br>&nbsp;&nbsp;`this.state.revealedBugs = Math.max(0, this.state.revealedBugs - 1);`<br>&nbsp;&nbsp;`/* Trigger Post-Debug Split */`<br>`}` |
| **Post-Debug Split** | `if (Math.random() < 0.30)` | `this.state.bugfixBacklogProgress += 0.70;`<br>`if (this.state.bugfixBacklogProgress >= 1.0) {`<br>&nbsp;&nbsp;`this.state.bugfixBacklogProgress -= 1.0;`<br>&nbsp;&nbsp;`this.state.bugPoints++;`<br>`} else {`<br>&nbsp;&nbsp;`/* Immediately resolved (no action) */`<br>`}` |

### 3. Benefits & Speeding up Calibration
*   **Single Simulation Runs:** Because the simulation is completely deterministic, we no longer need to average across multiple runs (e.g., `runs = 100`). A single simulation run is perfectly accurate.
*   **Instant Calibration Script:** The calibration script will take less than 50 milliseconds to run a full parameter search, as there is zero noise or variance.
*   **Deterministic Tests:** Jest unit tests will no longer depend on choosing specific mock PRNG seeds, as the results are natively deterministic.

---

## Proposed Changes by File

### [formulas.js](file:///app/formulas.js)
*   No changes to existing math functions are strictly required since they calculate rates/probabilities which now map directly to the accumulator increments.

### [phase-tutorial.js](file:///app/phase-tutorial.js)
*   Update Project 2 (`course-calc`) and Project 3 (`course-todo`) with the new `growthScale` and `transitionOffset` values.
*   We will calibrate `featureCompleteProb` and `bugfixClearProb` for Projects 2 and 3 using the deterministic calibration script, then update their values.

### [engine.js](file:///app/engine.js)
*   Initialize progress accumulator state properties (`bugIntroProgress`, `revealedBugProgress`, `bugfixClearProgress`, `featureCompleteProgress`, `revealProgress`, `debugProgress`, `bugfixBacklogProgress`) to `0.0` in the state initializer and in `loadContract()`.
*   Replace all `Math.random()` statements in the `tick()` function with the suggested progress accumulator logic.

### [calibrate_prob.js](file:///app/calibrate_prob.js)
*   Update the simulation logic to run exactly 1 run (no averaging needed) and find the calibrated configurations.

---

## Verification Plan

### Automated Tests
*   Run the updated `calibrate_prob.js` to find the exact parameters.
*   Verify that `npm test` runs and passes, validating that tutorial completion times match the 20% margin targets.
