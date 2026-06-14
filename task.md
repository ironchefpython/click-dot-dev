# Task Checklist - Deterministic Transition & Tutorial Balance

- [x] Update growth scale values for Projects 2 and 3 in `phase-tutorial.js`
- [x] Initialize accumulators in `engine.js` (`bugIntroProgress`, `revealedBugProgress`, `bugfixClearProgress`, `featureCompleteProgress`, `revealProgress`, `debugProgress`, `bugfixBacklogProgress`)
- [x] Update `engine.js` tick logic to use deterministic progress accumulators instead of `Math.random()`
- [x] Update `calibrate_prob.js` to run deterministically (1 iteration per configuration, no averages)
- [x] Run `calibrate_prob.js` to find the new calibrated tutorial parameters
- [x] Update `phase-tutorial.js` with the calibrated parameters
- [x] Update `game.test.js` to remove mock random seed overrides (since the engine is fully deterministic, we no longer need the math random override)
- [x] Run `npm test` and verify all tests pass
- [x] Make refactoring complexity reduction proportional to the current complexity
- [x] Replace the backlog card progress bar with the minimum LOC required to satisfy the next feature point
- [x] Update the bugs UI card layout to say "Bugs (Found / Fixable)" displaying `revealedBugs` / `bugPoints`
- [x] Remove bugfix points visual from the backlog UI card (displaying only feature points)
