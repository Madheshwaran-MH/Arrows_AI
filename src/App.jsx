// src/App.jsx
import * as React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, Suspense, lazy } from "react";

import TopBar from "./pages/layout/TopBar.jsx";
import Sidebar from "./pages/layout/Sidebar.jsx";
import Login from "./pages/login/Login.jsx";

// Lazy load page components for code splitting
const Dashboard = lazy(() => import("./pages/dashboard/Dashboard.jsx"));
const JobOpenings = lazy(() => import("./pages/job-openings/JobOpenings.jsx"));
const Candidates = lazy(() =>
  import("./pages/job-openings/Candidates.jsx").catch(err => {
    console.error("Failed to load Candidates:", err);
    throw err;
  })
);
const Clients = lazy(() => import("./pages/job-openings/Clients.jsx"));
const Interviews = lazy(() => import("./pages/interviews/Interviews.jsx"));
const JobDescription = lazy(() => import("./pages/job-openings/JobDescription.jsx"));
const Reports = lazy(() => import("./pages/reports/Reports.jsx"));
const UserRoles = lazy(() => import("./pages/user-roles/UserRoles.jsx"));
const Calendar = lazy(() => import("./pages/calendar/Calendar.jsx"));
const ApplicationForm = lazy(() => import("./pages/application/ApplicationForm.jsx"));

// Loading fallback component
const LoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '18px', color: '#666', marginBottom: '10px' }}>Loading...</div>
      <div style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #3498db', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  </div>
);

export default function App() {
  const [isSidebarOpen, setSidebarOpen] = React.useState(false);
  const location = useLocation();

  // Debug logging for route changes
  useEffect(() => {
    console.log('Route changed to:', location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    document.documentElement.classList.remove("dark");
    document.documentElement.style.backgroundColor = "#ffffff";
  }, []);

  useEffect(() => {
    const shouldLockScroll = location.pathname !== "/login" && isSidebarOpen && window.innerWidth <= 768;
    document.body.style.overflow = shouldLockScroll ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen, location.pathname]);

  // Close the sidebar on route changes for small screens
  React.useEffect(() => {
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  // Swipe gestures: right to open, left to close (only on small screens)
  React.useEffect(() => {
    let startX = null;
    let currentX = null;

    const isSmall = () => window.innerWidth <= 768;

    const onTouchStart = (e) => {
      if (!isSmall()) return;
      const t = e.touches[0];
      startX = t.clientX;
      currentX = t.clientX;
    };

    const onTouchMove = (e) => {
      if (!isSmall() || startX === null) return;
      currentX = e.touches[0].clientX;
    };

    const onTouchEnd = () => {
      if (!isSmall() || startX === null || currentX === null) return;
      const deltaX = currentX - startX;

      if (deltaX > 60) {
        // swipe right → open
        setSidebarOpen(true);
      } else if (deltaX < -60) {
        // swipe left → close
        setSidebarOpen(false);
      }

      startX = null;
      currentX = null;
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  return (
    <div className={`app ${location.pathname === '/login' ? 'login' : ''}`}>
      {/* Overlay (visible only when sidebar is open on small screens) */}
      <div
        className={`overlay ${isSidebarOpen ? "visible" : ""}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden={!isSidebarOpen}
      />

      {/* Sidebar: off‑canvas on small screens (controlled by isSidebarOpen) */}
      {location.pathname !== '/login' && <Sidebar isOpen={isSidebarOpen} />}

      {/* TopBar: includes arrow to toggle the sidebar */}
      {location.pathname !== '/login' && <TopBar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />}

      <main className="main">
        <Suspense fallback={<LoadingFallback />}>
          <Routes key={location.pathname}>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/job-openings" element={<JobOpenings />} />
            <Route path="/candidates" element={<Candidates />} />
            <Route path="/interviews" element={<Interviews />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/job-openings/edit" element={<JobOpenings />} />
            <Route path="/job-openings/create" element={<JobOpenings createMode={true} />} />
            <Route path="/job-openings/:jobId" element={<JobDescription />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/users" element={<UserRoles />} />
            <Route path="/application" element={<ApplicationForm />} />

            {/* TODO: add /chat route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}


