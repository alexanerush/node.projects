import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import Editor from "../components/Editor";

export default function EditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    api
      .get(id)
      .then((article) => {
        setTitle(article.title || "");
        setContent(article.content || "");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (!title.trim() || !content.trim()) {
      setError("Title and content are required");
      return;
    }

    setSaving(true);
    try {
      await api.update(id, { title, content });
      navigate(`/articles/${id}`);
    } catch (e) {
      setError(e.message || "Failed to update article");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p style={{ textAlign: "center" }}>Loading…</p>;
  }

  if (error) {
    return <p style={{ color: "crimson", textAlign: "center" }}>{error}</p>;
  }

  return (
    <main>
      <div className="container">
        <h2>Edit article</h2>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
          <div>
            <label>Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Article title"
            />
          </div>

          <div>
            <label>Content</label>
            <Editor value={content} onChange={setContent} />
          </div>

          {error && <p style={{ color: "crimson" }}>{error}</p>}

          <button disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>
    </main>
  );
}
