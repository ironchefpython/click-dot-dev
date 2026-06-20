import re

with open('index.html', 'r') as f:
    content = f.read()

# Add importmap
importmap = """
  <script type="importmap">
    {
      "imports": {
        "preact": "https://esm.sh/preact@10.23.1",
        "preact/hooks": "https://esm.sh/preact@10.23.1/hooks",
        "htm/preact": "https://esm.sh/htm@3.1.1/preact?external=preact"
      }
    }
  </script>
</head>
"""
content = re.sub(r'</head>', importmap, content)

# Clear app-container
content = re.sub(r'<div id="app-container">.*?</div>\s*<script', '<div id="app-container"></div>\n\n  <script', content, flags=re.DOTALL)

# Make main.js a module
content = re.sub(r'<script src="main.js"></script>', '<script type="module" src="main.js"></script>', content)

with open('index.html', 'w') as f:
    f.write(content)
