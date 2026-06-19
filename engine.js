(function() {
  // Load phase data (supports both Node.js environment and browser globals)
  let TUTORIAL_PHASE, DEVELOPER_PHASE, BUSINESS_PHASE, Formulas, Events;
  if (typeof require !== 'undefined') {
    TUTORIAL_PHASE = require('./phase-tutorial.js');
    DEVELOPER_PHASE = require('./phase-developer.js');
    BUSINESS_PHASE = require('./phase-business.js');
    Formulas = require('./formulas.js');
    Events = require('./events.js');
  } else {
    TUTORIAL_PHASE = window.TUTORIAL_PHASE;
    DEVELOPER_PHASE = window.DEVELOPER_PHASE;
    BUSINESS_PHASE = window.BUSINESS_PHASE;
    Formulas = window.Formulas;
    Events = window.Events;
  }

// Combine contract data and upgrades from phases
const CONTRACTS = [...TUTORIAL_PHASE.contracts, ...DEVELOPER_PHASE.contracts];
const UPGRADES = [...DEVELOPER_PHASE.upgrades, ...BUSINESS_PHASE.upgrades];
const RANKS = [...TUTORIAL_PHASE.ranks.filter(r => r.maxXP !== Infinity), ...DEVELOPER_PHASE.ranks];

// Procedural generator fallback
function generateProceduralContract(index) {
  return DEVELOPER_PHASE.generateProceduralContract(index);
}



/**
 * Pure Game Engine Class (No DOM dependencies)
 * Can be instantiated and ticked programmatically for automated testing
 */
class DevGameEngine {
  getContractConfig(key, defaultValue) {
    if (!this.currentContract) return defaultValue;
    return this.currentContract[key] !== undefined ? this.currentContract[key] : defaultValue;
  }

  isBacklogReductionPending() {
    return this.getContractConfig('requireBacklogReduction', false) && !this.state.backlogReduced;
  }

  constructor(initialState = null) {
    this.listeners = {};
    let initialStep = 0;
    if (initialState && initialState.tutorialStep !== undefined) {
      initialStep = initialState.tutorialStep;
    }

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
      complexity: 1.0,
      manualTestFactor: 1.0,
      activeTask: 'idle',
      taskFatigue: {
        idle: 0,
        code: 0,
        test: 0,
        bugfix: 0,
        refactor: 0,
        autotest: 0
      },
      taskTimeSpent: {
        idle: 0,
        code: 0,
        test: 0,
        bugfix: 0,
        refactor: 0,
        autotest: 0
      },
      purchasedUpgrades: [],
      tutorialCompleted: false,
      codeValue: 0,
      contractIndex: 0,
      bugIntroProgress: 0.0,
      revealedBugProgress: 0.0,
      bugfixClearProgress: 0.0,
      featureCompleteProgress: 0.0,
      revealProgress: 0.0,
      bugfixProgress: 0.0,
      bugfixBacklogProgress: 0.0,
      initialBacklog: 0,
      backlogReduced: false
    };

    if (this.state.tutorialCompleted === undefined) {
      this.state.tutorialCompleted = (initialStep >= 6);
    }

    let _tutorialStep = this.state.tutorialCompleted ? 6.0 : initialStep;
    Object.defineProperty(this.state, 'tutorialStep', {
      get: () => _tutorialStep,
      set: (val) => {
        _tutorialStep = val;
        this.state.tutorialCompleted = (val >= 6);
        this.dispatchEvent(Events.TUTORIAL_STEP_CHANGED, val);
      },
      configurable: true,
      enumerable: true
    });
    
    // Ensure purchasedUpgrades is stored as an array in state for serialization compatibility,
    // but we can check it via array methods.
    if (!this.state.purchasedUpgrades) {
      this.state.purchasedUpgrades = [];
    }

    if (!this.state.taskTimeSpent) {
      this.state.taskTimeSpent = { idle: 0, code: 0, test: 0, bugfix: 0, refactor: 0, autotest: 0 };
    }

    if (this.state.featurePoints === undefined) {
      this.state.featurePoints = Math.round(this.state.backlog);
    }
    if (this.state.bugPoints === undefined) {
      this.state.bugPoints = 0;
    }
    if (this.state.complexity === undefined) {
      this.state.complexity = 1.0;
    }
    if (this.state.initialBacklog === undefined) {
      this.state.initialBacklog = this.state.backlog;
    }
    if (this.state.backlogReduced === undefined) {
      this.state.backlogReduced = (this.state.backlog <= this.state.initialBacklog - 1);
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

  listenOnce(event, callback) {
    const onceWrapper = (data) => {
      this.removeEventListener(event, onceWrapper);
      callback(data);
    };
    this.addEventListener(event, onceWrapper);
  }

  dispatchEvent(event, data) {
    if (!this.listeners[event]) return;
    const targets = [...this.listeners[event]];
    targets.forEach(callback => {
      try {
        callback(data);
      } catch (err) {
        console.error("Error in event listener:", err);
      }
    });
  }

  loadContract(index) {
    this.state.contractIndex = index;
    
    if (index === null || index === undefined || index < 0) {
      this.currentContract = null;
      this.state.featurePoints = 0;
      this.state.bugPoints = 0;
      this.state.backlog = 0;
      this.state.loc = 0;
      this.state.hiddenBugs = 0;
      this.state.revealedBugs = 0;
      this.state.complexity = 1.0;
      this.state.manualTestFactor = 1.0;
      this.state.minLoc = 0;
      this.state.activeTask = 'idle';
      this.state.initialBacklog = 0;
      this.state.backlogReduced = false;
      this.state.bugIntroProgress = 0.0;
      this.state.revealedBugProgress = 0.0;
      this.state.bugfixClearProgress = 0.0;
      this.state.featureCompleteProgress = 0.0;
      this.state.revealProgress = 0.0;
      this.state.bugfixProgress = 0.0;
      this.state.bugfixBacklogProgress = 0.0;
      return;
    }
    
    if (index < CONTRACTS.length) {
      this.currentContract = CONTRACTS[index];
    } else {
      this.currentContract = generateProceduralContract(index - CONTRACTS.length);
    }

    this.state.featurePoints = Math.round(this.currentContract.backlog);
    this.state.bugPoints = 0;
    this.state.backlog = this.state.featurePoints;
    this.state.loc = 0;
    this.state.hiddenBugs = 0;
    this.state.revealedBugs = 0;
    const growthScale = this.getContractConfig('growthScale', 1443);
    const transitionOffset = this.getContractConfig('transitionOffset', 9);
    this.state.complexity = this.currentContract.complexity !== undefined ? this.currentContract.complexity : 1.0;
    this.state.manualTestFactor = this.getContractConfig('manualTestFactor', 1.0);
    this.state.minLoc = Formulas.getMinLoc(0, growthScale, transitionOffset, this.state.complexity);
    // Set initial test coverage to the current floor
    this.state.testCoverage = this.state.testCoverageFloor;
    this.state.activeTask = 'idle';
    this.state.initialBacklog = this.state.backlog;
    this.state.backlogReduced = false;

    // Reset progress accumulators for deterministic behavior
    this.state.bugIntroProgress = 0.0;
    this.state.revealedBugProgress = 0.0;
    this.state.bugfixClearProgress = 0.0;
    this.state.featureCompleteProgress = 0.0;
    this.state.revealProgress = 0.0;
    this.state.bugfixProgress = 0.0;
    this.state.bugfixBacklogProgress = 0.0;
    this.state.taskTimeSpent = { idle: 0, code: 0, test: 0, bugfix: 0, refactor: 0, autotest: 0 };
  }

  selectTask(taskName) {
    if (this.state.activeTask === taskName) return;

    if (taskName === 'test') {
      if (this.isBacklogReductionPending()) return;
      if (this.state.testCoverage >= 100.0) return;
    }
    if (taskName === 'refactor') {
      const initialComplexity = this.getContractConfig('complexity', 1.0);
      const minComplexity = Math.min(initialComplexity, 1.5);
      if (this.isBacklogReductionPending()) return;
      if (this.state.complexity <= minComplexity) return;
    }

    this.state.activeTask = taskName;
  }

  tick(dt) {
    if (this.state.backlog !== this.state.featurePoints) {
      const diff = this.state.backlog - this.state.featurePoints;
      this.state.featurePoints = Math.max(0, Math.round(this.state.featurePoints + diff));
      if (this.state.backlog <= 0.05) {
        this.state.featurePoints = 0;
      }
      this.state.backlog = this.state.featurePoints;
    }

    // Increment time spent on active task
    const activeTask = this.state.activeTask || 'idle';
    if (!this.state.taskTimeSpent) {
      this.state.taskTimeSpent = { idle: 0, code: 0, test: 0, bugfix: 0, refactor: 0, autotest: 0 };
    }
    this.state.taskTimeSpent[activeTask] = (this.state.taskTimeSpent[activeTask] || 0) + dt;

    if (this.state.initialBacklog === undefined) {
      this.state.initialBacklog = this.state.backlog;
    }
    if (this.state.backlog <= this.state.initialBacklog - 1) {
      this.state.backlogReduced = true;
    }

    const prevRank = this.getRank();
    const prevShippable = this.isShipReady();
    const prevTotalBugs = Math.floor(this.state.hiddenBugs + this.state.revealedBugs);
    const prevRevealedBugs = Math.floor(this.state.revealedBugs);
    const prevBacklog = Math.floor(this.state.backlog);
    const prevLoc = Math.floor(this.state.loc);
    const prevCoverageFloat = this.state.testCoverage;
    const prevCoverageFloorFloat = this.state.testCoverageFloor;
    const prevCompletedFeatures = this.currentContract ? Math.round(this.currentContract.backlog) - this.state.featurePoints : 0;

    // 1. Fatigue updates for all tasks
    const hasCoffee = this.state.purchasedUpgrades.includes('coffee');
    const decayRate = hasCoffee ? (Formulas.FATIGUE_DECAY * 1.5) : Formulas.FATIGUE_DECAY;

    for (let key in this.state.taskFatigue) {
      if (key === this.state.activeTask) {
        if (key !== 'idle') {
           const fatigueGain = Formulas.calculateFatigueGain(this.state.complexity, dt);
           this.state.taskFatigue[key] = Math.min(40.0, this.state.taskFatigue[key] + fatigueGain);
        } else {
           this.state.taskFatigue[key] = 0;
        }
      } else {
        const isActiveIdle = (this.state.activeTask === 'idle');
        this.state.taskFatigue[key] = Formulas.calculateFatigueDecay(this.state.taskFatigue[key], decayRate, isActiveIdle, dt);
      }
    }

    // 2. Efficiency calculations
    let activeFatigueTime = this.state.taskFatigue[this.state.activeTask];
    let displayFatigueTime = activeFatigueTime;
    if (this.state.activeTask === 'idle') {
      displayFatigueTime = Math.max(...Object.values(this.state.taskFatigue));
    }

    const hasCopilot = this.state.purchasedUpgrades.includes('copilot');
    const hasTutTyping = this.state.purchasedUpgrades.includes('touch-typing');
    let kFocusModifier = hasCopilot ? 1.5 : 1.0;
    if (hasTutTyping) kFocusModifier *= 1.5; // touch-typing: +50% focus build-up

    let focusVal = Formulas.calculateFocusVal(Formulas.K_FOCUS, activeFatigueTime, kFocusModifier);
    const baseEfficiency = this.getContractConfig('baseEfficiency', 1.0);
    const disableFatigue = this.getContractConfig('disableFatigue', false);
    let fatigueVal = disableFatigue ? 0.0 : Formulas.calculateFatigueVal(Formulas.K_FATIGUE, Formulas.LAMBDA, displayFatigueTime);
    let efficiency = Formulas.calculateEfficiency(baseEfficiency, focusVal, fatigueVal);

    // 3. Process active task
    let isTaskProcessed = false;
    const prevComplexity = this.state.complexity;
    if (this.state.activeTask !== 'idle') {
      isTaskProcessed = this.processTaskAction(this.state.activeTask, efficiency, dt);
      if (this.state.activeTask === 'code' && this.state.backlog <= 0.05) {
        this.selectTask('idle');
      } else if (this.state.activeTask === 'test' && (((this.isBacklogReductionPending())) || this.state.testCoverage >= 100.0)) {
        this.selectTask('idle');
      } else if (this.state.activeTask === 'bugfix' && this.state.revealedBugs <= 0.05) {
        this.selectTask('idle');
      } else if (this.state.activeTask === 'refactor') {
        const initialComplexity = this.getContractConfig('complexity', 1.0);
        const minComplexity = Math.min(initialComplexity, 1.5);
        if ((this.isBacklogReductionPending()) || this.state.complexity <= minComplexity) {
          this.selectTask('idle');
        }
      } else if (this.state.activeTask === 'autotest') {
        const hasTutGit = this.state.purchasedUpgrades.includes('git-workflow');
        const tutGitFloorCap = hasTutGit ? 95 : 90;
        if (this.state.testCoverageFloor >= tutGitFloorCap) {
          this.selectTask('idle');
        }
      }
      
      // Complexity threshold warnings crossing
      if (this.state.activeTask === 'code') {
        const thresholds = [3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5];
        for (const threshold of thresholds) {
          if (prevComplexity < threshold && this.state.complexity >= threshold) {
            this.selectTask('idle');
            this.dispatchEvent(Events.COMPLEXITY_THRESHOLD_REACHED, { threshold });
            break;
          }
        }
      }
      
      if (this.isShipReady()) {
        this.selectTask('idle');
      }
    }

    // 4. Code value calculation: proportional to feature points completed and reduced by total bugs
    let totalFeatures = this.currentContract ? Math.round(this.currentContract.backlog) : 0;
    let completedFeatures = totalFeatures - this.state.featurePoints;
    let totalBugs = this.state.hiddenBugs + this.state.revealedBugs;
    let potentialValue = Formulas.calculateCodeValue(completedFeatures, totalBugs);

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
      this.dispatchEvent(Events.RANK_UP, { rank: nextRank });
    }

    // Dispatch events based on state transitions
    const nextShippable = this.isShipReady();
    if (nextShippable && !prevShippable) {
      this.dispatchEvent(Events.SHIPPABLE);
    }

    const currentTotalBugs = Math.floor(this.state.hiddenBugs + this.state.revealedBugs);
    if (currentTotalBugs > prevTotalBugs) {
      for (let i = 0; i < currentTotalBugs - prevTotalBugs; i++) {
        this.dispatchEvent(Events.BUG_CREATED);
      }
    }

    const currentRevealedBugs = Math.floor(this.state.revealedBugs);
    if (currentRevealedBugs > prevRevealedBugs) {
      for (let i = 0; i < currentRevealedBugs - prevRevealedBugs; i++) {
        this.dispatchEvent(Events.BUG_REVEALED);
      }
    }

    const currentBacklog = Math.floor(this.state.backlog);
    if (currentBacklog < prevBacklog) {
      for (let i = 0; i < prevBacklog - currentBacklog; i++) {
        this.dispatchEvent(Events.STORY_POINT_COMPLETED);
      }
    }

    const currentLoc = Math.floor(this.state.loc);
    if (currentLoc > prevLoc) {
      this.dispatchEvent(Events.LOC_WRITTEN, { loc: this.state.loc });
    }

    if (this.state.testCoverage > prevCoverageFloat) {
      this.dispatchEvent(Events.TEST_COVERAGE_INCREASED, { testCoverage: this.state.testCoverage });
    }

    if (this.state.testCoverageFloor > prevCoverageFloorFloat) {
      this.dispatchEvent(Events.TEST_COVERAGE_FLOOR_INCREASED, { testCoverageFloor: this.state.testCoverageFloor });
    }

    // Recalculate minLoc and complexity at the end of the tick
    const growthScale = this.getContractConfig('growthScale', 1443);
    const transitionOffset = this.getContractConfig('transitionOffset', 9);
    
    totalFeatures = this.currentContract ? Math.round(this.currentContract.backlog) : 0;
    completedFeatures = totalFeatures - this.state.featurePoints;

    if (this.state.loc <= 0) {
      this.state.complexity = this.getContractConfig('complexity', 1.0);
    }
    
    this.state.minLoc = Formulas.getMinLoc(completedFeatures, growthScale, transitionOffset, this.state.complexity);

    this.state.backlog = this.state.featurePoints;

    this.dispatchEvent(Events.TICK, { dt });

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
    // Tutorial speed bonuses
    const tutCodeBoost = hasTutOSSIDE ? 1.3 : 1.0;
    const tutGitAutoBoost = hasTutGit ? 1.25 : 1.0;
    const tutGitFloorCap = hasTutGit ? 95 : 90;

    if (task === 'code' || task === 'bugfix') {
      if (task === 'code' && this.state.backlog <= 0) return false;
      if (task === 'bugfix' && this.state.revealedBugs <= 0) return false;

      const difficulty = this.getContractConfig('difficulty', this.getContractConfig('isCourse', false) ? 1.0 : 10.0);
      const baseBugRate = this.getContractConfig('baseBugRate', 0.05);
      const growthScale = this.getContractConfig('growthScale', 1443);
      const transitionOffset = this.getContractConfig('transitionOffset', 9);

      let speedMultiplier = this.getCodingSpeedMultiplier();
      const locBaseSpeed = task === 'bugfix' ? Formulas.BASE_BUGFIX_SPEED : Formulas.BASE_CODE_SPEED;
      let newLoc = Formulas.calculateNewLoc(locBaseSpeed, efficiency, keyboardBoost, difficulty, speedMultiplier, dt);

      let prevLoc = this.state.loc;
      this.state.loc += newLoc;

      // Coverage dilution
      if (prevLoc > 0 && newLoc > 0) {
        this.state.testCoverage = Formulas.calculateCoverageDilution(prevLoc, newLoc, this.state.testCoverage);
        this.state.testCoverageFloor = Formulas.calculateCoverageDilution(prevLoc, newLoc, this.state.testCoverageFloor);
      }

      // Calculate completed integer LOC boundaries
      let prevFloor = Math.floor(prevLoc);
      let newFloor = Math.floor(this.state.loc);
      let completedIntegers = newFloor - prevFloor;


      if (completedIntegers > 0) {
        for (let i = 0; i < completedIntegers; i++) {
          // 1. Increase complexity using formulas.js increment
          if (prevFloor === 0 && i === 0) {
            this.state.complexity = 1.5;
          } else {
            const contractComplexity = this.getContractConfig('complexity', 1.0);
            this.state.complexity += Formulas.getComplexityIncrement(contractComplexity, this.state.loc);
          }

          // 2. Bug introduction check
          let bugIntroProb = Formulas.calculateBugIntroProb(baseBugRate, this.state.complexity,  this.state.loc, linterReduction);
          
          let forceFoundProb = null;
          if (this.currentContract && this.currentContract.guaranteeFirstBug) {
            if (this.currentContract.guaranteeFirstBug === 'revealed' && this.state.revealedBugs === 0) {
              bugIntroProb = 1.0;
              forceFoundProb = 1.0;
            } else if (this.currentContract.guaranteeFirstBug === 'hidden' && this.state.hiddenBugs === 0) {
              bugIntroProb = 1.0;
              forceFoundProb = 0.0;
            }
          }

          // Accumulator for bug introduction
          this.state.bugIntroProgress = (this.state.bugIntroProgress || 0.0) + bugIntroProb;
          if (this.state.bugIntroProgress >= 1.0) {
            this.state.bugIntroProgress -= 1.0;
            
            // Bug placement (hidden vs revealed)
            let foundProb = forceFoundProb !== null
              ? forceFoundProb
              : (this.currentContract && this.currentContract.instantBugReveal ? 1.0 : (this.state.testCoverageFloor / 100));
            this.state.revealedBugProgress = (this.state.revealedBugProgress || 0.0) + foundProb;
            if (this.state.revealedBugProgress >= 1.0) {
              this.state.revealedBugProgress -= 1.0;
              this.state.revealedBugs++;
            } else {
              this.state.hiddenBugs++;
            }
          }

          // 3. Backlog clearing
          if (task === 'code') {
            if (this.state.featurePoints > 0) {
              let totalFeatures = this.currentContract ? Math.round(this.currentContract.backlog) : 0;
              let n = totalFeatures - this.state.featurePoints + 1;
              
              // Calculate minimum LOC threshold using formulas.js
              let minLocVal = Formulas.getMinLoc(n, growthScale, transitionOffset, this.state.complexity);
              let currentIntLoc = prevFloor + i + 1;

              if (Formulas.checkFeatureCompleteEligibility(currentIntLoc, minLocVal, this.state.loc, this.state.minLoc)) {
                let featureCompleteProb = Formulas.calculateFeatureCompleteProb(this.currentContract, difficulty, this.state.complexity);

                this.state.featureCompleteProgress = (this.state.featureCompleteProgress || 0.0) + featureCompleteProb;
                if (this.state.featureCompleteProgress >= 1.0) {
                  if (this.state.loc >= this.state.minLoc) {
                    this.state.featureCompleteProgress -= 1.0;
                    this.state.featurePoints = Math.max(0, this.state.featurePoints - 1);
                  }
                }
              }
            }
          }
        }
      }

      // 4. Bug squashing (specific to bugfix task)
      if (task === 'bugfix') {
        let pBugfix = Formulas.calculateBugfixProb(efficiency, this.currentContract.bugfixClearProb);
        this.state.bugfixProgress = (this.state.bugfixProgress || 0.0) + pBugfix;
        if (this.state.bugfixProgress >= 1.0) {
          this.state.bugfixProgress -= 1.0;
          this.state.revealedBugs = Math.max(0, this.state.revealedBugs - 1);
          this.state.backlog = this.state.featurePoints;
        }
      }

      let totalFeatures = this.currentContract ? Math.round(this.currentContract.backlog) : 0;
      let completedFeatures = totalFeatures - this.state.featurePoints;
      this.state.minLoc = Formulas.getMinLoc(completedFeatures, growthScale, transitionOffset, this.state.complexity);

      this.state.backlog = this.state.featurePoints;
      return true;
    } 
    
    else if (task === 'test') {
      const manualTestFactor = this.state.manualTestFactor !== undefined ? this.state.manualTestFactor : 1.0;
      let testSpeed = Formulas.calculateManualTestSpeed(Formulas.BASE_TEST_SPEED, efficiency, manualTestFactor, this.state.testCoverage, this.state.loc, this.state.hiddenBugs) * dt;
      const maxCoverage = this.state.hiddenBugs > 0 ? 99.9 : 100.0;
      this.state.testCoverage = Math.min(maxCoverage, this.state.testCoverage + testSpeed * 100);

      // Reveal bugs deterministically
      if (this.state.hiddenBugs > 0) {
        let pReveal = Formulas.calculateRevealProb(efficiency, manualTestFactor, dt);
        this.state.revealProgress = (this.state.revealProgress || 0.0) + pReveal;
        if (this.state.revealProgress >= 1.0) {
          this.state.revealProgress -= 1.0;
          this.state.hiddenBugs = Math.max(0, this.state.hiddenBugs - 1);
          this.state.revealedBugs++;
        }
      }
      return true;
    } 
    
    else if (task === 'refactor') {
      if (this.state.loc <= this.state.minLoc) return false;

      let refactorSpeed = Formulas.BASE_REFACTOR_SPEED * efficiency * frameworkBoost * dt;
      let refactorAmt = Math.min(this.state.loc - this.state.minLoc, refactorSpeed);
      
      const locOld = this.state.loc;
      this.state.loc -= refactorAmt;
      const f = this.state.loc / locOld;
      
      const initialComplexity = this.getContractConfig('complexity', 1.0);
      const minComplexity = Math.min(initialComplexity, 1.5);
      this.state.complexity = Math.max(minComplexity, this.state.complexity * f);

      this.state.testCoverage = Math.max(this.state.testCoverageFloor, this.state.testCoverage - refactorAmt * 0.15);
      return true;
    } 
    
    else if (task === 'autotest') {
      if (this.state.testCoverageFloor >= tutGitFloorCap) return false;

      let autoSpeed = Formulas.calculateAutotestSpeed(Formulas.BASE_AUTOTEST_SPEED, efficiency, tutGitAutoBoost, this.state.loc) * dt;
      this.state.testCoverageFloor = Math.min(tutGitFloorCap, this.state.testCoverageFloor + autoSpeed * 100);
      if (this.state.testCoverageFloor > this.state.testCoverage) {
        this.state.testCoverage = this.state.testCoverageFloor;
      }
      return true;
    }

    return false;
  }

  isShipReady() {
    if (!this.currentContract) return false;
    const threshold = this.getContractConfig('backlogThreshold', 1.0);
    const reqTestCoverage = this.getContractConfig('requiredTestCoverage', 0.0);
    return this.state.backlog < threshold && this.state.revealedBugs < 1.0 && this.state.testCoverage >= reqTestCoverage;
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

    this.dispatchEvent(Events.PROJECT_SHIPPED, report);

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
    const rank = this.getRank();
    const isTutorial = !this.state.tutorialCompleted;
    const ranksList = isTutorial ? TUTORIAL_PHASE.ranks : DEVELOPER_PHASE.ranks;
    const matchedRank = ranksList.find(r => r.name === rank);
    const matchedSpeed = (matchedRank && matchedRank.speed !== undefined) ? matchedRank.speed : 1.0;
    // Apply touch-typing upgrade: +50% faster focus ramp already handled in tick(),
    // but we boost effective speed here as a separate coding speed benefit.
    const hasTutTyping = this.state.purchasedUpgrades.includes('touch-typing');
    const typingBoost = hasTutTyping ? 1.15 : 1.0;
    return matchedSpeed * typingBoost;
  }

  getRank() {
    const xp = this.state.xp;
    if (!this.state.tutorialCompleted) {
      const matchedRank = TUTORIAL_PHASE.ranks.find(r => xp < r.maxXP) || TUTORIAL_PHASE.ranks[TUTORIAL_PHASE.ranks.length - 1];
      return matchedRank.name;
    } else {
      const matchedRank = DEVELOPER_PHASE.ranks.find(r => xp < r.maxXP) || DEVELOPER_PHASE.ranks[DEVELOPER_PHASE.ranks.length - 1];
      return matchedRank.name;
    }
  }

  skipTutorial() {
    this.state.purchasedUpgrades = ['oss-ide', 'install-linux', 'touch-typing', 'git-workflow'];
    this.state.tutorialCompleted = true;
    this.state.tutorialStep = 6;
    this.state.cash = 10.0;
    this.state.xp = 0;
    this.loadContract(5); // Bakery Website is index 5 in CONTRACTS
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
