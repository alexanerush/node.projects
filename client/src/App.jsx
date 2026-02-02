import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "./App.css";
import { clearToken } from "./api";

export default function App() {
  const nav = useNavigate();

  function onLogout() {
    clearToken();
    nav("/login");
  }

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
      <header style={{ display: "flex", gap: 16, marginBottom: 24, alignItems: "center" }}>
        <NavLink to="/" end>Articles</NavLink>
        <NavLink to="/create?workspaceId=1">New Article</NavLink>

        <div style={{ marginLeft: "auto" }}>
          <button type="button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <Outlet />
    </div>
  );
}
