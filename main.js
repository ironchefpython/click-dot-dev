import { h, render } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { html } from 'htm/preact';

const { DevGameEngine, Events, TUTORIAL_PHASE, DEVELOPER_PHASE, BUSINESS_PHASE, Formulas, StartPhase, TutorialUI } = window;
const codeLineGen = window.createLineGenerator(window.codeGrammar);
const testLineGen = window.createLineGenerator(window.testGrammar);
const bugfixLineGen = window.createLineGenerator(window.bugfixGrammar);
const refactorLineGen = window.createLineGenerator(window.refactorGrammar);
const autotestLineGen = window.createLineGenerator(window.autotestGrammar);

const FILES_DEF = {
  'main.js': { id: 'file-main', task: 'code', icon: '📄', path: '/src/main.js', placeholder: '// Writing code... Select Code task to begin.' },
  'grammar-testing.js': { id: 'file-test', task: 'test', icon: '🔬', path: '/tests/grammar-testing.js', placeholder: '// Running tests... Select Test task to begin.' },
  'bugfix.log': { id: 'file-bugfix', task: 'bugfix', icon: '🐛', path: '/logs/bugfix.log', placeholder: '# Bugfix log. Select Bugfix task to begin.' },
  'refactor.diff': { id: 'file-refactor', task: 'refactor', icon: '🔧', path: '/diffs/refactor.diff', placeholder: '# Refactor diff. Select Refactor task to begin.' },
  'jest.config.js': { id: 'file-autotest', task: 'autotest', icon: '🤖', path: '/config/jest.config.js', placeholder: '// Unit tests configuration. Select Unit Tests task to begin.' },
  'stats.xls': { id: 'file-stats', task: 'stats', icon: '📄', path: '/game/stats.xls', placeholder: '' },
  'upgrades.db': { id: 'file-upgrades', task: 'upgrades', icon: '🗄️', path: '/game/upgrades.db', placeholder: '' }
};

let engineInstance = null;
const FILES_CONTENT = {};
Object.keys(FILES_DEF).forEach(k => {
    FILES_CONTENT[k] = { content: [], totalGenerated: 0 };
});

function highlightSyntax(text, task) {
  let escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  if (task === 'code' || task === 'autotest') {
    if (escaped.trim().startsWith("//")) return `<span class="code-comment">${escaped}</span>`;
    
    const keywords = ['const', 'let', 'var', 'function', 'return', 'require', 'class', 'new', 'await', 'async', 'import', 'from', 'if', 'else', 'for', 'while', 'try', 'catch', 'finally'];
    keywords.forEach(kw => {
      const regex = new RegExp(`\\b(${kw})\\b`, 'g');
      escaped = escaped.replace(regex, '___KW___$1___ENDKW___');
    });

    escaped = escaped.replace(/(['"])(.*?)\1/g, '<span class="code-string">$1$2$1</span>');
    escaped = escaped.replace(/___KW___(.*?)___ENDKW___/g, '<span class="code-keyword">$1</span>');

    return escaped;
  }
  if (task === 'test') {
    if (escaped.includes("PASS")) escaped = escaped.replace("PASS", '<span class="test-pass">PASS</span>');
    if (escaped.includes("✓")) escaped = escaped.replace("✓", '<span class="test-check">✓</span>');
    if (escaped.includes("[WARN]")) escaped = escaped.replace("[WARN]", '<span class="test-warn">[WARN]</span>');
    return escaped;
  }
  if (task === 'bugfix') {
    if (escaped.includes("TypeError") || escaped.includes("ReferenceError")) return `<span class="bug-error">${escaped}</span>`;
    if (escaped.includes("[FIXED]")) escaped = escaped.replace("[FIXED]", '<span class="bug-fixed">[FIXED]</span>');
    else if (escaped.includes("[BUGFIXER]")) escaped = escaped.replace("[BUGFIXER]", '<span class="bug-tool">[BUGFIXER]</span>');
    return escaped;
  }
  if (task === 'refactor') {
    if (escaped.startsWith("+")) return `<span class="diff-add">${escaped}</span>`;
    if (escaped.startsWith("-")) return `<span class="diff-del">${escaped}</span>`;
    return escaped;
  }
  return escaped;
}

function generateStatsContent(state, currentRank) {
    const lines = [];
    lines.push("========================================================================");
    lines.push("|                   SOLO CODER - CAREER RANK SHEET                     |");
    lines.push("========================================================================");
    lines.push("| STATUS | RANK NAME            | XP RANGE   | CODING SPEED MULTIPLIER |");
    lines.push("------------------------------------------------------------------------");

    const isTutorial = (state.tutorialStep < 6);
    const tutorialRanks = [
      { name: "Coding Novice", minXP: 0, maxXP: 4, speed: 0.25 },
      { name: "Syntax Scholar", minXP: 5, maxXP: 11, speed: 0.50 },
      { name: "Logic Student", minXP: 12, maxXP: 24, speed: 0.75 },
      { name: "Graduate Candidate", minXP: 25, maxXP: Infinity, speed: 1.00 }
    ];

    tutorialRanks.forEach(r => {
      const activeMarker = (isTutorial && currentRank === r.name) ? "*" : " ";
      const xpRangeStr = r.maxXP === Infinity ? "25+" : `${r.minXP} - ${r.maxXP}`;
      const speedStr = `${r.speed.toFixed(2)}x`;
      lines.push(`|   ${activeMarker}    | ${r.name.padEnd(20)} | ${xpRangeStr.padEnd(10)} | ${speedStr.padEnd(23)} |`);
    });

    lines.push("------------------------------------------------------------------------");
    
    const developerRanks = [
      { name: "Junior Developer", minXP: 0, maxXP: 99, speed: 1.00 },
      { name: "Software Engineer", minXP: 100, maxXP: 299, speed: 1.00 },
      { name: "Senior Developer", minXP: 300, maxXP: 599, speed: 1.00 },
      { name: "Lead Architect", minXP: 600, maxXP: 1199, speed: 1.00 },
      { name: "Principal Engineer", minXP: 1200, maxXP: Infinity, speed: 1.00 }
    ];

    developerRanks.forEach(r => {
      const activeMarker = (!isTutorial && currentRank === r.name) ? "*" : " ";
      const xpRangeStr = r.maxXP === Infinity ? "1200+" : `${r.minXP} - ${r.maxXP}`;
      const speedStr = `${r.speed.toFixed(2)}x`;
      lines.push(`|   ${activeMarker}    | ${r.name.padEnd(20)} | ${xpRangeStr.padEnd(10)} | ${speedStr.padEnd(23)} |`);
    });

    lines.push("========================================================================");
    lines.push(`CURRENT KNOWLEDGE: ${state.xp.toFixed(1)} XP`);
    lines.push(`CURRENT RANK: ${currentRank}`);
    
    let baseMult = 1.0;
    if (engineInstance) baseMult = engineInstance.getCodingSpeedMultiplier();
    lines.push(`CURRENT SPEED MULTIPLIER: ${baseMult.toFixed(2)}x`);
    lines.push("========================================================================");

    return lines;
}

function generateUpgradesContent(state) {
    const lines = [];
    lines.push("========================================================================");
    lines.push("|                     SOLO CODER - UPGRADE DATABASE                    |");
    lines.push("========================================================================");

    const purchased = state.purchasedUpgrades || [];

    lines.push("[TUTORIAL PHASE UPGRADES]");
    let tutCount = 0;
    TUTORIAL_PHASE.upgrades.forEach(u => {
      if (purchased.includes(u.id)) {
        lines.push(`* ${u.name} (${u.id})`);
        u.desc.split('\n').forEach(descLine => lines.push(`  ${descLine}`));
        tutCount++;
      }
    });
    if (tutCount === 0) lines.push("  - None purchased yet.");
    lines.push("");

    lines.push("[DEVELOPER PHASE UPGRADES]");
    let devCount = 0;
    DEVELOPER_PHASE.upgrades.forEach(u => {
      if (purchased.includes(u.id)) {
        lines.push(`* ${u.name} (${u.id})`);
        u.desc.split('\n').forEach(descLine => lines.push(`  ${descLine}`));
        devCount++;
      }
    });
    if (devCount === 0) lines.push("  - None purchased yet.");
    lines.push("");

    lines.push("[BUSINESS PHASE UPGRADES]");
    let busCount = 0;
    BUSINESS_PHASE.upgrades.forEach(u => {
      if (purchased.includes(u.id)) {
        lines.push(`* ${u.name} (${u.id})`);
        u.desc.split('\n').forEach(descLine => lines.push(`  ${descLine}`));
        busCount++;
      }
    });
    if (busCount === 0) lines.push("  - None purchased yet.");
    lines.push("========================================================================");

    return lines;
}

const App = () => {
    const [state, setState] = useState(() => {
        const startingConditions = {
            ...(TUTORIAL_PHASE ? TUTORIAL_PHASE.startingConditions : {}),
            ...(DEVELOPER_PHASE ? DEVELOPER_PHASE.startingConditions : {})
        };
        const hashKey = window.location.hash ? window.location.hash.substring(1) : '';
        let initialGameState = {
            xp: 0, cash: 0, loc: 0, hiddenBugs: 0, revealedBugs: 0, backlog: 0, featurePoints: 0, bugPoints: 0,
            testCoverage: 0, testCoverageFloor: 0, minLoc: 0, complexity: 1.0, manualTestFactor: 1.0, activeTask: 'idle',
            taskFatigue: { idle: 0, code: 0, test: 0, bugfix: 0, refactor: 0, autotest: 0 },
            taskTimeSpent: { idle: 0, code: 0, test: 0, bugfix: 0, refactor: 0, autotest: 0 },
            purchasedUpgrades: [], tutorialStep: 0, codeValue: 0, contractIndex: -1,
            bugIntroProgress: 0.0, revealedBugProgress: 0.0, bugfixClearProgress: 0.0, featureCompleteProgress: 0.0,
            revealProgress: 0.0, bugfixProgress: 0.0, bugfixBacklogProgress: 0.0
        };

        if (hashKey && startingConditions[hashKey]) {
            initialGameState = { ...initialGameState, ...startingConditions[hashKey] };
        }

        const engine = new DevGameEngine(initialGameState);
        engineInstance = engine;
        window.engine = engine;

        return { ...engine.state, currentContract: engine.currentContract, rank: engine.getRank(), isShipReady: engine.isShipReady() };
    });
    const [tickData, setTickData] = useState({ focusVal: 0, fatigueVal: 0, efficiency: 1 });
    const [openTabs, setOpenTabs] = useState(['main.js']);
    const [activeTab, setActiveTab] = useState('main.js');
    const [consoleOutput, setConsoleOutput] = useState([
        { text: "Initializing workspace...", className: "system-msg" },
        { text: "Run 'npm run start' to begin.", className: "system-msg" }
    ]);
    const [modalConfig, setModalConfig] = useState(null);
    const [folderOpen, setFolderOpen] = useState(true);

    const terminalScrollTimerRef = useRef(0);
    
    useEffect(() => {
        const engine = engineInstance;
        const hashKey = window.location.hash ? window.location.hash.substring(1) : '';

        // Wrap dispatchEvent to sync state automatically on any event
        const originalDispatchEvent = engine.dispatchEvent;
        engine.dispatchEvent = function(event, data) {
            const res = originalDispatchEvent.call(this, event, data);
            syncState();
            return res;
        };

        const onShowModal = (config) => {
            console.log('onShowModal called with:', config ? config.title : 'null');
            setModalConfig(config);
        };
        const onHideModal = () => setModalConfig(null);

        engine.addEventListener(Events.SHOW_MODAL, onShowModal);
        engine.addEventListener(Events.HIDE_MODAL, onHideModal);
        engine.addEventListener(Events.TUTORIAL_STEP_CHANGED, (step) => {
            if (!TutorialUI.engine && step > 0) {
                TutorialUI.init(engine, {
                    initializeProjectFiles,
                    logToConsole: pushConsole,
                    updateProjectUIHeader: () => {}
                });
            }
        });
        engine.addEventListener(Events.COMPLEXITY_THRESHOLD_REACHED, (data) => {
             const words = { 3.0: "complicated", 3.5: "convoluted", 4.0: "tortuous", 4.5: "byzantine", 5.0: "job security", 5.5: "WTF", 6.0: "WTF?!?!!!!", 6.5: "OMGWTFBBQ" };
             const word = words[data.threshold] || "unknown";
             pushConsole(`[COMPLEXITY WARNING] Complexity has reached "${word}" (${data.threshold.toFixed(1)})! Switching task to IDLE.`, 'error-msg');
        });
        engine.addEventListener('shippable', () => {
             const times = engine.state.taskTimeSpent;
             pushConsole(`[DEBUG] Time spent on each task for ${engine.currentContract ? engine.currentContract.title : 'project'}:`, 'system-msg');
             pushConsole(`  - Idle: ${times.idle.toFixed(2)}s`, 'system-msg');
             pushConsole(`  - Code: ${times.code.toFixed(2)}s`, 'system-msg');
             pushConsole(`  - Test: ${times.test.toFixed(2)}s`, 'system-msg');
             pushConsole(`  - Bugfix: ${times.bugfix.toFixed(2)}s`, 'system-msg');
             pushConsole(`  - Refactor: ${times.refactor.toFixed(2)}s`, 'system-msg');
             pushConsole(`  - Unit Tests: ${times.autotest.toFixed(2)}s`, 'system-msg');
        });

        const initializeProjectFiles = () => {
            Object.keys(FILES_DEF).forEach(k => {
                FILES_CONTENT[k] = { content: [], totalGenerated: 0 };
            });
            setOpenTabs(['main.js']);
            setActiveTab('main.js');
        };

        const initGameStart = () => {
             const options = {
                 initializeProjectFiles,
                 logToConsole: pushConsole,
                 updateProjectUIHeader: () => {}
             };
             if (hashKey && hashKey.startsWith('D')) {
                  const contract = engine.currentContract;
                  const titleText = contract ? contract.title : 'bakery-website';
                  setModalConfig({
                      title: `Accept Contract: ${titleText}`,
                      text: `<p>Welcome back! Let's resume your software developer career.</p><p style="margin-top: 10px;">Accept the <strong>${titleText}</strong> contract to get started.</p>`,
                      btnText: `Accept ${titleText}`,
                      showSkip: false,
                      onAction: () => {
                          setModalConfig(null);
                          pushConsole(`[SYSTEM] Loaded developer contract: ${titleText}. Backlog: ${contract ? contract.backlog : 5} Points.`, 'success-msg');
                      }
                  });
             } else if (hashKey) {
                 TutorialUI.init(engine, options);
             } else {
                 StartPhase.init(engine, {
                    ...options,
                    onTutorialStart: () => TutorialUI.init(engine, options)
                 });
             }
        };

        initGameStart();

        const loop = setInterval(() => {
            const report = engine.tick(0.05);
            setTickData(report);
            setState({ ...engine.state, currentContract: engine.currentContract, rank: engine.getRank(), isShipReady: engine.isShipReady() });

            if (engine.rankUpFlag) {
                pushConsole(`[RANK UP] Congratulations! You have ranked up to: ${engine.rankUpFlag}`, 'success-msg');
                engine.rankUpFlag = null;
            }

            if (engine.state.activeTask !== 'idle' && report.isTaskProcessed) {
                terminalScrollTimerRef.current++;
                if (terminalScrollTimerRef.current >= 4) {
                    terminalScrollTimerRef.current = 0;
                    let lineGenFn = null, className = 'system-msg';
                    if (engine.state.activeTask === 'code') { lineGenFn = codeLineGen; className = 'code-line'; }
                    else if (engine.state.activeTask === 'test') { lineGenFn = testLineGen; className = 'success-msg'; }
                    else if (engine.state.activeTask === 'bugfix') { lineGenFn = bugfixLineGen; className = 'error-msg'; }
                    else if (engine.state.activeTask === 'refactor') { lineGenFn = refactorLineGen; className = 'system-msg'; }
                    else if (engine.state.activeTask === 'autotest') { lineGenFn = autotestLineGen; className = 'system-msg'; }
                    if (lineGenFn) pushConsole(lineGenFn(), className);
                }
            }

            updateFilesContent(engine.state);
        }, 50);

        return () => clearInterval(loop);
    }, []);

    const pushConsole = (text, className) => {
        setConsoleOutput(prev => {
            const updated = [...prev, { text, className }];
            return updated.slice(-8); // Max 8 lines
        });
    };

    const updateFilesContent = (s) => {
        const updateFile = (fileName, targetLines, genFn) => {
            const file = FILES_CONTENT[fileName];
            while (file.totalGenerated < targetLines) {
                file.content.push(genFn());
                file.totalGenerated++;
            }
            if (file.content.length > 15) file.content = file.content.slice(-15);
        };
        updateFile('main.js', Math.floor(s.loc), codeLineGen);
        updateFile('grammar-testing.js', Math.floor(s.testCoverage / 2), testLineGen);
        updateFile('bugfix.log', Math.floor(s.taskTimeSpent.bugfix * 2), bugfixLineGen);
        updateFile('refactor.diff', Math.floor(s.taskTimeSpent.refactor * 2), refactorLineGen);
        updateFile('jest.config.js', Math.floor(s.testCoverageFloor / 2), autotestLineGen);
        FILES_CONTENT['stats.xls'].content = generateStatsContent(s, engineInstance.getRank());
        FILES_CONTENT['upgrades.db'].content = generateUpgradesContent(s);
    };

    const syncState = () => {
        if (engineInstance) {
            setState({ ...engineInstance.state, currentContract: engineInstance.currentContract, rank: engineInstance.getRank(), isShipReady: engineInstance.isShipReady() });
        }
    };

    const selectTask = (task) => {
        if (!engineInstance) return;
        engineInstance.selectTask(task);
        const fileName = Object.keys(FILES_DEF).find(name => FILES_DEF[name].task === task);
        if (fileName) {
            if (!openTabs.includes(fileName)) setOpenTabs([...openTabs, fileName]);
            setActiveTab(fileName);
        }
        pushConsole(`>>> Switching context to: ${task.toUpperCase()}...`, 'system-msg');
        syncState();
    };

    if (!state) return html`<div>Loading...</div>`;

    // Derived states
    const projectName = state.currentContract ? state.currentContract.title : "No Active Project";
    const folderName = state.currentContract ? (state.currentContract.folderName ? state.currentContract.folderName.replace('📁 ', '📁\u00A0') : '') : "📁 No Project Loaded";

    const focusPct = Math.min(100, (tickData.focusVal / 2.0) * 100);
    const fatiguePct = Math.min(100, tickData.fatigueVal * 100);
    const effFill = Math.min(100, (Math.min(200, tickData.efficiency * 100)) / 2);

    const isCodeUnlocked = (state.tutorialStep >= 6) || (state.tutorialStep >= 1);
    const isBugfixUnlocked = (state.tutorialStep >= 6) || (state.tutorialStep >= 2);
    const isTestUnlocked = (state.tutorialStep >= 6) || (state.tutorialStep >= 3);
    const isRefactorUnlocked = (state.tutorialStep >= 6) || (state.tutorialStep >= 4);
    const isAutotestUnlocked = (state.tutorialStep >= 6) || (state.tutorialStep >= 5);

    const disableCode = !isCodeUnlocked || state.backlog <= 0.05;
    const disableBugfix = !isBugfixUnlocked || state.revealedBugs <= 0.05;
    const disableTest = !isTestUnlocked || engineInstance.isBacklogReductionPending() || state.testCoverage >= 100.0;
    const disableRefactor = !isRefactorUnlocked || engineInstance.isBacklogReductionPending() || state.complexity <= Math.min(engineInstance.getContractConfig('complexity', 1.0), 1.5);
    const disableAutotest = !isAutotestUnlocked || state.testCoverageFloor >= (state.purchasedUpgrades.includes('git-workflow') ? 95 : 90);

    const buyUpgrade = (id, isTutorial) => {
        if (isTutorial) {
            if (engineInstance.buyTutorialUpgrade(id)) pushConsole(`[UPGRADE] Installed: ${id}`, 'success-msg');
        } else {
            if (engineInstance.buyUpgrade(id)) {
                pushConsole(`[UPGRADE] Purchased: ${id}`, 'success-msg');
                if (id === 'transition') TutorialUI.triggerPhase2Transition();
            }
        }
        syncState();
    };

    console.log('App render, tutorialStep:', state.tutorialStep, 'backlog:', state.backlog, 'modalConfig:', modalConfig);
    return html`
      <header class="ide-header">
        <div class="header-left">
          <span class="app-icon">⚡</span>
          <span id="header-project-name" class="project-title">${projectName}</span>
          <span class="file-path">${FILES_DEF[activeTab] ? FILES_DEF[activeTab].path : ''}</span>
        </div>
        <div class="header-right">
          <div class="stat-pie-group">
            <div class="stat-pie-badge">
              <span class="stat-pie" style="background: conic-gradient(#10b981 0% ${focusPct}%, #1e293b ${focusPct}% 100%)"></span>
              <span class="stat-pie-label">Focus</span>
              <span class="stat-pie-val">${Math.round(focusPct)}%</span>
            </div>
            <div class="stat-pie-sep"></div>
            <div class="stat-pie-badge">
              <span class="stat-pie" style="background: conic-gradient(#ef4444 0% ${fatiguePct}%, #1e293b ${fatiguePct}% 100%)"></span>
              <span class="stat-pie-label">Fatigue</span>
              <span class="stat-pie-val">${Math.round(fatiguePct)}%</span>
            </div>
            <div class="stat-pie-sep"></div>
            <div class="stat-pie-badge">
              <span class="stat-pie" style="background: conic-gradient(#a855f7 0% ${effFill}%, #1e293b ${effFill}% 100%)"></span>
              <span class="stat-pie-label">Efficiency</span>
              <span class="stat-pie-val">${Math.round(tickData.efficiency * 100)}%</span>
            </div>
          </div>
          <div class="header-divider"></div>
          <div class="xp-badge cash-badge">
            <span class="xp-label">CASH:</span>
            <span class="xp-value cash-value">$${state.cash.toFixed(2)}</span>
          </div>
          <div class="xp-badge">
            <span class="xp-label">${state.tutorialStep < 6 ? "LEARNING:" : "KNOWLEDGE:"}</span>
            <span class="xp-value">${Math.floor(state.xp)} XP</span>
            <span class="xp-rate">(+${(state.activeTask === 'idle' ? 0.0 : engineInstance.xpRate || 0.0).toFixed(1)}/s)</span>
          </div>
          <div class="xp-badge rank-badge">
            <span class="xp-label">RANK:</span>
            <span class="xp-value rank-value">${state.rank}</span>
          </div>
        </div>
      </header>

      <div class="ide-body">
        <aside class="ide-sidebar">
          <div class="sidebar-title">EXPLORER</div>
          <div class="file-tree">
            <div class="tree-item folder ${folderOpen ? 'open' : ''}" onClick=${() => setFolderOpen(!folderOpen)}>
              <span class="chevron">${folderOpen ? '▼' : '▶'}</span> <span>${folderName}</span>
            </div>
            <div class="tree-items" style="display: ${folderOpen ? 'block' : 'none'}">
              <div class="tree-item file ${activeTab === 'main.js' ? 'active' : ''} ${disableCode ? 'locked' : ''}" onClick=${() => { if(!disableCode) { setOpenTabs([...new Set([...openTabs, 'main.js'])]); setActiveTab('main.js'); } }}>
                ${disableCode ? '🔒' : '📄'} main.js <span class="loc-indicator">${Math.floor(state.loc)} LOC</span>
              </div>
              <div class="tree-item file ${activeTab === 'grammar-testing.js' ? 'active' : ''} ${disableTest ? 'locked' : ''}" onClick=${() => { if(!disableTest) { setOpenTabs([...new Set([...openTabs, 'grammar-testing.js'])]); setActiveTab('grammar-testing.js'); } }}>
                ${disableTest ? '🔒' : '📄'} grammar-testing.js
              </div>
              <div class="tree-item file ${activeTab === 'bugfix.log' ? 'active' : ''} ${disableBugfix ? 'locked' : ''}" onClick=${() => { if(!disableBugfix) { setOpenTabs([...new Set([...openTabs, 'bugfix.log'])]); setActiveTab('bugfix.log'); } }}>
                ${disableBugfix ? '🔒' : '📄'} bugfix.log
              </div>
              <div class="tree-item file ${activeTab === 'refactor.diff' ? 'active' : ''} ${disableRefactor ? 'locked' : ''}" onClick=${() => { if(!disableRefactor) { setOpenTabs([...new Set([...openTabs, 'refactor.diff'])]); setActiveTab('refactor.diff'); } }}>
                ${disableRefactor ? '🔒' : '📄'} refactor.diff
              </div>
              <div class="tree-item file ${activeTab === 'jest.config.js' ? 'active' : ''} ${disableAutotest ? 'locked' : ''}" onClick=${() => { if(!disableAutotest) { setOpenTabs([...new Set([...openTabs, 'jest.config.js'])]); setActiveTab('jest.config.js'); } }}>
                ${disableAutotest ? '🔒' : '📄'} jest.config.js
              </div>
            </div>
            <div class="tree-item folder open"><span class="chevron">▼</span> 🎮 game</div>
            <div class="tree-items">
              <div class="tree-item file ${activeTab === 'stats.xls' ? 'active' : ''}" onClick=${() => { setOpenTabs([...new Set([...openTabs, 'stats.xls'])]); setActiveTab('stats.xls'); }}>📄 stats.xls</div>
              <div class="tree-item file ${activeTab === 'upgrades.db' ? 'active' : ''}" onClick=${() => { setOpenTabs([...new Set([...openTabs, 'upgrades.db'])]); setActiveTab('upgrades.db'); }}>🗄️ upgrades.db</div>
            </div>
          </div>
        </aside>

        <div class="ide-center-container">
          <main class="ide-editor">
            <div class="editor-tabs">
              ${openTabs.map(t => html`
                <div class="tab ${activeTab === t ? 'active' : ''}" onClick=${() => setActiveTab(t)}>
                  <span class="tab-icon">${FILES_DEF[t].icon}</span>
                  <span>${t}</span>
                  <span class="tab-close" onClick=${(e) => {
                      e.stopPropagation();
                      const newTabs = openTabs.filter(tab => tab !== t);
                      setOpenTabs(newTabs);
                      if(activeTab === t) setActiveTab(newTabs[0] || null);
                  }}>×</span>
                </div>
              `)}
            </div>
            <div class="editor-content">
              <div class="code-editor-view">
                ${activeTab && FILES_CONTENT[activeTab].content.length > 0
                  ? FILES_CONTENT[activeTab].content.map((line, idx) => {
                      let totalLines = 0;
                      if (activeTab === 'main.js') totalLines = Math.floor(state.loc);
                      else if (activeTab === 'grammar-testing.js') totalLines = Math.floor(state.testCoverage / 2);
                      else if (activeTab === 'bugfix.log') totalLines = Math.floor(state.taskTimeSpent.bugfix * 2);
                      else if (activeTab === 'refactor.diff') totalLines = Math.floor(state.taskTimeSpent.refactor * 2);
                      else if (activeTab === 'jest.config.js') totalLines = Math.floor(state.testCoverageFloor / 2);
                      else totalLines = FILES_CONTENT[activeTab].content.length;

                      const startLine = Math.max(1, totalLines - FILES_CONTENT[activeTab].content.length + 1);
                      return html`<div class="editor-line">
                        <span class="line-number">${startLine + idx}</span>
                        <span class="line-text" dangerouslySetInnerHTML=${{__html: highlightSyntax(line, FILES_DEF[activeTab].task)}}></span>
                      </div>`
                    })
                  : activeTab ? html`<div class="editor-placeholder">${FILES_DEF[activeTab].placeholder}</div>` : ''}
              </div>
            </div>
          </main>
          <section class="ide-console">
            <div class="console-header"><span>TERMINAL</span></div>
            <div class="console-content">
              <div class="code-terminal">
                ${consoleOutput.map(line => html`<div class="terminal-line ${line.className}">${line.text}</div>`)}
              </div>
            </div>
          </section>
        </div>

        <aside class="ide-dashboard">
          <div class="dash-section">
            <div class="code-value-card">
              <div class="metric-label">${state.currentContract && state.currentContract.isCourse ? "TUTORIAL PROJECT" : "CODEBASE VALUE"}</div>
              <div class="value-glowing">${state.currentContract && state.currentContract.isCourse ? `${['hello','calc','todo','weather','ecom'].indexOf(state.currentContract.id.replace('course-','')) + 1} of 5` : `$${state.codeValue.toFixed(2)}`}</div>
              <button class="ship-btn" disabled=${!state.isShipReady} onClick=${() => {
                  let report = engineInstance.shipProject();
                  if (report) TutorialUI.showShippingSplash(report);
              }}>Ship Project</button>
            </div>
          </div>
          <div class="dash-section">
            <div class="section-title">SELECT TASK</div>
            <div class="task-radio-group sidebar-task-group">
              ${['idle', 'code', 'test', 'bugfix', 'refactor', 'autotest'].map(task => {
                  let disabled = false, icon = '';
                  if (task === 'code') { disabled = disableCode; icon = '💻'; }
                  if (task === 'test') { disabled = disableTest; icon = '🔬'; }
                  if (task === 'bugfix') { disabled = disableBugfix; icon = '🐛'; }
                  if (task === 'refactor') { disabled = disableRefactor; icon = '🔧'; }
                  if (task === 'autotest') { disabled = disableAutotest; icon = '🤖'; }
                  if (task === 'idle') icon = '☕';
                  return html`
                    <label class="task-radio-btn ${disabled ? 'locked' : ''}">
                      <input type="radio" name="active-task" value=${task} checked=${state.activeTask === task} disabled=${disabled} onChange=${() => selectTask(task)} />
                      <span class="radio-label">${icon} ${task.charAt(0).toUpperCase() + task.slice(1)}</span>
                    </label>
                  `
              })}
            </div>
          </div>
          <div class="dash-section">
            <div class="section-title">CODEBASE METRICS</div>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-label">Code Size</div>
                <div class="metric-value">${Math.floor(state.loc)} LOC</div>
                <div class="metric-sub">Hidden bugs: ${state.tutorialStep < 1.8 ? '-' : Math.floor(state.hiddenBugs)}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Backlog</div>
                <div class="metric-value"><span class="feat-backlog">${Math.floor(state.featurePoints)}</span><span style="font-size: 0.8rem; color: var(--color-muted); font-weight: normal; margin-left: 2px;">Pts</span></div>
                <div id="stat-min-loc" class="metric-sub">Min LOC: ${state.currentContract ? `${state.minLoc.toFixed(1)} (${(Formulas.calculateFeatureCompleteProb(state.currentContract, state.currentContract.difficulty || (state.currentContract.isCourse ? 1.0 : 10.0), state.complexity) * 100).toFixed(1)}% chance)` : '-'}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Bugs</div>
                <div class="metric-value"><span id="stat-bugs-found" class="bug-revealed">${state.tutorialStep < 1.8 ? '-' : Math.floor(state.revealedBugs)}</span></div>
                <div class="metric-sub">Bug rate: ${state.tutorialStep < 1.8 ? '-' : `${(() => {const baseBugRate = engineInstance ? engineInstance.getContractConfig('baseBugRate', 0.05) : 0.05;
                    const compMult = state.complexity * (1 + (state.loc / 450) * (state.purchasedUpgrades.includes('framework') ? 0.7 : 1.0));
                    const linterRed = state.purchasedUpgrades.includes('linter') ? 0.6 : 1.0;
                    const bugRate = Formulas.calculateBugIntroProb(baseBugRate, compMult, state.loc, linterRed);
                    return `${(bugRate * 100).toFixed(1)}%`;})()}`}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Code Complexity</div>
                ${(() => {
                    const compVal = state.complexity;
                    let cWord = "OMGWTFBBQ", cClass = "complexity-omgwtfbbq";
                    if (compVal < 1.2) { cWord = "elegant"; cClass = "complexity-elegant"; }
                    else if (compVal < 1.4) { cWord = "simple"; cClass = "complexity-simple"; }
                    else if (compVal < 2.0) { cWord = "average"; cClass = "complexity-average"; }
                    else if (compVal < 2.5) { cWord = "verbose"; cClass = "complexity-verbose"; }
                    else if (compVal < 3.0) { cWord = "opaque"; cClass = "complexity-opaque"; }
                    else if (compVal < 3.5) { cWord = "complicated"; cClass = "complexity-complicated"; }
                    else if (compVal < 4.0) { cWord = "convoluted"; cClass = "complexity-convoluted"; }
                    else if (compVal < 4.5) { cWord = "tortuous"; cClass = "complexity-tortuous"; }
                    else if (compVal < 5.0) { cWord = "byzantine"; cClass = "complexity-byzantine"; }
                    else if (compVal < 5.5) { cWord = "job security"; cClass = "complexity-job-security"; }
                    else if (compVal < 6.0) { cWord = "WTF"; cClass = "complexity-wtf"; }
                    else if (compVal < 6.5) { cWord = "WTF?!?!!!!"; cClass = "complexity-wtf-extreme"; }
                    return html`
                        <div class="metric-value ${cClass}">${cWord}</div>
                        <div class="metric-sub">${compVal.toFixed(2)}x multiplier</div>
                    `;
                })()}
              </div>
              <div class="metric-card">
                <div class="metric-label">Tested</div>
                <div id="stat-coverage" class="metric-value">${state.tutorialStep < 2.8 ? '-' : `${state.testCoverage.toFixed(1)}%`}</div>
                <div class="progress-bar-container"><div class="progress-bar cyan" style="width: ${state.tutorialStep < 2.8 ? 0 : state.testCoverage}%"></div></div>
                <div class="metric-sub">Auto Floor: ${state.tutorialStep < 2.8 ? '-' : `${Math.floor(state.testCoverageFloor)}%`}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Code Coverage</div>
                <div class="metric-value coverage-floor-value">${state.tutorialStep < 2.8 ? '-' : `${state.testCoverageFloor.toFixed(1)}%`}</div>
                <div class="progress-bar-container"><div class="progress-bar purple" style="width: ${state.tutorialStep < 2.8 ? 0 : state.testCoverageFloor}%"></div></div>
                <div class="metric-sub">Automated floor</div>
              </div>
            </div>
          </div>
          <div class="dash-section flex-grow">
            <div class="section-title">KNOWLEDGE UPGRADES</div>
            <div id="upgrades-list" class="upgrades-list">
              ${(() => {
                  if (state.tutorialStep < 6) {
                      const available = TUTORIAL_PHASE.upgrades.filter(u => state.contractIndex >= u.unlocksAfterProject);
                      if (available.length === 0) return html`<div class="empty-upgrades">Ship your first project to unlock upgrades.</div>`;
                      return available.map(upg => {
                          const isPurchased = state.purchasedUpgrades.includes(upg.id);
                          const isAffordable = state.xp >= upg.costXP;
                          if (isPurchased) return null;
                          return html`
                            <div class="upgrade-card tutorial-upgrade-card ${!isAffordable ? 'disabled' : ''}" onClick=${() => buyUpgrade(upg.id, true)}>
                              <div class="upgrade-info"><div class="upgrade-name">${upg.name}</div><div class="upgrade-desc">${upg.desc}</div></div>
                              <button class="upgrade-cost-btn" disabled=${isPurchased}>${isPurchased ? 'Installed' : `${upg.costXP} XP`}</button>
                            </div>
                          `
                      });
                  } else {
                      const allUpgrades = [...DEVELOPER_PHASE.upgrades, ...BUSINESS_PHASE.upgrades];
                      return allUpgrades.map(upg => {
                          const isPurchased = state.purchasedUpgrades.includes(upg.id);
                          const isAffordable = state.cash >= upg.costCash && state.xp >= upg.costXP;
                          if (isPurchased) return null;
                          let costStr = '';
                          if (upg.costCash > 0) costStr += `$${upg.costCash}\n`;
                          if (upg.costXP > 0) costStr += `${upg.costXP} XP`;
                          return html`
                            <div class="upgrade-card ${!isAffordable ? 'disabled' : ''}" onClick=${() => buyUpgrade(upg.id, false)}>
                              <div class="upgrade-info"><div class="upgrade-name">${upg.name}</div><div class="upgrade-desc">${upg.desc}</div></div>
                              <button class="upgrade-cost-btn" disabled=${isPurchased}>${isPurchased ? 'Bought' : costStr}</button>
                            </div>
                          `
                      });
                  }
              })()}
            </div>
          </div>
        </aside>
      </div>

      <div id="tutorial-overlay" class="tutorial-overlay" style="display: ${modalConfig ? 'flex' : 'none'};">
        ${modalConfig ? html`
          <div class="tutorial-box">
            <h3 id="tutorial-title">${modalConfig.title}</h3>
            <div class="tutorial-body" dangerouslySetInnerHTML=${{__html: modalConfig.text}}></div>
            <div class="tutorial-actions">
              <button id="tutorial-action-btn" class="tutorial-btn" onClick=${() => {
                  if (modalConfig.onAction) modalConfig.onAction();
                  else engineInstance.dispatchEvent(Events.MODAL_BUTTON, { buttonId: 'action' });
              }}>${modalConfig.btnText}</button>
              ${modalConfig.showSkip !== false ? html`
                <button id="tutorial-skip-btn" class="tutorial-btn secondary" onClick=${() => {
                    engineInstance.dispatchEvent(Events.MODAL_BUTTON, { buttonId: 'skip' });
                }}>${modalConfig.skipText || 'Skip Tutorial'}</button>
              ` : ''}
            </div>
          </div>
        ` : ''}
      </div>
    `;
};

render(html`<${App} />`, document.getElementById('app-container'));
