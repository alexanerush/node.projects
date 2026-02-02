import { Router } from "express";
import { uploadAttachment } from "../controllers/attachmentsController.js";

export default function attachmentsRoutes(upload) {
  const r = Router();
  r.post("/articles/:id", upload.single("file"), uploadAttachment);
  return r;
}
