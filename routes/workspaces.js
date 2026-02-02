import { Router } from "express";
import { listWorkspaces, listWorkspaceArticles } from "../controllers/workspacesController.js";

const r = Router();

r.get("/", listWorkspaces);
r.get("/:id/articles", listWorkspaceArticles);

export default r;
