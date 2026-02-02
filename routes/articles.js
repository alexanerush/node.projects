import { Router } from "express";
import {
  listArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  listCommentsForArticle,
  addCommentToArticle,
  listVersions,
  getVersion,
} from "../controllers/articlesController.js";

const r = Router();

r.get("/", listArticles);
r.post("/", createArticle);

r.get("/:id", getArticle);
r.put("/:id", updateArticle);
r.delete("/:id", deleteArticle);

r.get("/:id/comments", listCommentsForArticle);
r.post("/:id/comments", addCommentToArticle);

r.get("/:id/versions", listVersions);
r.get("/:id/versions/:version", getVersion);

export default r;
