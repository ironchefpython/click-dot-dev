const TUTORIAL_PHASE = {
  contracts: [
    {
      id: 'course-hello',
      title: 'hello-world',
      folderName: '📁 hello_world',
      backlog: 4,
      difficulty: 0.7,
      complexity: 1.0,
      growthScale: 15,
      transitionOffset: 7,
      bugfixClearProb: 1.0,
      baseBugRate: 0.0,
      cashReward: 0,
      xpReward: 5,
      isCourse: true,
      disableFatigue: true,
      baseEfficiency: 0.10,
      instantBugReveal: true,
      backlogThreshold: 0.05
    },
    {
      id: 'course-calc',
      title: 'calculator-app',
      folderName: '📁 calculator_app',
      backlog: 8,
      difficulty: 1.0,
      complexity: 1.0,
      growthScale: 5,
      transitionOffset: 2,
      bugfixClearProb: 0.13,
      baseBugRate: 0.13,
      cashReward: 0,
      xpReward: 10,
      isCourse: true,
      disableFatigue: true,
      baseEfficiency: 0.325,
      instantBugReveal: true,
      guaranteeFirstBug: 'revealed',
      backlogThreshold: 0.05
    },
    {
      id: 'course-todo',
      title: 'todo-list',
      folderName: '📁 todo_list',
      backlog: 12,
      difficulty: 1.3,
      complexity: 1.0,
      growthScale: 8,
      transitionOffset: 3,
      bugfixClearProb: 0.10,
      baseBugRate: 0.05,
      manualTestFactor: 1.0,
      cashReward: 0,
      xpReward: 15,
      isCourse: true,
      disableFatigue: true,
      baseEfficiency: 0.55,
      guaranteeFirstBug: 'hidden',
      requiredTestCoverage: 99.9,
      backlogThreshold: 0.05
    },
    {
      id: 'course-weather',
      title: 'weather-app',
      folderName: '📁 weather_app',
      backlog: 16,
      difficulty: 1.0,
      complexity: 1.3,
      growthScale: 12,
      transitionOffset: 5,
      bugfixClearProb: 0.1,
      baseBugRate: 0.05,
      manualTestFactor: 0.5,
      cashReward: 0,
      xpReward: 20,
      isCourse: true,
      disableFatigue: true,
      baseEfficiency: 0.775,
      requiredTestCoverage: 99.9,
      backlogThreshold: 0.05
    },
    {
      id: 'course-ecom',
      title: 'sample-ecommerce',
      folderName: '📁 sample_ecommerce',
      backlog: 20,
      difficulty: 1.9,
      complexity: 1.2,
      growthScale: 15,
      transitionOffset: 7,
      bugfixClearProb: 0.095,
      baseBugRate: 0.03,
      manualTestFactor: 10.0,
      cashReward: 0,
      xpReward: 25,
      isCourse: true,
      disableFatigue: true,
      baseEfficiency: 1.00,
      requiredTestCoverage: 99.9,
      backlogThreshold: 0.05
    }
  ],
  ranks: [
    { name: "Coding Novice", maxXP: 5, speed: 0.25 },
    { name: "Syntax Scholar", maxXP: 12, speed: 0.50 },
    { name: "Logic Student", maxXP: 25, speed: 0.75 },
    { name: "Graduate Candidate", maxXP: Infinity, speed: 1.00 }
  ],
  upgrades: [
    {
      id: 'oss-ide',
      name: '🖥️ Open-Source IDE',
      desc: 'Switch from Notepad to VS Code.\n+30% coding speed.',
      costXP: 8,
      costCash: 0,
      unlocksAfterProject: 1  // available after shipping P1 (hello-world)
    },
    {
      id: 'install-linux',
      name: '🐧 Install Linux',
      desc: 'Ditch Windows for Ubuntu.\n+20% bugfix & test speed.',
      costXP: 18,
      costCash: 0,
      unlocksAfterProject: 2  // available after shipping P2 (calculator)
    },
    {
      id: 'touch-typing',
      name: '⌨️ Touch Typing Course',
      desc: 'Stop looking at the keyboard.\n+50% focus build-up rate.',
      costXP: 38,
      costCash: 0,
      unlocksAfterProject: 3  // available after shipping P3 (todo-list)
    },
    {
      id: 'git-workflow',
      name: '🌿 Git Workflow',
      desc: 'Learn branches, commits & CI.\n+25% auto-test speed, floor cap 95%.',
      costXP: 65,
      costCash: 0,
      unlocksAfterProject: 4  // available after shipping P4 (weather-app)
    }
  ],
  startingConditions: {
    T1: {
      contractIndex: 0,
      tutorialStep: 1.0,
      xp: 0,
      cash: 0,
      purchasedUpgrades: []
    },
    T2: {
      contractIndex: 1,
      tutorialStep: 1.8,
      xp: 5,
      cash: 0,
      purchasedUpgrades: []
    },
    T3: {
      contractIndex: 2,
      tutorialStep: 2.8,
      xp: 15,
      cash: 0,
      purchasedUpgrades: ['oss-ide']
    },
    T4: {
      contractIndex: 3,
      tutorialStep: 3.8,
      xp: 30,
      cash: 0,
      purchasedUpgrades: ['oss-ide', 'install-linux']
    },
    T5: {
      contractIndex: 4,
      tutorialStep: 4.8,
      xp: 50,
      cash: 0,
      purchasedUpgrades: ['oss-ide', 'install-linux', 'touch-typing']
    }
  }
};

// Exports will be handled at the end of the file

let UIUtils, Events;
if (typeof require !== 'undefined') {
  UIUtils = require('./ui-utils.js');
  Events = require('./events.js');
} else {
  UIUtils = window.UIUtils;
  Events = window.Events;
}

const TUTORIAL_STATES = {
  INTRO: {
    step: 0,
    title: "Course Intro: Learn to Code Online",
    text: "Welcome to your software development journey! Let's start by learning the basics of writing software. First, accept your \"Hello World\" project to start writing code.",
    btnText: "Accept Hello World Project",
    showSkip: true,
    transition: { event: Events.MODAL_BUTTON, buttonId: 'action', next: 'CODE_COURSE_START' }
  },
  CODE_COURSE_START: {
    step: 1,
    onEnter(ui) {
      ui.hideModal();
      if (ui.engine.state.contractIndex !== 0) {
        ui.engine.loadContract(0);
      }
      ui.syncTutorialButtonsUI();
      ui.highlightTaskButton('code');
      if (ui.options.initializeProjectFiles) ui.options.initializeProjectFiles();
      if (ui.options.logToConsole) {
        ui.options.logToConsole("[SYSTEM] Course started: Hello World project. Click '💻 Code' to start.", "success-msg");
      }
    },
    transition: {
      event: Events.PROJECT_SHIPPED,
      condition: (ui, report) => report.title === 'hello-world',
      next: 'BUG_SQUASHING_INTRO'
    }
  },
  BUG_SQUASHING_INTRO: {
    step: 1.8,
    title: "Project Shipped: Hello World",
    text: `<p>Congratulations on shipping your <strong>Hello World</strong> project!</p>
           <p style="margin-top: 10px;">Next up, let's accept the <strong>Calculator App</strong> contract to continue your training.</p>`,
    btnText: "Accept Calculator App",
    showSkip: false,
    onEnter(ui) {
      ui.showModal();
    },
    transition: { event: Events.MODAL_BUTTON, buttonId: 'action', next: 'CALCULATOR_CODE' }
  },
  CALCULATOR_CODE: {
    step: 1.8,
    onEnter(ui) {
      ui.hideModal();
      if (ui.engine.state.contractIndex !== 1) {
        ui.engine.loadContract(1);
      }
      ui.syncTutorialButtonsUI();
      ui.highlightTaskButton('code');
      if (ui.options.initializeProjectFiles) ui.options.initializeProjectFiles();
      if (ui.options.logToConsole) {
        ui.options.logToConsole("[SYSTEM] Project 2 loaded: Calculator App. Click '💻 Code' to start writing code.", "success-msg");
      }
    },
    transition: {
      event: Events.BUG_REVEALED,
      condition: (ui) => ui.engine.state.revealedBugs >= 1,
      next: 'BUG_SQUASHING_MODAL'
    }
  },
  BUG_SQUASHING_MODAL: {
    step: 2.5,
    title: "Unit 2: Bug Squashing",
    text: `<p>A compilation bug has appeared in your code!</p>
           <p style="margin-top: 10px;">Bugs decrease the code value and block deployment. Select Bugfixing to resolve these known issues.</p>`,
    btnText: "Start Bugfixing",
    onEnter(ui) {
      ui.showModal();
      ui.clearHighlights();
    },
    transition: { event: Events.MODAL_BUTTON, buttonId: 'action', next: 'BUG_SQUASHING_ACTIVE' }
  },
  BUG_SQUASHING_ACTIVE: {
    step: 2,
    onEnter(ui) {
      ui.hideModal();
      ui.syncTutorialButtonsUI();
      ui.highlightTaskButton('bugfix');
      if (ui.options.logToConsole) {
        ui.options.logToConsole("[SYSTEM] Course Unit 2: Bugfixing. Click '🐛 Bugfix' to remove discovered bugs.", "success-msg");
      }
    },
    transition: {
      event: Events.PROJECT_SHIPPED,
      condition: (ui, report) => report.title === 'calculator-app',
      next: 'MANUAL_VERIFICATION_INTRO'
    }
  },
  MANUAL_VERIFICATION_INTRO: {
    step: 2.8,
    title: "Project Shipped: Calculator App",
    text: `<p>Congratulations on shipping your <strong>Calculator App</strong>!</p>
           <p style="margin-top: 10px;">Next up, accept the <strong>Todo List</strong> contract to learn about manual testing.</p>`,
    btnText: "Accept Todo List",
    onEnter(ui) {
      ui.showModal();
    },
    transition: { event: Events.MODAL_BUTTON, buttonId: 'action', next: 'TODO_CODE' }
  },
  TODO_CODE: {
    step: 2.8,
    onEnter(ui) {
      ui.hideModal();
      if (ui.engine.state.contractIndex !== 2) {
        ui.engine.loadContract(2);
      }
      ui.syncTutorialButtonsUI();
      ui.highlightTaskButton('code');
      if (ui.options.initializeProjectFiles) ui.options.initializeProjectFiles();
      if (ui.options.logToConsole) {
        ui.options.logToConsole("[SYSTEM] Project 3 loaded: Todo List. Click '💻 Code' to start writing code.", "success-msg");
      }
    },
    transition: {
      event: Events.BUG_CREATED,
      condition: (ui) => ui.engine.state.hiddenBugs >= 1,
      next: 'MANUAL_VERIFICATION_MODAL'
    }
  },
  MANUAL_VERIFICATION_MODAL: {
    step: 3.5,
    title: "Unit 3: Manual Verification",
    text: `<p>Bugs are now hidden in your backlog and cannot be seen directly!</p>
           <p style="margin-top: 10px;">Select Manual Testing to check for failures and expose hidden bugs.</p>`,
    btnText: "Begin Testing",
    onEnter(ui) {
      ui.showModal();
      ui.clearHighlights();
    },
    transition: { event: Events.MODAL_BUTTON, buttonId: 'action', next: 'MANUAL_VERIFICATION_ACTIVE' }
  },
  MANUAL_VERIFICATION_ACTIVE: {
    step: 3,
    onEnter(ui) {
      ui.hideModal();
      ui.syncTutorialButtonsUI();
      ui.highlightTaskButton('test');
      if (ui.options.logToConsole) {
        ui.options.logToConsole("[SYSTEM] Course Unit 3: Testing. Click '🔬 Test' to expose hidden bugs.", "success-msg");
      }
    },
    transition: {
      event: Events.PROJECT_SHIPPED,
      condition: (ui, report) => report.title === 'todo-list',
      next: 'CODE_REFACTORING_INTRO'
    }
  },
  CODE_REFACTORING_INTRO: {
    step: 3.8,
    title: "Project Shipped: Todo List",
    text: `<p>Excellent testing! The <strong>Todo List</strong> project is shipped.</p>
           <p style="margin-top: 10px;">Next up, accept the <strong>Weather App</strong> contract to learn about refactoring.</p>`,
    btnText: "Accept Weather App",
    onEnter(ui) {
      ui.showModal();
    },
    transition: { event: Events.MODAL_BUTTON, buttonId: 'action', next: 'WEATHER_CODE' }
  },
  WEATHER_CODE: {
    step: 3.8,
    onEnter(ui) {
      ui.hideModal();
      if (ui.engine.state.contractIndex !== 3) {
        ui.engine.loadContract(3);
      }
      ui.syncTutorialButtonsUI();
      ui.highlightTaskButton('code');
      if (ui.options.initializeProjectFiles) ui.options.initializeProjectFiles();
      if (ui.options.logToConsole) {
        ui.options.logToConsole("[SYSTEM] Project 4 loaded: Weather App. Click '💻 Code' to start writing code.", "success-msg");
      }
    },
    transition: {
      event: Events.LOC_WRITTEN,
      condition: (ui) => ui.engine.state.complexity >= 3.0,
      next: 'CODE_REFACTORING_MODAL'
    }
  },
  CODE_REFACTORING_MODAL: {
    step: 4.5,
    title: "Unit 4: Code Refactoring",
    text: `<p>Complexity is high. Select Refactoring to clean up lines of code.</p>`,
    btnText: "Refactor Code",
    onEnter(ui) {
      ui.showModal();
      ui.clearHighlights();
    },
    transition: { event: Events.MODAL_BUTTON, buttonId: 'action', next: 'CODE_REFACTORING_ACTIVE' }
  },
  CODE_REFACTORING_ACTIVE: {
    step: 4,
    onEnter(ui) {
      ui.hideModal();
      ui.syncTutorialButtonsUI();
      ui.highlightTaskButton('refactor');
      if (ui.options.logToConsole) {
        ui.options.logToConsole("[SYSTEM] Course Unit 4: Refactoring. Click '🔧 Refactor' to clean codebase.", "success-msg");
      }
    },
    transition: {
      event: Events.PROJECT_SHIPPED,
      condition: (ui, report) => report.title === 'weather-app',
      next: 'AUTOMATION_SUITE_INTRO'
    }
  },
  AUTOMATION_SUITE_INTRO: {
    step: 4.8,
    title: "Project Shipped: Weather App",
    text: `<p>Great refactoring! The <strong>Weather App</strong> project is shipped.</p>
           <p style="margin-top: 10px;">Now, accept the <strong>Sample Ecommerce</strong> contract to set up automated testing.</p>`,
    btnText: "Accept Sample Ecommerce",
    onEnter(ui) {
      ui.showModal();
    },
    transition: { event: Events.MODAL_BUTTON, buttonId: 'action', next: 'ECOMMERCE_CODE' }
  },
  ECOMMERCE_CODE: {
    step: 4.8,
    onEnter(ui) {
      ui.hideModal();
      if (ui.engine.state.contractIndex !== 4) {
        ui.engine.loadContract(4);
      }
      ui.syncTutorialButtonsUI();
      ui.highlightTaskButton('code');
      if (ui.options.initializeProjectFiles) ui.options.initializeProjectFiles();
      if (ui.options.logToConsole) {
        ui.options.logToConsole("[SYSTEM] Project 5 loaded: Sample Ecommerce. Click '💻 Code' to start writing code.", "success-msg");
      }
    },
    transition: {
      event: Events.TEST_COVERAGE_INCREASED,
      condition: (ui) => ui.engine.state.testCoverage >= 10,
      next: 'AUTOMATION_SUITE_MODAL'
    }
  },
  AUTOMATION_SUITE_MODAL: {
    step: 5.5,
    title: "Unit 5: Automation Suite",
    text: `<p>Let's write Automated Tests to lock in a quality safety floor.</p>`,
    btnText: "Initialize Unit Tests",
    onEnter(ui) {
      ui.showModal();
      ui.clearHighlights();
    },
    transition: { event: Events.MODAL_BUTTON, buttonId: 'action', next: 'AUTOMATION_SUITE_ACTIVE' }
  },
  AUTOMATION_SUITE_ACTIVE: {
    step: 5,
    onEnter(ui) {
      ui.hideModal();
      ui.syncTutorialButtonsUI();
      ui.highlightTaskButton('autotest');
      if (ui.options.logToConsole) {
        ui.options.logToConsole("[SYSTEM] Course Unit 5: Automated Testing. Click '🤖 Unit Tests' to setup a floor.", "success-msg");
      }
    },
    transition: {
      event: Events.GRADUATE_CHECK,
      condition: (ui) => ui.engine.state.testCoverageFloor >= 10 && ui.engine.isShipReady(),
      next: 'GRADUATE_MODAL'
    }
  },
  GRADUATE_MODAL: {
    step: 6.5,
    title: "Course Graduate! Ready for Freelance",
    text: `<p>Congratulations, you have graduated your course!</p>
           <p style="margin-top: 10px;">You got your first freelance client contract: A bakery website. Let's start the real job! (+80 backlog, $10 starter funds)</p>`,
    btnText: "Launch Workspace",
    onEnter(ui) {
      ui.showModal();
      ui.clearHighlights();
    },
    transition: { event: Events.MODAL_BUTTON, buttonId: 'action', next: 'COMPLETED' }
  },
  COMPLETED: {
    step: 6,
    onEnter(ui) {
      ui.hideModal();
      ui.unlockAllTaskButtons();
      ui.clearHighlights();
      
      ui.engine.state.tutorialCompleted = true;
      ui.engine.state.tutorialStep = 6;
      
      if (ui.previousStateName === 'GRADUATE_MODAL') {
        ui.engine.state.cash = 10.0;
        ui.engine.state.xp = 0;
        ui.engine.loadContract(5);
      }
      
      if (ui.options.updateProjectUIHeader) ui.options.updateProjectUIHeader();
      if (ui.options.initializeProjectFiles) ui.options.initializeProjectFiles();
      if (ui.options.logToConsole) {
        ui.options.logToConsole("[SYSTEM] Course finished! Contract unlocked: Bakery Website.", "success-msg");
      }
    }
  }
};

const STEP_TO_STATE = {
  0: 'INTRO',
  1: 'CODE_COURSE_START',
  1.8: 'BUG_SQUASHING_INTRO',
  2.5: 'BUG_SQUASHING_MODAL',
  2: 'BUG_SQUASHING_ACTIVE',
  2.8: 'MANUAL_VERIFICATION_INTRO',
  3.5: 'MANUAL_VERIFICATION_MODAL',
  3: 'MANUAL_VERIFICATION_ACTIVE',
  3.8: 'CODE_REFACTORING_INTRO',
  4.5: 'CODE_REFACTORING_MODAL',
  4: 'CODE_REFACTORING_ACTIVE',
  4.8: 'AUTOMATION_SUITE_INTRO',
  5.5: 'AUTOMATION_SUITE_MODAL',
  5: 'AUTOMATION_SUITE_ACTIVE',
  6.5: 'GRADUATE_MODAL',
  6: 'COMPLETED'
};

const TutorialUI = {
  engine: null,
  options: {},
  currentStateName: 'INTRO',
  previousStateName: null,
  tutorialStep: 0,
  activeListeners: [],

  init(engine, options) {
    const controller = UIUtils.createStateMachine(
      engine,
      options,
      TUTORIAL_STATES,
      STEP_TO_STATE,
      'INTRO'
    );
    Object.assign(this, controller);
    this.init();
  },

  showShippingSplash(report) {
    if (typeof document === 'undefined') return;
    
    if (this.currentStateName !== 'COMPLETED') {
      return;
    }

    const overlay = document.getElementById("tutorial-overlay");
    const text = document.getElementById("tutorial-text");
    const title = document.getElementById("tutorial-title");
    const btn = document.getElementById("tutorial-action-btn");
    const skipBtn = document.getElementById("tutorial-skip-btn");

    if (skipBtn) skipBtn.style.display = 'none';
    if (overlay) overlay.style.display = 'flex';

    if (title) title.textContent = "🎉 Project Successfully Shipped!";
    if (text) {
      text.innerHTML = `
        <p>Contract "<strong>${report.title}</strong>" has been completed and deployed!</p>
        <div style="margin: 12px 0; padding: 12px; background-color: var(--bg-sidebar); border-radius: 4px; font-family: 'Fira Code', monospace; font-size: 0.8rem; line-height: 1.6;">
          <div>Code Size Shipped: ${report.loc} LOC</div>
          <div>Code Payout Value: $${report.codeValue.toFixed(2)}</div>
          <div>Contract Reward: +$${report.cashReward.toFixed(2)}</div>
          <hr style="border-color: var(--border-color); margin: 6px 0;">
          <div style="color: var(--color-code);">Total Cash Earned: +$${report.cashPayout.toFixed(2)}</div>
          <div style="color: var(--color-autotest);">Total XP Gained: +${Math.floor(report.xpPayout)} XP</div>
        </div>
        <p>Ready for your next contract? We have a fresh backlog queue waiting for you.</p>
      `;
    }
    if (btn) {
      btn.textContent = "Accept Next Contract";
      btn.onclick = () => {
        if (overlay) overlay.style.display = 'none';
        if (this.options.updateProjectUIHeader) this.options.updateProjectUIHeader();
        if (this.options.initializeProjectFiles) this.options.initializeProjectFiles();
        if (this.options.logToConsole) {
          this.options.logToConsole(`[SYSTEM] Loaded new project: ${this.engine.currentContract.title}. Backlog: ${this.engine.currentContract.backlog} Points.`, 'success-msg');
        }
      };
    }
  },

  triggerPhase2Transition() {
    if (typeof document === 'undefined') return;
    const overlay = document.getElementById("tutorial-overlay");
    if (overlay) overlay.style.display = 'flex';
    
    const title = document.getElementById("tutorial-title");
    if (title) title.textContent = "🚀 consultancy phase ready!";
    
    const text = document.getElementById("tutorial-text");
    if (text) {
      text.innerHTML = `
        <p>You have successfully accumulated enough funds and code experience to establish: <strong>DevLoop Solutions Ltd.</strong></p>
        <p style="margin-top: 10px;">Phase 1 (Solo Coder) is complete! In Phase 2, you will step away from the keyboard and hire staff developers and project managers to scale your operations.</p>
      `;
    }
    
    const btn = document.getElementById("tutorial-action-btn");
    if (btn) {
      btn.textContent = "Transition to Phase 2 (Under Construction)";
      btn.onclick = () => {
        alert("Congratulations on completing Phase 1! The consultancy stage is currently under development. Stay tuned!");
      };
    }
  }
};

if (typeof module !== 'undefined') {
  TUTORIAL_PHASE.TutorialUI = TutorialUI;
  module.exports = TUTORIAL_PHASE;
} else {
  window.TUTORIAL_PHASE = TUTORIAL_PHASE;
  window.TutorialUI = TutorialUI;
}
