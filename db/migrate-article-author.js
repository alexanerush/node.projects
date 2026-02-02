import { sequelize } from "./config.js";

async function migrate() {
  try {
    await sequelize.authenticate();

    const qi = sequelize.getQueryInterface();

    await qi.addColumn("articles", "authorId", {
      type: "INTEGER",
      allowNull: true,
    });

    await sequelize.query(`UPDATE articles SET "authorId" = 1 WHERE "authorId" IS NULL`);

    await qi.changeColumn("articles", "authorId", {
      type: "INTEGER",
      allowNull: false,
    });

    console.log("authorId column added to articles");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await sequelize.close();
  }
}

migrate();
