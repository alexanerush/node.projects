import { NavLink, Outlet } from "react-router-dom";
import "./App.css";

export default function App() {
  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
      <header style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <NavLink to="/" end>Articles</NavLink>
        <NavLink to="/create">New Article</NavLink>
      </header>
      <Outlet />
    </div>
  );
}
