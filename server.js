import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";

import { sequelize } from "./db/config.js";

import { validateEnv } from "./config/env.js";
import { authRequired } from "./middleware/authRequired.js";

import { UPLOADS_DIR } from "./lib/uploads.js";
import { setupWebSocket } from "./lib/ws.js";

import authRoutes from "./routes/auth.js";
import articlesRoutes from "./routes/articles.js";
import workspacesRoutes from "./routes/workspaces.js";
import commentsRoutes from "./routes/comments.js";
import versionsRoutes from "./routes/versions.js";
import attachmentsRoutes from "./routes/attachments.js";

validateEnv();

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, _res, next) => {
  console.log(`➡ ${req.method} ${req.url}`);
  next();
});

app.use("/uploads", express.static(UPLOADS_DIR));

app.get("/__ping", (_req, res) => res.send("pong"));
app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.get("/", (_req, res) => {
  res.send("API is running. Try GET /api/health");
});

// PUBLIC
app.use("/api/auth", authRoutes);

app.use("/api", authRequired);

app.use("/api/articles", articlesRoutes);
app.use("/api/workspaces", workspacesRoutes);
app.use("/api/comments", commentsRoutes);
app.use("/api/versions", versionsRoutes);
app.use("/api/attachments", attachmentsRoutes);

// 404
app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));


app.use((err, _req, res, _next) => {
  console.error("Server error caught:", err);

  const msg = err?.message || "Internal Server Error";

  if (msg.includes("Invalid file type"))
    return res.status(400).json({ error: msg });

  if (msg.toLowerCase().includes("file too large"))
    return res.status(400).json({ error: "File is too large (max 15MB)" });

  return res.status(500).json({ error: "Internal Server Error", details: msg });
});

const PORT = 3000;

async function start() {
  await sequelize.authenticate();
  console.log("Connected to database");

  const server = http.createServer(app);
  setupWebSocket(server);

  server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    console.log(`WebSocket is running at ws://localhost:${PORT}`);
  });
}

start().catch((e) => {
  console.error("Failed to start server:", e);
  process.exit(1);
});
