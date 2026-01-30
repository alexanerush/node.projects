import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";

export default function ArticlePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [toast, setToast] = useState("");
  const toastTimerRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  function showToast(msg) {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(""), 3000);
  }

  
  useEffect(() => {
    setErr("");
    setLoading(true);
    api
      .get(id)
      .then(setArticle)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  // WebSocket subscribe + notifications
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3000");

    ws.onopen = () => {
      console.log("WS open");
      ws.send(JSON.stringify({ type: "SUBSCRIBE", articleId: id }));
    };

    ws.onmessage = (event) => {
      console.log("WS message:", event.data);
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
      } catch {

      }
    };

    ws.onerror = (e) => {
      console.log("WS error:", e);
    };

    ws.onclose = () => {
      console.log("WS closed");
    };

    return () => {
      ws.close();
    };
  }, [id]);

  // Upload attachment
  async function handleUpload(e) {
    const input = e.target;
    const file = input.files?.[0];
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
      input.value = ""; // allow picking same file again
    }
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
  if (err) return <p style={{ color: "crimson", textAlign: "center" }}>{err}</p>;
  if (!article) return <p style={{ textAlign: "center" }}>Not found</p>;

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "2rem" }}>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 16,
            right: 16,
            background: "#111",
            color: "white",
            padding: "10px 14px",
            borderRadius: 10,
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
            zIndex: 9999,
            maxWidth: 320,
          }}
        >
          {toast}
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div>
          <h2 style={{ marginBottom: 4 }}>{article.title}</h2>
          <p>
            <small style={{ opacity: 0.7 }}>
              {article.createdAt ? new Date(article.createdAt).toLocaleString() : ""}
            </small>
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => navigate(`/articles/${id}/edit`)}
            style={{
              background: "#8b5cf6",
              border: "none",
              color: "white",
              padding: "6px 12px",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Edit
          </button>

          <button
            onClick={onDelete}
            style={{
              background: "#f43f5e",
              border: "none",
              color: "white",
              padding: "6px 12px",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Attachments */}
      <section style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 8 }}>Attachments</h3>

        <input
          type="file"
          onChange={handleUpload}
          accept="image/*,application/pdf"
          disabled={uploading}
        />

        {uploading && (
          <p style={{ opacity: 0.7, marginTop: 8 }}>Uploading…</p>
        )}

        {uploadError && (
          <p style={{ color: "crimson", marginTop: 8 }}>{uploadError}</p>
        )}

        {article.attachments?.length > 0 ? (
          <ul style={{ marginTop: 12 }}>
            {article.attachments.map((att) => (
              <li key={att.id} style={{ marginBottom: 6 }}>
                <a
                  href={`http://localhost:3000${att.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#2563eb" }}
                >
                  {att.originalName} ({Math.round(att.size / 1024)} KB)
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ opacity: 0.6, marginTop: 12 }}>No attachments yet</p>
        )}
      </section>

      {/* Article Content */}
      <div
        style={{ lineHeight: 1.6 }}
        dangerouslySetInnerHTML={{ __html: article.content }}
      />
    </main>
  );
}
