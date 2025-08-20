const fs = require('fs');
const html = fs.readFileSync('D:/A/iCloudDrive/HY/_Work/2025.08.18 - Subs Prompt Generator/_CODE/index.html', 'utf8');

// Get the first script block
const match = html.match(/<script>([\s\S]*?)<\/script>/);
if (!match) {
  console.log('No script found');
  process.exit(1);
}

const script = match[1];
const lines = script.split('\n');

console.log('=== SCRIPT ARCHITECTURE ANALYSIS ===');
console.log('Total lines:', lines.length);
console.log('');

// Track nesting levels
let depth = 0;
let structures = [];
let inFunction = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();
  
  // Track function declarations
  if (trimmed.startsWith('function ') || trimmed.includes('= function')) {
    const funcName = trimmed.match(/function\s+(\w+)/) || trimmed.match(/(\w+)\s*=\s*function/);
    if (funcName) {
      inFunction = { name: funcName[1], line: i + 1, startDepth: depth };
      structures.push({ type: 'function', name: funcName[1], line: i + 1, depth });
    }
  }
  
  // Track anonymous functions
  if (trimmed.includes('function(') || trimmed.includes('function (')) {
    if (!inFunction) {
      structures.push({ type: 'anonymous', line: i + 1, depth });
    }
  }
  
  // Track depth changes
  for (const char of line) {
    if (char === '{') {
      depth++;
    } else if (char === '}') {
      depth--;
      // Check if we're closing a function
      if (inFunction && depth === inFunction.startDepth) {
        inFunction = null;
      }
    }
  }
}

console.log('Final depth:', depth);
console.log('');

// Show key structures
console.log('KEY STRUCTURES (last 10):');
structures.slice(-10).forEach(s => {
  console.log(`Line ${s.line}: ${s.type} ${s.name || ''} at depth ${s.depth}`);
});

// Check for IIFE
const hasIIFE = script.includes('(function()') || script.includes('(function(');
console.log('\nHas IIFE wrapper:', hasIIFE);

// Check start and end
console.log('\nFirst 5 code lines:');
lines.slice(0, 5).forEach((l, i) => {
  if (l.trim()) console.log(i + 1, ':', l.substring(0, 60));
});

console.log('\nLast 5 code lines:');
lines.slice(-5).forEach((l, i) => {
  if (l.trim()) console.log(lines.length - 5 + i + 1, ':', l.substring(0, 60));
});
