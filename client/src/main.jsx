import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import App from "./App.jsx";
import ListPage from "./pages/ListPage.jsx";
import CreatePage from "./pages/CreatePage.jsx";
import ArticlePage from "./pages/ArticlePage.jsx";
import EditPage from "./pages/EditPage.jsx";

import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import LogicPage from "./pages/LogicPage.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import "react-quill/dist/quill.snow.css";
import "./index.css";

const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },

  {
    path: "/",
    element: (
      <ProtectedRoute>
        <App />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <ListPage /> },
      {
        path: "create",
        element: (
          <ProtectedRoute>
            <CreatePage />
          </ProtectedRoute>
        ),
      },
      { path: "articles/:id", element: <ArticlePage /> },
      { path: "articles/:id/edit", element: <EditPage /> },
      { path: "logic", element: <LogicPage /> },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
