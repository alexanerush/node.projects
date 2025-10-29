import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";

export default function ArticlePage() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    setLoading(true);
    api.get(id)
      .then(setArticle)
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p>Loading…</p>;
  if (err) return <p style={{ color: "crimson" }}>{err}</p>;
  if (!article) return <p>Not found</p>;

  return (
    <article>
      <h2 style={{ marginBottom: 8 }}>{article.title}</h2>
      <p><small style={{ opacity: 0.7 }}>{new Date(article.createdAt).toLocaleString()}</small></p>
      <div dangerouslySetInnerHTML={{ __html: article.content }} />
    </article>
  );
}
