import { sequelize } from "./config.js";

async function migrate() {
  try {
    await sequelize.authenticate();

    await sequelize.getQueryInterface().addColumn("users", "role", {
      type: "VARCHAR(255)",
      allowNull: false,
      defaultValue: "user",
    });

    console.log("role column added to users");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await sequelize.close();
  }
}

migrate();
