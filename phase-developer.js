const DEVELOPER_PHASE = {
  contracts: [
    {
      id: 'bakery',
      title: 'bakery-website',
      folderName: '📁 bakery_website',
      backlog: 5,
      difficulty: 4.0,
      growthScale: 20,
      transitionOffset: 5,
      baseBugRate: 0.01,
      complexity: 1.2,
      cashReward: 35,
      xpReward: 50,
      isCourse: false,
      requireBacklogReduction: true,
      requiredTestCoverage: 99.9
    },
    {
      id: 'ecommerce',
      title: 'ecom-cart-integration',
      folderName: '📁 stripe_integration',
      backlog: 8,
      difficulty: 5.0,
      growthScale: 25,
      transitionOffset: 6,
      baseBugRate: 0.015,
      complexity: 1.8,
      cashReward: 100,
      xpReward: 150,
      isCourse: false,
      requireBacklogReduction: true,
      requiredTestCoverage: 99.9
    },
    {
      id: 'chat',
      title: 'realtime-chat-server',
      folderName: '📁 chat_app',
      backlog: 10,
      difficulty: 6.0,
      growthScale: 30,
      transitionOffset: 7,
      baseBugRate: 0.015,
      complexity: 2.5,
      cashReward: 280,
      xpReward: 350,
      isCourse: false,
      requireBacklogReduction: true,
      requiredTestCoverage: 99.9
    },
    {
      id: 'crm',
      title: 'multi-tenant-crm',
      folderName: '📁 crm_dashboard',
      backlog: 10,
      difficulty: 7.0,
      growthScale: 35,
      transitionOffset: 8,
      baseBugRate: 0.02,
      complexity: 3.5,
      cashReward: 800,
      xpReward: 800,
      isCourse: false,
      requireBacklogReduction: true,
      requiredTestCoverage: 99.9
    }
  ],
  ranks: [
    { name: "Junior Developer", maxXP: 100 },
    { name: "Software Engineer", maxXP: 300 },
    { name: "Senior Developer", maxXP: 600 },
    { name: "Lead Architect", maxXP: 1200 },
    { name: "Principal Engineer", maxXP: Infinity }
  ],
  upgrades: [
    {
      id: 'keyboard',
      name: 'Mechanical Keyboard',
      desc: 'Increases typing speed by 40%.\nWrite code and refactor faster.',
      costCash: 15,
      costXP: 30
    },
    {
      id: 'coffee',
      name: 'French Press Coffee',
      desc: 'Fatigue decays 50% faster on all inactive tasks.',
      costCash: 30,
      costXP: 50
    },
    {
      id: 'linter',
      name: 'ESLint Config',
      desc: 'Catches typos early.\nReduces bug rates by 40%.',
      costCash: 50,
      costXP: 100
    },
    {
      id: 'copilot',
      name: 'AI Tab Autocomplete',
      desc: 'Focus gains are 50% faster.\nSlip into the flow state quicker.',
      costCash: 120,
      costXP: 250
    },
    {
      id: 'framework',
      name: 'Modern Web Framework',
      desc: 'Reduces complexity penalty by 30% and boosts refactor speed.',
      costCash: 200,
      costXP: 400
    }
  ],
  generateProceduralContract(index) {
    const buzzwords = ["AI-Wrapper", "Web3-Wallet", "LLM-Orchestrator", "Quantum-Ledger", "Kubernetes-Config", "No-Code-SaaS"];
    const name = buzzwords[index % buzzwords.length].toLowerCase() + `-v${Math.floor(index/6) + 1}`;
    const backlog = 300 + (index * 50);
    const complexity = 3.5 + (index * 0.3);
    const cashReward = 650 + (index * 150);
    const xpReward = 700 + (index * 100);
    return {
      id: `proc-${index}`,
      title: name,
      folderName: `📁 ${name.replace(/-/g, '_')}`,
      backlog: backlog,
      complexity: complexity,
      cashReward: cashReward,
      xpReward: xpReward,
      isCourse: false
    };
  },
  startingConditions: {}
};

if (typeof module !== 'undefined') {
  module.exports = DEVELOPER_PHASE;
} else {
  window.DEVELOPER_PHASE = DEVELOPER_PHASE;
}
