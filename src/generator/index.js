/**
 * Log Generator
 * - Every minute: create a new folder (YYYY-MM-DD_HH-mm).
 * - Every 10 seconds: create a new log file and write random entries.
 */
const fs = require('fs');
const path = require('path');
const { Logger } = require('../logger/Logger');
const { LOG_LEVELS, BASE_LOG_DIR } = require('../shared/constants');

fs.mkdirSync(BASE_LOG_DIR, { recursive: true });

function pad(n) { return String(n).padStart(2, '0'); }

function formatFolderName(d) {
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}`;
}

function formatFileName(d) {
  return `log_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}.log`;
}

let currentFolder = null;

async function ensureMinuteFolder() {
  const now = new Date();
  const folderName = formatFolderName(now);
  if (folderName !== currentFolder) {
    currentFolder = folderName;
    const fullPath = path.join(BASE_LOG_DIR, currentFolder);
    await fs.promises.mkdir(fullPath, { recursive: true });
    console.log('[generator] New minute folder:', fullPath);
  }
  return currentFolder;
}

function choice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function randomMsg(level) {
  const pool = {
    success: ['Order processed', 'Payment completed', 'Cache refreshed', 'Email sent', 'Job finished'],
    error:   ['DB connection failed', 'Timeout', 'Unhandled exception', 'Invalid payload', 'Permission denied'],
    warn:    ['High memory usage', 'Retry scheduled', 'Deprecated API', 'Slow response', 'Low disk space'],
    info:    ['Heartbeat', 'User ping', 'Background task', 'Metrics flush', 'Cron tick'],
  };
  return (pool[level] || ['Event'])[Math.floor(Math.random() * (pool[level]?.length || 1))];
}

async function writeRandomLogFile(folderName) {
  const now = new Date();
  const fileName = formatFileName(now);
  const filePath = path.join(BASE_LOG_DIR, folderName, fileName);
  const logger = new Logger(filePath);

  const count = 10 + Math.floor(Math.random() * 21); 

  for (let i = 0; i < count; i++) {
    const level = choice(['success', 'error', 'warn', 'info']);
    const msg = randomMsg(level);
    const meta = { iteration: i + 1, file: fileName };
    await logger.write(level, msg, meta);
  }
  console.log(`[generator] Wrote ${count} entries to ${fileName}`);
}

async function main() {
  await ensureMinuteFolder();

  setInterval(ensureMinuteFolder, 1000);

  setInterval(async () => {
    try {
      const folder = await ensureMinuteFolder();
      await writeRandomLogFile(folder);
    } catch (e) {
      console.error('[generator] Error writing log file:', e.message);
    }
  }, 10 * 1000);
}

main().catch((e) => {
  console.error('[generator] Fatal:', e);
  process.exit(1);
});
