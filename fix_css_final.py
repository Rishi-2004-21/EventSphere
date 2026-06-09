import re

# Read the original pristine file from before any messed up scripts
import subprocess
result = subprocess.run(['git', 'show', 'b40875e:src/index.css'], capture_output=True, text=True, encoding='utf-8')
original_content = result.stdout

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

match = blocks_regex.search(original_content)
if match:
    rest_of_css = original_content[match.end():]
    
    # Do replacements ONLY on the rest of the CSS
    rest_of_css = rest_of_css.replace('#070d1a', 'var(--bg-dark)')
    rest_of_css = rest_of_css.replace('#0f1729', 'var(--bg-card)')
    rest_of_css = rest_of_css.replace('#1e3a5f', 'var(--border)')
    rest_of_css = rest_of_css.replace('#111f35', 'var(--bg-card-2)')
    
    final_content = original_content[:match.start()] + new_vars + rest_of_css
    
    with open('src/index.css', 'w', encoding='utf-8') as f:
        f.write(final_content)
else:
    print("WARNING: Could not find the :root blocks in the original content.")
