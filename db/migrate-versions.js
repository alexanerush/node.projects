import "dotenv/config";
import { sequelize } from "./config.js";
import { DataTypes } from "sequelize";

async function migrate() {
  const queryInterface = sequelize.getQueryInterface();

  const tables = await queryInterface.showAllTables();
  const hasTable = tables.map(String).includes("article_versions");

  if (!hasTable) {
    await queryInterface.createTable("article_versions", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      articleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "articles", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      version: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    await queryInterface.addIndex(
      "article_versions",
      ["articleId", "version"],
      {
        unique: true,
        name: "article_versions_articleId_version_unique",
      }
    );

    console.log("article_versions created");
  } else {
    console.log("article_versions already exists");
  }

  await sequelize.close();
  process.exit(0);
}

migrate().catch(async (e) => {
  console.error("migrate-versions failed:", e);
  try {
    await sequelize.close();
  } catch {}
  process.exit(1);
});
