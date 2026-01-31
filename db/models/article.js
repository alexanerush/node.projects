import { DataTypes } from "sequelize";
import { sequelize } from "../config.js";

export const Article = sequelize.define(
  "Article",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    attachments: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },      
  },
  {
    tableName: "articles",
    timestamps: true, // createdAt, updatedAt
  }
);
