import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";

export default function ArticlePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    setLoading(true);
    api
      .get(id)
      .then(setArticle)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [id]);

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
              {article.createdAt
                ? new Date(article.createdAt).toLocaleString()
                : ""}
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

      <div
        style={{ lineHeight: 1.6 }}
        dangerouslySetInnerHTML={{ __html: article.content }}
      />
    </main>
  );
}
