// src/scripts/script-loader.js
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Register ts-node programmatically
const tsNode = require('ts-node');
tsNode.register({
  transpileOnly: true,
  compilerOptions: {
    module: 'NodeNext',
    moduleResolution: 'NodeNext',
  },
  esm: true,
});

// Get the script name from args
const scriptName = process.argv[2];
if (!scriptName) {
  console.error('Script name is required as an argument');
  process.exit(1);
}

// Import and run the requested TypeScript file
try {
  await import(`./${scriptName}.ts`);
} catch (error) {
  console.error(`Error running script ${scriptName}.ts:`, error);
  process.exit(1);
}

