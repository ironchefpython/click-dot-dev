(function() {
  let Events;
  if (typeof require !== 'undefined') {
    Events = require('./events.js');
  } else {
    Events = window.Events;
  }


  const UI_ELEMENTS = {};

  const UIUtils = {
    getEl(id) {
      if (typeof document === 'undefined') return null;
      if (!UI_ELEMENTS[id]) {
        UI_ELEMENTS[id] = document.getElementById(id);
      }
      return UI_ELEMENTS[id];
    },

    unlockTaskButton(task) {
      if (typeof document === 'undefined') return;
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
    },

    lockTaskButton(task) {
      if (typeof document === 'undefined') return;
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
    },

    unlockAllTaskButtons() {
      ['code', 'test', 'bugfix', 'refactor', 'autotest'].forEach(t => UIUtils.unlockTaskButton(t));
    },

    highlightTaskButton(task) {
      if (typeof document === 'undefined') return;
      const el = document.getElementById(`label-${task}`);
      if (el) el.classList.add("highlight-btn");
    },

    clearHighlights() {
      if (typeof document === 'undefined') return;
      document.querySelectorAll(".task-radio-btn").forEach((lbl) => {
        lbl.classList.remove("highlight-btn");
      });
    },

    showModal(config) {
      if (typeof document === 'undefined') return;
      const overlay = document.getElementById("tutorial-overlay");
      const text = document.getElementById("tutorial-text");
      const title = document.getElementById("tutorial-title");
      const btn = document.getElementById("tutorial-action-btn");
      const skipBtn = document.getElementById("tutorial-skip-btn");

      if (overlay) overlay.style.display = 'flex';
      if (title && config.title !== undefined) title.textContent = config.title;
      if (text && config.text !== undefined) text.innerHTML = config.text;
      if (btn && config.btnText !== undefined) btn.textContent = config.btnText;
      if (skipBtn) {
        if (config.showSkip !== undefined) {
          skipBtn.style.display = config.showSkip ? 'inline-block' : 'none';
        }
        if (config.skipText !== undefined) {
          skipBtn.textContent = config.skipText;
        }
      }
    },

    hideModal() {
      if (typeof document === 'undefined') return;
      const overlay = document.getElementById("tutorial-overlay");
      if (overlay) overlay.style.display = 'none';
    },

    createStateMachine(engine, options, states, stepToStateMap, defaultState) {
      const controller = {
        engine,
        options,
        currentStateName: defaultState,
        previousStateName: null,
        activeListeners: [],

        init() {
          // Register DOM event listeners
          if (typeof document !== 'undefined') {
            const actionBtn = document.getElementById("tutorial-action-btn");
            if (actionBtn) {
              actionBtn.onclick = () => {
                this.handleActionClick();
              };
            }

            const skipBtn = document.getElementById("tutorial-skip-btn");
            if (skipBtn) {
              skipBtn.onclick = () => {
                this.handleSkipClick();
              };
            }
          }

          // Listen for step changes if stepToStateMap is provided
          if (stepToStateMap) {
            engine.addEventListener(Events.TUTORIAL_STEP_CHANGED, (step) => {
              const targetState = stepToStateMap[step];
              if (targetState && targetState !== this.currentStateName) {
                this.transitionTo(targetState);
              }
            });
            const initialStep = engine.state.tutorialStep !== undefined ? engine.state.tutorialStep : 0;
            const startingState = stepToStateMap[initialStep] || defaultState;
            this.transitionTo(startingState);
          } else {
            this.transitionTo(defaultState);
          }
        },

        transitionTo(stateName) {
          const prev = this.currentStateName;
          this.clearTransitionListeners();

          const nextState = states[stateName];
          if (!nextState) return;

          this.previousStateName = prev;
          this.currentStateName = stateName;

          if (nextState.step !== undefined) {
            this.engine.state.tutorialStep = nextState.step;
            this.engine.state.tutorialCompleted = (nextState.step >= 6);
          }

          if (nextState.onEnter) {
            nextState.onEnter(this);
          } else {
            this.showModal();
          }

          const transList = nextState.transitions || (nextState.transition ? [nextState.transition] : []);
          transList.forEach(trans => {
            this.registerTransitionListener(trans);
          });
        },

        registerTransitionListener(trans) {
          const { event, next } = trans;
          const condition = trans.predicate || trans.condition;

          if (event === 'graduateCheck') {
            const checkFn = (data) => {
              if (condition && condition(this, data)) {
                this.engine.removeEventListener('shippable', checkFn);
                this.engine.removeEventListener('testCoverageFloorIncreased', checkFn);
                this.activeListeners = this.activeListeners.filter(l => l.callback !== checkFn);
                this.transitionTo(next);
              }
            };
            this.activeListeners.push({ event: 'shippable', callback: checkFn });
            this.activeListeners.push({ event: 'testCoverageFloorIncreased', callback: checkFn });
            this.engine.addEventListener('shippable', checkFn);
            this.engine.addEventListener('testCoverageFloorIncreased', checkFn);
          } else {
            const callback = (data) => {
              let isMatch = true;
              if (trans.predicate) {
                isMatch = trans.predicate(data, this);
              } else if (trans.condition) {
                isMatch = trans.condition(this, data);
              } else if (trans.buttonId !== undefined) {
                isMatch = data && data.buttonId === trans.buttonId;
              }

              if (isMatch) {
                this.activeListeners = this.activeListeners.filter(l => l.callback !== callback);
                this.transitionTo(next);
              } else {
                // Re-listen since condition failed
                this.engine.listenOnce(event, callback);
              }
            };
            this.activeListeners.push({ event, callback });
            this.engine.listenOnce(event, callback);
          }
        },

        clearTransitionListeners() {
          this.activeListeners.forEach(({ event, callback }) => {
            this.engine.removeEventListener(event, callback);
          });
          this.activeListeners = [];
        },

        showModal() {
          const state = states[this.currentStateName];
          if (!state) return;
          UIUtils.showModal({
            title: state.title,
            text: state.text,
            btnText: state.btnText,
            skipText: state.skipText,
            showSkip: state.showSkip
          });
        },

        hideModal() {
          UIUtils.hideModal();
        },

        handleActionClick() {
          this.engine.dispatchEvent(Events.MODAL_BUTTON, { buttonId: 'action' });
        },

        handleSkipClick() {
          this.engine.dispatchEvent(Events.MODAL_BUTTON, { buttonId: 'skip' });
        },

        unlockTaskButton: UIUtils.unlockTaskButton,
        lockTaskButton: UIUtils.lockTaskButton,
        syncTutorialButtonsUI() {
          if (!this.engine.state.tutorialCompleted) {
            ['code', 'test', 'bugfix', 'refactor', 'autotest'].forEach(t => this.lockTaskButton(t));
            const state = states[this.currentStateName];
            const step = state ? state.step : 0;
            if (step >= 1) this.unlockTaskButton('code');
            if (step >= 2) this.unlockTaskButton('bugfix');
            if (step >= 3) this.unlockTaskButton('test');
            if (step >= 4) this.unlockTaskButton('refactor');
            if (step >= 5) this.unlockTaskButton('autotest');
          } else {
            UIUtils.unlockAllTaskButtons();
          }
        },
        unlockAllTaskButtons: UIUtils.unlockAllTaskButtons,
        highlightTaskButton: UIUtils.highlightTaskButton,
        clearHighlights: UIUtils.clearHighlights
      };

      return controller;
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIUtils;
  } else {
    window.UIUtils = UIUtils;
  }
})();
