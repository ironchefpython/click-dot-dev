/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

const activeIntervals = [];
const originalSetInterval = global.setInterval;
global.setInterval = (fn, delay, ...args) => {
  const id = originalSetInterval(fn, delay, ...args);
  activeIntervals.push(id);
  return id;
};

describe('Solo Coder Game - Core Engine Tests', () => {
  let DevGameEngine, CONTRACTS;

  beforeAll(() => {
    // Load engine modules
    const engineMod = require('./engine.js');
    DevGameEngine = engineMod.DevGameEngine;
    CONTRACTS = engineMod.CONTRACTS;
  });

  test('should initialize with correct default state', () => {
    const engine = new DevGameEngine();
    expect(engine.state.xp).toBe(0);
    expect(engine.state.cash).toBe(0);
    expect(engine.state.loc).toBe(0);
    expect(engine.state.activeTask).toBe('idle');
    expect(engine.currentContract.id).toBe('course-hello');
  });

  test('should progress and tick state', () => {
    const engine = new DevGameEngine();
    engine.selectTask('code');
    const report = engine.tick(1.0);
    
    expect(engine.state.activeTask).toBe('code');
    expect(report.isTaskProcessed).toBe(true);
    expect(engine.state.loc).toBeGreaterThan(0);
  });

  test('should auto-switch to idle when backlog is empty', () => {
    const engine = new DevGameEngine();
    engine.selectTask('code');
    engine.state.backlog = 0.04;
    engine.tick(0.05);
    expect(engine.state.activeTask).toBe('idle');
  });

  test('should auto-switch to idle when test coverage is 100%', () => {
    const engine = new DevGameEngine();
    engine.selectTask('test');
    engine.state.testCoverage = 100.0;
    engine.tick(0.05);
    expect(engine.state.activeTask).toBe('idle');
  });

  test('should auto-switch to idle when revealed bugs is less than 0.05', () => {
    const engine = new DevGameEngine();
    engine.selectTask('debug');
    engine.state.revealedBugs = 0.04;
    engine.tick(0.05);
    expect(engine.state.activeTask).toBe('idle');
  });

  test('should auto-switch to idle when project is ready to ship', () => {
    const engine = new DevGameEngine();
    engine.loadContract(1);
    engine.state.backlog = 0.04;
    engine.state.revealedBugs = 0.9;
    engine.selectTask('code');
    engine.tick(0.05);
    expect(engine.state.activeTask).toBe('idle');
  });

  test('should not increase task fatigue or focus when idle', () => {
    const engine = new DevGameEngine();
    engine.selectTask('idle');
    engine.tick(1.0);
    expect(engine.state.taskFatigue.idle).toBe(0);
  });

  test('should return correct ranks', () => {
    const engine = new DevGameEngine();
    engine.state.tutorialStep = 1;
    engine.state.xp = 0;
    expect(engine.getRank()).toBe('Coding Novice');

    engine.state.xp = 6;
    expect(engine.getRank()).toBe('Syntax Scholar');

    engine.state.xp = 26;
    expect(engine.getRank()).toBe('Graduate Candidate');

    engine.state.tutorialStep = 6; // tutorial finished
    engine.state.xp = 50;
    expect(engine.getRank()).toBe('Junior Developer');
  });
});

describe('Solo Coder Game - UI Binding & Integration Tests', () => {
  beforeEach(() => {
    activeIntervals.forEach(id => clearInterval(id));
    activeIntervals.length = 0;
    // Reset DOM modules and JSDOM document state for each test
    jest.resetModules();

    // Load actual index.html content into JSDOM body
    const html = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf8');
    // Strip script tags to prevent duplicate imports in JSDOM
    const cleanHtml = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    document.documentElement.innerHTML = cleanHtml;
  });

  test('should display tutorial overlay initially and advance step on click', () => {
    // Require main.js which sets up event listeners
    require('./main.js');

    const domEvent = new Event('DOMContentLoaded');
    document.dispatchEvent(domEvent);

    const overlay = document.getElementById('tutorial-overlay');
    const text = document.getElementById('tutorial-text');
    const btn = document.getElementById('tutorial-action-btn');

    // Overlay is initially visible
    expect(overlay.style.display).not.toBe('none');

    // Click on action button
    btn.click();

    // Overlay should now be hidden
    expect(overlay.style.display).toBe('none');

    // Code input should be enabled, and other buttons should be disabled (tutorial step 1 locks others)
    const codeRadio = document.querySelector('input[value="code"]');
    const testRadio = document.querySelector('input[value="test"]');
    expect(codeRadio.hasAttribute('disabled')).toBe(false);
    expect(testRadio.hasAttribute('disabled')).toBe(true);
  });

  test('should skip tutorial and unlock all tasks', () => {
    require('./main.js');

    const domEvent = new Event('DOMContentLoaded');
    document.dispatchEvent(domEvent);

    const skipBtn = document.getElementById('tutorial-skip-btn');
    const overlay = document.getElementById('tutorial-overlay');

    skipBtn.click();

    // Overlay hidden
    expect(overlay.style.display).toBe('none');

    // All inputs should be enabled
    const inputs = document.querySelectorAll('input[name="active-task"]');
    inputs.forEach(input => {
      expect(input.hasAttribute('disabled')).toBe(false);
    });

    // Check project header loaded Bakery Website
    const headerProj = document.getElementById('header-project-name');
    expect(headerProj.textContent).toBe('bakery-website');
  });

  test('should populate upgrades sidebar when tutorial is completed', () => {
    jest.useFakeTimers();
    require('./main.js');

    const domEvent = new Event('DOMContentLoaded');
    document.dispatchEvent(domEvent);

    const skipBtn = document.getElementById('tutorial-skip-btn');
    skipBtn.click();

    // Advance Jest timers by 50ms to run the UI loop tick
    jest.advanceTimersByTime(50);

    const upgradesList = document.getElementById('upgrades-list');
    expect(upgradesList.innerHTML).not.toContain('Finish course tutorial');
    expect(upgradesList.innerHTML).toContain('Mechanical Keyboard');
    
    jest.useRealTimers();
  });

  test('should blank out bugs and test coverage UI metrics in early tutorial steps', () => {
    jest.useFakeTimers();
    require('./main.js');

    const domEvent = new Event('DOMContentLoaded');
    document.dispatchEvent(domEvent);

    // Initial step is 0 (Project 1)
    jest.advanceTimersByTime(50);

    const hiddenBugsEl = document.getElementById('stat-hidden-bugs');
    const revealedBugsEl = document.getElementById('stat-revealed-bugs');
    const coverageEl = document.getElementById('stat-coverage');

    // Both should be blank (displayed as "-")
    expect(hiddenBugsEl.textContent).toBe('-');
    expect(revealedBugsEl.textContent).toBe('-');
    expect(coverageEl.textContent).toBe('-');

    jest.useRealTimers();
  });

  test('should unlock tasks in the reversed order (debug at step 2, test at step 3)', () => {
    jest.useFakeTimers();
    require('./main.js');

    const domEvent = new Event('DOMContentLoaded');
    document.dispatchEvent(domEvent);

    // Step 0 -> Step 1
    const actionBtn = document.getElementById('tutorial-action-btn');
    actionBtn.click(); // Accept Hello World Project -> step 1

    const codeRadio = document.querySelector('input[value="code"]');
    const testRadio = document.querySelector('input[value="test"]');
    const debugRadio = document.querySelector('input[value="debug"]');

    // Code is unlocked, test and debug are locked
    expect(codeRadio.disabled).toBe(false);
    expect(testRadio.disabled).toBe(true);
    expect(debugRadio.disabled).toBe(true);

    // Start coding Hello World
    console.log("Before hello-world code task select, activeTask is:", document.querySelector('input[name="active-task"]:checked')?.value);
    codeRadio.checked = true;
    codeRadio.dispatchEvent(new Event('change'));
    console.log("After hello-world code task select, activeTask is:", document.querySelector('input[name="active-task"]:checked')?.value);
    console.log("Initial Hello World backlog:", document.getElementById('stat-backlog').textContent);

    // Advance timers to complete Hello World backlog (backlog: 3, speed: 8/s)
    jest.advanceTimersByTime(15000);
    console.log("Backlog after 15s:", document.getElementById('stat-backlog').textContent);
    console.log("Active task after 15s:", document.querySelector('input[name="active-task"]:checked')?.value);

    // Hello World should be ready to ship
    const shipBtn = document.getElementById('ship-project-btn');
    expect(shipBtn.disabled).toBe(false);

    // Ship Hello World -> tutorialStep becomes 1.8
    shipBtn.click();

    // Modal popup appears: "Accept Calculator App"
    expect(actionBtn.textContent).toBe('Accept Calculator App');
    actionBtn.click(); // Sets up Project 2 (step remains 1.8)

    // Code is unlocked, test and debug are locked
    expect(codeRadio.disabled).toBe(false);
    expect(testRadio.disabled).toBe(true);
    expect(debugRadio.disabled).toBe(true);

    // Start coding Project 2
    codeRadio.checked = true;
    codeRadio.dispatchEvent(new Event('change'));

    // Advance timers so code writes enough LOC to generate at least 1 bug
    jest.advanceTimersByTime(25000);



    // This should trigger the "Unit 2: Bug Squashing" popup
    const overlay = document.getElementById('tutorial-overlay');
    expect(overlay.style.display).not.toBe('none');
    expect(actionBtn.textContent).toBe('Start Debugging');

    // Click "Start Debugging" -> tutorialStep becomes 2
    actionBtn.click();

    // Now check that:
    // - Code is unlocked
    // - Debug is unlocked (reversed tutorial!)
    // - Test remains locked
    expect(codeRadio.disabled).toBe(false);
    expect(debugRadio.disabled).toBe(false);
    expect(testRadio.disabled).toBe(true);

    // Start debugging to resolve the bugs
    debugRadio.checked = true;
    debugRadio.dispatchEvent(new Event('change'));
    jest.advanceTimersByTime(5000);

    // Loop to code and debug Project 2 until ready to ship
    let limit = 0;
    while (!window.engine.isShipReady() && limit < 30) {
      limit++;
      const backlogVal = window.engine.state.backlog;
      const bugsVal = window.engine.state.revealedBugs;
      console.log(`Iter ${limit}: engine backlog=${backlogVal}, bugs=${bugsVal}, isShipReady=${window.engine.isShipReady()}`);
      if (backlogVal > 0.05) {
        codeRadio.checked = true;
        codeRadio.dispatchEvent(new Event('change'));
        jest.advanceTimersByTime(Math.ceil(backlogVal / 0.4) * 1000 + 1000);
      } else if (bugsVal >= 1.0) {
        debugRadio.checked = true;
        debugRadio.dispatchEvent(new Event('change'));
        jest.advanceTimersByTime(Math.ceil(bugsVal / 0.8) * 1000 + 1000);
      } else {
        // Just advance 100ms to let any updates process
        jest.advanceTimersByTime(100);
      }
    }

    console.log(`Exited loop at limit=${limit}. Final: backlog=${window.engine.state.backlog}, bugs=${window.engine.state.revealedBugs}, isShipReady=${window.engine.isShipReady()}`);

    // Project 2 should be ready to ship
    expect(window.engine.isShipReady()).toBe(true);
    shipBtn.click(); // Ships Project 2 -> step becomes 2.8

    // Modal popup appears: "Accept Todo List"
    expect(actionBtn.textContent).toBe('Accept Todo List');
    actionBtn.click(); // Sets up Project 3 (step remains 2.8)

    // Code and Debug are unlocked, Test is locked
    expect(codeRadio.disabled).toBe(false);
    expect(debugRadio.disabled).toBe(false);
    expect(testRadio.disabled).toBe(true);

    // Start coding Project 3 (Todo List)
    codeRadio.checked = true;
    codeRadio.dispatchEvent(new Event('change'));

    // Code to generate hidden bugs
    jest.advanceTimersByTime(10000);

    // This should trigger the "Unit 3: Manual Verification" popup because hiddenBugs >= 1
    expect(overlay.style.display).not.toBe('none');
    expect(actionBtn.textContent).toBe('Begin Testing');

    // Click "Begin Testing" -> tutorialStep becomes 3
    actionBtn.click();

    // Now check that:
    // - Test is unlocked
    expect(testRadio.disabled).toBe(false);

  });

  test('should disable code button in UI when backlog is empty', () => {
    jest.useFakeTimers();
    require('./main.js');

    const domEvent = new Event('DOMContentLoaded');
    document.dispatchEvent(domEvent);

    // Skip tutorial to unlock upgrades and tasks
    const skipBtn = document.getElementById('tutorial-skip-btn');
    skipBtn.click();

    // Set backlog to 0.9 (which floors to 0 points, but is still > 0.05)
    window.engine.state.backlog = 0.9;
    jest.advanceTimersByTime(50);
    const codeRadio = document.querySelector('input[value="code"]');
    expect(codeRadio.disabled).toBe(false); // allowed to continue coding!

    // Set backlog of current contract in engine to 0.04 (which is <= 0.05)
    window.engine.state.backlog = 0.04;

    // Advance timers by 50ms to trigger the UI loop tick
    jest.advanceTimersByTime(50);

    expect(codeRadio.disabled).toBe(true);

    // Set backlog of current contract back to 5.0
    window.engine.state.backlog = 5.0;
    jest.advanceTimersByTime(50);
    expect(codeRadio.disabled).toBe(false);

    jest.useRealTimers();
  });
});

describe('Solo Coder Game - Tutorial Project Time Calibration', () => {
  let DevGameEngine;

  beforeAll(() => {
    const engineMod = require('./engine.js');
    DevGameEngine = engineMod.DevGameEngine;
  });

  test('should simulate each tutorial project, counting ticks, and verify times within 20% target', () => {
    const game = new DevGameEngine();
    const targets = [10, 20, 40, 80, 160];
    const projectNames = ['hello-world', 'calculator-app', 'todo-list', 'weather-app', 'sample-ecommerce'];
    const actualTimes = [];

    // Helper to run ticks
    let tickCount = 0;
    const dt = 0.05;
    function runTick(seconds, task) {
      game.selectTask(task);
      const steps = Math.round(seconds / dt);
      for (let i = 0; i < steps; i++) {
        game.tick(dt);
        tickCount++;
      }
    }

    // P1: Hello World
    let p1Start = tickCount;
    game.state.tutorialStep = 1;
    game.loadContract(0);
    while (game.state.backlog > 0.05) {
      runTick(dt, 'code');
    }
    game.shipProject();
    actualTimes.push((tickCount - p1Start) * dt);

    // P2: Calculator App
    let p2Start = tickCount;
    game.state.tutorialStep = 1.8;
    game.loadContract(1);
    runTick(3.0, 'code');
    game.state.tutorialStep = 2; // debug unlocked
    runTick(3.0, 'debug');
    
    // Convergence loop to code/debug Project 2
    let limit = 0;
    while (!game.isShipReady() && limit < 10000) {
      limit++;
      if (game.state.backlog > 0.05) {
        runTick(dt, 'code');
      } else if (game.state.revealedBugs >= 1.0) {
        runTick(dt, 'debug');
      } else {
        runTick(dt, 'debug'); // clean up fractional bugs
      }
    }
    game.shipProject();
    actualTimes.push((tickCount - p2Start) * dt);

    // P3: Todo List
    let p3Start = tickCount;
    game.state.tutorialStep = 2.8;
    game.loadContract(2);
    runTick(3.0, 'code');
    runTick(3.0, 'test');
    game.state.tutorialStep = 3; // test unlocked
    
    // Focus-friendly block strategy
    limit = 0;
    while (!game.isShipReady() && limit < 10000) {
      limit++;
      if (game.state.backlog > 0.05) {
        while (game.state.backlog > 0.05 && limit++ < 10000) {
          runTick(dt, 'code');
        }
      } else if (game.state.testCoverage < 99.9) {
        while (game.state.testCoverage < 99.9 && limit++ < 10000) {
          runTick(dt, 'test');
        }
      } else if (game.state.revealedBugs >= 1.0) {
        while (game.state.revealedBugs > 0.05 && limit++ < 10000) {
          runTick(dt, 'debug');
        }
      } else {
        runTick(dt, 'debug');
      }
    }
    game.shipProject();
    actualTimes.push((tickCount - p3Start) * dt);

    // P4: Weather App
    let p4Start = tickCount;
    game.state.tutorialStep = 3.8;
    game.loadContract(3);
    
    // Code until LOC >= 8
    while (game.state.loc < 8.0) {
      runTick(dt, 'code');
    }
    game.state.tutorialStep = 4; // refactor unlocked
    
    // Refactor for 4 seconds
    runTick(4.0, 'refactor');
    
    // Finish Project 4 using block-based strategy
    limit = 0;
    while (!game.isShipReady() && limit < 10000) {
      limit++;
      if (game.state.backlog > 0.05) {
        while (game.state.backlog > 0.05 && limit++ < 10000) {
          runTick(dt, 'code');
        }
      } else if (game.state.testCoverage < 99.9) {
        while (game.state.testCoverage < 99.9 && limit++ < 10000) {
          runTick(dt, 'test');
        }
      } else if (game.state.revealedBugs >= 1.0) {
        while (game.state.revealedBugs > 0.05 && limit++ < 10000) {
          runTick(dt, 'debug');
        }
      } else {
        runTick(dt, 'debug');
      }
    }
    game.shipProject();
    actualTimes.push((tickCount - p4Start) * dt);

    // P5: Sample Ecommerce
    let p5Start = tickCount;
    game.state.tutorialStep = 4.8;
    game.loadContract(4);
    
    // Code for 3 seconds, then test until coverage >= 10
    runTick(3.0, 'code');
    while (game.state.testCoverage < 10.0) {
      runTick(dt, 'test');
    }
    game.state.tutorialStep = 5; // autotest unlocked
    
    // Autotest until testCoverageFloor >= 10
    while (game.state.testCoverageFloor < 10.0) {
      runTick(dt, 'autotest');
    }
    
    // Finish Project 5 using block-based strategy
    limit = 0;
    while (!game.isShipReady() && limit < 10000) {
      limit++;
      if (game.state.backlog > 0.05) {
        while (game.state.backlog > 0.05 && limit++ < 10000) {
          runTick(dt, 'code');
        }
      } else if (game.state.testCoverage < 99.9) {
        while (game.state.testCoverage < 99.9 && limit++ < 10000) {
          runTick(dt, 'test');
        }
      } else if (game.state.revealedBugs >= 1.0) {
        while (game.state.revealedBugs > 0.05 && limit++ < 10000) {
          runTick(dt, 'debug');
        }
      } else {
        runTick(dt, 'debug');
      }
    }
    game.shipProject();
    actualTimes.push((tickCount - p5Start) * dt);

    // Assert and print results
    console.log('\n==================================================');
    console.log('Automated Tutorial Playtime Verification (in seconds):');
    console.log('==================================================');
    for (let i = 0; i < 5; i++) {
      const actual = actualTimes[i];
      const target = targets[i];
      const diffPct = (Math.abs(actual - target) / target) * 100;
      console.log(`Project ${i + 1} (${projectNames[i]}): Target = ${target}s | Actual = ${actual.toFixed(2)}s | Diff = ${diffPct.toFixed(1)}%`);
      
      // 20% margin assertion
      expect(actual).toBeGreaterThanOrEqual(target * 0.8);
      expect(actual).toBeLessThanOrEqual(target * 1.2);
    }
    console.log('==================================================\n');
  });

  test('should require test coverage >= 99.9 to ship Project 3+', () => {
    const engine = new DevGameEngine();
    
    // Project 2 (Calculator) does not require test coverage
    engine.loadContract(1);
    engine.state.backlog = 0.04;
    engine.state.revealedBugs = 0.5;
    engine.state.testCoverage = 0;
    expect(engine.isShipReady()).toBe(true);

    // Project 3 (Todo List) requires test coverage >= 99.9
    engine.loadContract(2);
    engine.state.backlog = 0.04;
    engine.state.revealedBugs = 0.5;
    engine.state.testCoverage = 95.0;
    expect(engine.isShipReady()).toBe(false);

    engine.state.testCoverage = 99.9;
    expect(engine.isShipReady()).toBe(true);
  });
});
