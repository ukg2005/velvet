const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
      callback(path.join(dir, f));
    }
  });
}

const dirs = ['./components', './app'];
dirs.forEach(d => {
  walkDir(d, (filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('crossOrigin="anonymous"')) {
      const replaced = content.replace(/\s*crossOrigin="anonymous"/g, '');
      fs.writeFileSync(filePath, replaced, 'utf8');
      console.log('Fixed', filePath);
    }
  });
});
