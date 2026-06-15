const { DevGameEngine } = require('./game.js');
const TUTORIAL_PHASE = require('./phase-tutorial.js');
const DEVELOPER_PHASE = require('./phase-developer.js');

const DT = 0.05;
const FATIGUE_REST_THRESHOLD = 20.0;
const FATIGUE_REST_DURATION = 2.0;

// Tutorial target playtimes (seconds), used for display only
const tutorialTargets = [10, 20, 40, 80, 160];

// ─── Shared helpers ───────────────────────────────────────────────────────────

/**
 * Returns true if the given task can currently do useful work,
 * checking gamestate preconditions first, then tutorial unlock state.
 */
function checkTaskPossible(game, task) {
  if (task === 'idle') return true;

  // 1. Gamestate: can this task make progress right now?
  let isGamestatePossible = false;
  if (task === 'code') {
    isGamestatePossible = game.state.backlog > 0.05;
  } else if (task === 'test') {
    isGamestatePossible = game.state.testCoverage < 100.0;
  } else if (task === 'debug') {
    isGamestatePossible = game.state.revealedBugs > 0.05;
  } else if (task === 'refactor') {
    isGamestatePossible = game.state.loc > game.state.minLoc;
  } else if (task === 'autotest') {
    const hasTutGit = game.state.purchasedUpgrades.includes('git-workflow');
    const tutGitFloorCap = hasTutGit ? 95 : 90;
    isGamestatePossible = game.state.testCoverageFloor < tutGitFloorCap;
  }

  if (!isGamestatePossible) return false;

  // 2. Tutorial unlock: has this task been taught yet?
  const step = game.state.tutorialStep;
  if (step >= 6) return true;

  if (task === 'code')     return step >= 1;
  if (task === 'debug')    return step >= 1.8;
  if (task === 'test')     return step >= 2.8;
  if (task === 'refactor') return step >= 3.8;
  if (task === 'autotest') return step >= 4.8;

  return false;
}

/**
 * Advances the game by `seconds` wall-clock time, spending each tick on `task`
 * unless the task is impossible (falls back to idle) or fatigue is too high
 * (rests for FATIGUE_REST_DURATION before continuing).
 *
 * @param {DevGameEngine} game
 * @param {number} seconds
 * @param {string} task
 * @param {object} taskTimes  Mutable accumulator: { idle, code, test, debug, refactor, autotest }
 * @param {{ count: number }} tickCounter  Mutable tick counter shared across a simulation run
 */
function runTick(game, seconds, task, taskTimes, tickCounter) {
  const steps = Math.round(seconds / DT);
  for (let i = 0; i < steps; i++) {
    let activeTask = task;

    // Check task eligibility before doing anything
    if (!checkTaskPossible(game, activeTask)) {
      activeTask = 'idle';
    }

    // Rest if fatigue is too high
    if (activeTask !== 'idle' && game.state.taskFatigue[activeTask] >= FATIGUE_REST_THRESHOLD) {
      game.selectTask('idle');
      const restSteps = Math.round(FATIGUE_REST_DURATION / DT);
      for (let r = 0; r < restSteps; r++) {
        game.tick(DT);
        taskTimes['idle'] += DT;
        tickCounter.count++;
      }
      // Re-check after rest
      if (!checkTaskPossible(game, activeTask)) {
        activeTask = 'idle';
      }
    }

    game.selectTask(activeTask);
    game.tick(DT);
    taskTimes[activeTask] += DT;
    tickCounter.count++;
  }
}

/**
 * Simulates a single contract on the provided engine instance until it is
 * ready to ship, then ships it. Works for both tutorial and developer contracts.
 *
 * Priority order each tick:
 *   1. code   – if backlog remains
 *   2. test   – if coverage < 99.9%
 *   3. debug  – if revealed bugs exist
 *   4. refactor – if LOC > minLoc (opportunistic)
 *   5. autotest – if floor not capped
 *   6. idle   – nothing productive to do
 *
 * @returns {{ taskTimes, finalLoc, finalMinLoc }}
 */
function simulateProject(game, contractIdx, tickCounter) {
  const taskTimes = { idle: 0, code: 0, test: 0, debug: 0, refactor: 0, autotest: 0 };

  game.loadContract(contractIdx);

  const MAX_TICKS = 4000; // 200s of game time — bail out fast if misconfigured
  let ticks = 0;

  while (!game.isShipReady() && ticks < MAX_TICKS) {
    let task;
    if      (checkTaskPossible(game, 'code'))     task = 'code';
    else if (checkTaskPossible(game, 'debug'))    task = 'debug';
    else if (checkTaskPossible(game, 'test'))     task = 'test';
    else if (checkTaskPossible(game, 'refactor')) task = 'refactor';
    else if (checkTaskPossible(game, 'autotest')) task = 'autotest';
    else                                          task = 'idle';

    runTick(game, DT, task, taskTimes, tickCounter);
    ticks++;
  }

  const finalLoc    = game.state.loc;
  const finalMinLoc = game.state.minLoc;

  game.shipProject();

  return { taskTimes, finalLoc, finalMinLoc };
}

// ─── Career simulation ────────────────────────────────────────────────────────

function simulateCareer() {
  const game = new DevGameEngine();
  const tickCounter = { count: 0 };
  const results = [];

  // ── Tutorial projects (P1–P5) ──────────────────────────────────────────────
  // Tutorial steps must be advanced in the correct order so that tasks unlock
  // Each value is the fully-unlocked tutorialStep for that project, so every
  // task introduced during that project is available from the first tick.
  const tutorialSteps = [
    1,  // P1: code only
    2,  // P2: + debug (>= 1.8)
    3,  // P3: + test  (>= 2.8)
    4,  // P4: + refactor (>= 3.8)
    5,  // P5: + autotest (>= 4.8)
  ];

  for (let i = 0; i < TUTORIAL_PHASE.contracts.length; i++) {
    game.state.tutorialStep = tutorialSteps[i];
    const contractIdx = i;
    const { taskTimes, finalLoc, finalMinLoc } = simulateProject(game, contractIdx, tickCounter);

    results.push({
      label:    `P${i + 1}: ${TUTORIAL_PHASE.contracts[i].title}`,
      target:   tutorialTargets[i],
      ...taskTimes,
      total:    Object.values(taskTimes).reduce((a, b) => a + b, 0),
      loc:      finalLoc,
      minLoc:   finalMinLoc,
    });
  }

  // After tutorial, fully unlock all tasks
  game.state.tutorialStep = 6;

  // ── Developer phase contracts ───────────────────────────────────────────────
  for (let i = 0; i < DEVELOPER_PHASE.contracts.length; i++) {
    const contractIdx = TUTORIAL_PHASE.contracts.length + i;
    const { taskTimes, finalLoc, finalMinLoc } = simulateProject(game, contractIdx, tickCounter);

    results.push({
      label:    `D${i + 1}: ${DEVELOPER_PHASE.contracts[i].title}`,
      target:   null,
      ...taskTimes,
      total:    Object.values(taskTimes).reduce((a, b) => a + b, 0),
      loc:      finalLoc,
      minLoc:   finalMinLoc,
    });
  }

  return results;
}

// ─── Entry point (when run directly) ─────────────────────────────────────────

if (require.main === module) {
  const results = simulateCareer();

  const tableData = results.map(r => {
    const row = {
      'Project':        r.label,
      'Code (s)':       r.code.toFixed(2),
      'Test (s)':       r.test.toFixed(2),
      'Debug (s)':      r.debug.toFixed(2),
      'Refactor (s)':   r.refactor.toFixed(2),
      'Unit Tests (s)': r.autotest.toFixed(2),
      'Idle (s)':       r.idle.toFixed(2),
      'Total (s)':      r.total.toFixed(2),
      'LOC':            r.loc.toFixed(1),
      'Min LOC':        r.minLoc.toFixed(1),
    };
    if (r.target !== null) row['Target (s)'] = r.target.toFixed(2);
    return row;
  });

  if (process.stdout.isTTY) {
    console.log('\n=========================================================================================');
    console.log('                        DevLoop Career Playtime Simulation');
    console.log('=========================================================================================');
    console.table(tableData);
    console.log('=========================================================================================\n');
  } else {
    const headers = ['Project', 'Code (s)', 'Test (s)', 'Debug (s)', 'Refactor (s)', 'Unit Tests (s)', 'Idle (s)', 'Total (s)', 'LOC', 'Min LOC', 'Target (s)'];
    console.log('| ' + headers.join(' | ') + ' |');
    console.log('| ' + headers.map(h => (h === 'Project' ? ':---' : ':---:')).join(' | ') + ' |');
    results.forEach(r => {
      const row = [
        r.label,
        r.code.toFixed(2),
        r.test.toFixed(2),
        r.debug.toFixed(2),
        r.refactor.toFixed(2),
        r.autotest.toFixed(2),
        r.idle.toFixed(2),
        r.total.toFixed(2),
        r.loc.toFixed(1),
        r.minLoc.toFixed(1),
        r.target !== null ? r.target.toFixed(2) : '-',
      ];
      console.log('| ' + row.join(' | ') + ' |');
    });
  }
}

// ─── Exports (for calibrate_prob.js, game.test.js, etc.) ─────────────────────

module.exports = { checkTaskPossible, runTick, simulateProject, simulateCareer, DT };
