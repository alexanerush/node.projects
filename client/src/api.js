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

  return fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  }).then(handleResponse);
}

// auth
export const authApi = {
  register: (email, password) =>
    request("/api/auth/register", { method: "POST", body: { email, password } }),

  login: (email, password) =>
    request("/api/auth/login", { method: "POST", body: { email, password } }),
};

// protected main api
export const api = {
  // categories/workspaces
  workspaces: () => request("/api/workspaces"),
  workspaceArticles: (workspaceId) => request(`/api/workspaces/${workspaceId}/articles`),

  // articles
  list: (workspaceId) => {
    const qs = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : "";
    return request(`/api/articles${qs}`);
  },

  get: (id) => request(`/api/articles/${id}`),

  create: (payload) => request("/api/articles", { method: "POST", body: payload }),

  update: (id, payload) => request(`/api/articles/${id}`, { method: "PUT", body: payload }),

  remove: (id) =>
    fetch(`${BASE_URL}/api/articles/${id}`, {
      method: "DELETE",
      headers: {
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      },
    }).then((res) => {
      if (res.status === 401) clearToken();
      if (!res.ok) throw new Error("Failed to delete article");
    }),

  // logic protected page
  getLogic: () => request("/api/logic"),
};
