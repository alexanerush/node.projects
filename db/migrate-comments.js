import { sequelize } from "./config.js";

import "./models/comment.js";
import "./models/article.js";

async function migrate() {
  try {
    await sequelize.sync({ alter: true });
    console.log("Comments table ready");
  } catch (e) {
    console.error("Migration failed:", e);
  } finally {
    process.exit();
  }
}

migrate();
