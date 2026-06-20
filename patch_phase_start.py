import re

with open('phase-start.js', 'r') as f:
    content = f.read()

# Refactor StartPhase to use engine events for modals
replacement = """
      engine.dispatchEvent(Events.SHOW_MODAL, {
        title: "DevLoop: Solo Coder",
        text: `
          <p>Welcome to <strong>DevLoop: Solo Coder</strong>.</p>
          <p style="margin-top: 10px;">In this game, you will learn to code, take on projects, and grow your career from a novice to a principal software engineer.</p>
          <p style="margin-top: 10px;">Are you ready to begin your journey?</p>
        `,
        btnText: "Start Tutorial",
        showSkip: true,
        skipText: "Skip Tutorial (Dev Mode)"
      });

      engine.listenOnce(Events.MODAL_BUTTON, (data) => {
        if (data.buttonId === 'action') {
          engine.dispatchEvent(Events.HIDE_MODAL);
          if (uiCallbacks.onTutorialStart) uiCallbacks.onTutorialStart();
        } else if (data.buttonId === 'skip') {
          engine.dispatchEvent(Events.HIDE_MODAL);
          engine.skipTutorial();
          if (uiCallbacks.initializeProjectFiles) uiCallbacks.initializeProjectFiles();
          if (uiCallbacks.updateProjectUIHeader) uiCallbacks.updateProjectUIHeader();
        }
      });
"""

content = re.sub(r'if \(typeof document === \'undefined\'\) return;.*?(?=\s+\}\s+\};\s+if \(typeof module)', replacement, content, flags=re.DOTALL)

with open('phase-start.js', 'w') as f:
    f.write(content)
