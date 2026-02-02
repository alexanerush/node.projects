import { Workspace } from "../db/models/workspace.js";
import { Article } from "../db/models/article.js";

export async function listWorkspaces(_req, res, next) {
  try {
    const items = await Workspace.findAll({
      attributes: ["id", "name", "createdAt", "updatedAt"],
      order: [["id", "ASC"]],
    });

    res.json(
      items.map((w) => ({
        id: String(w.id),
        name: w.name,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
      }))
    );
  } catch (e) {
    next(e);
  }
}

export async function listWorkspaceArticles(req, res, next) {
  try {
    const workspaceId = Number(req.params.id);

    const items = await Article.findAll({
      attributes: ["id", "title", "createdAt", "workspaceId"],
      where: { workspaceId },
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
