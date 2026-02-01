import { DataTypes } from "sequelize";
import { sequelize } from "../config.js";

export const Workspace = sequelize.define(
  "Workspace",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
  },
  {
    tableName: "workspaces",
    timestamps: true,
  }
);
