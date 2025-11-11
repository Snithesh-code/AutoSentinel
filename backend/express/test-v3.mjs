import { generateYAML } from './utils/yamlGenerator.js';
import fs from 'fs/promises';

// Load the v3 template from networkConstants
const { NETWORK_TEMPLATES } = await import('./src/utils/networkConstants.js');
const v3 = NETWORK_TEMPLATES.v3;

const yaml = await generateYAML(v3);

// Write to file for inspection
await fs.writeFile('test-v3-generated.yaml', yaml);
console.log('Generated v3 template YAML');

// Show agents section
const lines = yaml.split('\n');
let inAgents = false;
let agentCount = 0;
let lineCount = 0;
for (const line of lines) {
  if (line.includes('agents:')) {
    inAgents = true;
  }
  if (inAgents) {
    console.log(line);
    lineCount++;
    if (line.includes('ref:')) agentCount++;
    if (lineCount > 250) break;
  }
}

console.log(`\n✅ Generated YAML with ${agentCount} agents`);
