import crypto from "crypto";
import { Article } from "../db/models/article.js";
import { notifyArticle } from "../lib/ws.js";

export async function uploadAttachment(req, res, next) {
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
