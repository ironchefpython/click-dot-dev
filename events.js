(function() {
  const Events = {
    // Engine Events
    TUTORIAL_STEP_CHANGED: 'tutorialStepChanged',
    COMPLEXITY_THRESHOLD_REACHED: 'complexityThresholdReached',
    RANK_UP: 'rankUp',
    SHIPPABLE: 'shippable',
    BUG_CREATED: 'bugCreated',
    BUG_REVEALED: 'bugRevealed',
    STORY_POINT_COMPLETED: 'storyPointCompleted',
    LOC_WRITTEN: 'locWritten',
    TEST_COVERAGE_INCREASED: 'testCoverageIncreased',
    TEST_COVERAGE_FLOOR_INCREASED: 'testCoverageFloorIncreased',
    TICK: 'tick',
    PROJECT_SHIPPED: 'projectShipped',

    // UI Events
    MODAL_BUTTON: 'modalButton'
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Events;
  } else {
    window.Events = Events;
  }
})();
