const fs = require('fs');
const path = require('path');

const rootDir = __dirname;

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (['node_modules', '.git', 'dist', '.vscode'].includes(file)) continue;
      walk(fullPath);
    } else {
      if (!['.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.json', '.md'].includes(path.extname(fullPath))) continue;
      
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      
      if (content.includes('EventSphere')) {
        content = content.replace(/EventSphere/g, 'Tixque');
        changed = true;
      }
      if (content.includes('eventsphere')) {
        content = content.replace(/eventsphere/g, 'tixque');
        changed = true;
      }
      
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated: ' + fullPath);
      }
    }
  }
}

walk(rootDir);
console.log('Done.');
