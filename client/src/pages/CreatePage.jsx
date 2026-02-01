import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import Editor from "../components/Editor";

export default function CreatePage() {
  const [searchParams] = useSearchParams();
  const workspaceId = useMemo(() => {
    const v = searchParams.get("workspaceId");
    return v ? Number(v) : null;
  }, [searchParams]);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setOk("");

    if (!title.trim() || !content.trim()) {
      setError("Title and content are required");
      return;
    }

    if (!workspaceId || !Number.isFinite(workspaceId)) {
      setError("workspaceId is missing in URL. Open page like /create?workspaceId=2");
      return;
    }

    setSaving(true);
    try {
      const created = await api.create({ title, content, workspaceId });
      setOk("Article created");
      setTitle("");
      setContent("");

      navigate(`/?workspaceId=${workspaceId}`);
     
    } catch (err) {
      setError(err.message || "Failed to create article");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h2 style={{ marginBottom: 16 }}>Create article</h2>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <div style={{ color: "#64748b", fontSize: 14 }}>
          Workspace: {workspaceId ?? "— (missing)"}
        </div>

        <label>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Title</div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="My new article"
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #cbd5e1",
            }}
          />
        </label>

        <label>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Content</div>
          <Editor value={content} onChange={setContent} />
        </label>

        {error && <p style={{ color: "crimson", margin: 0 }}>{error}</p>}
        {ok && <p style={{ color: "seagreen", margin: 0 }}>{ok}</p>}

        <button
          type="submit"
          disabled={saving}
          style={{
            width: 180,
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #DDA0DD",
            background: saving ? "#E6B0E6" : "#DDA0DD",
            color: "white",
            fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer",
            transition: "background 0.2s ease-in-out",
          }}
          onMouseEnter={(e) => !saving && (e.currentTarget.style.background = "#C187C1")}
          onMouseLeave={(e) => !saving && (e.currentTarget.style.background = "#DDA0DD")}
        >
          {saving ? "Saving…" : "Create"}
        </button>
      </form>
    </div>
  );
}
