(function() {
  // Import dependencies for Node.js test environments
  let DevGameEngine, CONTRACTS, TUTORIAL_PHASE, DEVELOPER_PHASE, BUSINESS_PHASE, Formulas;
  let createLineGenerator, codeGrammar, testGrammar, bugfixGrammar, refactorGrammar, autotestGrammar;

  if (typeof require !== 'undefined') {
    const engineMod = require('./engine.js');
    DevGameEngine = engineMod.DevGameEngine;
    CONTRACTS = engineMod.CONTRACTS;
    TUTORIAL_PHASE = require('./phase-tutorial.js');
    DEVELOPER_PHASE = require('./phase-developer.js');
    BUSINESS_PHASE = require('./phase-business.js');
    Formulas = require('./formulas.js');

    createLineGenerator = require('./linegen.js');
    codeGrammar = require('./code.js');
    testGrammar = require('./test.js');
    bugfixGrammar = require('./bugfix.js');
    refactorGrammar = require('./refactor.js');
    autotestGrammar = require('./autotest.js');
  } else {
    DevGameEngine = window.DevGameEngine;
    CONTRACTS = window.CONTRACTS;
    TUTORIAL_PHASE = window.TUTORIAL_PHASE;
    DEVELOPER_PHASE = window.DEVELOPER_PHASE;
    BUSINESS_PHASE = window.BUSINESS_PHASE;
    Formulas = window.Formulas;

    createLineGenerator = window.createLineGenerator;
    codeGrammar = window.codeGrammar;
    testGrammar = window.testGrammar;
    bugfixGrammar = window.bugfixGrammar;
    refactorGrammar = window.refactorGrammar;
    autotestGrammar = window.autotestGrammar;
  }

  const codeLineGen = createLineGenerator(codeGrammar);
  const testLineGen = createLineGenerator(testGrammar);
  const bugfixLineGen = createLineGenerator(bugfixGrammar);
  const refactorLineGen = createLineGenerator(refactorGrammar);
  const autotestLineGen = createLineGenerator(autotestGrammar);

// Browser Mounting & UI Interactivity Logic
if (typeof window !== 'undefined') {
  window.createSimulator = (initState) => new DevGameEngine(initState);

  const FILES = {
    'main.js': {
      id: 'file-main',
      task: 'code',
      icon: '📄',
      path: '/src/main.js',
      content: [],
      placeholder: '// Writing code... Select Code task to begin.'
    },
    'test.js': {
      id: 'file-test',
      task: 'test',
      icon: '🔬',
      path: '/tests/test.js',
      content: [],
      placeholder: '// Running tests... Select Test task to begin.'
    },
    'bugfix.log': {
      id: 'file-bugfix',
      task: 'bugfix',
      icon: '🐛',
      path: '/logs/bugfix.log',
      content: [],
      placeholder: '# Bugfix log. Select Bugfix task to begin.'
    },
    'refactor.diff': {
      id: 'file-refactor',
      task: 'refactor',
      icon: '🔧',
      path: '/diffs/refactor.diff',
      content: [],
      placeholder: '# Refactor diff. Select Refactor task to begin.'
    },
    'jest.config.js': {
      id: 'file-autotest',
      task: 'autotest',
      icon: '🤖',
      path: '/config/jest.config.js',
      content: [],
      placeholder: '// Unit tests configuration. Select Unit Tests task to begin.'
    },
    'stats.xls': {
      id: 'file-stats',
      task: 'stats',
      icon: '📄',
      path: '/game/stats.xls',
      content: [],
      placeholder: ''
    },
    'upgrades.db': {
      id: 'file-upgrades',
      task: 'upgrades',
      icon: '🗄️',
      path: '/game/upgrades.db',
      content: [],
      placeholder: ''
    }
  };

  let openTabs = ['main.js'];
  let activeTab = 'main.js';
  let maxEditorLines = 15;
  let maxConsoleLines = 8;

  const startingConditions = {
    ...(typeof TUTORIAL_PHASE !== 'undefined' ? TUTORIAL_PHASE.startingConditions : {}),
    ...(typeof DEVELOPER_PHASE !== 'undefined' ? DEVELOPER_PHASE.startingConditions : {})
  };

  let initialGameState = null;
  const hashKey = window.location.hash ? window.location.hash.substring(1) : '';
  if (hashKey && startingConditions[hashKey]) {
    const cond = startingConditions[hashKey];
    initialGameState = {
      xp: cond.xp || 0,
      cash: cond.cash || 0,
      loc: cond.loc || 0,
      hiddenBugs: cond.hiddenBugs || 0,
      revealedBugs: cond.revealedBugs || 0,
      backlog: 0,
      featurePoints: 0,
      bugPoints: 0,
      testCoverage: cond.testCoverage || 0,
      testCoverageFloor: cond.testCoverageFloor || 0,
      minLoc: 0,
      complexity: cond.complexity || 1.0,
      manualTestFactor: cond.manualTestFactor || 1.0,
      activeTask: cond.activeTask || 'idle',
      taskFatigue: {
        idle: 0, code: 0, test: 0, bugfix: 0, refactor: 0, autotest: 0
      },
      taskTimeSpent: cond.taskTimeSpent ? { ...cond.taskTimeSpent } : {
        idle: 0, code: 0, test: 0, bugfix: 0, refactor: 0, autotest: 0
      },
      purchasedUpgrades: cond.purchasedUpgrades ? [...cond.purchasedUpgrades] : [],
      tutorialStep: cond.tutorialStep !== undefined ? cond.tutorialStep : 0,
      codeValue: 0,
      contractIndex: cond.contractIndex || 0,
      bugIntroProgress: 0.0,
      revealedBugProgress: 0.0,
      bugfixClearProgress: 0.0,
      featureCompleteProgress: 0.0,
      revealProgress: 0.0,
      bugfixProgress: 0.0,
      bugfixBacklogProgress: 0.0
    };
  }

  let engine = new DevGameEngine(initialGameState);
  window.engine = engine;
  let refactorTimer = 0;
  let terminalScrollTimer = 0;
  let lastUpgradesStateKey = '';

  window.addEventListener('hashchange', () => {
    window.location.reload();
  });

  // Initialize DOM bindings on DOMContentLoaded
  document.addEventListener("DOMContentLoaded", () => {
    // Accept tutorial course button
    document.getElementById("tutorial-action-btn").addEventListener("click", () => {
      handleTutorialAction();
    });

    // Skip tutorial button
    document.getElementById("tutorial-skip-btn").addEventListener("click", () => {
      engine.skipTutorial();
      document.getElementById("tutorial-overlay").style.display = 'none';
      unlockAllTaskButtons();
      clearHighlights();
      updateProjectUIHeader();
      initializeProjectFiles();
      logToConsole("[SYSTEM] Tutorial skipped. Starting with $10 cash & Bakery Contract.", "success-msg");
    });

    // Ship Project button
    document.getElementById("ship-project-btn").addEventListener("click", () => {
      let report = engine.shipProject();
      if (report) {
        showShippingSplash(report);
      }
    });

    // Task radio inputs
    document.querySelectorAll('input[name="active-task"]').forEach((radio) => {
      radio.addEventListener("change", (e) => {
        engine.selectTask(e.target.value);
        selectTaskUI(e.target.value);
      });
    });

    // Upgrades list event delegation
    document.getElementById("upgrades-list").addEventListener("click", (e) => {
      const card = e.target.closest(".upgrade-card");
      if (!card) return;

      if (card.classList.contains("purchased") || card.classList.contains("disabled")) {
        return;
      }

      const id = card.dataset.id;
      const isTutorial = card.classList.contains("tutorial-upgrade-card");
      if (isTutorial) {
        const upg = TUTORIAL_PHASE.upgrades.find(u => u.id === id);
        if (upg && engine.buyTutorialUpgrade(id)) {
          logToConsole(`[UPGRADE] Installed: ${upg.name}`, 'success-msg');
          renderUpgradesList();
        }
      } else {
        const allUpgrades = [...DEVELOPER_PHASE.upgrades, ...BUSINESS_PHASE.upgrades];
        const upg = allUpgrades.find(u => u.id === id);
        if (upg && engine.buyUpgrade(id)) {
          logToConsole(`[UPGRADE] Purchased: ${upg.name}`, 'success-msg');
          if (id === 'transition') {
            triggerPhase2Transition();
          }
          renderUpgradesList();
        }
      }
    });

    // Start UI updates
    updateProjectUIHeader();
    syncTutorialButtonsUI();

    // File tree selection listeners
    document.querySelectorAll(".tree-item.file").forEach(fileEl => {
      fileEl.addEventListener("click", () => {
        if (fileEl.classList.contains("locked")) return;
        
        const id = fileEl.id;
        const fileName = Object.keys(FILES).find(name => FILES[name].id === id);
        if (fileName) {
          openFile(fileName);
        }
      });
    });

    // Folder expand/collapse chevron toggle
    document.querySelectorAll(".tree-item.folder").forEach(folderEl => {
      folderEl.addEventListener("click", () => {
        folderEl.classList.toggle("open");
        const chevron = folderEl.querySelector(".chevron");
        if (chevron) {
          chevron.textContent = folderEl.classList.contains("open") ? "▼" : "▶";
        }
      });
    });

    // Calculate line limits from dynamic layout dimensions
    updateDynamicLineLimits();

    // Initialize files
    initializeProjectFiles();

    // Recalculate limits and trim terminal/editor on browser resize
    window.addEventListener("resize", () => {
      updateDynamicLineLimits();
      renderEditorContent();
      const terminal = document.getElementById("console-output");
      if (terminal) {
        while (terminal.childNodes.length > maxConsoleLines) {
          terminal.removeChild(terminal.firstChild);
        }
      }
    });

    // If starting condition has UI implications, configure overlay popup
    if (hashKey && startingConditions[hashKey]) {
      const overlay = document.getElementById("tutorial-overlay");
      const text = document.getElementById("tutorial-text");
      const title = document.getElementById("tutorial-title");
      const btn = document.getElementById("tutorial-action-btn");
      const skipBtn = document.getElementById("tutorial-skip-btn");

      if (skipBtn) skipBtn.style.display = 'none';

      if (hashKey === 'T1') {
        if (overlay) overlay.style.display = 'none';
        syncTutorialButtonsUI();
        highlightTaskButton('code');
      } else if (hashKey === 'T2') {
        if (overlay) overlay.style.display = 'flex';
        if (title) title.textContent = "Project Shipped: Hello World";
        if (text) {
          text.innerHTML = `
            <p>Congratulations on shipping your <strong>Hello World</strong> project!</p>
            <p style="margin-top: 10px;">Next up, let's accept the <strong>Calculator App</strong> contract to continue your training.</p>
          `;
        }
        if (btn) {
          btn.textContent = "Accept Calculator App";
          btn.onclick = () => { handleTutorialAction(); };
        }
      } else if (hashKey === 'T3') {
        if (overlay) overlay.style.display = 'flex';
        if (title) title.textContent = "Project Shipped: Calculator App";
        if (text) {
          text.innerHTML = `
            <p>Congratulations on shipping your <strong>Calculator App</strong>!</p>
            <p style="margin-top: 10px;">Next up, accept the <strong>Todo List</strong> contract to learn about manual testing.</p>
          `;
        }
        if (btn) {
          btn.textContent = "Accept Todo List";
          btn.onclick = () => { handleTutorialAction(); };
        }
      } else if (hashKey === 'T4') {
        if (overlay) overlay.style.display = 'flex';
        if (title) title.textContent = "Project Shipped: Todo List";
        if (text) {
          text.innerHTML = `
            <p>Excellent testing! The <strong>Todo List</strong> project is shipped.</p>
            <p style="margin-top: 10px;">Next up, accept the <strong>Weather App</strong> contract to learn about refactoring.</p>
          `;
        }
        if (btn) {
          btn.textContent = "Accept Weather App";
          btn.onclick = () => { handleTutorialAction(); };
        }
      } else if (hashKey === 'T5') {
        if (overlay) overlay.style.display = 'flex';
        if (title) title.textContent = "Project Shipped: Weather App";
        if (text) {
          text.innerHTML = `
            <p>Great refactoring! The <strong>Weather App</strong> project is shipped.</p>
            <p style="margin-top: 10px;">Now, accept the <strong>Sample Ecommerce</strong> contract to set up automated testing.</p>
          `;
        }
        if (btn) {
          btn.textContent = "Accept Sample Ecommerce";
          btn.onclick = () => { handleTutorialAction(); };
        }
      }
    }

    // Setup event listeners for tutorial progression
    engine.addEventListener('bugRevealed', () => {
      const overlay = document.getElementById("tutorial-overlay");
      const text = document.getElementById("tutorial-text");
      const title = document.getElementById("tutorial-title");
      const btn = document.getElementById("tutorial-action-btn");

      if (engine.state.tutorialStep === 1.8 && engine.state.revealedBugs >= 1) {
        engine.state.tutorialStep = 2.5;
        overlay.style.display = 'flex';
        title.textContent = "Unit 2: Bug Squashing";
        text.innerHTML = `
          <p>A compilation bug has appeared in your code!</p>
          <p style="margin-top: 10px;">Bugs decrease the code value and block deployment. Select Bugfixing to resolve these known issues.</p>
        `;
        btn.textContent = "Start Bugfixing";
        clearHighlights();
      }
    });

    engine.addEventListener('bugCreated', () => {
      const overlay = document.getElementById("tutorial-overlay");
      const text = document.getElementById("tutorial-text");
      const title = document.getElementById("tutorial-title");
      const btn = document.getElementById("tutorial-action-btn");

      if (engine.state.tutorialStep === 2.8 && engine.state.hiddenBugs >= 1) {
        engine.state.tutorialStep = 3.5;
        overlay.style.display = 'flex';
        title.textContent = "Unit 3: Manual Verification";
        text.innerHTML = `
          <p>Bugs are now hidden in your backlog and cannot be seen directly!</p>
          <p style="margin-top: 10px;">Select Manual Testing to check for failures and expose hidden bugs.</p>
        `;
        btn.textContent = "Begin Testing";
        clearHighlights();
      }
    });

    engine.addEventListener('locWritten', () => {
      const overlay = document.getElementById("tutorial-overlay");
      const text = document.getElementById("tutorial-text");
      const title = document.getElementById("tutorial-title");
      const btn = document.getElementById("tutorial-action-btn");

      if (engine.state.tutorialStep === 3.8 && engine.state.complexity >= 3.0) {
        engine.state.tutorialStep = 4.5;
        overlay.style.display = 'flex';
        title.textContent = "Unit 4: Code Refactoring";
        text.innerHTML = `
          <p>Complexity is high. Select Refactoring to clean up lines of code.</p>
        `;
        btn.textContent = "Refactor Code";
        clearHighlights();
      }
    });

    engine.addEventListener('testCoverageIncreased', () => {
      const overlay = document.getElementById("tutorial-overlay");
      const text = document.getElementById("tutorial-text");
      const title = document.getElementById("tutorial-title");
      const btn = document.getElementById("tutorial-action-btn");

      if (engine.state.tutorialStep === 4.8 && engine.state.testCoverage >= 10) {
        engine.state.tutorialStep = 5.5;
        overlay.style.display = 'flex';
        title.textContent = "Unit 5: Automation Suite";
        text.innerHTML = `
          <p>Let's write Automated Tests to lock in a quality safety floor.</p>
        `;
        btn.textContent = "Initialize Unit Tests";
        clearHighlights();
      }
    });

    const checkGraduate = () => {
      const overlay = document.getElementById("tutorial-overlay");
      const text = document.getElementById("tutorial-text");
      const title = document.getElementById("tutorial-title");
      const btn = document.getElementById("tutorial-action-btn");

      if (engine.state.tutorialStep === 5 && engine.state.testCoverageFloor >= 10 && engine.isShipReady()) {
        engine.state.tutorialStep = 6.5;
        overlay.style.display = 'flex';
        title.textContent = "Course Graduate! Ready for Freelance";
        text.innerHTML = `
          <p>Congratulations, you have graduated your course!</p>
          <p style="margin-top: 10px;">You got your first freelance client contract: A bakery website. Let's start the real job! (+80 backlog, $10 starter funds)</p>
        `;
        btn.textContent = "Launch Workspace";
        clearHighlights();
      }
    };

    engine.addEventListener('shippable', checkGraduate);
    engine.addEventListener('testCoverageFloorIncreased', checkGraduate);

    engine.addEventListener('shippable', () => {
      const times = engine.state.taskTimeSpent || { idle: 0, code: 0, test: 0, bugfix: 0, refactor: 0, autotest: 0 };
      const messageLines = [
        `[DEBUG] Time spent on each task for ${engine.currentContract ? engine.currentContract.title : 'project'}:`,
        `  - Idle: ${times.idle.toFixed(2)}s`,
        `  - Code: ${times.code.toFixed(2)}s`,
        `  - Test: ${times.test.toFixed(2)}s`,
        `  - Bugfix: ${times.bugfix.toFixed(2)}s`,
        `  - Refactor: ${times.refactor.toFixed(2)}s`,
        `  - Unit Tests: ${times.autotest.toFixed(2)}s`
      ];
      console.log(messageLines.join('\n'));
      messageLines.forEach(line => {
        logToConsole(line, 'system-msg');
      });
    });

    engine.addEventListener('complexityThresholdReached', (data) => {
      const words = {
        3.0: "complicated",
        3.5: "convoluted",
        4.0: "tortuous",
        4.5: "byzantine",
        5.0: "job security",
        5.5: "WTF",
        6.0: "WTF?!?!!!!",
        6.5: "OMGWTFBBQ"
      };
      const word = words[data.threshold] || "unknown";
      logToConsole(`[COMPLEXITY WARNING] Complexity has reached "${word}" (${data.threshold.toFixed(1)})! Switching task to IDLE.`, 'error-msg');
    });

    engine.addEventListener('tick', (data) => {
      if (engine.state.tutorialStep === 4) {
        if (engine.state.activeTask === 'refactor') {
          refactorTimer += data.dt;
        }
      }
    });
    
    // Main browser loop running at 20 ticks/sec
    setInterval(() => {
      const dt = 0.05;
      
      // Tick engine
      const tickReport = engine.tick(dt);
      
      // If engine auto-switched to idle (backlog complete), sync UI
      const activeRadio = document.querySelector('input[name="active-task"]:checked');
      if (activeRadio && activeRadio.value !== engine.state.activeTask) {
        const targetRadio = document.querySelector(`input[name="active-task"][value="${engine.state.activeTask}"]`);
        if (targetRadio) targetRadio.checked = true;
        selectTaskUI(engine.state.activeTask);
      }

      if (engine.rankUpFlag) {
        logToConsole(`[RANK UP] Congratulations! You have ranked up to: ${engine.rankUpFlag}`, 'success-msg');
        engine.rankUpFlag = null;
      }
      
      // Process passive timers
      if (engine.state.activeTask !== 'idle' && tickReport.isTaskProcessed) {
        processConsoleScroll(engine.state.activeTask);
      }



      // Render all stats to DOM
      renderUI(tickReport.focusVal, tickReport.fatigueVal, tickReport.efficiency);
      updateFileContents();
      renderEditorContent();
    }, 50);
  });

  function updateProjectUIHeader() {
    document.getElementById("header-project-name").textContent = engine.currentContract.title;
    const folderName = engine.currentContract.folderName;
    document.getElementById("sidebar-folder-name").textContent = folderName ? folderName.replace('📁 ', '📁\u00A0') : '';
  }

  function resetFileContents() {
    Object.keys(FILES).forEach(fileName => {
      if (fileName !== 'coffee_break.txt') {
        FILES[fileName].content = [];
      }
    });
  }

  function measureLineHeight(container, className) {
    const dummy = document.createElement("div");
    dummy.className = className;
    dummy.style.visibility = "hidden";
    dummy.style.position = "absolute";
    dummy.innerHTML = "<span>1</span><span>Test</span>";
    container.appendChild(dummy);
    const height = dummy.offsetHeight || 20;
    container.removeChild(dummy);
    return height;
  }

  function updateDynamicLineLimits() {
    const editorView = document.getElementById("editor-code-view");
    const terminal = document.getElementById("console-output");

    if (editorView) {
      const h = editorView.clientHeight;
      if (h > 0) {
        const lineHeight = measureLineHeight(editorView, "editor-line");
        const padding = 32;
        const availableHeight = Math.max(0, h - padding);
        maxEditorLines = Math.max(1, Math.floor(availableHeight / lineHeight));
      } else {
        maxEditorLines = 15;
      }
    }

    if (terminal) {
      const h = terminal.clientHeight;
      if (h > 0) {
        const lineHeight = measureLineHeight(terminal, "terminal-line");
        const padding = 32;
        const availableHeight = Math.max(0, h - padding);
        maxConsoleLines = Math.max(1, Math.floor(availableHeight / lineHeight));
      } else {
        maxConsoleLines = 8;
      }
    }
  }

  function initializeProjectFiles() {
    resetFileContents();
    openTabs = ['main.js'];
    openFile('main.js');
  }

  function openFile(fileName) {
    const file = FILES[fileName];
    if (!file) return;

    if (!openTabs.includes(fileName)) {
      openTabs.push(fileName);
    }
    activeTab = fileName;

    renderTabs();
    renderEditorContent();

    const filePath = document.getElementById("header-file-path");
    if (filePath) {
      filePath.textContent = file.path;
    }

    document.querySelectorAll(".tree-item.file").forEach(f => f.classList.remove("active"));
    if (file.id) {
      const sidebarEl = document.getElementById(file.id);
      if (sidebarEl) {
        sidebarEl.classList.add("active");
      }
    }
  }

  function closeFileTab(fileName) {
    const index = openTabs.indexOf(fileName);
    if (index === -1) return;

    openTabs.splice(index, 1);

    if (activeTab === fileName) {
      if (openTabs.length > 0) {
        const nextActiveIndex = Math.min(index, openTabs.length - 1);
        const nextActiveTab = openTabs[nextActiveIndex];
        openFile(nextActiveTab);
      } else {
        activeTab = null;
        renderTabs();
        renderEditorContent();

        const filePath = document.getElementById("header-file-path");
        if (filePath) {
          filePath.textContent = "";
        }
        document.querySelectorAll(".tree-item.file").forEach(f => f.classList.remove("active"));
      }
    } else {
      renderTabs();
    }
  }

  function renderTabs() {
    const container = document.getElementById("editor-tabs-container");
    if (!container) return;

    container.innerHTML = "";
    openTabs.forEach(fileName => {
      const file = FILES[fileName];
      if (!file) return;

      const tabEl = document.createElement("div");
      tabEl.className = `tab ${activeTab === fileName ? 'active' : ''}`;
      tabEl.dataset.file = fileName;

      const iconSpan = document.createElement("span");
      iconSpan.className = "tab-icon";
      iconSpan.textContent = file.icon;

      const titleSpan = document.createElement("span");
      titleSpan.textContent = fileName;

      tabEl.appendChild(iconSpan);
      tabEl.appendChild(titleSpan);

      const closeSpan = document.createElement("span");
      closeSpan.className = "tab-close";
      closeSpan.textContent = "×";
      closeSpan.addEventListener("click", (e) => {
        e.stopPropagation();
        closeFileTab(fileName);
      });

      tabEl.appendChild(closeSpan);

      tabEl.addEventListener("click", () => {
        openFile(fileName);
      });

      container.appendChild(tabEl);
    });
  }

  function highlightSyntax(text, task) {
    let escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    if (task === 'code' || task === 'autotest') {
      if (escaped.trim().startsWith("//")) {
        return `<span class="code-comment">${escaped}</span>`;
      }
      escaped = escaped.replace(/(['"])(.*?)\1/g, '<span class="code-string">$1$2$1</span>');
      const keywords = [
        'const', 'let', 'var', 'function', 'return', 'require', 'class', 'new', 
        'await', 'async', 'import', 'from', 'if', 'else', 'for', 'while', 'try', 'catch', 'finally'
      ];
      keywords.forEach(kw => {
        const regex = new RegExp(`\\b(${kw})\\b`, 'g');
        escaped = escaped.replace(regex, '<span class="code-keyword">$1</span>');
      });
      return escaped;
    }

    if (task === 'test') {
      if (escaped.includes("PASS")) {
        escaped = escaped.replace("PASS", '<span class="test-pass">PASS</span>');
      }
      if (escaped.includes("✓")) {
        escaped = escaped.replace("✓", '<span class="test-check">✓</span>');
      }
      if (escaped.includes("[WARN]")) {
        escaped = escaped.replace("[WARN]", '<span class="test-warn">[WARN]</span>');
      }
      return escaped;
    }

    if (task === 'bugfix') {
      if (escaped.includes("TypeError") || escaped.includes("ReferenceError")) {
        escaped = `<span class="bug-error">${escaped}</span>`;
      } else if (escaped.includes("[FIXED]")) {
        escaped = escaped.replace("[FIXED]", '<span class="bug-fixed">[FIXED]</span>');
      } else if (escaped.includes("[BUGFIXER]")) {
        escaped = escaped.replace("[BUGFIXER]", '<span class="bug-tool">[BUGFIXER]</span>');
      }
      return escaped;
    }

    if (task === 'refactor') {
      if (escaped.startsWith("+")) {
        return `<span class="diff-add">${escaped}</span>`;
      }
      if (escaped.startsWith("-")) {
        return `<span class="diff-del">${escaped}</span>`;
      }
      return escaped;
    }

    return escaped;
  }

  function renderEditorContent() {
    const editorView = document.getElementById("editor-code-view");
    if (!editorView) return;

    const file = FILES[activeTab];
    if (!file) {
      editorView.innerHTML = '<div class="editor-placeholder">// No file open.</div>';
      return;
    }

    if (file.content.length === 0 && file.placeholder) {
      editorView.innerHTML = `<div class="editor-placeholder">${file.placeholder}</div>`;
      return;
    }

    let totalLines = 0;
    if (activeTab === 'main.js') {
      totalLines = Math.floor(engine.state.loc);
    } else if (activeTab === 'test.js') {
      totalLines = Math.floor(engine.state.testCoverage / 2);
    } else if (activeTab === 'bugfix.log') {
      totalLines = Math.floor(engine.state.taskTimeSpent.bugfix * 2);
    } else if (activeTab === 'refactor.diff') {
      totalLines = Math.floor(engine.state.taskTimeSpent.refactor * 2);
    } else if (activeTab === 'jest.config.js') {
      totalLines = Math.floor(engine.state.testCoverageFloor / 2);
    } else if (activeTab === 'stats.xls' || activeTab === 'upgrades.db') {
      totalLines = file.content.length;
    }

    const startLineNum = Math.max(1, totalLines - file.content.length + 1);

    editorView.innerHTML = "";
    file.content.forEach((lineText, idx) => {
      const lineEl = document.createElement("div");
      lineEl.className = "editor-line";

      const numSpan = document.createElement("span");
      numSpan.className = "line-number";
      numSpan.textContent = startLineNum + idx;

      const textSpan = document.createElement("span");
      textSpan.className = "line-text";
      textSpan.innerHTML = highlightSyntax(lineText, file.task);

      lineEl.appendChild(numSpan);
      lineEl.appendChild(textSpan);
      editorView.appendChild(lineEl);
    });
  }

  function generateStatsContent() {
    const lines = [];
    lines.push("========================================================================");
    lines.push("|                   SOLO CODER - CAREER RANK SHEET                     |");
    lines.push("========================================================================");
    lines.push("| STATUS | RANK NAME            | XP RANGE   | CODING SPEED MULTIPLIER |");
    lines.push("------------------------------------------------------------------------");

    const currentRank = engine.getRank();
    const isTutorial = (engine.state.tutorialStep < 6);

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
      
      const statusCol = `|   ${activeMarker}    `;
      const nameCol = `| ${r.name.padEnd(20)} `;
      const rangeCol = `| ${xpRangeStr.padEnd(10)} `;
      const multCol = `| ${speedStr.padEnd(23)} |`;
      lines.push(statusCol + nameCol + rangeCol + multCol);
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
      
      const statusCol = `|   ${activeMarker}    `;
      const nameCol = `| ${r.name.padEnd(20)} `;
      const rangeCol = `| ${xpRangeStr.padEnd(10)} `;
      const multCol = `| ${speedStr.padEnd(23)} |`;
      lines.push(statusCol + nameCol + rangeCol + multCol);
    });

    lines.push("========================================================================");
    lines.push(`CURRENT KNOWLEDGE: ${engine.state.xp.toFixed(1)} XP`);
    lines.push(`CURRENT RANK: ${currentRank}`);
    
    const baseMult = engine.getCodingSpeedMultiplier();
    lines.push(`CURRENT SPEED MULTIPLIER: ${baseMult.toFixed(2)}x`);
    lines.push("========================================================================");

    return lines;
  }

  function generateUpgradesContent() {
    const lines = [];
    lines.push("========================================================================");
    lines.push("|                     SOLO CODER - UPGRADE DATABASE                    |");
    lines.push("========================================================================");

    const purchased = engine.state.purchasedUpgrades || [];

    lines.push("[TUTORIAL PHASE UPGRADES]");
    let tutCount = 0;
    TUTORIAL_PHASE.upgrades.forEach(u => {
      if (purchased.includes(u.id)) {
        lines.push(`* ${u.name} (${u.id})`);
        u.desc.split('\n').forEach(descLine => {
          lines.push(`  ${descLine}`);
        });
        tutCount++;
      }
    });
    if (tutCount === 0) {
      lines.push("  - None purchased yet.");
    }
    lines.push("");

    lines.push("[DEVELOPER PHASE UPGRADES]");
    let devCount = 0;
    DEVELOPER_PHASE.upgrades.forEach(u => {
      if (purchased.includes(u.id)) {
        lines.push(`* ${u.name} (${u.id})`);
        u.desc.split('\n').forEach(descLine => {
          lines.push(`  ${descLine}`);
        });
        devCount++;
      }
    });
    if (devCount === 0) {
      lines.push("  - None purchased yet.");
    }
    lines.push("");

    lines.push("[BUSINESS PHASE UPGRADES]");
    let busCount = 0;
    BUSINESS_PHASE.upgrades.forEach(u => {
      if (purchased.includes(u.id)) {
        lines.push(`* ${u.name} (${u.id})`);
        u.desc.split('\n').forEach(descLine => {
          lines.push(`  ${descLine}`);
        });
        busCount++;
      }
    });
    if (busCount === 0) {
      lines.push("  - None purchased yet.");
    }
    lines.push("========================================================================");

    return lines;
  }

  function updateFileContents() {
    const targetLocLines = Math.floor(engine.state.loc);
    const mainFile = FILES['main.js'];
    while (mainFile.content.length < targetLocLines && mainFile.content.length < 500) {
      mainFile.content.push(codeLineGen());
    }
    if (mainFile.content.length > maxEditorLines) {
      mainFile.content = mainFile.content.slice(-maxEditorLines);
    }

    const targetTestLines = Math.floor(engine.state.testCoverage / 2);
    const testFile = FILES['test.js'];
    while (testFile.content.length < targetTestLines && testFile.content.length < 100) {
      testFile.content.push(testLineGen());
    }
    if (testFile.content.length > maxEditorLines) {
      testFile.content = testFile.content.slice(-maxEditorLines);
    }

    const targetBugfixLines = Math.floor(engine.state.taskTimeSpent.bugfix * 2);
    const bugfixFile = FILES['bugfix.log'];
    while (bugfixFile.content.length < targetBugfixLines && bugfixFile.content.length < 100) {
      bugfixFile.content.push(bugfixLineGen());
    }
    if (bugfixFile.content.length > maxEditorLines) {
      bugfixFile.content = bugfixFile.content.slice(-maxEditorLines);
    }

    const targetRefactorLines = Math.floor(engine.state.taskTimeSpent.refactor * 2);
    const refactorFile = FILES['refactor.diff'];
    while (refactorFile.content.length < targetRefactorLines && refactorFile.content.length < 100) {
      refactorFile.content.push(refactorLineGen());
    }
    if (refactorFile.content.length > maxEditorLines) {
      refactorFile.content = refactorFile.content.slice(-maxEditorLines);
    }

    const targetAutotestLines = Math.floor(engine.state.testCoverageFloor / 2);
    const autotestFile = FILES['jest.config.js'];
    while (autotestFile.content.length < targetAutotestLines && autotestFile.content.length < 100) {
      autotestFile.content.push(autotestLineGen());
    }
    if (autotestFile.content.length > maxEditorLines) {
      autotestFile.content = autotestFile.content.slice(-maxEditorLines);
    }

    const statsFile = FILES['stats.xls'];
    if (statsFile) {
      statsFile.content = generateStatsContent();
    }

    const upgradesFile = FILES['upgrades.db'];
    if (upgradesFile) {
      upgradesFile.content = generateUpgradesContent();
    }
  }

  function selectTaskUI(task) {
    const fileName = Object.keys(FILES).find(name => FILES[name].task === task);
    if (fileName) {
      openFile(fileName);
    }
    logToConsole(`>>> Switching context to: ${task.toUpperCase()}...`, 'system-msg');
  }

  function processConsoleScroll(task) {
    terminalScrollTimer++;
    if (terminalScrollTimer >= 4) { // log every 0.2s
      terminalScrollTimer = 0;
      let lineGenFn = null;
      let className = 'system-msg';
      
      if (task === 'code') { lineGenFn = codeLineGen; className = 'code-line'; }
      else if (task === 'test') { lineGenFn = testLineGen; className = 'success-msg'; }
      else if (task === 'bugfix') { lineGenFn = bugfixLineGen; className = 'error-msg'; }
      else if (task === 'refactor') { lineGenFn = refactorLineGen; className = 'system-msg'; }
      else if (task === 'autotest') { lineGenFn = autotestLineGen; className = 'system-msg'; }

      if (lineGenFn) {
        logToConsole(lineGenFn(), className);
      }
    }
  }

  function logToConsole(message, className) {
    const terminal = document.getElementById("console-output");
    if (!terminal) return;
    const line = document.createElement("div");
    line.className = `terminal-line ${className || ''}`;
    line.textContent = message;
    terminal.appendChild(line);

    while (terminal.childNodes.length > maxConsoleLines) {
      terminal.removeChild(terminal.firstChild);
    }
  }

  function renderUI(focusVal, fatigueVal, efficiency) {
    // Header counters
    document.getElementById("cash-counter").textContent = `$${engine.state.cash.toFixed(2)}`;
    document.getElementById("xp-counter").textContent = `${Math.floor(engine.state.xp)} XP`;
    
    const xpLabel = document.getElementById("xp-label");
    if (xpLabel) {
      if (engine.state.tutorialStep < 6) {
        xpLabel.textContent = "LEARNING:";
      } else {
        xpLabel.textContent = "KNOWLEDGE:";
      }
    }
    
    // Only display rate if active
    let rate = engine.state.activeTask === 'idle' ? 0.0 : (engine.xpRate || 0.0);
    document.getElementById("xp-rate").textContent = `(+${rate.toFixed(1)}/s)`;
    
    document.getElementById("rank-value").textContent = engine.getRank();
    
    // Metrics
    document.getElementById("sidebar-loc").textContent = `${Math.floor(engine.state.loc)} LOC`;
    document.getElementById("stat-loc").textContent = `${Math.floor(engine.state.loc)} LOC`;
    if (engine.state.tutorialStep < 1.8) {
      document.getElementById("stat-loc-sub").textContent = "Hidden bugs: -";
    } else {
      const hiddenBugsCount = Math.floor(engine.state.hiddenBugs);
      document.getElementById("stat-loc-sub").textContent = `Hidden bugs: ${hiddenBugsCount}`;
    }
    
    const featPoints = Math.floor(engine.state.featurePoints);
    document.getElementById("stat-backlog").innerHTML = `
      <span class="feat-backlog">${featPoints}</span>
      <span style="font-size: 0.8rem; color: var(--color-muted); font-weight: normal; margin-left: 2px;">Pts</span>
    `;

    let minLocDisplay = "-";
    if (engine.currentContract) {
      minLocDisplay = `${engine.state.minLoc.toFixed(1)}`;
    }
    document.getElementById("stat-min-loc").textContent = `Min LOC: ${minLocDisplay}`;

    // Bugs metrics (blank in Project 1, shown in Project 2 onwards)
    if (engine.state.tutorialStep < 1.8) {
      document.getElementById("stat-bugs-found").textContent = "-";
      document.getElementById("stat-bug-rate").textContent = "Bug rate: -";
    } else {
      document.getElementById("stat-bugs-found").textContent = Math.floor(engine.state.revealedBugs);
      let baseBugRate = engine.currentContract ? (engine.currentContract.baseBugRate !== undefined ? engine.currentContract.baseBugRate : 0.05) : 0.05;
      let complexityFactor = engine.state.purchasedUpgrades.includes('framework') ? 0.7 : 1.0;
      let complexityMultiplier = 1 + (engine.state.loc / 450) * complexityFactor;
      let linterRed = engine.state.purchasedUpgrades.includes('linter') ? 0.6 : 1.0;
      let displayBugRate = Formulas.calculateBugIntroProb(baseBugRate, engine.state.complexity * complexityMultiplier, linterRed);
      document.getElementById("stat-bug-rate").textContent = `Bug rate: ${(displayBugRate * 100).toFixed(1)}%`;
    }

    // Test coverage metrics (blank in Project 1 and 2, shown in Project 3 onwards)
    // "Tested" = manual testCoverage, "Code Coverage" = testCoverageFloor
    if (engine.state.tutorialStep < 2.8) {
      document.getElementById("stat-coverage").textContent = "-";
      document.getElementById("progress-coverage").style.width = "0%";
      document.getElementById("stat-coverage-floor").textContent = "Auto Floor: -";
      document.getElementById("stat-coverage-floor-display").textContent = "-";
      document.getElementById("progress-coverage-floor").style.width = "0%";
    } else {
      const covDisplay = engine.state.testCoverage.toFixed(1);
      document.getElementById("stat-coverage").textContent = `${covDisplay}%`;
      document.getElementById("progress-coverage").style.width = `${engine.state.testCoverage}%`;
      document.getElementById("stat-coverage-floor").textContent = `Auto Floor: ${Math.floor(engine.state.testCoverageFloor)}%`;
      const floorDisplay = engine.state.testCoverageFloor.toFixed(1);
      document.getElementById("stat-coverage-floor-display").textContent = `${floorDisplay}%`;
      document.getElementById("progress-coverage-floor").style.width = `${engine.state.testCoverageFloor}%`;
    }

    // Code Complexity UI Update
    const compEl = document.getElementById("stat-complexity");
    const compSubEl = document.getElementById("stat-complexity-sub");
    if (compEl) {
      const compVal = engine.state.complexity;
      let details;
      if (compVal < 1.2) {
        details = { word: "elegant", class: "complexity-elegant" };
      } else if (compVal < 1.4) {
        details = { word: "simple", class: "complexity-simple" };
      } else if (compVal < 2.0) {
        details = { word: "average", class: "complexity-average" };
      } else if (compVal < 2.5) {
        details = { word: "verbose", class: "complexity-verbose" };
      } else if (compVal < 3.0) {
        details = { word: "opaque", class: "complexity-opaque" };
      } else if (compVal < 3.5) {
        details = { word: "complicated", class: "complexity-complicated" };
      } else if (compVal < 4.0) {
        details = { word: "convoluted", class: "complexity-convoluted" };
      } else if (compVal < 4.5) {
        details = { word: "tortuous", class: "complexity-tortuous" };
      } else if (compVal < 5.0) {
        details = { word: "byzantine", class: "complexity-byzantine" };
      } else if (compVal < 5.5) {
        details = { word: "job security", class: "complexity-job-security" };
      } else if (compVal < 6.0) {
        details = { word: "WTF", class: "complexity-wtf" };
      } else if (compVal < 6.5) {
        details = { word: "WTF?!?!!!!", class: "complexity-wtf-extreme" };
      } else {
        details = { word: "OMGWTFBBQ", class: "complexity-omgwtfbbq" };
      }
      
      compEl.textContent = details.word;
      compEl.className = "metric-value " + details.class;
      if (compSubEl) {
        compSubEl.textContent = `${compVal.toFixed(2)}x multiplier`;
      }
    }


    if (engine.currentContract && engine.currentContract.isCourse) {
      let projectNum = 1;
      if (engine.currentContract.id === 'course-hello') projectNum = 1;
      else if (engine.currentContract.id === 'course-calc') projectNum = 2;
      else if (engine.currentContract.id === 'course-todo') projectNum = 3;
      else if (engine.currentContract.id === 'course-weather') projectNum = 4;
      else if (engine.currentContract.id === 'course-ecom') projectNum = 5;
      document.getElementById("stat-value").textContent = `${projectNum} of 5`;
      const lbl = document.getElementById("project-value-label");
      if (lbl) lbl.textContent = "TUTORIAL PROJECT";
    } else {
      document.getElementById("stat-value").textContent = `$${engine.state.codeValue.toFixed(2)}`;
      const lbl = document.getElementById("project-value-label");
      if (lbl) lbl.textContent = "CODEBASE VALUE";
    }


    // Ship button status
    const shipBtn = document.getElementById("ship-project-btn");
    shipBtn.disabled = !engine.isShipReady();

    // Code button status: disable when backlog is empty (backlog <= 0.05)
    const isCodeUnlocked = (engine.state.tutorialStep >= 6) || (engine.state.tutorialStep >= 1);
    if (isCodeUnlocked) {
      if (engine.state.backlog <= 0.05) {
        lockTaskButton('code');
      } else {
        unlockTaskButton('code');
      }
    } else {
      lockTaskButton('code');
    }

    // Bugfix button status: disable when revealed bugs is zero (revealedBugs <= 0.05)
    const isBugfixUnlocked = (engine.state.tutorialStep >= 6) || (engine.state.tutorialStep >= 2);
    if (isBugfixUnlocked) {
      if (engine.state.revealedBugs <= 0.05) {
        lockTaskButton('bugfix');
      } else {
        unlockTaskButton('bugfix');
      }
    } else {
      lockTaskButton('bugfix');
    }

    // Test button status: disable until first backlog point is reduced or testCoverage >= 100%
    const isTestUnlocked = (engine.state.tutorialStep >= 6) || (engine.state.tutorialStep >= 3);
    if (isTestUnlocked) {
      const needBacklogReduced = engine.state.tutorialStep >= 6;
      if ((needBacklogReduced && !engine.state.backlogReduced) || engine.state.testCoverage >= 100.0) {
        lockTaskButton('test');
      } else {
        unlockTaskButton('test');
      }
    } else {
      lockTaskButton('test');
    }

    // Refactor button status: disable until first backlog point is reduced or complexity reaches minComplexity
    const isRefactorUnlocked = (engine.state.tutorialStep >= 6) || (engine.state.tutorialStep >= 4);
    if (isRefactorUnlocked) {
      const needBacklogReduced = engine.state.tutorialStep >= 6;
      const initialComplexity = engine.currentContract ? (engine.currentContract.complexity || 1.0) : 1.0;
      const minComplexity = Math.min(initialComplexity, 1.5);
      if ((needBacklogReduced && !engine.state.backlogReduced) || engine.state.complexity <= minComplexity) {
        lockTaskButton('refactor');
      } else {
        unlockTaskButton('refactor');
      }
    } else {
      lockTaskButton('refactor');
    }

    // Autotest button status: disable when floor reaches cap
    const isAutotestUnlocked = (engine.state.tutorialStep >= 6) || (engine.state.tutorialStep >= 5);
    if (isAutotestUnlocked) {
      const hasTutGit = engine.state.purchasedUpgrades.includes('git-workflow');
      const tutGitFloorCap = hasTutGit ? 95 : 90;
      if (engine.state.testCoverageFloor >= tutGitFloorCap) {
        lockTaskButton('autotest');
      } else {
        unlockTaskButton('autotest');
      }
    } else {
      lockTaskButton('autotest');
    }

    // Mini pie badges in header
    let focusPct = Math.min(100, (focusVal / 2.0) * 100);
    let fatiguePct = Math.min(100, fatigueVal * 100);
    let efficiencyPct = Math.min(200, efficiency * 100); // efficiency can be >100%

    const focusCol = '#10b981';
    const fatigueCol = '#ef4444';
    const effCol = '#a855f7';
    const emptyCol = '#1e293b';

    const pieFocus = document.getElementById("pie-focus");
    const pieFatigue = document.getElementById("pie-fatigue");
    const pieEfficiency = document.getElementById("pie-efficiency");

    if (pieFocus) pieFocus.style.background =
      `conic-gradient(${focusCol} 0% ${focusPct}%, ${emptyCol} ${focusPct}% 100%)`;
    if (pieFatigue) pieFatigue.style.background =
      `conic-gradient(${fatigueCol} 0% ${fatiguePct}%, ${emptyCol} ${fatiguePct}% 100%)`;
    // Efficiency pie: fills relative to 200% max so 100% efficiency = half pie
    const effFill = Math.min(100, efficiencyPct / 2);
    if (pieEfficiency) pieEfficiency.style.background =
      `conic-gradient(${effCol} 0% ${effFill}%, ${emptyCol} ${effFill}% 100%)`;

    document.getElementById("val-focus").textContent = `${Math.round(focusPct)}%`;
    document.getElementById("val-fatigue").textContent = `${Math.round(fatiguePct)}%`;
    document.getElementById("stat-efficiency").textContent = `${Math.round(efficiency * 100)}%`;

    // Upgrades
    renderUpgradesList();
  }

  function renderUpgradesList() {
    const container = document.getElementById("upgrades-list");
    const stateKey = `${engine.state.tutorialStep}_${engine.state.contractIndex}_${engine.state.xp}_${engine.state.cash}_${engine.state.purchasedUpgrades.join(',')}`;
    if (stateKey === lastUpgradesStateKey) {
      return;
    }
    lastUpgradesStateKey = stateKey;

    // ── Tutorial phase: show tutorial-specific upgrades ──────────────────────
    if (engine.state.tutorialStep < 6) {
      const tutUpgrades = TUTORIAL_PHASE.upgrades;
      const available = tutUpgrades.filter(u => engine.state.contractIndex >= u.unlocksAfterProject);

      if (available.length === 0) {
        container.innerHTML = `<div class="empty-upgrades">Ship your first project to unlock upgrades.</div>`;
        return;
      }

      container.innerHTML = '';
      available.forEach((upg) => {
        const card = document.createElement("div");
        card.className = "upgrade-card tutorial-upgrade-card";
        card.dataset.id = upg.id;

        const isPurchased = engine.state.purchasedUpgrades.includes(upg.id);
        const isAffordable = engine.state.xp >= upg.costXP;

        if (isPurchased) {
          card.classList.add("purchased");
        } else if (!isAffordable) {
          card.classList.add("disabled");
        }

        const costStr = isPurchased ? 'Installed' : `${upg.costXP} XP`;

        card.innerHTML = `
          <div class="upgrade-info">
            <div class="upgrade-name">${upg.name}</div>
            <div class="upgrade-desc">${upg.desc}</div>
          </div>
          <button class="upgrade-cost-btn" ${isPurchased ? 'disabled' : ''}>
            ${costStr}
          </button>
        `;

        container.appendChild(card);
      });
      return;
    }

    container.innerHTML = '';
    // Use the dynamic global upgrades list
    let allUpgrades = [...DEVELOPER_PHASE.upgrades, ...BUSINESS_PHASE.upgrades];
    allUpgrades.forEach((upg) => {
      const card = document.createElement("div");
      card.className = "upgrade-card";
      card.dataset.id = upg.id;
      
      const isPurchased = engine.state.purchasedUpgrades.includes(upg.id);
      const isAffordable = engine.state.cash >= upg.costCash && engine.state.xp >= upg.costXP;

      if (isPurchased) {
        card.classList.add("purchased");
      } else if (!isAffordable) {
        card.classList.add("disabled");
      }

      // Display cost strings
      let costStr = '';
      if (upg.costCash > 0) costStr += `$${upg.costCash}\n`;
      if (upg.costXP > 0) costStr += `${upg.costXP} XP`;

      card.innerHTML = `
        <div class="upgrade-info">
          <div class="upgrade-name">${upg.name}</div>
          <div class="upgrade-desc">${upg.desc}</div>
        </div>
        <button class="upgrade-cost-btn" ${isPurchased ? 'disabled' : ''}>
          ${isPurchased ? 'Bought' : costStr}
        </button>
      `;

      container.appendChild(card);
    });
  }

  // Tutorial popups sequencing
  function handleTutorialAction() {
    const overlay = document.getElementById("tutorial-overlay");
    const text = document.getElementById("tutorial-text");
    const title = document.getElementById("tutorial-title");
    const btn = document.getElementById("tutorial-action-btn");
    const skipBtn = document.getElementById("tutorial-skip-btn");

    if (engine.state.tutorialStep === 0) {
      engine.state.tutorialStep = 1;
      overlay.style.display = 'none';
      skipBtn.style.display = 'none';
      syncTutorialButtonsUI();
      highlightTaskButton('code');
      initializeProjectFiles();
      logToConsole("[SYSTEM] Course started: Hello World project. Click '💻 Code' to start.", "success-msg");
    } 
    
    else if (engine.state.tutorialStep === 1.8) {
      overlay.style.display = 'none';
      syncTutorialButtonsUI();
      highlightTaskButton('code');
      initializeProjectFiles();
      logToConsole("[SYSTEM] Project 2 loaded: Calculator App. Click '💻 Code' to start writing code.", "success-msg");
    }
    
    else if (engine.state.tutorialStep === 2.5) {
      engine.state.tutorialStep = 2;
      overlay.style.display = 'none';
      syncTutorialButtonsUI();
      highlightTaskButton('bugfix');
      logToConsole("[SYSTEM] Course Unit 2: Bugfixing. Click '🐛 Bugfix' to remove discovered bugs.", "success-msg");
    } 
    
    else if (engine.state.tutorialStep === 2.8) {
      overlay.style.display = 'none';
      syncTutorialButtonsUI();
      highlightTaskButton('code');
      initializeProjectFiles();
      logToConsole("[SYSTEM] Project 3 loaded: Todo List. Click '💻 Code' to start writing code.", "success-msg");
    }
    
    else if (engine.state.tutorialStep === 3.5) {
      engine.state.tutorialStep = 3;
      overlay.style.display = 'none';
      syncTutorialButtonsUI();
      highlightTaskButton('test');
      logToConsole("[SYSTEM] Course Unit 3: Testing. Click '🔬 Test' to expose hidden bugs.", "success-msg");
    } 
    
    else if (engine.state.tutorialStep === 3.8) {
      overlay.style.display = 'none';
      syncTutorialButtonsUI();
      highlightTaskButton('code');
      initializeProjectFiles();
      logToConsole("[SYSTEM] Project 4 loaded: Weather App. Click '💻 Code' to start writing code.", "success-msg");
    }
    
    else if (engine.state.tutorialStep === 4.5) {
      engine.state.tutorialStep = 4;
      overlay.style.display = 'none';
      syncTutorialButtonsUI();
      highlightTaskButton('refactor');
      logToConsole("[SYSTEM] Course Unit 4: Refactoring. Click '🔧 Refactor' to clean codebase.", "success-msg");
    } 
    
    else if (engine.state.tutorialStep === 4.8) {
      overlay.style.display = 'none';
      syncTutorialButtonsUI();
      highlightTaskButton('code');
      initializeProjectFiles();
      logToConsole("[SYSTEM] Project 5 loaded: Sample Ecommerce. Click '💻 Code' to start writing code.", "success-msg");
    }
    
    else if (engine.state.tutorialStep === 5.5) {
      engine.state.tutorialStep = 5;
      overlay.style.display = 'none';
      syncTutorialButtonsUI();
      highlightTaskButton('autotest');
      logToConsole("[SYSTEM] Course Unit 5: Automated Testing. Click '🤖 Unit Tests' to setup a floor.", "success-msg");
    } 
    
    else if (engine.state.tutorialStep === 6.5) {
      engine.state.tutorialStep = 6;
      engine.state.cash = 10.0;
      engine.state.xp = 0;
      engine.loadContract(5);
      overlay.style.display = 'none';
      unlockAllTaskButtons();
      clearHighlights();
      updateProjectUIHeader();
      initializeProjectFiles();
      logToConsole("[SYSTEM] Course finished! Contract unlocked: Bakery Website.", "success-msg");
    }
  }

  // checkTutorialProgression removed in favor of event listener implementation

  function unlockTaskButton(task) {
    const input = document.querySelector(`input[value="${task}"]`);
    if (input && input.hasAttribute("disabled")) {
      input.removeAttribute("disabled");
    }
    const label = document.getElementById(`label-${task}`);
    if (label) label.classList.remove("locked");
    
    const fileEl = document.getElementById(`file-${task}`);
    if (fileEl) {
      fileEl.classList.remove("locked");
      if (fileEl.textContent.includes("🔒 ")) {
        fileEl.textContent = fileEl.textContent.replace("🔒 ", "📄 ");
      }
    }
  }

  function lockTaskButton(task) {
    const input = document.querySelector(`input[value="${task}"]`);
    if (input && !input.hasAttribute("disabled")) {
      input.setAttribute("disabled", "true");
    }
    const label = document.getElementById(`label-${task}`);
    if (label) label.classList.add("locked");
    
    const fileEl = document.getElementById(`file-${task}`);
    if (fileEl) {
      fileEl.classList.add("locked");
      if (fileEl.textContent.includes("📄 ")) {
        fileEl.textContent = fileEl.textContent.replace("📄 ", "🔒 ");
      }
    }
  }

  function syncTutorialButtonsUI() {
    if (engine.state.tutorialStep < 6) {
      ['code', 'test', 'bugfix', 'refactor', 'autotest'].forEach(t => lockTaskButton(t));
      const step = engine.state.tutorialStep;
      if (step >= 1) unlockTaskButton('code');
      if (step >= 2) unlockTaskButton('bugfix');
      if (step >= 3) unlockTaskButton('test');
      if (step >= 4) unlockTaskButton('refactor');
      if (step >= 5) unlockTaskButton('autotest');
    } else {
      unlockAllTaskButtons();
    }
  }

  function unlockAllTaskButtons() {
    ['code', 'test', 'bugfix', 'refactor', 'autotest'].forEach(t => unlockTaskButton(t));
  }

  function highlightTaskButton(task) {
    const el = document.getElementById(`label-${task}`);
    if (el) el.classList.add("highlight-btn");
  }

  function clearHighlights() {
    document.querySelectorAll(".task-radio-btn").forEach((lbl) => {
      lbl.classList.remove("highlight-btn");
    });
  }

  function showShippingSplash(report) {
    const overlay = document.getElementById("tutorial-overlay");
    const text = document.getElementById("tutorial-text");
    const title = document.getElementById("tutorial-title");
    const btn = document.getElementById("tutorial-action-btn");
    const skipBtn = document.getElementById("tutorial-skip-btn");

    skipBtn.style.display = 'none';
    overlay.style.display = 'flex';

    if (report.title === 'hello-world') {
      engine.state.tutorialStep = 1.8;
      title.textContent = "Project Shipped: Hello World";
      text.innerHTML = `
        <p>Congratulations on shipping your <strong>Hello World</strong> project!</p>
        <p style="margin-top: 10px;">Next up, let's accept the <strong>Calculator App</strong> contract to continue your training.</p>
      `;
      btn.textContent = "Accept Calculator App";
      btn.onclick = () => {
        handleTutorialAction();
      };
    } 
    
    else if (report.title === 'calculator-app') {
      engine.state.tutorialStep = 2.8;
      title.textContent = "Project Shipped: Calculator App";
      text.innerHTML = `
        <p>Congratulations on shipping your <strong>Calculator App</strong>!</p>
        <p style="margin-top: 10px;">Next up, accept the <strong>Todo List</strong> contract to learn about manual testing.</p>
      `;
      btn.textContent = "Accept Todo List";
      btn.onclick = () => {
        handleTutorialAction();
      };
    } 
    
    else if (report.title === 'todo-list') {
      engine.state.tutorialStep = 3.8;
      title.textContent = "Project Shipped: Todo List";
      text.innerHTML = `
        <p>Excellent testing! The <strong>Todo List</strong> project is shipped.</p>
        <p style="margin-top: 10px;">Next up, accept the <strong>Weather App</strong> contract to learn about refactoring.</p>
      `;
      btn.textContent = "Accept Weather App";
      btn.onclick = () => {
        handleTutorialAction();
      };
    } 
    
    else if (report.title === 'weather-app') {
      engine.state.tutorialStep = 4.8;
      title.textContent = "Project Shipped: Weather App";
      text.innerHTML = `
        <p>Great refactoring! The <strong>Weather App</strong> project is shipped.</p>
        <p style="margin-top: 10px;">Now, accept the <strong>Sample Ecommerce</strong> contract to set up automated testing.</p>
      `;
      btn.textContent = "Accept Sample Ecommerce";
      btn.onclick = () => {
        handleTutorialAction();
      };
    }
    
    else {
      title.textContent = "🎉 Project Successfully Shipped!";
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
      btn.textContent = "Accept Next Contract";
      btn.onclick = () => {
        overlay.style.display = 'none';
        updateProjectUIHeader();
        initializeProjectFiles();
        logToConsole(`[SYSTEM] Loaded new project: ${engine.currentContract.title}. Backlog: ${engine.currentContract.backlog} Points.`, 'success-msg');
        btn.onclick = handleTutorialAction;
      };
    }
  }

  function triggerPhase2Transition() {
    const overlay = document.getElementById("tutorial-overlay");
    overlay.style.display = 'flex';
    
    const title = document.getElementById("tutorial-title");
    title.textContent = "🚀 consultancy phase ready!";
    
    const text = document.getElementById("tutorial-text");
    text.innerHTML = `
      <p>You have successfully accumulated enough funds and code experience to establish: <strong>DevLoop Solutions Ltd.</strong></p>
      <p style="margin-top: 10px;">Phase 1 (Solo Coder) is complete! In Phase 2, you will step away from the keyboard and hire staff developers and project managers to scale your operations.</p>
    `;
    
    const btn = document.getElementById("tutorial-action-btn");
    btn.textContent = "Transition to Phase 2 (Under Construction)";
    btn.onclick = () => {
      alert("Congratulations on completing Phase 1! The consultancy stage is currently under development. Stay tuned!");
    };
  }

  function runAutoSimulationUI() {
    logToConsole("=======================================", "success-msg");
    logToConsole("[SIMULATOR] Starting Automated Game Run...", "success-msg");
    
    // Create isolated engine
    let simEngine = new DevGameEngine();
    simEngine.skipTutorial();
    logToConsole(`[SIMULATOR] Loaded contract: ${simEngine.currentContract.title}`, "system-msg");
    logToConsole(`[SIMULATOR] Starting Backlog: ${simEngine.state.backlog}`, "system-msg");

    // Phase 1: Code for 8s
    simEngine.selectTask('code');
    logToConsole(">>> Task: Coding (Duration: 8.0s) ...", "system-msg");
    for (let i = 0; i < 160; i++) simEngine.tick(0.05);
    logToConsole(`[RESULT] LOC: ${Math.round(simEngine.state.loc)} | Backlog: ${Math.round(simEngine.state.backlog)}`, "system-msg");
    logToConsole(`[RESULT] Hidden Bugs: ${simEngine.state.hiddenBugs.toFixed(1)} | Value: $${simEngine.state.codeValue.toFixed(2)}`, "system-msg");

    // Phase 2: Test for 8s
    simEngine.selectTask('test');
    logToConsole(">>> Task: Testing (Duration: 8.0s) ...", "system-msg");
    for (let i = 0; i < 160; i++) simEngine.tick(0.05);
    logToConsole(`[RESULT] Coverage: ${simEngine.state.testCoverage.toFixed(1)}% | Revealed Bugs: ${simEngine.state.revealedBugs.toFixed(1)}`, "system-msg");

    // Phase 3: Bugfix for 6s
    simEngine.selectTask('bugfix');
    logToConsole(">>> Task: Bugfixing (Duration: 6.0s) ...", "system-msg");
    for (let i = 0; i < 120; i++) simEngine.tick(0.05);
    logToConsole(`[RESULT] Bugs Left: ${simEngine.state.revealedBugs.toFixed(1)} | Backlog: ${Math.round(simEngine.state.backlog)}`, "system-msg");

    // Phase 4: Code remaining
    simEngine.selectTask('code');
    logToConsole(">>> Task: Coding remaining backlog ...", "system-msg");
    let safety = 0;
    while(simEngine.state.backlog > 0.1 && safety < 800) {
      simEngine.tick(0.05);
      safety++;
    }
    logToConsole(`[RESULT] Final Backlog: ${simEngine.state.backlog.toFixed(1)} | Final LOC: ${Math.round(simEngine.state.loc)}`, "system-msg");

    // Phase 5: Test and Bugfix remainder
    simEngine.selectTask('test');
    for (let i = 0; i < 160; i++) simEngine.tick(0.05);
    simEngine.selectTask('bugfix');
    safety = 0;
    while(simEngine.state.revealedBugs > 0.1 && safety < 800) {
      simEngine.tick(0.05);
      safety++;
    }
    
    // Code final backlog items
    simEngine.selectTask('code');
    safety = 0;
    while(simEngine.state.backlog > 0.1 && safety < 800) {
      simEngine.tick(0.05);
      safety++;
    }

    logToConsole(`[RESULT] Is Ready to Ship? ${simEngine.isShipReady()}`, "system-msg");
    if (simEngine.isShipReady()) {
      let report = simEngine.shipProject();
      logToConsole(`[SHIP REPORT] Shipped ${report.title}. Payout: $${report.cashPayout.toFixed(2)}, XP: +${Math.round(report.xpPayout)}`, "success-msg");
      logToConsole(`[SIMULATOR] Test Complete! All checks PASSED.`, "success-msg");
    } else {
      logToConsole(`[SIMULATOR] Test Failed! Code was not ready to ship.`, "error-msg");
    }
    logToConsole("=======================================", "success-msg");
  }
}
})();
