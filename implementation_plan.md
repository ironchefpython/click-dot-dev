# Implementation Plan - Phase 1 Loop Enhancements

We will enhance the Phase 1 loop of the software developer game to improve gameplay balance, add a project shipping loop, support multi-currency upgrades (Cash & XP), and introduce a simulator class for automated play-testing.

## Proposed Changes

### 1. UI & Visual Polish
*   **Modal Transparency:** Adjust `.tutorial-overlay` background transparency to 90% (`rgba(2, 6, 23, 0.1)` with a light backdrop-filter blur) so the IDE remains visible during tutorial alerts.
*   **Header Stats:** Add a **Cash ($)** counter alongside the **Knowledge (XP)** badge.
*   **"Ship Project" Button:** Add a prominent button to the codebase metrics panel. It will be enabled once the active project's backlog is `0` and known bugs are `0`. Clicking it pays the user, grants XP, and loads a new contract.

### 2. Math & Logic Refinement
*   **Logarithmic Testing Curve:** Adjust manual test speed relative to current coverage:
    $$\Delta Coverage = BASE\_TEST\_SPEED \times \eta \times \frac{100 - Coverage}{100} \times dt$$
    This halves the testing speed at 50% coverage, quarters it at 75%, and asymptotes cleanly.
*   **Value Formula (No Backlog Penalty):**
    $$Value = LOC \times \left(1 - \frac{HiddenBugs \times 4.0 + RevealedBugs \times 1.5}{LOC}\right)$$
    *This ensures debugging (which increases backlog) does not decrease value, and hidden bugs penalize value 2.6x more than revealed ones.*
*   **XP Generation:** XP is only accumulated when the player is actively working (`activeTask !== 'idle'`).

### 3. Story & Tutorial Enhancements
*   **Start State (Learn to Code Online):** The game starts with an online coding course instead of a commercial project.
*   **Skip Tutorial Button:** Allow players to bypass the tutorial. Skipping unlocks all actions and upgrades immediately, starts them with $10 cash, and launches their first freelance bakery contract.
*   **Project Shipping Loop:** When the tutorial exercises are complete, the user accepts their first commercial contract. Shipping a project clears the local code stats (retains the test floor), pays Cash + XP, and unlocks a queue of increasingly complex contracts (Bakery, E-Commerce, Chatroom, SaaS CRM, and procedurally generated apps).

### 4. Upgrade Revamp
Upgrades now require Cash, XP, or both:
*   *Mechanical Keyboard:* $15 + 30 XP
*   *French Press Coffee:* $30 + 50 XP
*   *ESLint Config:* $50 + 100 XP
*   *AI Tab Autocomplete:* $120 + 250 XP
*   *Modern Web Framework:* $200 + 400 XP
*   *Incorporate Consultancy:* $500 + 1000 XP

### 5. Automated Play-testing (Simulator)
We will refactor the game code into a pure state-machine class `DevGameEngine` that runs independently of the DOM.
*   Expose `window.createSimulator()` or `DevGameEngine` in the browser console.
*   Support importable CommonJS modules for Node.js.
*   Create a scratch script `test_simulator.js` to simulate 100 ticks of gameplay (coding, testing, debugging) to verify math correctness in the shell.

---

## File Changes

#### [MODIFY] [index.html](file:///app/index.html)
Add Cash status gauge, "Ship Project" button, and "Skip Tutorial" button to modal layout.

#### [MODIFY] [style.css](file:///app/style.css)
Update modal overlay opacity, styling for ship buttons, secondary button styles, and cash layout.

#### [MODIFY] [game.js](file:///app/game.js)
Extract `DevGameEngine` core class, implement logarithmic testing, updated value formula, cash/XP upgrades, shipping loop, and tutorial progression.

#### [NEW] [test_simulator.js](file:///app/.gemini/antigravity-cli/brain/a31e8f9e-72bb-4184-8254-467d6672ef5c/scratch/test_simulator.js)
Node.js test script to simulate gameplay ticks and print statistics.

---

## Verification Plan

### Automated Test
*   Run `node test_simulator.js` to verify the state transitions, focus curves, bug generation, and shipping calculations.

### Manual Verification
*   Open http://localhost:37999.
*   Verify overlay is transparent.
*   Test the "Skip Tutorial" flow.
*   Test project shipping and check if a new contract loads with fresh backlog.
