# Walkthrough - Phase 1 Loop Enhancements

I have successfully updated the Phase 1 loop of our casual software developer game! The app is hosted on your local VM server at **http://localhost:37999**.

## Summary of Completed Changes

### 1. Visual Polish
*   **Transparent Modals:** Adjusted the background overlay for tutorial/event popups to **90% transparency** (`rgba(2, 6, 23, 0.1)` with a light blur filter) so you can see the editor workspace beneath.
*   **Double Currencies:** Added a **Cash ($)** counter alongside the **Knowledge (XP)** indicator in the top header.
*   **"Ship Project" Button:** Added a project shipping control. It triggers once the backlog and known bugs are cleared.

### 2. Gameplay & Math Balance
*   **Logarithmic Testing:** Manual testing coverage speed now scales with remaining coverage space. It progresses quickly at first, but is half as fast at 50% coverage, a quarter at 75%, and an eighth at 87.5%, creating a natural asymptotic progression.
*   **Value Formula (Debugging Protection):** Code value is no longer penalized by backlog size (meaning debugging, which adds backlog, does not decrease value). It is instead penalized by hidden bugs (4.0x penalty) and revealed bugs (1.5x penalty).
*   **XP Idle Clamp:** Knowledge (XP) accumulation is strictly paused when the developer is in the "☕ Idle" state.

### 3. Shipping & Contracts Loop
*   **Story Intro:** The game now begins with an online coding course ("Learn to Code Online") as the tutorial project.
*   **Skip Tutorial:** Added a **"Skip Tutorial"** button to the intro popup. Clicking it sets starter funds to $10.00, unlocks all commands/upgrades, and instantly loads your first freelance contract.
*   **Contract Queue:** Shipping a project awards Cash + XP, clears the IDE stats, and pulls in the next client contract from the backlog queue (Bakery website, E-Commerce cart integration, Chat server, SaaS CRM, and procedurally generated endless contracts).

### 4. Upgrade Costs
Upgrades have been refactored to require Cash, XP, or a combination of both:
*   *Mechanical Keyboard:* $15.00 + 30 XP
*   *French Press Coffee:* $30.00 + 50 XP
*   *ESLint Config:* $50.00 + 100 XP
*   *AI Tab Autocomplete:* $120.00 + 250 XP
*   *Modern Web Framework:* $200.00 + 400 XP
*   *Incorporate Consultancy:* $500.00 + 1000 XP

---

## 5. Automated Play-testing (The Simulator)

Since the VM environment does not contain a Node.js interpreter, I built the play-testing feature directly into the game UI!

*   **"Run Auto-Sim" Button:** I added a purple button at the bottom of the File Explorer sidebar.
*   **How it works:** Clicking it instantiates an isolated `DevGameEngine`, skips the tutorial, runs a simulated sequence of ticks (Coding, testing, debugging, refactoring, and finishing), and prints the step-by-step progress and shipping payouts **directly into the IDE console terminal window** in real-time.
*   **Console Expose:** Exposed `window.createSimulator()` and the `DevGameEngine` class to the browser console so you can inspect or run custom ticks programmatically in the browser.

---

## How to Verify

1.  Open the workspace in your browser: `http://localhost:37999`.
2.  Click **"Run Auto-Sim"** in the sidebar. You will see the terminal scroll with automated logs showing:
    *   *Step-by-step ticks of coding, testing, and debugging.*
    *   *Logarithmic coverage outputs.*
    *   *A final project shipping calculation showing exact Cash/XP payout ratios.*
3.  Refresh the page, try completing the tutorial manually, buy upgrades, and click **"Ship Project"** to load the next client contracts!
