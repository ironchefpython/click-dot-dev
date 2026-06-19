(function() {
  let UIUtils, Events;
  if (typeof require !== 'undefined') {
    UIUtils = require('./ui-utils.js');
    Events = require('./events.js');
  } else {
    UIUtils = window.UIUtils;
    Events = window.Events;
  }

  const START_STATES = {
    START: {
      title: "Welcome to DevLoop!",
      text: "<p>Select your path. You can start the game directly as a junior developer or play the tutorial to learn the basics.</p>",
      btnText: "Play Tutorial",
      skipText: "Start Game",
      showSkip: true,
      onEnter(ui) {
        ui.engine.loadContract(-1); // No active contract
        ui.showModal();
      },
      transitions: [
        { event: Events.MODAL_BUTTON, buttonId: 'action', next: 'START_TUTORIAL' },
        { event: Events.MODAL_BUTTON, buttonId: 'skip', next: 'START_GAME' }
      ]
    },
    START_TUTORIAL: {
      onEnter(ui) {
        ui.hideModal();
        if (ui.options.onTutorialStart) {
          ui.options.onTutorialStart();
        }
      }
    },
    START_GAME: {
      onEnter(ui) {
        ui.hideModal();
        ui.engine.skipTutorial();
        if (ui.options.onTutorialStart) {
          ui.options.onTutorialStart();
        }
      }
    }
  };

  const StartPhase = {
    engine: null,
    options: {},
    currentStateName: 'START',
    previousStateName: null,
    activeListeners: [],

    init(engine, options) {
      const controller = UIUtils.createStateMachine(
        engine,
        options,
        START_STATES,
        null, // No stepToStateMap needed for StartPhase
        'START'
      );
      Object.assign(this, controller);
      this.init();
    }
  };

  const START_PHASE = {
    StartPhase
  };

  if (typeof module !== 'undefined' && module.exports) {
    START_PHASE.StartPhase = StartPhase;
    module.exports = START_PHASE;
  } else {
    window.START_PHASE = START_PHASE;
    window.StartPhase = StartPhase;
  }
})();
