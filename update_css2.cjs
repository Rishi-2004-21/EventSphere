const fs = require('fs');
let css = fs.readFileSync('organizer-app/src/index.css', 'utf-8');

const topOfFile = `/* ═══════════════════════════════════════════════════════════════
   Tixque Organizer — Design System (Teal Accents)
═══════════════════════════════════════════════════════════════ */

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

body[data-theme="dark"] {
  --color-bg: #070d1a;
  --color-bg-card: #0f1729;
  --color-bg-secondary: #111f35;
  --color-border: #1e3a5f;
  --color-text-primary: #ffffff;
  --color-text-secondary: #94a3b8;
  --color-text-muted: #4a5568;
  --color-organizer-accent: #0891b2;
  --color-organizer-light: #22d3ee;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-input-background: #111f35;
  --color-shadow: rgba(0, 0, 0, 0.5);
}

body[data-theme="light"] {
  --color-bg: #f8fafc;
  --color-bg-card: #ffffff;
  --color-bg-secondary: #f1f5f9;
  --color-border: #e2e8f0;
  --color-text-primary: #0f172a;
  --color-text-secondary: #475569;
  --color-text-muted: #94a3b8;
  --color-organizer-accent: #0891b2;
  --color-organizer-light: #0369a1;
  --color-success: #059669;
  --color-warning: #d97706;
  --color-error: #dc2626;
  --color-input-background: #ffffff;
  --color-shadow: rgba(0, 0, 0, 0.1);
}

body {
  background-color: var(--color-bg);
  color: var(--color-text-primary);
  transition: background-color 0.3s ease, color 0.3s ease;
  font-family: 'Inter', system-ui, sans-serif;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
}

div.card, div[class$="-card"] {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
}

input, textarea, select {
  background: var(--color-input-background);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.navbar {
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
}

.wallet-card {
  background: linear-gradient(135deg, #1a0533 0%, #0d2233 100%) !important;
  color: white !important;
}
.wallet-card * {
  color: white !important;
}

h1, h2, h3 {
  color: var(--color-text-primary);
}

p, span {
  color: var(--color-text-primary);
}

.warning-banner {
  background: rgba(245,158,11,0.15);
  border: 1px solid var(--color-warning);
  color: var(--color-warning);
}
.warning-banner * {
  color: var(--color-warning);
}

:root {
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;
  --shadow-card: 0 4px 24px var(--color-shadow);
  --shadow-glow: 0 0 40px rgba(8,145,178,0.15);
  --transition: all 0.2s ease;
  --teal: var(--color-organizer-accent);
  --teal-light: var(--color-organizer-light);
  --teal-dim: rgba(8,145,178,0.15);
  --teal-glow: rgba(8,145,178,0.3);
  --green: var(--color-success);
  --green-dim: rgba(16,185,129,0.15);
  --red: var(--color-error);
  --red-dim: rgba(239,68,68,0.15);
  --amber: var(--color-warning);
  --amber-dim: rgba(245,158,11,0.15);
  --purple: #8b5cf6;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
a { text-decoration: none; color: inherit; }
button { font-family: inherit; }
input, select, textarea { font-family: inherit; }
`;

// replace lines 1-72
css = css.replace(/[\s\S]*?(?=\.page-wrapper \{)/, topOfFile + '\n');

// replace remaining variables
css = css.replace(/var\(--bg-dark\)/g, 'var(--color-bg)');
css = css.replace(/var\(--bg-card-2\)/g, 'var(--color-bg-secondary)');
css = css.replace(/var\(--bg-card\)/g, 'var(--color-bg-card)');
css = css.replace(/var\(--border\)/g, 'var(--color-border)');
css = css.replace(/var\(--text-primary\)/g, 'var(--color-text-primary)');
css = css.replace(/var\(--text-secondary\)/g, 'var(--color-text-secondary)');
css = css.replace(/var\(--text-muted\)/g, 'var(--color-text-muted)');

fs.writeFileSync('organizer-app/src/index.css', css);
console.log('Updated organizer index.css successfully');
