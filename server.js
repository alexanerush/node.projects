import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

import http from "http";

import { WebSocketServer } from "ws";

import multer from "multer";

import crypto from "crypto";

console.log("RUNNING FROM:", new URL(import.meta.url).pathname);

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, _res, next) => {
  console.log(`➡ ${req.method} ${req.url}`);
  next();
});

const DATA_DIR = path.resolve("data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log("Created data folder:", DATA_DIR);
}

// Folder where uploaded files 
const UPLOADS_DIR = path.resolve("uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log("Created uploads folder:", UPLOADS_DIR);
}

function articleFilePath(id) {
  return path.join(DATA_DIR, `${id}.json`);
}


app.use("/uploads", express.static(UPLOADS_DIR));


const server = http.createServer(app);

const wss = new WebSocketServer({ server }); // WebSocket server that sends real-time notifications 

const subscribedArticleByClient = new Map();


function notifyArticle(articleId, payload) {
  const msg = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState !== 1) continue; // 1 = open
    const sub = subscribedArticleByClient.get(client);
    if (sub === articleId) client.send(msg);
  }
}

wss.on("connection", (ws) => {
  subscribedArticleByClient.set(ws, null);

  ws.on("message", (buf) => {
    try {
      const data = JSON.parse(buf.toString());
      if (data?.type === "SUBSCRIBE" && data.articleId) {
        subscribedArticleByClient.set(ws, String(data.articleId));
      }
    } catch {
      // Ignore invalid messages (not required by rubric, just prevents crashes)
    }
  });

  ws.on("close", () => {
    subscribedArticleByClient.delete(ws);
  });
});

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || "").toLowerCase();
      cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 15 * 1024 * 1024 }, 
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(
        new Error("Invalid file type. Only images and PDFs are allowed.")
      );
    }
    cb(null, true);
  },
});

app.get("/__ping", (_req, res) => res.send("pong"));
app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.get("/", (_req, res) => {
  res.send("API is running. Try GET /api/articles");
});

app.get("/api/articles", async (_req, res, next) => {
  console.log("GET /api/articles triggered");
  try {
    const files = await fs.promises.readdir(DATA_DIR);
    const items = [];
    for (const f of files) {
      if (!f.endsWith(".json")) continue;
      const filePath = path.join(DATA_DIR, f);
      const raw = await fs.promises.readFile(filePath, "utf8");
      const a = JSON.parse(raw);
      items.push({
        id: a.id,
        title: a.title,
        createdAt: a.createdAt,
      });
    }
    items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(items);
  } catch (e) {
    console.error("Error in GET /api/articles:", e);
    next(e);
  }
});

app.post("/api/articles", async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required" });
  }

  const article = {
    id: Date.now().toString(),
    title,
    content,
    createdAt: new Date().toISOString(),
    attachments: [],
  };

  const filePath = articleFilePath(article.id);
  await fs.promises.writeFile(filePath, JSON.stringify(article, null, 2), "utf8");
  console.log("Saved:", filePath);
  res.status(201).json(article);
});

app.get("/api/articles/:id", async (req, res, next) => {
  try {
    const file = articleFilePath(req.params.id);
    const raw = await fs.promises.readFile(file, "utf8");
    const article = JSON.parse(raw);

    if (!Array.isArray(article.attachments)) {
      article.attachments = [];
    }

    res.json(article);
  } catch (e) {
    if (e.code === "ENOENT")
      return res.status(404).json({ error: "Article not found" });
    next(e);
  }
});

app.put("/api/articles/:id", async (req, res, next) => {
  const { id } = req.params;
  const file = articleFilePath(id);

  try {
    const raw = await fs.promises.readFile(file, "utf8");
    const existing = JSON.parse(raw);

    const { title, content, attachments } = req.body;

    if (!title && !content && !attachments) {
      return res.status(400).json({ error: "Nothing to update" });
    }

    const updated = {
      ...existing,
      title: title ?? existing.title,
      content: content ?? existing.content,
      attachments: Array.isArray(attachments)
        ? attachments
        : Array.isArray(existing.attachments)
        ? existing.attachments
        : [],
    };

    await fs.promises.writeFile(file, JSON.stringify(updated, null, 2), "utf8");

    notifyArticle(String(id), {
      type: "ARTICLE_UPDATED",
      articleId: String(id),
      at: new Date().toISOString(),
    });

    res.json(updated);
  } catch (e) {
    if (e.code === "ENOENT") {
      return res.status(404).json({ error: "Article not found" });
    }
    next(e);
  }
});


app.post(
  "/api/articles/:id/attachments",
  upload.single("file"),
  async (req, res, next) => {
    const { id } = req.params;

    try {
      const file = articleFilePath(id);
      const raw = await fs.promises.readFile(file, "utf8");
      const article = JSON.parse(raw);

      if (!Array.isArray(article.attachments)) article.attachments = [];

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

      article.attachments.push(attachment);

      await fs.promises.writeFile(file, JSON.stringify(article, null, 2), "utf8");

      notifyArticle(String(id), {
        type: "ATTACHMENT_ADDED",
        articleId: String(id),
        attachment,
        at: new Date().toISOString(),
      });

      res.status(201).json({ ok: true, attachment });
    } catch (e) {
      if (e.code === "ENOENT") {
        return res.status(404).json({ error: "Article not found" });
      }
      next(e);
    }
  }
);

app.delete("/api/articles/:id", async (req, res, next) => {
  const { id } = req.params;
  const file = articleFilePath(id);

  try {
    await fs.promises.access(file, fs.constants.F_OK);
  } catch {
    return res.status(404).json({ error: "Article not found" });
  }

  try {
    await fs.promises.unlink(file);
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

// Converts upload validation errors into readable 400 responses 
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

server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
  console.log(`WebSocket is running at ws://localhost:${PORT}`);
});
