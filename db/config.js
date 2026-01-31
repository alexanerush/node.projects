import "dotenv/config";
import { Sequelize } from "sequelize";


export const sequelize = new Sequelize(
  process.env.DB_NAME || "articles_db",
  process.env.DB_USER || "postgres",
  process.env.DB_PASSWORD || "postgres",
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    logging: false,
  }
);
