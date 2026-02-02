import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi, setToken } from "../api";

export default function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      const data = await authApi.login(email, password);
      setToken(data.token);
      nav("/");
    } catch (err) {
      setError(err.message || "Login failed");
    }
  }

  return (
    <div className="wrap">
      <h1>Login</h1>

      <form onSubmit={onSubmit} className="panel">
        <label>
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="you@example.com"
            required
          />
        </label>

        <label>
          Password
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="••••••••"
            required
          />
        </label>

        {error && <p className="error">{error}</p>}

        <button type="submit">Login</button>

        <p style={{ marginTop: 12 }}>
          No account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}
