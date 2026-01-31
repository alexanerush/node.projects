// Loads .env variables for DB connection
import "dotenv/config";

import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import http from "http";
import { WebSocketServer } from "ws";
import multer from "multer";
import crypto from "crypto";

// Imports Sequelize connection + Article model (PostgreSQL storage)
import { sequelize } from "./db/config.js";
import { Article } from "./db/models/article.js";

console.log("RUNNING FROM:", new URL(import.meta.url).pathname);

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, _res, next) => {
  console.log(`➡ ${req.method} ${req.url}`);
  next();
});

// Folder where uploaded files are stored on disk
const UPLOADS_DIR = path.resolve("uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log("Created uploads folder:", UPLOADS_DIR);
}

// Serves uploaded files so clicking attachment URLs opens them
app.use("/uploads", express.static(UPLOADS_DIR));

// HTTP server needed so WebSocket can share the same port
const server = http.createServer(app);

// WebSocket server used for real-time notifications
const wss = new WebSocketServer({ server });

// Stores which article each client is subscribed to
const subscribedArticleByClient = new Map();

// Sends an event to all clients subscribed to the given articleId
function notifyArticle(articleId, payload) {
  const msg = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState !== 1) continue; // 1 = OPEN
    const sub = subscribedArticleByClient.get(client);
    if (sub === articleId) client.send(msg);
  }
}

// Allows clients to subscribe via {"type":"SUBSCRIBE","articleId":"..."}
wss.on("connection", (ws) => {
  subscribedArticleByClient.set(ws, null);

  ws.on("message", (buf) => {
    try {
      const data = JSON.parse(buf.toString());
      if (data?.type === "SUBSCRIBE" && data.articleId) {
        subscribedArticleByClient.set(ws, String(data.articleId));
      }
    } catch {
      // ignore
    }
  });

  ws.on("close", () => {
    subscribedArticleByClient.delete(ws);
  });
});

// Allowed file types: images + PDF only
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

// Multer config to accept multipart/form-data uploads and save to disk
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || "").toLowerCase();
      cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error("Invalid file type. Only images and PDFs are allowed."));
    }
    cb(null, true);
  },
});

app.get("/__ping", (_req, res) => res.send("pong"));
app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.get("/", (_req, res) => {
  res.send("API is running. Try GET /api/articles");
});

// Lists articles from PostgreSQL
app.get("/api/articles", async (_req, res, next) => {
  try {
    const items = await Article.findAll({
      attributes: ["id", "title", "createdAt"],
      order: [["createdAt", "DESC"]],
    });

    // Keep same shape the client expects
    res.json(
      items.map((a) => ({
        id: String(a.id),
        title: a.title,
        createdAt: a.createdAt,
      }))
    );
  } catch (e) {
    next(e);
  }
});

// Creates an article in PostgreSQL (attachments start empty array)
app.post("/api/articles", async (req, res, next) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    const article = await Article.create({
      title,
      content,
      attachments: [],
    });

    res.status(201).json({
      id: String(article.id),
      title: article.title,
      content: article.content,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      attachments: article.attachments ?? [],
    });
  } catch (e) {
    next(e);
  }
});

// Gets one article from PostgreSQL
app.get("/api/articles/:id", async (req, res, next) => {
  try {
    const article = await Article.findByPk(req.params.id);
    if (!article) return res.status(404).json({ error: "Article not found" });

    res.json({
      id: String(article.id),
      title: article.title,
      content: article.content,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      attachments: Array.isArray(article.attachments) ? article.attachments : [],
    });
  } catch (e) {
    next(e);
  }
});

// Updates title/content (and optionally attachments) in PostgreSQL
app.put("/api/articles/:id", async (req, res, next) => {
  try {
    const { title, content, attachments } = req.body;
    if (title === undefined && content === undefined && attachments === undefined) {
      return res.status(400).json({ error: "Nothing to update" });
    }

    const article = await Article.findByPk(req.params.id);
    if (!article) return res.status(404).json({ error: "Article not found" });

    if (title !== undefined) article.title = title;
    if (content !== undefined) article.content = content;

    if (attachments !== undefined) {
      article.attachments = Array.isArray(attachments)
        ? attachments
        : Array.isArray(article.attachments)
        ? article.attachments
        : [];
    }

    await article.save();

    // Notifies subscribers that the article was edited
    notifyArticle(String(article.id), {
      type: "ARTICLE_UPDATED",
      articleId: String(article.id),
      at: new Date().toISOString(),
    });

    res.json({
      id: String(article.id),
      title: article.title,
      content: article.content,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      attachments: Array.isArray(article.attachments) ? article.attachments : [],
    });
  } catch (e) {
    next(e);
  }
});

// Uploads a file and appends it to article.attachments in PostgreSQL
app.post(
  "/api/articles/:id/attachments",
  upload.single("file"),
  async (req, res, next) => {
    try {
      const article = await Article.findByPk(req.params.id);
      if (!article) return res.status(404).json({ error: "Article not found" });

      if (!req.file) {
        return res.status(400).json({ error: "File is required" });
      }

      const attachment = {
        id: crypto.randomUUID(),
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/${req.file.filename}`,
        createdAt: new Date().toISOString(),
      };

      const current = Array.isArray(article.attachments) ? article.attachments : [];
      article.attachments = [...current, attachment];

      await article.save();

      // Notifies subscribers that a file was attached
      notifyArticle(String(article.id), {
        type: "ATTACHMENT_ADDED",
        articleId: String(article.id),
        attachment,
        at: new Date().toISOString(),
      });

      res.status(201).json({ ok: true, attachment });
    } catch (e) {
      next(e);
    }
  }
);

// Deletes an article from PostgreSQL
app.delete("/api/articles/:id", async (req, res, next) => {
  try {
    const article = await Article.findByPk(req.params.id);
    if (!article) return res.status(404).json({ error: "Article not found" });

    await article.destroy();
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

app.get("/__routes", (_req, res) => {
  const routes = [];
  (app._router?.stack || []).forEach((layer) => {
    if (layer.route?.path) {
      routes.push({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      });
    }
  });
  res.json(routes);
});

// Converts upload validation errors into readable responses
app.use((err, _req, res, _next) => {
  console.error("Server error caught:", err);

  const msg = err?.message || "Internal Server Error";

  if (msg.includes("Invalid file type")) {
    return res.status(400).json({ error: msg });
  }
  if (msg.toLowerCase().includes("file too large")) {
    return res.status(400).json({ error: "File is too large (max 15MB)" });
  }

  res.status(500).json({
    error: "Internal Server Error",
    details: msg,
  });
});

const PORT = 3000;

// Connects to PostgreSQL before starting HTTP + WebSocket server
async function start() {
  await sequelize.authenticate();
  console.log("Connected to database");

  server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    console.log(`WebSocket is running at ws://localhost:${PORT}`);
  });
}

start().catch((e) => {
  console.error("Failed to start server:", e);
  process.exit(1);
});
