(function() {
  // Import dependencies for Node.js test environments
  let DevGameEngine, CONTRACTS, TUTORIAL_PHASE, DEVELOPER_PHASE, BUSINESS_PHASE, Formulas;
  if (typeof require !== 'undefined') {
  const engineMod = require('./engine.js');
  DevGameEngine = engineMod.DevGameEngine;
  CONTRACTS = engineMod.CONTRACTS;
  TUTORIAL_PHASE = require('./phase-tutorial.js');
  DEVELOPER_PHASE = require('./phase-developer.js');
  BUSINESS_PHASE = require('./phase-business.js');
  Formulas = require('./formulas.js');
} else {
  DevGameEngine = window.DevGameEngine;
  CONTRACTS = window.CONTRACTS;
  TUTORIAL_PHASE = window.TUTORIAL_PHASE;
  DEVELOPER_PHASE = window.DEVELOPER_PHASE;
  BUSINESS_PHASE = window.BUSINESS_PHASE;
  Formulas = window.Formulas;
}

// Scrolling Text Libraries for terminal simulation
const CODE_LINES = [
  "const express = require('express');",
  "const app = express();",
  "app.use(express.json());",
  "const stripe = require('stripe')(process.env.STRIPE_KEY);",
  "// Get bakery inventory",
  "app.get('/api/products', (req, res) => {",
  "  const db = getDatabaseConnection();",
  "  db.query('SELECT * FROM inventory', (err, rows) => {",
  "    if (err) return res.status(500).json({ error: err.message });",
  "    res.json({ products: rows });",
  "  });",
  "});",
  "// Handle customer order checkout",
  "app.post('/api/checkout', async (req, res) => {",
  "  const { cart, email } = req.body;",
  "  let total = 0;",
  "  for (const item of cart) {",
  "    const product = await getProductPrice(item.id);",
  "    total += product.price * item.quantity;",
  "  }",
  "  const paymentIntent = await stripe.paymentIntents.create({",
  "    amount: Math.round(total * 100),",
  "    currency: 'usd',",
  "    receipt_email: email",
  "  });",
  "  res.send({ clientSecret: paymentIntent.client_secret });",
  "});"
];

const TEST_LINES = [
  "PASS  tests/bakery.test.js",
  " ✓ should return inventory list (34ms)",
  " ✓ should reject invalid checkout items (12ms)",
  " ✓ should connect to stripe gateway (115ms)",
  " Running path coverage analysis...",
  " [WARN] Route '/api/checkout' has 85% branch coverage",
  "   - Missing coverage for stripe API connection failure",
  " Running Unit Tests: 18 tests passed, 0 failed.",
  " PASS  tests/auth.test.js",
  " ✓ should hash passwords on signup (48ms)",
  " ✓ should block SQL injection on login (8ms)"
];

const DEBUG_LINES = [
  "TypeError: Cannot read property 'price' of undefined",
  "    at calculateTotal (/src/cart.js:14:32)",
  "    at processOrder (/src/routes/checkout.js:84:18)",
  " [DEBUGGER] Attaching to process (port 9229)...",
  " [DEBUGGER] Variable state at breakpoint L14:",
  "    item = { id: 104, qty: 2 }",
  "    product = undefined (Stripe query failed)",
  " [FIXED] Added fallbacks for empty catalog queries.",
  " ReferenceError: db is not defined",
  "    at /src/routes/products.js:8:5",
  " [FIXED] Imported database helper namespace."
];

const REFACTOR_LINES = [
  " <<<<<<< /src/cart.js:L10",
  " - function getCartTotal(items) {",
  " -   let sum = 0;",
  " -   for(let i=0; i<items.length; i++) {",
  " -     sum += items[i].price * items[i].qty;",
  " -   }",
  " -   return sum;",
  " - }",
  " ======= /src/cart.js:L10",
  " + const getCartTotal = items =>",
  " +   items.reduce((sum, item) => sum + item.price * item.qty, 0);",
  " >>>>>>>",
  " [REFACTOR] Extracted checkout validation to middleware.",
  " [REFACTOR] Replaced connection pool callbacks with promises."
];

const AUTOTEST_LINES = [
  " [JEST] Initializing Jest Watch Mode...",
  " [JEST] Found 4 test files matching regex patterns.",
  " [CI/CD] Generating github actions deployment pipeline...",
  " [CI/CD] Added lint checks and unit test step to pre-push hook.",
  " [AUTO-TEST] Writing automated test mocks for Stripe webhook.",
  " [AUTO-TEST] Locked minimum coverage constraint for /src/db.js"
];

// Browser Mounting & UI Interactivity Logic
if (typeof window !== 'undefined') {
  window.createSimulator = (initState) => new DevGameEngine(initState);

  let engine = new DevGameEngine();
  window.engine = engine;
  let refactorTimer = 0;
  let terminalScrollTimer = 0;
  let passiveBacklogTimer = 0;
  let lastUpgradesStateKey = '';

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
          <p style="margin-top: 10px;">Bugs decrease the code value and block deployment. Select Debugging to resolve these known issues.</p>
        `;
        btn.textContent = "Start Debugging";
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

      if (engine.state.tutorialStep === 3.8 && engine.state.loc >= 8) {
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

      // Passive backlog emails (triggered after tutorial is finished)
      if (engine.state.tutorialStep >= 6) {
        passiveBacklogTimer += dt;
        if (passiveBacklogTimer >= 14) {
          passiveBacklogTimer = 0;
          let complexity = Math.floor(engine.state.loc / 350);
          let incoming = 10 + complexity * 3;
          engine.state.backlog += incoming;
          logToConsole(`[CLIENT] Incoming email request: "New Feature Request" (+${incoming} Points)`, 'system-msg');
        }
      }

      // Render all stats to DOM
      renderUI(tickReport.focusVal, tickReport.fatigueVal, tickReport.efficiency);
    }, 50);
  });

  function updateProjectUIHeader() {
    document.getElementById("header-project-name").textContent = engine.currentContract.title;
    document.getElementById("sidebar-folder-name").textContent = engine.currentContract.folderName;
  }

  function selectTaskUI(task) {
    const tabTitle = document.getElementById("tab-title");
    const tabIcon = document.getElementById("tab-icon");
    const filePath = document.getElementById("header-file-path");

    // Clear sidebar explorer active lines
    document.querySelectorAll(".tree-item.file").forEach(f => f.classList.remove("active"));

    if (task === 'idle') {
      tabTitle.textContent = "coffee_break.txt";
      tabIcon.textContent = "☕";
      filePath.textContent = "/home/developer/coffee_break.txt";
    } else if (task === 'code') {
      tabTitle.textContent = "main.js";
      tabIcon.textContent = "📄";
      filePath.textContent = "/src/main.js";
      document.getElementById("file-main").classList.add("active");
    } else if (task === 'test') {
      tabTitle.textContent = "test.js";
      tabIcon.textContent = "🔬";
      filePath.textContent = "/tests/test.js";
      document.getElementById("file-test").classList.add("active");
    } else if (task === 'debug') {
      tabTitle.textContent = "debug.log";
      tabIcon.textContent = "🐛";
      filePath.textContent = "/logs/debug.log";
      document.getElementById("file-debug").classList.add("active");
    } else if (task === 'refactor') {
      tabTitle.textContent = "refactor.diff";
      tabIcon.textContent = "🔧";
      filePath.textContent = "/diffs/refactor.diff";
      document.getElementById("file-refactor").classList.add("active");
    } else if (task === 'autotest') {
      tabTitle.textContent = "jest.config.js";
      tabIcon.textContent = "🤖";
      filePath.textContent = "/config/jest.config.js";
      document.getElementById("file-autotest").classList.add("active");
    }

    logToConsole(`>>> Switching context to: ${task.toUpperCase()}...`, 'system-msg');
  }

  function processConsoleScroll(task) {
    terminalScrollTimer++;
    if (terminalScrollTimer >= 4) { // log every 0.2s
      terminalScrollTimer = 0;
      let linesArray = [];
      let className = 'system-msg';
      
      if (task === 'code') { linesArray = CODE_LINES; className = 'code-line'; }
      else if (task === 'test') { linesArray = TEST_LINES; className = 'success-msg'; }
      else if (task === 'debug') { linesArray = DEBUG_LINES; className = 'error-msg'; }
      else if (task === 'refactor') { linesArray = REFACTOR_LINES; className = 'system-msg'; }
      else if (task === 'autotest') { linesArray = AUTOTEST_LINES; className = 'system-msg'; }

      let randomLine = linesArray[Math.floor(Math.random() * linesArray.length)];
      logToConsole(randomLine, className);
    }
  }

  function logToConsole(message, className) {
    const terminal = document.getElementById("console-output");
    if (!terminal) return;
    const line = document.createElement("div");
    line.className = `terminal-line ${className || ''}`;
    line.textContent = message;
    terminal.appendChild(line);

    if (terminal.childNodes.length > 50) {
      terminal.removeChild(terminal.firstChild);
    }
    terminal.scrollTop = terminal.scrollHeight;
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
    
    let complexity = engine.state.complexity || 1.0;
    document.getElementById("stat-complexity").textContent = `Complexity: x${complexity.toFixed(2)}`;
    
    const featPoints = Math.floor(engine.state.featurePoints);
    document.getElementById("stat-backlog").innerHTML = `
      <span class="feat-backlog">${featPoints}</span>
      <span style="font-size: 0.8rem; color: var(--color-muted); font-weight: normal; margin-left: 2px;">Pts</span>
    `;

    let minLocDisplay = "-";
    if (engine.currentContract && engine.state.featurePoints > 0) {
      const totalFeatures = Math.round(engine.currentContract.backlog);
      const n = totalFeatures - engine.state.featurePoints + 1;
      const growthScale = engine.currentContract.growthScale || 0;
      const transitionOffset = engine.currentContract.transitionOffset || 0;
      const complexity = engine.state.complexity || 1.0;
      
      const minLocVal = Formulas.getMinLoc(n, growthScale, transitionOffset, complexity);
      minLocDisplay = `${minLocVal.toFixed(1)}`;
    } else if (engine.currentContract && engine.state.featurePoints === 0) {
      minLocDisplay = "Completed";
    }
    document.getElementById("stat-min-loc").textContent = `Min LOC: ${minLocDisplay}`;

    // Bugs metrics (blank in Project 1, shown in Project 2 onwards)
    if (engine.state.tutorialStep < 1.8) {
      document.getElementById("stat-bugs-found").textContent = "-";
      document.getElementById("stat-bugs-fixable").textContent = "-";
      document.getElementById("stat-bug-rate").textContent = "Bug rate: -";
    } else {
      document.getElementById("stat-bugs-found").textContent = Math.floor(engine.state.revealedBugs);
      document.getElementById("stat-bugs-fixable").textContent = Math.floor(engine.state.bugPoints);
      let baseBugRate = engine.currentContract ? (engine.currentContract.baseBugRate !== undefined ? engine.currentContract.baseBugRate : 0.05) : 0.05;
      let complexityFactor = engine.state.purchasedUpgrades.includes('framework') ? 0.7 : 1.0;
      let complexityMultiplier = 1 + (engine.state.loc / 450) * complexityFactor;
      let linterRed = engine.state.purchasedUpgrades.includes('linter') ? 0.6 : 1.0;
      document.getElementById("stat-bug-rate").textContent = `Bug rate: ${(baseBugRate * complexityMultiplier * linterRed * 100).toFixed(1)}%`;
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

    // Specification metric — always 100% for tutorial projects, shown from the start
    const specEl = document.getElementById("stat-specification");
    const specSubEl = document.getElementById("stat-specification-sub");
    if (specEl) {
      // For tutorial courses: spec is always 100% (course brief is fixed)
      // For freelance contracts: spec could fluctuate, but for now also 100%
      specEl.textContent = "100%";
      if (specSubEl) specSubEl.textContent = "Requirements met";
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
    const codeRadio = document.querySelector('input[name="active-task"][value="code"]');
    const codeLabel = document.getElementById("label-code");
    if (codeRadio) {
      if (engine.state.backlog <= 0.05) {
        codeRadio.disabled = true;
        if (codeLabel) codeLabel.classList.add("locked");
      } else {
        let isCodeUnlocked = (engine.state.tutorialStep >= 6) || (engine.state.tutorialStep >= 1);
        if (isCodeUnlocked) {
          codeRadio.disabled = false;
          if (codeLabel) codeLabel.classList.remove("locked");
        }
      }
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
      logToConsole("[SYSTEM] Course started: Hello World project. Click '💻 Code' to start.", "success-msg");
    } 
    
    else if (engine.state.tutorialStep === 1.8) {
      overlay.style.display = 'none';
      syncTutorialButtonsUI();
      highlightTaskButton('code');
      logToConsole("[SYSTEM] Project 2 loaded: Calculator App. Click '💻 Code' to start writing code.", "success-msg");
    }
    
    else if (engine.state.tutorialStep === 2.5) {
      engine.state.tutorialStep = 2;
      overlay.style.display = 'none';
      syncTutorialButtonsUI();
      highlightTaskButton('debug');
      logToConsole("[SYSTEM] Course Unit 2: Debugging. Click '🐛 Debug' to remove discovered bugs.", "success-msg");
    } 
    
    else if (engine.state.tutorialStep === 2.8) {
      overlay.style.display = 'none';
      syncTutorialButtonsUI();
      highlightTaskButton('code');
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
      engine.loadContract(0);
      overlay.style.display = 'none';
      unlockAllTaskButtons();
      clearHighlights();
      updateProjectUIHeader();
      logToConsole("[SYSTEM] Course finished! Contract unlocked: Bakery Website.", "success-msg");
    }
  }

  // checkTutorialProgression removed in favor of event listener implementation

  function unlockTaskButton(task) {
    const input = document.querySelector(`input[value="${task}"]`);
    if (input) input.removeAttribute("disabled");
    const label = document.getElementById(`label-${task}`);
    if (label) label.classList.remove("locked");
    
    const fileEl = document.getElementById(`file-${task}`);
    if (fileEl) {
      fileEl.classList.remove("locked");
      fileEl.textContent = fileEl.textContent.replace("🔒 ", "📄 ");
    }
  }

  function lockTaskButton(task) {
    const input = document.querySelector(`input[value="${task}"]`);
    if (input) input.setAttribute("disabled", "true");
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
      ['code', 'test', 'debug', 'refactor', 'autotest'].forEach(t => lockTaskButton(t));
      const step = engine.state.tutorialStep;
      if (step >= 1) unlockTaskButton('code');
      if (step >= 2) unlockTaskButton('debug');
      if (step >= 3) unlockTaskButton('test');
      if (step >= 4) unlockTaskButton('refactor');
      if (step >= 5) unlockTaskButton('autotest');
    } else {
      unlockAllTaskButtons();
    }
  }

  function unlockAllTaskButtons() {
    ['code', 'test', 'debug', 'refactor', 'autotest'].forEach(t => unlockTaskButton(t));
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

    // Phase 3: Debug for 6s
    simEngine.selectTask('debug');
    logToConsole(">>> Task: Debugging (Duration: 6.0s) ...", "system-msg");
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

    // Phase 5: Test and Debug remainder
    simEngine.selectTask('test');
    for (let i = 0; i < 160; i++) simEngine.tick(0.05);
    simEngine.selectTask('debug');
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
