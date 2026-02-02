import { Router } from "express";
import { deleteComment } from "../controllers/commentsController.js";

const r = Router();

r.delete("/:commentId", deleteComment);

export default r;
