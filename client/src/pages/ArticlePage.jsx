import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";

export default function ArticlePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentAuthor, setCommentAuthor] = useState("");
  const [commentErr, setCommentErr] = useState("");

  const [toast, setToast] = useState("");
  const toastTimerRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  function showToast(msg) {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(""), 3000);
  }

  // Load article
  useEffect(() => {
    setErr("");
    setLoading(true);
    api
      .get(id)
      .then(setArticle)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  // Load comments
  useEffect(() => {
    fetch(`http://localhost:3000/api/articles/${id}/comments`)
      .then((r) => r.json())
      .then((data) => setComments(Array.isArray(data) ? data : []))
      .catch(() => setComments([]));
  }, [id]);

  // WebSocket subscribe
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3000");

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "SUBSCRIBE", articleId: id }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === "ARTICLE_UPDATED") {
          showToast("Article has been updated");
          api.get(id).then(setArticle);
        }

        if (msg.type === "ATTACHMENT_ADDED") {
          showToast("New attachment added");
          api.get(id).then(setArticle);
        }
      } catch {}
    };

    return () => ws.close();
  }, [id]);

  // Upload file
  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");
    setUploading(true);

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch(
        `http://localhost:3000/api/articles/${id}/attachments`,
        { method: "POST", body: form }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setUploadError(data.error || "Upload failed");
        showToast(data.error || "Upload failed");
        return;
      }

      showToast("Attachment uploaded");
      api.get(id).then(setArticle);
    } catch (error) {
      setUploadError(error.message);
      showToast(error.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  // Submit comment
  async function submitComment(e) {
    e.preventDefault();
    setCommentErr("");

    if (!commentAuthor.trim() || !commentText.trim()) {
      setCommentErr("Both fields are required");
      return;
    }

    const res = await fetch(
      `http://localhost:3000/api/articles/${id}/comments`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: commentText,
          author: commentAuthor,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      setCommentErr(data.error || "Failed to add");
      return;
    }

    setComments([...comments, data]);
    setCommentText("");
    setCommentAuthor("");
  }

  // Delete comment
  async function deleteComment(commentId) {
    const ok = confirm("Delete comment?");
    if (!ok) return;

    await fetch(`http://localhost:3000/api/comments/${commentId}`, {
      method: "DELETE",
    });

    setComments(comments.filter((c) => c.id !== commentId));
  }

  async function onDelete() {
    if (!window.confirm("Delete this article?")) return;
    try {
      await api.remove(id);
      navigate("/");
    } catch (e) {
      alert(e.message);
    }
  }

  if (loading) return <p style={{ textAlign: "center" }}>Loading…</p>;
  if (err) return <p className="error" style={{ textAlign: "center" }}>{err}</p>;

  return (
    <main className="wrap">

      {/* Toast */}
      {toast && (
        <div className="toast">{toast}</div>
      )}

      {/* HEADER */}
      <div className="page-head">
        <div>
          <h2 className="page-title">{article.title}</h2>
          <p className="muted">
            {new Date(article.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="actions">
          <button className="btn btn-primary"
            onClick={() => navigate(`/articles/${id}/edit`)}
          >Edit</button>

          <button className="btn btn-danger"
            onClick={onDelete}
          >Delete</button>
        </div>
      </div>

      {/* ATTACHMENTS */}
      <section className="section">
        <h3 className="section-title">Attachments</h3>

        <input
          type="file"
          onChange={handleUpload}
          accept="image/*,application/pdf"
        />

        {uploading && <p className="muted">Uploading…</p>}
        {uploadError && <p className="error">{uploadError}</p>}

        {article.attachments.length > 0 ? (
          <ul className="list">
            {article.attachments.map((att) => (
              <li key={att.id}>
                <a href={`http://localhost:3000${att.url}`} target="_blank">
                  {att.originalName} ({Math.round(att.size / 1024)} KB)
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No attachments yet</p>
        )}
      </section>

      {/* ARTICLE CONTENT */}
      <div
        style={{ lineHeight: 1.6, marginBottom: "32px" }}
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      {/* COMMENTS */}
      <section className="section">
        <h3 className="section-title">Comments</h3>

        <form className="form" onSubmit={submitComment}>
          <input
            className="input"
            placeholder="Your name"
            value={commentAuthor}
            onChange={(e) => setCommentAuthor(e.target.value)}
            style={{ color: "var(--ink)" }}
          />

          <textarea
            className="textarea"
            placeholder="Write a comment…"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            style={{ color: "var(--ink)" }}
          />

          {commentErr && <p className="error">{commentErr}</p>}

          <button className="btn btn-primary" type="submit">
            Add Comment
          </button>
        </form>

        {comments.length > 0 ? (
          <ul className="list" style={{ marginTop: "20px" }}>
            {comments.map((c) => (
              <li key={c.id} className="comment">
                <div className="comment-head">
                  <div>
                    <div className="comment-author">{c.author}</div>
                    <div className="comment-text">{c.text}</div>
                    <div className="comment-meta">
                      {new Date(c.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <button
                    className="btn btn-danger"
                    style={{ height: "32px" }}
                    onClick={() => deleteComment(c.id)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted" style={{ marginTop: "10px" }}>
            No comments yet
          </p>
        )}
      </section>
    </main>
  );
}
