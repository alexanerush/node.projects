import { Comment } from "../db/models/comment.js";

export async function deleteComment(req, res, next) {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findByPk(commentId);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    await comment.destroy();
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}
