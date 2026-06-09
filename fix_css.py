import re

with open('src/index.css', 'r', encoding='utf-8') as f:
    content = f.read()

# First, extract the CSS after the theme blocks to modify it safely
blocks_regex = re.compile(r'(body\[data-theme="dark"\]\s*\{[^}]+\}\s*body\[data-theme="light"\]\s*\{[^}]+\})', re.MULTILINE)

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
}"""

match = blocks_regex.search(content)
if match:
    rest_of_css = content[match.end():]
else:
    # Fallback if something is weird
    rest_of_css = content

# Perform color replacements on rest_of_css
rest_of_css = rest_of_css.replace('#070d1a', 'var(--background)')
rest_of_css = rest_of_css.replace('#0f1729', 'var(--card-background)')
rest_of_css = rest_of_css.replace('#1e3a5f', 'var(--border-color)')
rest_of_css = rest_of_css.replace('#94a3b8', 'var(--text-secondary)')
rest_of_css = rest_of_css.replace('#111f35', 'var(--input-background)')

# Only replace #ffffff and white if it's used for text color or background
# Actually it's safer to use regex for colors
rest_of_css = re.sub(r'(?i)color:\s*#ffffff;?', 'color: var(--text-primary);', rest_of_css)
rest_of_css = re.sub(r'(?i)color:\s*white;?', 'color: var(--text-primary);', rest_of_css)

# A few instances might be text-primary but let's replace all white text
rest_of_css = re.sub(r'(?i)color:\s*#fff;?', 'color: var(--text-primary);', rest_of_css)

# Also fix the weird aliases I left
rest_of_css = rest_of_css.replace('var(--bg-dark)', 'var(--background)')
rest_of_css = rest_of_css.replace('var(--bg-card)', 'var(--card-background)')
rest_of_css = rest_of_css.replace('var(--bg-card-2)', 'var(--input-background)')
rest_of_css = rest_of_css.replace('var(--border)', 'var(--border-color)')

final_content = content[:match.start()] + new_vars + rest_of_css if match else new_vars + rest_of_css

with open('src/index.css', 'w', encoding='utf-8') as f:
    f.write(final_content)
