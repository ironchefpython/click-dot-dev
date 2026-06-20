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
      return null; // Deprecated, managed by Preact
    },

    unlockTaskButton(task) {
      // Deprecated, managed by Preact via engine state/tutorial rules
    },

    lockTaskButton(task) {
      // Deprecated, managed by Preact via engine state/tutorial rules
    },

    unlockAllTaskButtons() {
      // Deprecated, managed by Preact
    },

    highlightTaskButton(task) {
      // Deprecated, managed by Preact
    },

    clearHighlights() {
      // Deprecated, managed by Preact
    },

    showModal(config, engine) {
        if (engine) {
            engine.dispatchEvent(Events.SHOW_MODAL, config);
        }
    },

    hideModal(engine) {
        if (engine) {
            engine.dispatchEvent(Events.HIDE_MODAL);
        }
    },
createStateMachine(engine, options, states, stepToStateMap, defaultState) {
      const controller = {
        engine,
        options,
        currentStateName: defaultState,
        previousStateName: null,
        activeListeners: [],

        init() {
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
          }, this.engine);
        },

        hideModal() {
          UIUtils.hideModal(this.engine);
        },

        handleActionClick() {
          this.engine.dispatchEvent(Events.MODAL_BUTTON, { buttonId: 'action' });
        },

        handleSkipClick() {
          this.engine.dispatchEvent(Events.MODAL_BUTTON, { buttonId: 'skip' });
        },

        unlockTaskButton: UIUtils.unlockTaskButton,
        lockTaskButton: UIUtils.lockTaskButton,
        syncTutorialButtonsUI() {},

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
