import re

with open('events.js', 'r') as f:
    content = f.read()

# Add new UI Events
content = re.sub(
    r"MODAL_BUTTON: 'modalButton'",
    "MODAL_BUTTON: 'modalButton',\n    SHOW_MODAL: 'showModal',\n    HIDE_MODAL: 'hideModal'",
    content
)

with open('events.js', 'w') as f:
    f.write(content)
