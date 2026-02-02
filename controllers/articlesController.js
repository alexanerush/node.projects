import crypto from "crypto";
import { Article } from "../db/models/article.js";
import { Comment } from "../db/models/comment.js";
import { Workspace } from "../db/models/workspace.js";
import { ArticleVersion } from "../db/models/articleVersion.js";
import { notifyArticle } from "../lib/ws.js";

export async function listArticles(req, res, next) {
  try {
    const { workspaceId } = req.query;

    const where = {};
    if (workspaceId !== undefined && workspaceId !== null && workspaceId !== "") {
      where.workspaceId = Number(workspaceId);
    }

    const items = await Article.findAll({
      attributes: ["id", "title", "createdAt", "workspaceId"],
      where,
      order: [["createdAt", "DESC"]],
    });

    res.json(
      items.map((a) => ({
        id: String(a.id),
        title: a.title,
        createdAt: a.createdAt,
        workspaceId: a.workspaceId,
      }))
    );
  } catch (e) {
    next(e);
  }
}

export async function getArticle(req, res, next) {
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
      workspaceId: article.workspaceId,
    });
  } catch (e) {
    next(e);
  }
}

export async function createArticle(req, res, next) {
  try {
    const { title, content, workspaceId } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }
    if (workspaceId === undefined || workspaceId === null || workspaceId === "") {
      return res.status(400).json({ error: "workspaceId is required" });
    }

    const workspaceIdNumber = Number(workspaceId);
    if (!Number.isFinite(workspaceIdNumber) || workspaceIdNumber <= 0) {
      return res.status(400).json({ error: "workspaceId must be a positive number" });
    }

    const workspace = await Workspace.findByPk(workspaceIdNumber);
    if (!workspace) {
      return res.status(400).json({ error: `Workspace not found (id=${workspaceIdNumber})` });
    }

    const article = await Article.create({
      title,
      content,
      attachments: [],
      workspaceId: workspaceIdNumber,
    });

    res.status(201).json({
      id: String(article.id),
      title: article.title,
      content: article.content,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      attachments: article.attachments ?? [],
      workspaceId: article.workspaceId,
    });
  } catch (e) {
    next(e);
  }
}

export async function updateArticle(req, res, next) {
  try {
    const { title, content, attachments } = req.body;
    if (title === undefined && content === undefined && attachments === undefined) {
      return res.status(400).json({ error: "Nothing to update" });
    }

    const article = await Article.findByPk(req.params.id);
    if (!article) return res.status(404).json({ error: "Article not found" });

    const lastVersion = await ArticleVersion.findOne({
      where: { articleId: article.id },
      order: [["version", "DESC"]],
    });
    const nextVersion = lastVersion ? lastVersion.version + 1 : 1;

    await ArticleVersion.create({
      articleId: article.id,
      version: nextVersion,
      title: article.title,
      content: article.content,
    });

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
      workspaceId: article.workspaceId,
    });
  } catch (e) {
    next(e);
  }
}

export async function deleteArticle(req, res, next) {
  try {
    const article = await Article.findByPk(req.params.id);
    if (!article) return res.status(404).json({ error: "Article not found" });

    await article.destroy();
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}

export async function listCommentsForArticle(req, res, next) {
  try {
    const { id } = req.params;

    const article = await Article.findByPk(id);
    if (!article) return res.status(404).json({ error: "Article not found" });

    const comments = await Comment.findAll({
      where: { articleId: id },
      order: [["createdAt", "DESC"]],
    });

    res.json(comments);
  } catch (e) {
    next(e);
  }
}

export async function addCommentToArticle(req, res, next) {
  try {
    const { id } = req.params;
    const { author, text } = req.body;

    if (!author || !text) {
      return res.status(400).json({ error: "author and text are required" });
    }

    const article = await Article.findByPk(id);
    if (!article) return res.status(404).json({ error: "Article not found" });

    const comment = await Comment.create({ articleId: id, author, text });
    res.status(201).json(comment);
  } catch (e) {
    next(e);
  }
}

export async function listVersions(req, res, next) {
  try {
    const { id } = req.params;

    const article = await Article.findByPk(id);
    if (!article) return res.status(404).json({ error: "Article not found" });

    const versions = await ArticleVersion.findAll({
      where: { articleId: id },
      attributes: ["version", "title", "createdAt"],
      order: [["version", "DESC"]],
    });

    res.json(
      versions.map((v) => ({
        version: v.version,
        title: v.title,
        createdAt: v.createdAt,
      }))
    );
  } catch (e) {
    next(e);
  }
}

export async function getVersion(req, res, next) {
  try {
    const { id, version } = req.params;

    const article = await Article.findByPk(id);
    if (!article) return res.status(404).json({ error: "Article not found" });

    const v = await ArticleVersion.findOne({
      where: { articleId: id, version: Number(version) },
    });

    if (!v) return res.status(404).json({ error: "Version not found" });

    res.json({
      articleId: String(v.articleId),
      version: v.version,
      title: v.title,
      content: v.content,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
    });
  } catch (e) {
    next(e);
  }
}
