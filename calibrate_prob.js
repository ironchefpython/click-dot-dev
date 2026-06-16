const { DevGameEngine, CONTRACTS } = require('./game.js');
const { simulateProject, DT } = require('./simulate.js');
const TUTORIAL_PHASE = require('./phase-tutorial.js');

const targets = [10, 20, 40, 80, 160];

// Tutorial project configs used as the search space for calibration.
// Only featureCompleteProb / bugfixClearProb are searched; other fields are
// fixed per-project design decisions.
const configs = [
  // P1: Hello World
  { backlog: 4, difficulty: 1.0, complexity: 1.0, growthScale: 0, transitionOffset: 0, featureCompleteProb: 1.0, bugfixClearProb: 1.0, baseBugRate: 0.0 },
  // P2: Calculator
  { backlog: 5, difficulty: 1.5, complexity: 1.0, growthScale: 5, transitionOffset: 2, featureCompleteProb: 0.57, bugfixClearProb: 0.57, baseBugRate: 0.05 },
  // P3: Todo
  { backlog: 5, difficulty: 2.0, complexity: 1.1, growthScale: 5, transitionOffset: 2, featureCompleteProb: 0.56, bugfixClearProb: 0.56, baseBugRate: 0.05 },
  // P4: Weather
  { backlog: 8, difficulty: 2.5, complexity: 1.1, growthScale: 6, transitionOffset: 4, featureCompleteProb: 0.39, bugfixClearProb: 0.39, baseBugRate: 0.05 },
  // P5: Ecommerce
  { backlog: 10, difficulty: 3.0, complexity: 1.2, growthScale: 15, transitionOffset: 7, featureCompleteProb: 0.49, bugfixClearProb: 0.49, baseBugRate: 0.05 }
];

// Each value is the fully-unlocked tutorialStep for that project.
const tutorialSteps = [1, 2, 3, 4, 5];

/**
 * Apply a set of config overrides to the shared CONTRACTS array, run the full
 * 5-project tutorial sequence using simulateProject, and return the playtime
 * (in seconds) for each project.
 */
function runSequentialSim(configsOverride) {
  for (let i = 0; i < 5; i++) {
    Object.assign(CONTRACTS[i], configsOverride[i]);
  }

  const game = new DevGameEngine();
  const tickCounter = { count: 0 };
  const actualTimes = [];

  for (let i = 0; i < 5; i++) {
    game.state.tutorialStep = tutorialSteps[i];
    const { taskTimes } = simulateProject(game, i, tickCounter);
    actualTimes.push(Object.values(taskTimes).reduce((a, b) => a + b, 0));
  }

  return actualTimes;
}

// ─── Quick single-pass probe ──────────────────────────────────────────────────
// One sim run per project. Measures actual time at the current config's prob
// and emits a corrected estimate. Fast by design — run this constantly.

console.log('Probing configurations (1 pass)...\n');

const results = runSequentialSim(configs);

for (let pIdx = 0; pIdx < 5; pIdx++) {
  const actual = results[pIdx];
  const target = targets[pIdx];
  const diff = ((actual - target) / target * 100).toFixed(1);
  const sign = actual >= target ? '+' : '';
  console.log(`P${pIdx + 1}: prob=${configs[pIdx].featureCompleteProb.toFixed(5)}  actual=${actual.toFixed(2)}s  target=${target}s  (${sign}${diff}%)`);
}

console.log('\nSuggested next configs (scale prob inversely with time ratio):');
configs.forEach((c, i) => {
  if (i === 0) return; // P1 has no prob to tune
  const ratio = results[i] / targets[i];
  const newProb = Math.min(1.0, Math.max(0.001, parseFloat((c.featureCompleteProb * ratio).toFixed(5))));
  console.log(`  P${i + 1}: featureCompleteProb: ${newProb}  (was ${c.featureCompleteProb.toFixed(5)}, ratio=${ratio.toFixed(2)})`);
});
