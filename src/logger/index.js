import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Logger from "./Logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logFilePath = path.join(__dirname, "../../logs/server.log");

await fs.promises.mkdir(path.dirname(logFilePath), { recursive: true });
const logger = new Logger(logFilePath);

export default function requestLogger() {
  return async (req, res, next) => {
    const start = Date.now();
    res.on("finish", async () => {
      const duration = Date.now() - start;
      const meta = {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration: `${duration}ms`,
      };
      await logger.info("Request handled", meta);
    });
    next();
  };
}
