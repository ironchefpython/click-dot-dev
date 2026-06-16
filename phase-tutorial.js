const TUTORIAL_PHASE = {
  contracts: [
    {
      id: 'course-hello',
      title: 'hello-world',
      folderName: '📁 hello_world',
      backlog: 4,
      difficulty: 1.0,
      complexity: 1.0,
      growthScale: 15,
      transitionOffset: 7,
      featureCompleteProb: 0.9,
      bugfixClearProb: 1.0,
      baseBugRate: 0.0,
      cashReward: 0,
      xpReward: 5,
      isCourse: true
    },
    {
      id: 'course-calc',
      title: 'calculator-app',
      folderName: '📁 calculator_app',
      backlog: 8,
      difficulty: 1.3,
      complexity: 1.1,
      growthScale: 5,
      transitionOffset: 2,
      featureCompleteProb: 0.2,
      bugfixClearProb: 0.2,
      baseBugRate: 0.05,
      cashReward: 0,
      xpReward: 10,
      isCourse: true
    },
    {
      id: 'course-todo',
      title: 'todo-list',
      folderName: '📁 todo_list',
      backlog: 18,
      difficulty: 2.0,
      complexity: 1.2,
      growthScale: 8,
      transitionOffset: 3,
      featureCompleteProb: 0.155,
      bugfixClearProb: 0.155,
      baseBugRate: 0.05,
      manualTestFactor: 1.0,
      cashReward: 0,
      xpReward: 15,
      isCourse: true
    },
    {
      id: 'course-weather',
      title: 'weather-app',
      folderName: '📁 weather_app',
      backlog: 24,
      difficulty: 2.5,
      complexity: 1.8,
      growthScale: 10,
      transitionOffset: 5,
      featureCompleteProb: 0.115,
      bugfixClearProb: 0.115,
      baseBugRate: 0.05,
      manualTestFactor: 1.0,
      cashReward: 0,
      xpReward: 20,
      isCourse: true
    },
    {
      id: 'course-ecom',
      title: 'sample-ecommerce',
      folderName: '📁 sample_ecommerce',
      backlog: 40,
      difficulty: 2.5,
      complexity: 1.2,
      growthScale: 15,
      transitionOffset: 7,
      featureCompleteProb: 0.1,
      bugfixClearProb: 0.095,
      baseBugRate: 0.03,
      manualTestFactor: 10.0,
      cashReward: 0,
      xpReward: 25,
      isCourse: true
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
      desc: 'Ditch Windows for Ubuntu.\n+20% debug & test speed.',
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

if (typeof module !== 'undefined') {
  module.exports = TUTORIAL_PHASE;
} else {
  window.TUTORIAL_PHASE = TUTORIAL_PHASE;
}
