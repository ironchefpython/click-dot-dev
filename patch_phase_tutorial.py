import re

with open('phase-tutorial.js', 'r') as f:
    content = f.read()

# Replace showShippingSplash to emit an event
replacement = """
  showShippingSplash: (report) => {
    if (TutorialUI.engine) {
        TutorialUI.engine.dispatchEvent(Events.SHOW_MODAL, {
          title: `Project Shipped: ${report.title}`,
          text: `
            <p><strong>Codebase Value:</strong> $${report.codeValue.toFixed(2)}</p>
            <p><strong>Quality Multiplier:</strong> ${report.qualityMultiplier.toFixed(2)}x</p>
            <p style="margin-top: 10px; font-size: 1.2rem; color: var(--color-success);">
              Payout: $${report.cashPayout.toFixed(2)} | Knowledge: +${Math.round(report.xpPayout)} XP
            </p>
            <p style="margin-top: 10px; font-size: 0.9rem; color: var(--color-muted);">
              Hint: Spend Cash and XP on Knowledge Upgrades to improve your skills.
            </p>
          `,
          btnText: "Continue",
          showSkip: false
        });

        TutorialUI.engine.listenOnce(Events.MODAL_BUTTON, () => {
            TutorialUI.engine.dispatchEvent(Events.HIDE_MODAL);
            // Move to next project
            const phase = TutorialUI.engine.state.tutorialCompleted ? BUSINESS_PHASE : TUTORIAL_PHASE;
            const contracts = phase.contracts;
            let nextIndex = TutorialUI.engine.state.contractIndex + 1;

            if (nextIndex < contracts.length) {
              const nextContract = contracts[nextIndex];
              TutorialUI.engine.acceptContract(nextContract.id);
            }
        });
    }
  },
"""

content = re.sub(r'showShippingSplash: \(report\) => \{.*?(?=\s+init:)', replacement, content, flags=re.DOTALL)


# Remove UI callbacks from init signature since Preact will handle UI initialization automatically
content = re.sub(r'init: \(engine, uiCallbacks = \{\}\) => \{', 'init: (engine) => {', content)
content = re.sub(r'const \{.*?\} = uiCallbacks;', '', content, flags=re.DOTALL)
content = re.sub(r'if \(initializeProjectFiles\) initializeProjectFiles\(\);', '', content)
content = re.sub(r'if \(updateProjectUIHeader\) updateProjectUIHeader\(\);', '', content)
content = re.sub(r'if \(logToConsole\).*?;', '', content)
content = re.sub(r'setTimeout\(\(\) => \{.*?if \(updateProjectUIHeader\) updateProjectUIHeader\(\);.*?\}, 100\);', '', content, flags=re.DOTALL)


with open('phase-tutorial.js', 'w') as f:
    f.write(content)
