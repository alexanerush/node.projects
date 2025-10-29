const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || res.statusText || "Request failed");
  }
  return data;
}

export const api = {
  list: () => fetch(`${BASE_URL}/api/articles`).then(handleResponse),

  get: (id) => fetch(`${BASE_URL}/api/articles/${id}`).then(handleResponse),

  create: (payload) =>
    fetch(`${BASE_URL}/api/articles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(handleResponse),
};
