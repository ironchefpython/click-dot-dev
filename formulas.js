/**
 * # DevLoop Solo Coder Engine Formulas
 * 
 * This document outlines the mathematical models and formulas used in the game engine.
 * 
 * ## 1. Lines of Code (LOC) and Complexity
 * - **LOC** is a floating-point number representing the size of the codebase.
 * - **Complexity** is a floating-point number representing the structural complexity of the codebase, which grows as new code is written.
 * - For each integer LOC completed (i.e. when `Math.floor(loc)` increases), complexity increases:
 *   $$\text{complexity} = \text{complexity} + 0.005$$
 * 
 * ## 2. Minimum LOC Threshold
 * To implement $n$ completed feature points, the minimum required LOC is defined as:
 * $$\text{minLoc}(n) = \text{GROWTH\_SCALE} \times \ln\left(1 + 2^{n - \text{TRANSITION\_OFFSET}}\right) \times \text{complexity}$$
 * where:
 * - $n$ is the target completed feature points ($n = \text{features\_total} - \text{featurePoints\_remaining} + 1$).
 * - $\text{GROWTH\_SCALE}$ and $\text{TRANSITION\_OFFSET}$ are configuration parameters set per project.
 * - If the current $\text{LOC} < \text{minLoc}(n)$, coding cannot complete the $n$-th feature point.
 * 
 * ## 3. Coding and Backlog Progress (Per Integer LOC Completed)
 * When coding, every time $\text{LOC}$ crosses an integer boundary:
 * 1. **Bugfix Points present ($\text{bugPoints} > 0$)**:
 *    - There is a probability $P_{\text{bugfix}}$ to resolve 1 bugfix point:
 *      $$\text{bugPoints} = \text{bugPoints} - 1$$
 * 2. **No Bugfix Points ($\text{bugPoints} == 0$)**:
 *    - If the current $\text{LOC} \ge \text{minLoc}(n)$ (where $n$ is the next feature point):
 *      - There is a probability $P_{\text{feature}}$ to complete 1 feature point:
 *        $$\text{featurePoints} = \text{featurePoints} - 1$$
 * 3. **Bug Introduction**:
 *    - For every integer LOC completed, there is a probability $P_{\text{bug\_intro}}$ to introduce a new bug:
 *      $$\text{hiddenBugs} = \text{hiddenBugs} + 1$$
 *    - The chance that the newly introduced bug is created in a "found" (revealed) state rather than hidden depends entirely on the current **Code Coverage** ($C_{\text{auto}}$):
 *      $$P_{\text{found}} = \frac{C_{\text{auto}}}{100}$$
 * 
 * ## 4. Manual Testing (Manual Verification)
 * During the manual `test` task, hidden bugs are discovered probabilistically:
 * - In each tick of duration $dt$, the probability of revealing a hidden bug is:
 *   $$P_{\text{reveal}} = 0.40 \times \text{efficiency} \times dt$$
 * - If a hidden bug is revealed:
 *   $$\text{hiddenBugs} = \text{hiddenBugs} - 1$$
 *   $$\text{revealedBugs} = \text{revealedBugs} + 1$$
 * 
 * ## 5. Debugging (Bug Squashing)
 * During the `debug` task, revealed bugs are resolved probabilistically:
 * - In each tick of duration $dt$, the probability of debugging a revealed bug is:
 *   $$P_{\text{debug}} = 0.50 \times \text{efficiency} \times dt$$
 * - When a bug is debugged:
 *   $$\text{revealedBugs} = \text{revealedBugs} - 1$$
 *   - It has a $30\%$ probability to be immediately resolved (completely removed).
 *   - Otherwise ($70\%$ chance), it creates a bugfix point in the backlog:
 *     $$\text{bugPoints} = \text{bugPoints} + 1$$
 * 
 * ## 6. Test Coverage and Tested Percentage
 * - **Tested Percent ($T_{\text{manual}}$)**: Manual testing coverage percentage.
 * - **Code Coverage ($C_{\text{auto}}$)**: Automated test coverage percentage.
 * - **Auto-test progress**: The automated `autotest` task increases $C_{\text{auto}}$. Since code coverage can exceed the tested percentage, if $C_{\text{auto}} > T_{\text{manual}}$, the tested percentage is raised to match:
 *   $$T_{\text{manual}} = \max(T_{\text{manual}}, C_{\text{auto}})$$
 * - **Dilution**: When new code is written, both percentages are diluted:
 *   $$T_{\text{manual\_new}} = \frac{T_{\text{manual}} \times \text{LOC}_{\text{old}}}{\text{LOC}_{\text{new}}}$$
 *   $$C_{\text{auto\_new}} = \frac{C_{\text{auto}} \times \text{LOC}_{\text{old}}}{\text{LOC}_{\text{new}}}$$
 * - **Coverage Increase Effort (LOC proportionality)**:
 *   - The effort required to increase coverage scales with the lines of code. Therefore, coverage growth rates are divided by `loc / 10.0` (with a minimum loc of 1.0 to avoid division by zero).
 */
(function() {
  const Formulas = {
    /**
     * Minimum LOC required to implement N completed feature points.
     */
    getMinLoc(n, growthScale, transitionOffset, complexity) {
      if (growthScale === 0) return 0;
      return growthScale * Math.log(1 + Math.pow(2, n - transitionOffset)) * complexity;
    },
    
    /**
     * Probability of introducing a bug per integer LOC completed.
     */
    calculateBugIntroProb(baseBugRate, complexity, linterReduction) {
      return Math.min(1.0, baseBugRate * complexity * linterReduction);
    },
    
    /**
     * Increment applied to complexity per integer LOC completed.
     */
    getComplexityIncrement() {
      // 0.005 avoids mathematical feedback lock in minLoc calculations.
      return 0.005;
    },
    
    /**
     * Dilution of coverage percent when writing new code.
     */
    calculateCoverageDilution(prevLoc, newLoc, currentCoverage) {
      if (prevLoc <= 0 || newLoc <= 0) return currentCoverage;
      return (currentCoverage * prevLoc) / (prevLoc + newLoc);
    },
    
    /**
     * Probability of revealing a hidden bug in a single tick.
     */
    calculateRevealProb(efficiency, tutDebugTestBoost, dt) {
      return Math.min(1.0, 0.40 * efficiency * tutDebugTestBoost * dt);
    },
    
    /**
     * Probability of debugging a revealed bug in a single tick.
     */
    calculateDebugProb(efficiency, tutDebugTestBoost, dt) {
      return Math.min(1.0, 0.50 * efficiency * tutDebugTestBoost * dt);
    },

    /**
     * Manual testing coverage growth speed per tick, proportional to LOC.
     */
    calculateManualTestSpeed(baseSpeed, efficiency, tutDebugTestBoost, coverage, loc) {
      const scaleLoc = Math.max(1.0, loc);
      const coverageRemainingRatio = (100 - coverage) / 100;
      const baselineLoc = 10.0;
      return (baseSpeed * efficiency * tutDebugTestBoost * coverageRemainingRatio * baselineLoc) / scaleLoc;
    },

    /**
     * Automated testing coverage growth speed per tick, proportional to LOC.
     */
    calculateAutotestSpeed(baseSpeed, efficiency, tutGitAutoBoost, loc) {
      const scaleLoc = Math.max(1.0, loc);
      const baselineLoc = 10.0;
      return (baseSpeed * efficiency * tutGitAutoBoost * baselineLoc) / scaleLoc;
    },

    /**
     * Codebase value calculation: proportional to feature points completed and reduced by total bugs.
     */
    calculateCodeValue(completedFeatures, totalBugs) {
      const valuePerFeature = 10.0;
      const penaltyPerBug = 15.0;
      return Math.max(0, completedFeatures * valuePerFeature - totalBugs * penaltyPerBug);
    }
  };

  if (typeof module !== 'undefined') {
    module.exports = Formulas;
  } else {
    window.Formulas = Formulas;
  }
})();
