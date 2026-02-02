import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { api, getToken } from "../api";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function ArticlePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const versionParam = useMemo(() => {
    const sp = new URLSearchParams(location.search);
    const v = sp.get("version");
    return v && /^\d+$/.test(v) ? Number(v) : null;
  }, [location.search]);

  const isOldVersion = versionParam !== null;

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [versions, setVersions] = useState([]);
  const [versionsErr, setVersionsErr] = useState("");

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

  async function loadVersions() {
    setVersionsErr("");
    try {
      const r = await fetch(`${BASE_URL}/api/articles/${id}/versions`);
      const data = await r.json().catch(() => []);
      if (!r.ok) {
        setVersions([]);
        setVersionsErr(data?.error || "Failed to load versions");
        return;
      }
      setVersions(Array.isArray(data) ? data : []);
    } catch (e) {
      setVersions([]);
      setVersionsErr(e.message);
    }
  }

  useEffect(() => {
    loadVersions();
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    setErr("");
    setLoading(true);

    (async () => {
      try {
        if (isOldVersion) {
          const r = await fetch(`${BASE_URL}/api/articles/${id}/versions/${versionParam}`);
          const data = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error(data?.error || "Failed to load version");
          if (cancelled) return;

          const latest = await api.get(id).catch(() => null);

          setArticle({
            id: String(id),
            title: data.title,
            content: data.content,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            attachments: Array.isArray(latest?.attachments) ? latest.attachments : [],
            author: latest?.author ?? null,
          });
        } else {
          const a = await api.get(id);
          if (cancelled) return;
          setArticle(a);
        }
      } catch (e) {
        if (!cancelled) setErr(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, isOldVersion, versionParam]);

  useEffect(() => {
    if (isOldVersion) {
      setComments([]);
      return;
    }
    fetch(`${BASE_URL}/api/articles/${id}/comments`)
      .then((r) => r.json())
      .then((data) => setComments(Array.isArray(data) ? data : []))
      .catch(() => setComments([]));
  }, [id, isOldVersion]);

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
          loadVersions();
          if (!isOldVersion) api.get(id).then(setArticle).catch(() => {});
        }

        if (msg.type === "ATTACHMENT_ADDED") {
          showToast("New attachment added");
          if (!isOldVersion) api.get(id).then(setArticle).catch(() => {});
        }
      } catch {}
    };

    return () => ws.close();
  }, [id, isOldVersion]);

  function goToLatest() {
    navigate(`/articles/${id}`);
  }

  function goToVersion(v) {
    navigate(`/articles/${id}?version=${v}`);
  }

  function onVersionPickerChange(e) {
    const val = e.target.value;
    if (val === "latest") goToLatest();
    else goToVersion(Number(val));
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");
    setUploading(true);

    const form = new FormData();
    form.append("file", file);

    try {
      const token = getToken();
      if (!token) {
        setUploadError("Missing token");
        showToast("Missing token");
        return;
      }

      const res = await fetch(`${BASE_URL}/api/articles/${id}/attachments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setUploadError(data.error || "Upload failed");
        showToast(data.error || "Upload failed");
        return;
      }

      showToast("Attachment uploaded");
      api.get(id).then(setArticle).catch(() => {});
    } catch (error) {
      setUploadError(error.message);
      showToast(error.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function submitComment(e) {
    e.preventDefault();
    setCommentErr("");

    if (!commentAuthor.trim() || !commentText.trim()) {
      setCommentErr("Both fields are required");
      return;
    }

    const token = getToken();
    if (!token) {
      setCommentErr("Missing token");
      showToast("Missing token");
      return;
    }

    const res = await fetch(`${BASE_URL}/api/articles/${id}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        text: commentText,
        author: commentAuthor,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setCommentErr(data.error || "Failed to add");
      return;
    }

    setComments([...comments, data]);
    setCommentText("");
    setCommentAuthor("");
  }

  async function deleteComment(commentId) {
    const ok = confirm("Delete comment?");
    if (!ok) return;

    const token = getToken();
    if (!token) {
      showToast("Missing token");
      return;
    }

    const res = await fetch(`${BASE_URL}/api/comments/${commentId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      showToast(data.error || "Failed to delete");
      return;
    }

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

  const attachments = Array.isArray(article?.attachments) ? article.attachments : [];
  const isAdminArticle = article?.author?.role === "admin";

  // ---- UI permissions (hide buttons for non-author/non-admin) ----
  let me = null;
  try {
    const token = getToken();
    if (token) me = JSON.parse(atob(token.split(".")[1]));
  } catch {
    me = null;
  }

  const canEdit =
    !isOldVersion &&
    !!me &&
    (me.role === "admin" || String(me.id) === String(article?.author?.id));

  const canDelete = canEdit;
  const canManage = canEdit; // attachments + comment delete

  return (
    <main className="wrap">
      {toast && <div className="toast">{toast}</div>}

      {isOldVersion && (
        <div className="version-banner">
          <div className="version-banner__left">
            <strong>Viewing version {versionParam}</strong>{" "}
            <span className="muted">— read-only</span>
          </div>
          <button className="btn btn-primary" onClick={goToLatest}>
            Back to latest
          </button>
        </div>
      )}

      <div className="page-head">
        <div>
          <h2 className="page-title">
            {article.title}
            {isAdminArticle ? <span style={{ marginLeft: 8 }}>⭐</span> : null}
          </h2>

          <p className="muted">
            {new Date(article.createdAt).toLocaleString()}
            {isOldVersion ? <> · <span className="muted">v{versionParam}</span></> : null}
          </p>

          {versionsErr && <p className="error version-error">{versionsErr}</p>}
        </div>

        <div className="actions">
          <select
            className="input version-select"
            value={isOldVersion ? String(versionParam) : "latest"}
            onChange={onVersionPickerChange}
          >
            <option value="latest">Latest</option>
            {versions.map((v) => (
              <option key={v.version} value={String(v.version)}>
                v{v.version} · {new Date(v.createdAt).toLocaleDateString()}
              </option>
            ))}
          </select>

          {canEdit && (
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/articles/${id}/edit`)}
              disabled={isOldVersion}
              title={isOldVersion ? "Old versions are read-only" : "Edit"}
            >
              Edit
            </button>
          )}

          {canDelete && (
            <button className="btn btn-danger" onClick={onDelete} disabled={isOldVersion}>
              Delete
            </button>
          )}
        </div>
      </div>

      <section className="section">
        <h3 className="section-title">Attachments</h3>

        {canManage ? (
          <input
            type="file"
            onChange={handleUpload}
            accept="image/*,application/pdf"
            disabled={isOldVersion || uploading}
            title={isOldVersion ? "Old versions are read-only" : "Upload attachment"}
          />
        ) : (
          <p className="muted">Only author or admin can upload attachments.</p>
        )}

        {uploading && <p className="muted">Uploading…</p>}
        {uploadError && <p className="error">{uploadError}</p>}

        {attachments.length > 0 ? (
          <ul className="list">
            {attachments.map((att) => {
              const fileUrl = `${BASE_URL}${att.url}`;
              const isImage = typeof att.mimeType === "string" && att.mimeType.startsWith("image/");
              const isPdf = att.mimeType === "application/pdf";

              return (
                <li key={att.id} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    <a href={fileUrl} target="_blank" rel="noreferrer">
                      {att.originalName} ({Math.round(att.size / 1024)} KB)
                    </a>

                    {isPdf && (
                      <a className="btn btn-secondary" href={fileUrl} target="_blank" rel="noreferrer">
                        Open PDF
                      </a>
                    )}
                  </div>

                  {isImage && (
                    <div style={{ marginTop: 10 }}>
                      <a href={fileUrl} target="_blank" rel="noreferrer">
                        <img
                          src={fileUrl}
                          alt={att.originalName}
                          style={{ maxWidth: "100%", borderRadius: 12, boxShadow: "var(--shadow)" }}
                        />
                      </a>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="muted">No attachments yet</p>
        )}
      </section>

      <div className="article-content" dangerouslySetInnerHTML={{ __html: article.content }} />

      <section className="section">
        <h3 className="section-title">Comments</h3>

        {isOldVersion ? (
          <p className="muted">Comments are available on the latest version only.</p>
        ) : (
          <>
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
              <ul className="list comment-list">
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

                      {canManage && (
                        <button
                          className="btn btn-danger comment-delete"
                          onClick={() => deleteComment(c.id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted comment-empty">No comments yet</p>
            )}
          </>
        )}
      </section>
    </main>
  );
}
