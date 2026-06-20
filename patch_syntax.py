import re

with open('main.js', 'r') as f:
    content = f.read()

# Fix syntax highlighting in main.js where HTML tags inside highlightSyntax were not rendered correctly
# In Preact, dangerouslySetInnerHTML is used, but we need to make sure the replacement regex doesn't break due to Preact rendering it differently or HTML structure mismatches.
# Actually, the issue is that in the original `highlightSyntax`, we replaced words with span tags, but we should make sure those tags are valid string literals.

# Also Bug rate: NaN% needs to be fixed.

with open('main.js', 'w') as f:
    f.write(content)
