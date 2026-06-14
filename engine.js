(function() {
  // Load phase data (supports both Node.js environment and browser globals)
  let TUTORIAL_PHASE, DEVELOPER_PHASE, BUSINESS_PHASE;
  if (typeof require !== 'undefined') {
  TUTORIAL_PHASE = require('./phase-tutorial.js');
  DEVELOPER_PHASE = require('./phase-developer.js');
  BUSINESS_PHASE = require('./phase-business.js');
} else {
  TUTORIAL_PHASE = window.TUTORIAL_PHASE;
  DEVELOPER_PHASE = window.DEVELOPER_PHASE;
  BUSINESS_PHASE = window.BUSINESS_PHASE;
}

// Combine contract data and upgrades from phases
const CONTRACTS = [...TUTORIAL_PHASE.contracts, ...DEVELOPER_PHASE.contracts];
const UPGRADES = [...DEVELOPER_PHASE.upgrades, ...BUSINESS_PHASE.upgrades];

// Procedural generator fallback
function generateProceduralContract(index) {
  return DEVELOPER_PHASE.generateProceduralContract(index);
}

// Game constants and parameters
const K_FOCUS = 0.06;      // Focus grows by 6% per second
const K_FATIGUE = 0.008;   // Fatigue baseline coefficient
const LAMBDA = 0.125;      // Exponential fatigue growth rate
const FATIGUE_DECAY = 0.65; // Decay rate for inactive tasks

// Task base speeds
const BASE_CODE_SPEED = 8.0;     // LOC written per second at 100% efficiency
const BASE_TEST_SPEED = 0.8;    // Manual testing speed coefficient
const BASE_DEBUG_SPEED = 0.8;    // Bugs fixed per second
const BASE_REFACTOR_SPEED = 6.0; // LOC removed per second
const BASE_AUTOTEST_SPEED = 1.2; // Floor percentage added per second

/**
 * Pure Game Engine Class (No DOM dependencies)
 * Can be instantiated and ticked programmatically for automated testing
 */
class DevGameEngine {
  constructor(initialState = null) {
    this.listeners = {};
    this.state = initialState || {
      xp: 0,
      cash: 0,
      loc: 0,
      hiddenBugs: 0,
      revealedBugs: 0,
      backlog: 0,
      featurePoints: 0,
      bugPoints: 0,
      testCoverage: 0,
      testCoverageFloor: 0,
      minLoc: 0,
      activeTask: 'idle',
      taskFatigue: {
        idle: 0,
        code: 0,
        test: 0,
        debug: 0,
        refactor: 0,
        autotest: 0
      },
      purchasedUpgrades: [],
      tutorialStep: 0, // 0: Start popup, 1: Code course, 2: Test course, 3: Debug course, 4: Refactor course, 5: Autotest course, 6: Completed
      codeValue: 0,
      contractIndex: 0
    };
    
    // Ensure purchasedUpgrades is stored as an array in state for serialization compatibility,
    // but we can check it via array methods.
    if (!this.state.purchasedUpgrades) {
      this.state.purchasedUpgrades = [];
    }

    if (this.state.featurePoints === undefined) {
      this.state.featurePoints = this.state.backlog;
    }
    if (this.state.bugPoints === undefined) {
      this.state.bugPoints = 0;
    }

    this.currentContract = null;
    this.xpRate = 0;
    this.loadContract(this.state.contractIndex);
  }

  addEventListener(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  removeEventListener(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  dispatchEvent(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (err) {
        console.error("Error in event listener:", err);
      }
    });
  }

  loadContract(index) {
    this.state.contractIndex = index;
    
    let isTutorialActive = this.state.tutorialStep < 6;
    if (isTutorialActive) {
      if (index < 5) {
        this.currentContract = CONTRACTS[index];
      } else {
        this.currentContract = CONTRACTS[5]; // fallback to bakery
      }
    } else {
      let actualIndex = index + 5;
      if (actualIndex < CONTRACTS.length) {
        this.currentContract = CONTRACTS[actualIndex];
      } else {
        this.currentContract = generateProceduralContract(actualIndex - CONTRACTS.length);
      }
    }

    this.state.featurePoints = this.currentContract.backlog;
    this.state.bugPoints = 0;
    this.state.backlog = this.state.featurePoints + this.state.bugPoints;
    this.state.loc = 0;
    this.state.hiddenBugs = 0;
    this.state.revealedBugs = 0;
    this.state.minLoc = 0;
    // Set initial test coverage to the current floor
    this.state.testCoverage = this.state.testCoverageFloor;
    this.state.activeTask = 'idle';
  }

  selectTask(taskName) {
    if (this.state.activeTask === taskName) return;
    this.state.activeTask = taskName;
  }

  tick(dt) {
    const currentSum = this.state.featurePoints + this.state.bugPoints;
    if (this.state.backlog !== currentSum) {
      const diff = this.state.backlog - currentSum;
      this.state.featurePoints = Math.max(0, this.state.featurePoints + diff);
    }

    const prevRank = this.getRank();
    const prevShippable = this.isShipReady();
    const prevTotalBugs = Math.floor(this.state.hiddenBugs + this.state.revealedBugs);
    const prevRevealedBugs = Math.floor(this.state.revealedBugs);
    const prevBacklog = Math.floor(this.state.backlog);
    const prevLoc = Math.floor(this.state.loc);
    const prevCoverageFloat = this.state.testCoverage;
    const prevCoverageFloorFloat = this.state.testCoverageFloor;

    // 1. Fatigue updates for all tasks
    const hasCoffee = this.state.purchasedUpgrades.includes('coffee');
    const decayRate = hasCoffee ? (FATIGUE_DECAY * 1.5) : FATIGUE_DECAY;

    for (let key in this.state.taskFatigue) {
      if (key === this.state.activeTask) {
        if (key !== 'idle') {
          this.state.taskFatigue[key] += dt;
        } else {
          this.state.taskFatigue[key] = 0;
        }
      } else {
        Math.max(0, this.state.taskFatigue[key] - decayRate * dt);
        this.state.taskFatigue[key] = Math.max(0, this.state.taskFatigue[key] - decayRate * dt);
      }
    }

    // 2. Efficiency calculations
    let activeFatigueTime = this.state.taskFatigue[this.state.activeTask];
    const hasCopilot = this.state.purchasedUpgrades.includes('copilot');
    const hasTutTyping = this.state.purchasedUpgrades.includes('touch-typing');
    let kFocusModifier = hasCopilot ? 1.5 : 1.0;
    if (hasTutTyping) kFocusModifier *= 1.5; // touch-typing: +50% focus build-up

    let focusVal = K_FOCUS * activeFatigueTime * kFocusModifier;
    let fatigueVal = K_FATIGUE * (Math.exp(LAMBDA * activeFatigueTime) - 1);
    let efficiency;
    if (this.state.tutorialStep < 6) {
      fatigueVal = 0;
      const projectNum = Math.min(5, Math.max(1, Math.floor(this.state.tutorialStep)));
      // Base efficiency scales linearly: P1 → 0.10, P5 → 1.00
      // Max efficiency = 2 × base:       P1 → 0.20, P5 → 2.00
      const baseEff = 0.10 + (projectNum - 1) * (0.90 / 4);
      const maxFocusBonus = baseEff; // cap so max = 2× base
      focusVal = Math.min(focusVal, maxFocusBonus);
      efficiency = Math.max(0.01, baseEff + focusVal);
    } else {
      efficiency = Math.max(0.1, 1 + focusVal - fatigueVal);
    }

    // 3. Process active task
    let isTaskProcessed = false;
    if (this.state.activeTask !== 'idle') {
      isTaskProcessed = this.processTaskAction(this.state.activeTask, efficiency, dt);
      if (this.state.activeTask === 'code' && this.state.backlog <= 0.05) {
        this.selectTask('idle');
      } else if (this.state.activeTask === 'test' && this.state.testCoverage >= 100.0) {
        this.selectTask('idle');
      } else if (this.state.activeTask === 'debug' && this.state.revealedBugs <= 0.05) {
        this.selectTask('idle');
      }
      
      if (this.isShipReady()) {
        this.selectTask('idle');
      }
    }

    // 4. Code value calculation
    // Value = LOC * (1 - penalty), where hidden bugs penalize 4x and revealed penalize 1.5x
    let hiddenPenalty = this.state.hiddenBugs * 4.0;
    let revealedPenalty = this.state.revealedBugs * 1.5;
    let totalPenalty = this.state.loc > 0 ? (hiddenPenalty + revealedPenalty) / this.state.loc : 0;
    let potentialValue = this.state.loc * Math.max(0.05, 1.0 - totalPenalty);

    if (this.currentContract && this.currentContract.isCourse) {
      this.state.codeValue = 0;
    } else {
      this.state.codeValue = potentialValue;
    }

    // 5. XP gain (strictly no XP when idle)
    let xpGain = 0;
    this.xpRate = 0;
    if (this.state.activeTask !== 'idle' && isTaskProcessed) {
      xpGain = potentialValue * 0.08 * dt;
      this.state.xp += xpGain;
      this.xpRate = potentialValue * 0.08;
    }

    const nextRank = this.getRank();
    if (prevRank !== nextRank) {
      this.rankUpFlag = nextRank;
      this.dispatchEvent('rankUp', { rank: nextRank });
    }

    // Dispatch events based on state transitions
    const nextShippable = this.isShipReady();
    if (nextShippable && !prevShippable) {
      this.dispatchEvent('shippable');
    }

    const currentTotalBugs = Math.floor(this.state.hiddenBugs + this.state.revealedBugs);
    if (currentTotalBugs > prevTotalBugs) {
      for (let i = 0; i < currentTotalBugs - prevTotalBugs; i++) {
        this.dispatchEvent('bugCreated');
      }
    }

    const currentRevealedBugs = Math.floor(this.state.revealedBugs);
    if (currentRevealedBugs > prevRevealedBugs) {
      for (let i = 0; i < currentRevealedBugs - prevRevealedBugs; i++) {
        this.dispatchEvent('bugRevealed');
      }
    }

    const currentBacklog = Math.floor(this.state.backlog);
    if (currentBacklog < prevBacklog) {
      for (let i = 0; i < prevBacklog - currentBacklog; i++) {
        this.dispatchEvent('storyPointCompleted');
      }
    }

    const currentLoc = Math.floor(this.state.loc);
    if (currentLoc > prevLoc) {
      this.dispatchEvent('locWritten', { loc: this.state.loc });
    }

    if (this.state.testCoverage > prevCoverageFloat) {
      this.dispatchEvent('testCoverageIncreased', { testCoverage: this.state.testCoverage });
    }

    if (this.state.testCoverageFloor > prevCoverageFloorFloat) {
      this.dispatchEvent('testCoverageFloorIncreased', { testCoverageFloor: this.state.testCoverageFloor });
    }

    this.dispatchEvent('tick', { dt });

    return {
      focusVal,
      fatigueVal,
      efficiency,
      xpGain,
      isTaskProcessed
    };
  }

  processTaskAction(task, efficiency, dt) {
    const hasKeyboard = this.state.purchasedUpgrades.includes('keyboard');
    const hasFramework = this.state.purchasedUpgrades.includes('framework');
    const hasLinter = this.state.purchasedUpgrades.includes('linter');

    // Tutorial upgrades
    const hasTutOSSIDE = this.state.purchasedUpgrades.includes('oss-ide');
    const hasTutLinux = this.state.purchasedUpgrades.includes('install-linux');
    const hasTutTyping = this.state.purchasedUpgrades.includes('touch-typing');
    const hasTutGit = this.state.purchasedUpgrades.includes('git-workflow');

    const keyboardBoost = hasKeyboard ? 1.4 : 1.0;
    const frameworkBoost = hasFramework ? 1.4 : 1.0;
    const linterReduction = hasLinter ? 0.6 : 1.0;
    const complexityFactor = hasFramework ? 0.7 : 1.0;
    // Tutorial speed bonuses
    const tutCodeBoost = hasTutOSSIDE ? 1.3 : 1.0;
    const tutDebugTestBoost = hasTutLinux ? 1.2 : 1.0;
    const tutGitAutoBoost = hasTutGit ? 1.25 : 1.0;
    const tutGitFloorCap = hasTutGit ? 95 : 90;

    // Apply touch-typing focus modifier directly to kFocusModifier effect
    // (already computed before processTaskAction, pass as param via efficiency — no re-calc here)
    if (task === 'code') {
      if (this.state.backlog <= 0) return false;

      const difficulty = this.currentContract ? (this.currentContract.difficulty || (this.currentContract.isCourse ? 1.0 : 10.0)) : 10.0;

      let speedMultiplier = this.getCodingSpeedMultiplier();
      let newLoc = BASE_CODE_SPEED * efficiency * keyboardBoost * tutCodeBoost * speedMultiplier * dt;
      // Cap write speed by backlog limit (in terms of LOC)
      newLoc = Math.min((this.state.featurePoints + this.state.bugPoints) * difficulty, newLoc);
      
      let reducedPoints = newLoc / difficulty;
      if (this.state.bugPoints > 0) {
        let bugReduction = Math.min(this.state.bugPoints, reducedPoints);
        this.state.bugPoints -= bugReduction;
        reducedPoints -= bugReduction;
      }
      if (reducedPoints > 0) {
        this.state.featurePoints = Math.max(0, this.state.featurePoints - reducedPoints);
      }
      this.state.backlog = this.state.featurePoints + this.state.bugPoints;
      
      let prevLoc = this.state.loc;
      this.state.loc += newLoc;

      // Geometric minLoc increase
      const ratio = 1.15;
      const complexity = this.currentContract ? this.currentContract.complexity : 1.0;
      let dMinLoc = newLoc * 0.55 * Math.pow(ratio, -this.state.featurePoints * complexity);
      this.state.minLoc += dMinLoc;

      if (this.state.loc > 0 && newLoc > 0) {
        let coveredLoc = prevLoc * (this.state.testCoverage / 100);
        this.state.testCoverage = (coveredLoc / this.state.loc) * 100;
        this.state.testCoverage = Math.max(this.state.testCoverageFloor, this.state.testCoverage);
      }

      // Bug creation
      let baseBugRate = 0.05;
      let complexityMultiplier = 1 + (this.state.loc / 450) * complexityFactor;
      let actualBugRate = baseBugRate * complexityMultiplier * linterReduction;
      let newBugs = newLoc * actualBugRate;

      let revealedRatio = this.state.tutorialStep < 2.8 ? 1.0 : (this.state.testCoverage / 100);
      this.state.hiddenBugs += newBugs * (1 - revealedRatio);
      this.state.revealedBugs += newBugs * revealedRatio;
      return true;
    } 
    
    else if (task === 'test') {
      // Logarithmic curve manual testing: rate is proportional to (100 - currentCoverage) / 100
      let coverageRemainingRatio = (100 - this.state.testCoverage) / 100;
      let testSpeed = BASE_TEST_SPEED * efficiency * tutDebugTestBoost * coverageRemainingRatio * dt;
      this.state.testCoverage = Math.min(100, this.state.testCoverage + testSpeed * 100);

      // Reveal bugs
      let revealRate = 0.15 * efficiency * dt;
      let bugsFound = Math.min(this.state.hiddenBugs, this.state.hiddenBugs * revealRate);
      this.state.hiddenBugs -= bugsFound;
      this.state.revealedBugs += bugsFound;
      return true;
    } 
    
    else if (task === 'debug') {
      if (this.state.revealedBugs <= 0) return false;

      let debugSpeed = BASE_DEBUG_SPEED * efficiency * tutDebugTestBoost * dt;
      let bugsFixed = Math.min(this.state.revealedBugs, debugSpeed);
      this.state.revealedBugs -= bugsFixed;

      // Debugging increases backlog (revealing structural tickets)
      let backlogAdd = (this.currentContract && this.currentContract.isCourse) ? 0.5 : 3.5;
      let addedBugPoints = bugsFixed * backlogAdd;
      this.state.bugPoints += addedBugPoints;
      this.state.backlog = this.state.featurePoints + this.state.bugPoints;
      return true;
    } 
    
    else if (task === 'refactor') {
      if (this.state.loc <= this.state.minLoc) return false;

      let refactorSpeed = BASE_REFACTOR_SPEED * efficiency * frameworkBoost * dt;
      let refactorAmt = Math.min(this.state.loc - this.state.minLoc, refactorSpeed);
      this.state.loc -= refactorAmt;

      this.state.testCoverage = Math.max(this.state.testCoverageFloor, this.state.testCoverage - refactorAmt * 0.15);
      return true;
    } 
    
    else if (task === 'autotest') {
      if (this.state.testCoverageFloor >= this.state.testCoverage || this.state.testCoverageFloor >= tutGitFloorCap) return false;

      let autoSpeed = BASE_AUTOTEST_SPEED * efficiency * tutGitAutoBoost * dt;
      this.state.testCoverageFloor = Math.min(this.state.testCoverage, Math.min(tutGitFloorCap, this.state.testCoverageFloor + autoSpeed));
      return true;
    }

    return false;
  }

  isShipReady() {
    if (!this.currentContract) return false;
    const threshold = this.currentContract.isCourse ? 0.05 : 1.0;
    if (this.currentContract.id === 'course-hello') {
      return this.state.backlog < threshold;
    }
    if (this.currentContract.id === 'course-calc') {
      return this.state.backlog < threshold && this.state.revealedBugs < 1.0;
    }
    return this.state.backlog < threshold && this.state.revealedBugs < 1.0 && this.state.testCoverage >= 99.9;
  }

  shipProject() {
    if (!this.isShipReady()) return null;

    let contract = this.currentContract;
    
    // Calculate final payouts
    let cashPayout = contract.isCourse ? 0 : this.state.codeValue + contract.cashReward;
    let xpPayout = (this.state.loc * 0.25) + contract.xpReward;

    this.state.cash += cashPayout;
    this.state.xp += xpPayout;

    const report = {
      title: contract.title,
      loc: Math.floor(this.state.loc),
      codeValue: this.state.codeValue,
      cashReward: contract.cashReward,
      cashPayout: cashPayout,
      xpPayout: xpPayout
    };

    // Load next contract
    this.loadContract(this.state.contractIndex + 1);

    return report;
  }

  buyUpgrade(upgradeId) {
    const upg = UPGRADES.find(u => u.id === upgradeId);
    if (!upg) return false;

    const isPurchased = this.state.purchasedUpgrades.includes(upgradeId);
    const hasCash = this.state.cash >= upg.costCash;
    const hasXP = this.state.xp >= upg.costXP;

    if (!isPurchased && hasCash && hasXP) {
      this.state.cash -= upg.costCash;
      this.state.xp -= upg.costXP;
      this.state.purchasedUpgrades.push(upgradeId);
      return true;
    }
    return false;
  }

  buyTutorialUpgrade(upgradeId) {
    const upg = TUTORIAL_PHASE.upgrades.find(u => u.id === upgradeId);
    if (!upg) return false;

    const isPurchased = this.state.purchasedUpgrades.includes(upgradeId);
    const hasXP = this.state.xp >= upg.costXP;
    const isUnlocked = this.state.contractIndex >= upg.unlocksAfterProject;

    if (!isPurchased && hasXP && isUnlocked) {
      this.state.xp -= upg.costXP;
      this.state.purchasedUpgrades.push(upgradeId);
      return true;
    }
    return false;
  }

  getCodingSpeedMultiplier() {
    if (this.state.tutorialStep < 6) {
      const rank = this.getRank();
      const matchedRank = TUTORIAL_PHASE.ranks.find(r => r.name === rank);
      // Apply touch-typing upgrade: +50% faster focus ramp already handled in tick(),
      // but we boost effective speed here as a separate coding speed benefit.
      const hasTutTyping = this.state.purchasedUpgrades.includes('touch-typing');
      const typingBoost = hasTutTyping ? 1.15 : 1.0;
      return (matchedRank ? matchedRank.speed : 1.0) * typingBoost;
    }
    return 1.0;
  }

  getRank() {
    const xp = this.state.xp;
    if (this.state.tutorialStep < 6) {
      // Tutorial Ranks (Student Skill)
      const matchedRank = TUTORIAL_PHASE.ranks.find(r => xp < r.maxXP) || TUTORIAL_PHASE.ranks[TUTORIAL_PHASE.ranks.length - 1];
      return matchedRank.name;
    } else {
      // Phase 1 Ranks (SWE Path)
      const matchedRank = DEVELOPER_PHASE.ranks.find(r => xp < r.maxXP) || DEVELOPER_PHASE.ranks[DEVELOPER_PHASE.ranks.length - 1];
      return matchedRank.name;
    }
  }

  skipTutorial() {
    this.state.tutorialStep = 6;
    this.state.cash = 10.0;
    this.state.xp = 0;
    this.loadContract(0); // This will load Bakery Website because tutorialStep >= 6
  }
}

  // Export modules
  if (typeof module !== 'undefined') {
    module.exports = { DevGameEngine, CONTRACTS };
  } else {
    window.DevGameEngine = DevGameEngine;
    window.CONTRACTS = CONTRACTS;
  }
})();
