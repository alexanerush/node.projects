import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

function formatDate(d) {
  try {
    return new Date(d).toLocaleString();
  } catch {
    return "";
  }
}

export default function ListPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    api.list()
      .then(setItems)
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter(a => a.title?.toLowerCase().includes(s));
  }, [q, items]);

  return (
    <div className="wrap">
      <div className="page-head">
        <h1 className="page-title">Articles</h1>
        <div className="actions">
          <input
            className="input"
            placeholder="Search by title…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Link className="btn btn-primary" to="/create">New Article</Link>
        </div>
      </div>

      {loading && <p className="muted">Loading…</p>}
      {err && <p className="error">{err}</p>}

      {!loading && !err && filtered.length === 0 && (
        <div className="empty">
          <p>No articles yet.</p>
          <Link className="btn btn-primary" to="/create">Create the first one</Link>
        </div>
      )}

      <ul className="articles-grid">
        {filtered.map(a => (
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
              <Link className="btn btn-ghost" to={`/articles/${a.id}`}>Read</Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
