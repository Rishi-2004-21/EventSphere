import re

with open('src/index.css', 'r', encoding='utf-8') as f:
    content = f.read()

root_block_regex = re.compile(r':root\s*\{[^}]+\}\s*:root\.light-theme\s*\{[^}]+\}', re.MULTILINE)
new_vars = """body[data-theme="dark"] {
  --background: #070d1a;
  --card-background: #0f1729;
  --border-color: #1e3a5f;
  --text-primary: #ffffff;
  --text-secondary: #94a3b8;
  --input-background: #111f35;
  
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
  --text-muted: #556080;
  --bg-dark: var(--background);
  --bg-card: var(--card-background);
  --bg-card-2: var(--input-background);
  --border: var(--border-color);
}

body[data-theme="light"] {
  --background: #f0f4ff;
  --card-background: #ffffff;
  --border-color: #d1d9f0;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --input-background: #e8edf8;
  
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
  --text-muted: #94a3b8;
  --bg-dark: var(--background);
  --bg-card: var(--card-background);
  --bg-card-2: var(--input-background);
  --border: var(--border-color);
}"""

if root_block_regex.search(content):
    content = root_block_regex.sub(new_vars, content)
else:
    print("Could not find the root blocks")

content = content.replace('var(--bg-dark)', 'var(--background)')
content = content.replace('var(--bg-card)', 'var(--card-background)')
content = content.replace('var(--bg-card-2)', 'var(--input-background)')
content = content.replace('var(--border)', 'var(--border-color)')

content = content.replace('#070d1a', 'var(--background)')
content = content.replace('#0f1729', 'var(--card-background)')
content = content.replace('#1e3a5f', 'var(--border-color)')
content = content.replace('#94a3b8', 'var(--text-secondary)')
content = content.replace('#111f35', 'var(--input-background)')

with open('src/index.css', 'w', encoding='utf-8') as f:
    f.write(content)
