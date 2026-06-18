const fs = require('fs');

let css = fs.readFileSync('organizer-app/src/index.css', 'utf-8');

// Replace variable definitions
const themeDefs = `
body[data-theme="dark"] {
  --color-bg: #070d1a;
  --color-bg-card: #0f1729;
  --color-bg-secondary: #111f35;
  --color-border: #1e3a5f;
  --color-text-primary: #ffffff;
  --color-text-secondary: #94a3b8;
  --color-organizer: #0891b2;
  --color-organizer-light: #22d3ee;
}

body[data-theme="light"] {
  --color-bg: #f0f9ff;
  --color-bg-card: #ffffff;
  --color-bg-secondary: #e0f2fe;
  --color-border: #bae6fd;
  --color-text-primary: #0c4a6e;
  --color-text-secondary: #0369a1;
  --color-organizer: #0891b2;
  --color-organizer-light: #0284c7;
}

:root {
  --bg-dark: var(--color-bg);
  --bg-card: var(--color-bg-card);
  --bg-card-2: var(--color-bg-secondary);
  --border: var(--color-border);
  --text-primary: var(--color-text-primary);
  --text-secondary: var(--color-text-secondary);
  --text-muted: #556080;
  --teal: var(--color-organizer);
  --teal-light: var(--color-organizer-light);
`;

css = css.replace(/:root\s*\{[^}]*--teal-light:\s*#[0-9a-fA-F]+;/s, themeDefs);

// Add transitions to body
css = css.replace(/body\s*\{/, 'body {\n  transition: background-color 0.3s ease, color 0.3s ease;');

// Replace hardcoded hex colors that match our theme
// #111827 -> var(--bg-card-2) roughly
css = css.replace(/#111827/g, 'var(--bg-card-2)');
// #2a3a55 -> var(--border) roughly
css = css.replace(/#2a3a55/g, 'var(--border)');

// Write back
fs.writeFileSync('organizer-app/src/index.css', css);
console.log('Done mapping theme colors');
