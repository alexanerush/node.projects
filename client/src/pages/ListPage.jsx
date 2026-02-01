import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

function formatDate(d) {
  try {
    return new Date(d).toLocaleString();
  } catch {
    return "";
  }
}

export default function ListPage() {
  const [items, setItems] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [workspaceId, setWorkspaceId] = useState("");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    setLoading(true);
    setErr("");

    fetch("http://localhost:3000/api/workspaces")
      .then((r) => r.json())
      .then((ws) => {
        const list = Array.isArray(ws) ? ws : [];
        setWorkspaces(list);

        if (list.length > 0) {
          setWorkspaceId(String(list[0].id));
        }
      })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!workspaceId) return;

    setLoading(true);
    setErr("");

    fetch(`http://localhost:3000/api/workspaces/${workspaceId}/articles`)
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [workspaceId]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((a) => a.title?.toLowerCase().includes(s));
  }, [q, items]);

  return (
    <div className="wrap">
      <div className="page-head">
        <h1 className="page-title">Articles</h1>

        <div className="actions">
          <select
            className="input"
            value={workspaceId}
            onChange={(e) => setWorkspaceId(e.target.value)}
          >
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id}>
                {ws.name}
              </option>
            ))}
          </select>

          <input
            className="input"
            placeholder="Search by title…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <Link
            className="btn btn-primary"
            to={`/create?workspaceId=${workspaceId}`}
          >
            New Article
          </Link>
        </div>
      </div>

      {loading && <p className="muted">Loading…</p>}
      {err && <p className="error">{err}</p>}

      {!loading && !err && filtered.length === 0 && (
        <div className="empty">
          <p>No articles yet.</p>
          <Link
            className="btn btn-primary"
            to={`/create?workspaceId=${workspaceId}`}
          >
            Create the first one
          </Link>
        </div>
      )}

      <ul className="articles-grid">
        {filtered.map((a) => (
          <li key={a.id} className="article-card">
            <div className="article-card__head">
              <h3 className="article-card__title">
                <Link to={`/articles/${a.id}`}>{a.title}</Link>
              </h3>
              {a.createdAt && (
                <span className="chip">{formatDate(a.createdAt)}</span>
              )}
            </div>

            <div className="article-card__footer">
              <Link className="btn btn-ghost" to={`/articles/${a.id}`}>
                Read
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
