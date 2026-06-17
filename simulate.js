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
    const needBacklogReduced = game.state.tutorialStep >= 6;
    isGamestatePossible = (!needBacklogReduced || game.state.backlogReduced) && game.state.testCoverage < 100.0;
  } else if (task === 'bugfix') {
    isGamestatePossible = game.state.revealedBugs > 0.05;
  } else if (task === 'refactor') {
    const needBacklogReduced = game.state.tutorialStep >= 6;
    const initialComplexity = game.currentContract ? (game.currentContract.complexity || 1.0) : 1.0;
    const minComplexity = Math.min(initialComplexity, 1.5);
    isGamestatePossible = (!needBacklogReduced || game.state.backlogReduced) && game.state.loc > game.state.minLoc && game.state.complexity > minComplexity;
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
  if (task === 'bugfix')    return step >= 1.8;
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
 * @param {object} taskTimes  Mutable accumulator: { idle, code, test, bugfix, refactor, autotest }
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
    if (game.state.tutorialStep >= 6 && activeTask !== 'idle' && game.state.taskFatigue[activeTask] >= FATIGUE_REST_THRESHOLD) {
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

const DEFAULT_THRESHOLDS = {
  code: { set: 0.05, reset: 0.05 },
  bugfix: { set: 1.0, reset: 0.0 },
  test: { set: 80.0, reset: 99.9 },
  refactor: { set: 1.4, reset: 0.05 }, // relative to contract's initial complexity
  autotest: { set: 30.0, reset: 60.0 }
};

/**
 * Simulates a single contract on the provided engine instance until it is
 * ready to ship, then ships it. Works for both tutorial and developer contracts.
 *
 * Uses hysteresis-based active task tracking:
 *   1. bugfix    - highest priority
 *   2. refactor
 *   3. code
 *   4. autotest
 *   5. test     - lowest priority
 *
 * @returns {{ taskTimes, finalLoc, finalMinLoc }}
 */
function simulateProject(game, contractIdx, tickCounter, thresholds = null, maxTicks = 15000) {
  const taskTimes = { idle: 0, code: 0, test: 0, bugfix: 0, refactor: 0, autotest: 0 };

  game.loadContract(contractIdx);

  const MAX_TICKS = maxTicks; // bail out fast if misconfigured or custom limit reached
  let ticks = 0;

  const initialComplexity = game.currentContract ? (game.currentContract.complexity || 1.0) : 1.0;

  const activeTasks = {
    code: false,
    bugfix: false,
    test: false,
    refactor: false,
    autotest: false
  };

  const isDevPhase = game.state.tutorialStep >= 6;
  let activeThresholds = thresholds;
  if (!activeThresholds) {
    if (isDevPhase) {
      activeThresholds = {
        code: { set: 0.05, reset: 0.05 },
        bugfix: { set: 1.0, reset: 0.0 },
        test: { set: 99.9, reset: 99.9 },
        refactor: { set: 0.50, reset: 0.05 },
        autotest: { set: 80.0, reset: 95.0 }
      };
    } else {
      activeThresholds = DEFAULT_THRESHOLDS;
    }
  }

  const taskPriority = isDevPhase
    ? ['bugfix', 'refactor', 'autotest', 'code', 'test']
    : ['bugfix', 'refactor', 'code', 'autotest', 'test'];

  const startTicks = tickCounter.count;
  while (!game.isShipReady() && (tickCounter.count - startTicks) < MAX_TICKS) {
    // 1. Update active states with set/reset thresholds
    // Code
    if (game.state.backlog > activeThresholds.code.set) {
      activeTasks.code = true;
    }
    if (game.state.backlog <= activeThresholds.code.reset) {
      activeTasks.code = false;
    }

    // Bugfix
    if (game.state.revealedBugs >= activeThresholds.bugfix.set) {
      activeTasks.bugfix = true;
    }
    if (game.state.revealedBugs <= activeThresholds.bugfix.reset) {
      activeTasks.bugfix = false;
    }

    // Test
    if (game.state.testCoverage < activeThresholds.test.set) {
      activeTasks.test = true;
    }
    if (game.state.testCoverage >= activeThresholds.test.reset) {
      activeTasks.test = false;
    }

    // Refactor (relative to contract initialComplexity, but starting at 1.5)
    const refactorBase = Math.max(initialComplexity, 1.5);
    if (game.state.complexity >= refactorBase + activeThresholds.refactor.set) {
      activeTasks.refactor = true;
    }
    if (game.state.complexity <= refactorBase + activeThresholds.refactor.reset) {
      activeTasks.refactor = false;
    }

    // Autotest
    if (game.state.testCoverageFloor < activeThresholds.autotest.set) {
      activeTasks.autotest = true;
    }
    if (game.state.testCoverageFloor >= activeThresholds.autotest.reset) {
      activeTasks.autotest = false;
    }

    // 2. Choose active task: continue with current task if not idle;
    // otherwise, select the highest priority active and possible task.
    let task = game.state.activeTask || 'idle';
    if (task === 'idle') {
      for (const t of taskPriority) {
        if (activeTasks[t] && checkTaskPossible(game, t)) {
          task = t;
          break;
        }
      }
      // Fallback: if we selected idle but the project is not ready to ship,
      // force selection of the highest priority possible task to break deadlocks.
      if (task === 'idle' && !game.isShipReady()) {
        for (const t of taskPriority) {
          if (checkTaskPossible(game, t)) {
            task = t;
            break;
          }
        }
      }
    }

    runTick(game, DT, task, taskTimes, tickCounter);
    ticks++;
  }

  const finalLoc    = game.state.loc;
  const finalMinLoc = game.state.minLoc;

  const shipped = game.isShipReady();
  if (shipped) {
    game.shipProject();
  }

  return { taskTimes, finalLoc, finalMinLoc, shipped };
}

// Upgrade purchase logic
function buyAffordableUpgrades(g) {
  const devUpgrades = [
    { id: 'keyboard', costCash: 15, costXP: 30 },
    { id: 'coffee', costCash: 30, costXP: 50 },
    { id: 'linter', costCash: 50, costXP: 100 },
    { id: 'copilot', costCash: 120, costXP: 250 },
    { id: 'framework', costCash: 200, costXP: 400 }
  ];
  const tutUpgrades = [
    { id: 'oss-ide', costCash: 0, costXP: 8 },
    { id: 'install-linux', costCash: 0, costXP: 18 },
    { id: 'touch-typing', costCash: 0, costXP: 38 },
    { id: 'git-workflow', costCash: 0, costXP: 65 }
  ];

  for (const upg of tutUpgrades) {
    if (!g.state.purchasedUpgrades.includes(upg.id) && g.state.xp >= upg.costXP) {
      g.buyTutorialUpgrade(upg.id);
    }
  }

  for (const upg of devUpgrades) {
    if (!g.state.purchasedUpgrades.includes(upg.id) && g.state.cash >= upg.costCash && g.state.xp >= upg.costXP) {
      g.buyUpgrade(upg.id);
    }
  }
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
    2,  // P2: + bugfix (>= 1.8)
    3,  // P3: + test  (>= 2.8)
    4,  // P4: + refactor (>= 3.8)
    5,  // P5: + autotest (>= 4.8)
  ];

  for (let i = 0; i < TUTORIAL_PHASE.contracts.length; i++) {
    game.state.tutorialStep = tutorialSteps[i];
    const contractIdx = i;
    const { taskTimes, finalLoc, finalMinLoc, shipped } = simulateProject(game, contractIdx, tickCounter);

    results.push({
      label:    `P${i + 1}: ${TUTORIAL_PHASE.contracts[i].title}`,
      target:   tutorialTargets[i],
      ...taskTimes,
      total:    Object.values(taskTimes).reduce((a, b) => a + b, 0),
      loc:      finalLoc,
      minLoc:   finalMinLoc,
      shipped:  shipped
    });
  }

  // After tutorial, fully unlock all tasks
  game.state.tutorialStep = 6;

  // ── Developer phase contracts ───────────────────────────────────────────────
  for (let i = 0; i < DEVELOPER_PHASE.contracts.length; i++) {
    buyAffordableUpgrades(game);
    const { taskTimes, finalLoc, finalMinLoc, shipped } = simulateProject(game, i + 5, tickCounter);

    results.push({
      label:    `D${i + 1}: ${DEVELOPER_PHASE.contracts[i].title}`,
      target:   null,
      ...taskTimes,
      total:    Object.values(taskTimes).reduce((a, b) => a + b, 0),
      loc:      finalLoc,
      minLoc:   finalMinLoc,
      shipped:  shipped
    });
  }

  return results;
}

// ─── Entry point (when run directly) ─────────────────────────────────────────

if (require.main === module) {
  const results = simulateCareer();

  if (process.stdout.isTTY) {
    const cols = [
      { name: 'Project', width: 28, align: 'left', key: 'label' },
      { name: 'LOC', width: 6, align: 'right', format: v => v.loc.toFixed(1) },
      { name: 'Min LOC', width: 8, align: 'right', format: v => v.minLoc.toFixed(1) },
      { name: 'Code', width: 6, align: 'right', format: v => v.code.toFixed(1) },
      { name: 'Test', width: 6, align: 'right', format: v => v.test.toFixed(1) },
      { name: 'Bugfix', width: 6, align: 'right', format: v => v.bugfix.toFixed(1) },
      { name: 'Refactor', width: 8, align: 'right', format: v => v.refactor.toFixed(1) },
      { name: 'Coverage', width: 8, align: 'right', format: v => v.autotest.toFixed(1) },
      { name: 'Idle', width: 6, align: 'right', format: v => v.idle.toFixed(1) },
      { name: 'Total', width: 8, align: 'right', format: v => v.shipped ? v.total.toFixed(1) : 'TIMEOUT' },
      { name: 'Target', width: 6, align: 'right', format: v => v.target !== null ? v.target.toFixed(1) : '-' }
    ];

    const topBorder = '┌' + cols.map(c => '─'.repeat(c.width + 2)).join('┬') + '┐';
    const midBorder = '├' + cols.map(c => '─'.repeat(c.width + 2)).join('┼') + '┤';
    const botBorder = '└' + cols.map(c => '─'.repeat(c.width + 2)).join('┴') + '┘';

    function formatRow(rowValues) {
      return '│ ' + cols.map((c, i) => {
        const val = rowValues[i];
        if (c.align === 'left') {
          return val.padEnd(c.width);
        } else {
          return val.padStart(c.width);
        }
      }).join(' │ ') + ' │';
    }

    const bannerWidth = topBorder.length;
    const bannerLine = '='.repeat(bannerWidth);

    console.log('\n' + bannerLine);
    console.log(' '.repeat(Math.max(0, Math.floor((bannerWidth - 34) / 2))) + 'DevLoop Career Playtime Simulation');
    console.log(bannerLine);
    console.log(topBorder);
    console.log(formatRow(cols.map(c => c.name)));
    console.log(midBorder);
    results.forEach(r => {
      const rowValues = cols.map(c => {
        if (c.key) return r[c.key];
        return c.format(r);
      });
      console.log(formatRow(rowValues));
    });
    console.log(botBorder);
    console.log(bannerLine + '\n');
  } else {
    const headers = ['Project', 'LOC', 'Min LOC', 'Code', 'Test', 'Bugfix', 'Refactor', 'Coverage', 'Idle', 'Total', 'Target'];
    console.log('| ' + headers.join(' | ') + ' |');
    console.log('| ' + headers.map(h => (h === 'Project' ? ':---' : '---:')).join(' | ') + ' |');
    results.forEach(r => {
      const row = [
        r.label,
        r.loc.toFixed(1),
        r.minLoc.toFixed(1),
        r.code.toFixed(1),
        r.test.toFixed(1),
        r.bugfix.toFixed(1),
        r.refactor.toFixed(1),
        r.autotest.toFixed(1),
        r.idle.toFixed(1),
        r.shipped ? r.total.toFixed(1) : 'TIMEOUT',
        r.target !== null ? r.target.toFixed(1) : '-',
      ];
      console.log('| ' + row.join(' | ') + ' |');
    });
  }
}

// ─── Exports (for calibrate_prob.js, game.test.js, etc.) ─────────────────────

module.exports = { checkTaskPossible, runTick, simulateProject, simulateCareer, DT };
