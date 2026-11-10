// 1. Load Required Modules and Room Data
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'js/puzzles.js'), 'utf8'), ctx);
const ROOMS = vm.runInContext('ROOMS', ctx);