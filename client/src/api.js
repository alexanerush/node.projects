const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const TOKEN_KEY = "jwt";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function handleResponse(res) {

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    clearToken();
  }

  if (!res.ok) {
    throw new Error(data.error || data.details || res.statusText || "Request failed");
  }

  return data;
}

function request(path, { method = "GET", body, headers } = {}) {
  const token = getToken();

  const finalHeaders = {
    ...(headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  if (body !== undefined) {
    finalHeaders["Content-Type"] = "application/json";
  }

  return fetch(`${BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }).then(handleResponse);
}

// auth
export const authApi = {
  register: (email, password) =>
    request("/api/auth/register", { method: "POST", body: { email, password } }),

  login: (email, password) =>
    request("/api/auth/login", { method: "POST", body: { email, password } }),
};

export const api = {
  workspaces: () => request("/api/workspaces"),
  workspaceArticles: (workspaceId) => request(`/api/workspaces/${workspaceId}/articles`),

  list: (workspaceId) => {
    const qs = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : "";
    return request(`/api/articles${qs}`);
  },

  get: (id) => request(`/api/articles/${id}`),

  create: (payload) => request("/api/articles", { method: "POST", body: payload }),

  update: (id, payload) => request(`/api/articles/${id}`, { method: "PUT", body: payload }),

  remove: (id) => request(`/api/articles/${id}`, { method: "DELETE" }),
};
