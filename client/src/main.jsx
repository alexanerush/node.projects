import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import App from "./App.jsx";
import ListPage from "./pages/ListPage.jsx";       
import CreatePage from "./pages/CreatePage.jsx";   
import ArticlePage from "./pages/ArticlePage.jsx"; 

import "react-quill/dist/quill.snow.css";
import "./index.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <ListPage /> },             
      { path: "create", element: <CreatePage /> },        
      { path: "articles/:id", element: <ArticlePage /> }, 
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
