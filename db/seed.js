import "dotenv/config";
import { sequelize } from "./config.js";
import { Workspace } from "./models/workspace.js";

async function seed() {
  try {
    await sequelize.authenticate();
    console.log("DB connected (seed)");

    const defaults = ["Personal", "School"];

    for (const name of defaults) {
      await Workspace.findOrCreate({ where: { name } });
    }

    console.log("Seed complete: default workspaces ensured");
    await sequelize.close();
    process.exit(0);
  } catch (e) {
    console.error("Seed failed:", e);
    try { await sequelize.close(); } catch {}
    process.exit(1);
  }
}

seed();
