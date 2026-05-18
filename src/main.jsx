
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { initPerformanceMonitoring } from "./utils/performance.js";
import "./styles/globals.scss";
// Optional font bundling:
// import "@fontsource/poppins/400.css";
// import "@fontsource/poppins/600.css";
document.documentElement.classList.remove("dark");

// Initialize performance monitoring
initPerformanceMonitoring();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

