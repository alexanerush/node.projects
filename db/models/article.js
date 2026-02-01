import { DataTypes } from "sequelize";
import { sequelize } from "../config.js";
import { Comment } from "./comment.js";

export const Article = sequelize.define(
  "Article",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    workspaceId: {
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
    attachments: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
  },
  {
    tableName: "articles",
    timestamps: true,
  }
);

Article.hasMany(Comment, { foreignKey: "articleId", onDelete: "CASCADE" });
Comment.belongsTo(Article, { foreignKey: "articleId" });
