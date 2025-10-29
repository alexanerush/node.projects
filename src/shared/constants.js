import path from "path";
import { fileURLToPath } from "url";

export const LOG_LEVELS = {
  SUCCESS: "success",
  ERROR: "error",
  WARN: "warn",
  INFO: "info",
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export const BASE_LOG_DIR = path.join(__dirname, "../../logs/generated");
