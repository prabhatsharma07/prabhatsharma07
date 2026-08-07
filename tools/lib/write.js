const fs = require('fs');
const path = require('path');
const { themes } = require('./theme');

const ASSETS = path.join(__dirname, '..', '..', 'assets');

function writeAsset(name, contents) {
  fs.mkdirSync(ASSETS, { recursive: true });
  const file = path.join(ASSETS, name);
  const previous = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  fs.writeFileSync(file, contents);
  console.log(`${previous === contents ? 'unchanged' : 'updated  '}  assets/${name}`);
}

function writeThemedAssets(name, render, ...args) {
  for (const key of ['dark', 'light']) {
    writeAsset(`${name}-${key}.svg`, render(themes[key], ...args));
  }
}

module.exports = { writeAsset, writeThemedAssets, ASSETS };
