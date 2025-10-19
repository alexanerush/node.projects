const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { LOG_LEVELS, BASE_LOG_DIR } = require('../shared/constants');

const VALID_TYPES = Object.values(LOG_LEVELS);

function parseArgs(argv) {
  const args = { type: null, help: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') args.help = true;
    else if (a === '--type') { args.type = argv[i + 1]; i++; }
    else if (a.startsWith('--type=')) { args.type = a.split('=')[1]; }
  }
  return args;
}

function printHelp() {
  console.log(`Usage: node src/analyzer/index.js [--type <success|error|warn|info>] [--help]
Analyzes logs in ${BASE_LOG_DIR}
Examples:
  node src/analyzer/index.js
  node src/analyzer/index.js --type error
  node src/analyzer/index.js --type=success`);
}

async function* walk(dir) {
  try {
    const items = await fs.promises.readdir(dir, { withFileTypes: true });
    for (const it of items) {
      const full = path.join(dir, it.name);
      if (it.isDirectory()) yield* walk(full);
      else yield full;
    }
  } catch (e) {
    if (e.code === 'ENOENT') return; 
    throw e;
  }
}

async function analyze(typeFilter = null) {
  const counts = { success: 0, error: 0, warn: 0, info: 0, total: 0 };
  let filteredCount = 0;
  let filesScanned = 0;

  for await (const filePath of walk(BASE_LOG_DIR)) {
    if (!filePath.endsWith('.log')) continue;
    filesScanned++;
    const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

    for await (const line of rl) {
      if (!line.trim()) continue;
      try {
        const entry = JSON.parse(line);
        if (entry.level && counts.hasOwnProperty(entry.level)) {
          counts[entry.level]++;
        }
        counts.total++;
        if (!typeFilter || entry.level === typeFilter) filteredCount++;
      } catch (_) {
      }
    }
  }

  return { counts, filteredCount, filesScanned };
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) return printHelp();

  const type = args.type ? String(args.type).toLowerCase() : null;
  if (type && !VALID_TYPES.includes(type)) {
    console.error(`Unknown type '${type}'. Valid: ${VALID_TYPES.join(', ')}`);
    printHelp();
    process.exit(2);
  }

  try {
    const { counts, filteredCount, filesScanned } = await analyze(type);
    console.log('--- Log Analyzer Summary ---');
    console.log('Log directory:', BASE_LOG_DIR);
    console.log('Files scanned:', filesScanned);
    console.log('Counts by level:', counts);
    if (type) console.log(`Matched entries for type='${type}':`, filteredCount);
    else console.log('Total entries (all types):', counts.total);
  } catch (e) {
    console.error('[analyzer] Failed:', e.message);
    process.exit(1);
  }
}

main();
