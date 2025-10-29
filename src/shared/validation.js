import { z } from "zod";

export const ArticleSchema = z.object({
  title: z.string().min(1, "Title is required").max(120, "Title is too long"),
  content: z.string().min(1, "Content is required"),
});
