import re

with open('src/index.css', 'r', encoding='utf-8') as f:
    content = f.read()

blocks_regex = re.compile(r':root\s*\{[^}]+\}\s*:root\.light-theme\s*\{[^}]+\}', re.MULTILINE)

new_vars = """body[data-theme="dark"] {
  --bg-dark: #070d1a;
  --bg-card: #0f1729;
  --bg-card-2: #111f35;
  --border: #1e3a5f;
  --text-primary: #ffffff;
  --text-secondary: #94a3b8;
  --text-muted: #556080;
  --purple: #8b5cf6;
  --purple-light: #a78bfa;
  --purple-dim: rgba(139,92,246,0.15);
  --purple-glow: rgba(139,92,246,0.3);
  --green: #10b981;
  --green-dim: rgba(16,185,129,0.15);
  --red: #ef4444;
  --red-dim: rgba(239,68,68,0.15);
  --amber: #f59e0b;
  --amber-dim: rgba(245,158,11,0.15);
  --teal: #0891b2;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;
  --shadow-card: 0 4px 24px rgba(0,0,0,0.5);
  --shadow-glow: 0 0 40px rgba(139,92,246,0.18);
  --transition: all 0.2s ease;
}

body[data-theme="light"] {
  --bg-dark: #f0f4ff;
  --bg-card: #ffffff;
  --bg-card-2: #e8edf8;
  --border: #d1d9f0;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #94a3b8;
  --purple: #7c3aed;
  --purple-light: #8b5cf6;
  --purple-dim: rgba(124,58,237,0.15);
  --purple-glow: rgba(124,58,237,0.3);
  --green: #059669;
  --green-dim: rgba(5,150,105,0.15);
  --red: #dc2626;
  --red-dim: rgba(220,38,38,0.15);
  --amber: #d97706;
  --amber-dim: rgba(217,119,6,0.15);
  --shadow-card: 0 4px 20px rgba(0,0,0,0.06);
  --shadow-glow: 0 0 40px rgba(124,58,237,0.12);
}"""

if blocks_regex.search(content):
    content = blocks_regex.sub(new_vars, content)
else:
    print("WARNING: Could not find the :root blocks to replace.")

# Replace any lingering hardcoded theme colors
content = content.replace('#070d1a', 'var(--bg-dark)')
content = content.replace('#0f1729', 'var(--bg-card)')
content = content.replace('#1e3a5f', 'var(--border)')
content = content.replace('#111f35', 'var(--bg-card-2)')

# The user asked to replace #ffffff text with text-primary.
# I will only replace specific cases where it's used for text, but avoiding buttons.
# Let's just fix specific known bad ones, like "color: #ffffff" in event-card? Wait, event-card uses --text-primary.
# Is there any text that's explicitly #ffffff that shouldn't be? Let's check EventCard.jsx, maybe?

with open('src/index.css', 'w', encoding='utf-8') as f:
    f.write(content)
