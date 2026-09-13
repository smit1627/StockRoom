import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./styles/global.css";
import "./styles/phase2.css";
import "./styles/category.css";
import "./styles/brand.css";
import "./styles/dashboard.css";
import "./styles/products.css";
import "./styles/catalogue.css";
import { AuthProvider } from "./context/AuthContext";
import { AppProvider } from "./context/AppContext";
import AppRoutes from "./routes/AppRoutes";

createRoot(document.getElementById("root")).render(
    <React.StrictMode><BrowserRouter><AuthProvider><AppProvider><AppRoutes /></AppProvider></AuthProvider></BrowserRouter></React.StrictMode>,
);
