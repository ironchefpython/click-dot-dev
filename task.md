# Task Checklist - Defect Fix & UI Format Update

- [x] Fix the defect where feature points decrease when LOC is less than min LOC
- [x] Update the Backlog Story Points metric card label to `Backlog Story Points (incomplete / required)`
- [x] Implement unit test in `game.test.js` to assert feature points do not decrease when `loc < minLoc`
- [x] Run and verify all Jest unit tests pass
- [x] Verify simulation calibration results are stable and within margins
- [x] Always display Min LOC even when backlog features are complete
- [x] Scale testing speed based on untested LOC / hidden bugs ratio and cap coverage at 99.9% while hidden bugs remain and within margins
- [x] Track task time spent per contract and print formatted report to debug/virtual console when shippable is ready
- [x] Update simulator scheduling to stay on selected tasks until the engine returns them to idle
- [x] Relocate core engine constants and task speed coefficients to Formulas in formulas.js
- [x] Format simulation output: remove single quotes, rename header to Coverage, round to one decimal place, and right-align columns
