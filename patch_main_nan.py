import re

with open('main.js', 'r') as f:
    content = f.read()

replacement = """const baseBugRate = engineInstance ? engineInstance.getContractConfig('baseBugRate', 0.05) : 0.05;
                    const compMult = state.complexity * (1 + (state.loc / 450) * (state.purchasedUpgrades.includes('framework') ? 0.7 : 1.0));
                    const linterRed = state.purchasedUpgrades.includes('linter') ? 0.6 : 1.0;
                    const bugRate = Formulas.calculateBugIntroProb(baseBugRate, compMult, linterRed);
                    return `${(bugRate * 100).toFixed(1)}%`;"""

content = re.sub(
    r'`\$\{\(Formulas\.calculateBugIntroProb\(engineInstance\.getContractConfig\(\'baseBugRate\', 0\.05\), state\.complexity \* \(1 \+ \(state\.loc \/ 450\) \* \(state\.purchasedUpgrades\.includes\(\'framework\'\) \? 0\.7 : 1\.0\)\), state\.purchasedUpgrades\.includes\(\'linter\'\) \? 0\.6 : 1\.0\) \* 100\)\.toFixed\(1\)\}%`',
    '`${(() => {' + replacement + '})()}`',
    content
)

# Use simple string replace to avoid re group errors
with open('main.js', 'w') as f:
    f.write(content)
