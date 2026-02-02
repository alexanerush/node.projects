import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../api";

export default function RegisterPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setOk("");

    try {
      await authApi.register(email, password);
      setOk("Account created. Now login.");
      nav("/login");
    } catch (err) {
      setError(err.message || "Registration failed");
    }
  }

  return (
    <div className="wrap">
      <h1>Register</h1>

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
            placeholder="min 6 chars"
            required
          />
        </label>

        {error && <p className="error">{error}</p>}
        {ok && <p className="ok">{ok}</p>}

        <button type="submit">Create account</button>

        <p style={{ marginTop: 12 }}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}
