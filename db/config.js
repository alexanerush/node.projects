import "dotenv/config";
import { Sequelize } from "sequelize";

const {
  DB_NAME = "articles_db",
  DB_USER = "postgres",
  DB_PASSWORD,
  DB_HOST = "localhost",
  DB_PORT = "5432",
} = process.env;

if (!DB_PASSWORD) {
  throw new Error("DB_PASSWORD is not set. Create .env from .env.example and add password.");
}

export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: Number(DB_PORT),
  dialect: "postgres",
  logging: false,
});
