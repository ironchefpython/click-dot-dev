import re

with open('ui-utils.js', 'r') as f:
    content = f.read()

# Replace UIUtils methods to emit events instead of DOM manipulation
replacement = """
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
"""

content = re.sub(r'const UIUtils = \{.*?(?=createStateMachine)', replacement, content, flags=re.DOTALL)

# Update createStateMachine to not bind DOM listeners natively and use the new showModal/hideModal signatures
content = re.sub(r'init\(\) \{.*?if \(stepToStateMap\)', 'init() {\n          if (stepToStateMap)', content, flags=re.DOTALL)

# Fix showModal in createStateMachine
content = re.sub(
    r'showModal\(\) \{.*?UIUtils\.showModal\(\{.*?\}\);.*?\}',
    """showModal() {
          const state = states[this.currentStateName];
          if (!state) return;
          UIUtils.showModal({
            title: state.title,
            text: state.text,
            btnText: state.btnText,
            skipText: state.skipText,
            showSkip: state.showSkip
          }, this.engine);
        }""",
    content,
    flags=re.DOTALL
)

content = re.sub(
    r'hideModal\(\) \{.*?UIUtils\.hideModal\(\);.*?\}',
    """hideModal() {
          UIUtils.hideModal(this.engine);
        }""",
    content,
    flags=re.DOTALL
)

# Remove UI syncing logic in createStateMachine (now handled by Preact)
content = re.sub(r'syncTutorialButtonsUI\(\) \{.*?\}', 'syncTutorialButtonsUI() {}', content, flags=re.DOTALL)

with open('ui-utils.js', 'w') as f:
    f.write(content)
