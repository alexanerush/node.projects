import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { nanoid } from "nanoid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "../../data");
export const DATA_DIR_PATH = DATA_DIR; 

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function listArticles() {
  await ensureDir();
  const files = await fs.readdir(DATA_DIR);
  const items = [];
  for (const f of files) {
    if (!f.endsWith(".json")) continue;
    const raw = await fs.readFile(path.join(DATA_DIR, f), "utf-8");
    const json = JSON.parse(raw);
    items.push({ id: json.id, title: json.title, createdAt: json.createdAt });
  }
  return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getArticle(id) {
  const filePath = path.join(DATA_DIR, `${id}.json`);
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw);
}

export async function saveArticle(articleData) {
  await ensureDir();
  const article = {
    id: nanoid(12),
    ...articleData,
    createdAt: new Date().toISOString(),
  };
  const filePath = path.join(DATA_DIR, `${article.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(article, null, 2), "utf-8");
  return article;
}
