import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

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

function articleFilePath(id) {
  return path.join(DATA_DIR, `${id}.json`);
}

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
      items.push({ id: a.id, title: a.title, createdAt: a.createdAt });
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
    res.json(JSON.parse(raw));
  } catch (e) {
    if (e.code === "ENOENT") return res.status(404).json({ error: "Article not found" });
    next(e);
  }
});


app.put("/api/articles/:id", async (req, res, next) => {
  const { id } = req.params;
  const file = articleFilePath(id);

  try {
    const raw = await fs.promises.readFile(file, "utf8");
    const existing = JSON.parse(raw);

    const { title, content } = req.body;
    if (!title && !content) {
      return res.status(400).json({ error: "Nothing to update" });
    }

    const updated = {
      ...existing,
      title: title ?? existing.title,
      content: content ?? existing.content,
    };

    await fs.promises.writeFile(file, JSON.stringify(updated, null, 2), "utf8");
    res.json(updated);
  } catch (e) {
    if (e.code === "ENOENT") {
      return res.status(404).json({ error: "Article not found" });
    }
    next(e);
  }
});

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

app.use((err, _req, res, _next) => {
  console.error("Server error caught:", err);
  res.status(500).json({ error: "Internal Server Error", details: err.message });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
