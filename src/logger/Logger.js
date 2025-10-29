import fs from "fs";
import path from "path";
import { LOG_LEVELS } from "../shared/constants.js";

export default class Logger {
  constructor(filePath) {
    this.filePath = filePath;
  }

  async write(level, msg, meta = {}) {
    const entry = { ts: new Date().toISOString(), level, msg, meta };
    const json = JSON.stringify(entry);
    await fs.promises.appendFile(this.filePath, json + "\n", "utf8");
  }

  async success(msg, meta) { return this.write(LOG_LEVELS.SUCCESS, msg, meta); }
  async error(msg, meta)   { return this.write(LOG_LEVELS.ERROR, msg, meta); }
  async warn(msg, meta)    { return this.write(LOG_LEVELS.WARN, msg, meta); }
  async info(msg, meta)    { return this.write(LOG_LEVELS.INFO, msg, meta); }

  static buildFilePath(baseDir, folderName, fileName) {
    return path.join(baseDir, folderName, fileName);
  }
}
