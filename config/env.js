export function validateEnv() {
    const required = ["JWT_SECRET"];
  
    for (const key of required) {
      const v = process.env[key];
      if (!v || String(v).trim() === "") {
        console.error(`ERROR: ${key} is missing. Add it to your .env file.`);
        process.exit(1);
      }
    }
  }
  