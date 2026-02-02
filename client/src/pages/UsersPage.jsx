import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usersApi, getMe } from "../api";

export default function UsersPage() {
  const nav = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const me = getMe();

    if (!me || me.role !== "admin") {
      nav("/", { replace: true });
      return;
    }

    usersApi
      .list()
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [nav]);

  async function onRoleChange(userId, newRole) {
    try {
      await usersApi.setRole(userId, newRole);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    } catch (e) {
      alert(e.message);
    }
  }

  if (loading) return <p className="muted">Loading…</p>;
  if (err) return <p className="error">{err}</p>;

  return (
    <div className="wrap">
      <div className="page-head">
        <div>
          <h1 className="page-title" style={{ fontSize: 34 }}>Users</h1>
          <p className="muted">Admin only</p>
        </div>
      </div>

      {users.length === 0 ? (
        <p className="muted">No users</p>
      ) : (
        <div className="section">
          <ul className="list">
            {users.map((u) => (
              <li key={u.id} className="comment" style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div className="comment-author">{u.email}</div>
                  <div className="muted" style={{ fontSize: 12 }}>id: {u.id}</div>
                </div>

                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span className="muted" style={{ fontSize: 12 }}>role</span>
                  <select
                    className="input"
                    value={u.role}
                    onChange={(e) => onRoleChange(u.id, e.target.value)}
                    style={{ minWidth: 140 }}
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
