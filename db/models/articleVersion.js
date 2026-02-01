import { DataTypes } from "sequelize";
import { sequelize } from "../config.js";

export const ArticleVersion = sequelize.define(
  "ArticleVersion",
  {
    articleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
  },
  {
    tableName: "article_versions",
    timestamps: true,
  }
);
