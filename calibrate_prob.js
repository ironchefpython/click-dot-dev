const { DevGameEngine, CONTRACTS } = require('/app/game.js');

const targets = [10, 20, 40, 80, 160];

const configs = [
  // P1: Hello World
  { backlog: 4, difficulty: 1.0, complexity: 1.0, growthScale: 0, transitionOffset: 0, featureCompleteProb: 1.0, bugfixClearProb: 1.0, baseBugRate: 0.0 },
  // P2: Calculator
  { backlog: 5, difficulty: 1.5, complexity: 1.0, growthScale: 5, transitionOffset: 2, featureCompleteProb: 0.38, bugfixClearProb: 0.38, baseBugRate: 0.05 },
  // P3: Todo
  { backlog: 5, difficulty: 2.0, complexity: 1.1, growthScale: 8, transitionOffset: 3, featureCompleteProb: 0.39, bugfixClearProb: 0.39, baseBugRate: 0.05 },
  // P4: Weather
  { backlog: 9, difficulty: 2.5, complexity: 1.1, growthScale: 10, transitionOffset: 5, featureCompleteProb: 0.1, bugfixClearProb: 0.1, baseBugRate: 0.05 },
  // P5: Ecommerce
  { backlog: 11, difficulty: 3.0, complexity: 1.2, growthScale: 15, transitionOffset: 7, featureCompleteProb: 0.08, bugfixClearProb: 0.08, baseBugRate: 0.05 }
];

function runSequentialSim(configsOverride) {
  // Override CONTRACTS inside game engine database
  for (let i = 0; i < 5; i++) {
    CONTRACTS[i].backlog = configsOverride[i].backlog;
    CONTRACTS[i].difficulty = configsOverride[i].difficulty;
    CONTRACTS[i].complexity = configsOverride[i].complexity;
    CONTRACTS[i].growthScale = configsOverride[i].growthScale;
    CONTRACTS[i].transitionOffset = configsOverride[i].transitionOffset;
    CONTRACTS[i].featureCompleteProb = configsOverride[i].featureCompleteProb;
    CONTRACTS[i].bugfixClearProb = configsOverride[i].bugfixClearProb;
    CONTRACTS[i].baseBugRate = configsOverride[i].baseBugRate;
  }

  const game = new DevGameEngine();
  let tickCount = 0;
  const dt = 0.05;
  const actualTimes = [];

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
  
  let limit = 0;
  while (!game.isShipReady() && limit < 10000) {
    limit++;
    if (game.state.backlog > 0.05) {
      runTick(dt, 'code');
    } else if (game.state.revealedBugs >= 1.0) {
      runTick(dt, 'debug');
    } else {
      runTick(dt, 'debug');
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
  
  while (game.state.loc < 8.0) {
    runTick(dt, 'code');
  }
  game.state.tutorialStep = 4; // refactor unlocked
  runTick(4.0, 'refactor');
  
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
  
  runTick(3.0, 'code');
  while (game.state.testCoverage < 10.0) {
    runTick(dt, 'test');
  }
  game.state.tutorialStep = 5; // autotest unlocked
  while (game.state.testCoverageFloor < 10.0) {
    runTick(dt, 'autotest');
  }
  
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

  return actualTimes;
}

console.log("Searching configurations...");

for (let pIdx = 0; pIdx < 5; pIdx++) {
  const target = targets[pIdx];

  if (pIdx === 0) {
    const times = runSequentialSim(configs);
    console.log(`P1: actual = ${times[0].toFixed(2)}s (target = ${target}s)`);
    continue;
  }

  let bestDiff = Infinity;
  let bestParams = { ...configs[pIdx] };
  let bestTime = 0;

  // Sweep backlog and probability
  for (let backlog = Math.max(3, configs[pIdx].backlog - 3); backlog <= configs[pIdx].backlog + 12; backlog++) {
    for (let prob = 0.02; prob <= 0.98; prob += 0.02) {
      const pCopy = {
        ...configs[pIdx],
        backlog: backlog,
        featureCompleteProb: parseFloat(prob.toFixed(3)),
        bugfixClearProb: parseFloat(prob.toFixed(3))
      };
      
      const configsCopy = configs.map((c, i) => i === pIdx ? pCopy : c);
      const times = runSequentialSim(configsCopy);
      const t = times[pIdx];
      const diff = Math.abs(t - target);

      if (diff < bestDiff) {
        bestDiff = diff;
        bestParams = pCopy;
        bestTime = t;
      }
    }
  }

  // Refine probability with higher precision
  bestDiff = Infinity;
  const startProb = bestParams.featureCompleteProb;
  for (let prob = Math.max(0.01, startProb - 0.04); prob <= Math.min(1.0, startProb + 0.04); prob += 0.005) {
    const pCopy = {
      ...bestParams,
      featureCompleteProb: parseFloat(prob.toFixed(4)),
      bugfixClearProb: parseFloat(prob.toFixed(4))
    };
    const configsCopy = configs.map((c, i) => i === pIdx ? pCopy : c);
    const times = runSequentialSim(configsCopy);
    const t = times[pIdx];
    const diff = Math.abs(t - target);

    if (diff < bestDiff) {
      bestDiff = diff;
      bestParams = pCopy;
      bestTime = t;
    }
  }

  console.log(`P${pIdx+1} (${target}s): Backlog = ${bestParams.backlog}, prob = ${bestParams.featureCompleteProb} -> actual = ${bestTime.toFixed(2)}s (diff = ${((bestTime - target)/target*100).toFixed(1)}%)`);
  configs[pIdx] = bestParams;
}

console.log("\nCalibrated Configurations:");
console.log(JSON.stringify(configs, null, 2));
