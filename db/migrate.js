import "dotenv/config";
import { sequelize } from "./config.js";
import { Article } from "./models/article.js";

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log("DB connected");

    // Creates the table if it doesn't exist
    await Article.sync({ alter: false });
    console.log("Migration complete: articles table is ready");

    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  }
}

migrate();
