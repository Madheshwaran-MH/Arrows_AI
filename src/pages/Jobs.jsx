import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Jobs() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [openings, setOpenings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

  const navItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Job Openings", path: "/jobs" },
    { label: "Candidates", path: "/candidates" },
    { label: "Interviews", path: "/dashboard" },
    { label: "Reports", path: "/dashboard" },
    { label: "Chat", path: "/dashboard" },
    // { label: "Calendar", path: "/dashboard" }, // Disabled for later
    // { label: "User Roles", path: "/dashboard" }, // Disabled for later
  ];

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_URL}/jobs`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        });
        if (!res.ok) throw new Error("Failed to load jobs");
        const data = await res.json();
        setOpenings(data);
      } catch (err) {
        setError(err.message || "Unable to load jobs");
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand">ARROWS</div>
        <ul className="nav-list">
          {navItems.map(item => (
            <li
              key={item.label}
              className={`nav-item ${pathname === item.path ? "active" : ""}`}
              onClick={() => navigate(item.path)}
            >
              <span className="icon">•</span>
              {item.label}
            </li>
          ))}
        </ul>
        <button className="btn btn-ghost" onClick={() => {
          localStorage.clear();
          navigate("/login");
        }}>
          Logout
        </button>
      </aside>

      <main className="main">
        <div className="topbar">
          <h2 className="page-title">Job Openings</h2>
          <div className="top-right">
            <button className="btn btn-primary" onClick={() => navigate("/jobs/create")}>Create Job</button>
            <div className="avatar">HR</div>
          </div>
        </div>

        <div className="page-card">
          {loading && <div className="muted">Loading jobs...</div>}
          {error && <div className="muted" style={{ color: "#f75555" }}>{error}</div>}
          {!loading && !error && (
            <div className="card-row">
              {openings.map(job => (
                <div key={job.id} className="card">
                  <div className="stat-label">{job.type} · {job.location}</div>
                  <h3 className="page-title" style={{ margin: "0 0 8px" }}>{job.title}</h3>
                  <div className="stat-sub">Status: {job.status}</div>
                  <div className="stat-sub">Applications: {job.applications}</div>
                  <div className="stat-sub">Department: {job.department}</div>
                  {job.summary && <div className="muted small">{job.summary}</div>}
                </div>
              ))}
              {openings.length === 0 && <div className="muted">No openings yet. Create one to get started.</div>}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
