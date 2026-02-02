import { useEffect, useState } from "react";
import { api } from "../api";

export default function LogicPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getLogic()
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="wrap">
        <h1>Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="wrap">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="wrap">
      <h1>Protected Logic Page</h1>
      <p>Only logged-in users can see this.</p>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
