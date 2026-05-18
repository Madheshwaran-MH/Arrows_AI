import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function CreateJob() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("Full-time");
  const [summary, setSummary] = useState("");
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
          <h2 className="page-title">Create Job Opening</h2>
          <div className="top-right">
            <button className="btn btn-ghost" onClick={() => navigate("/jobs")}>Cancel</button>
            <div className="avatar">HR</div>
          </div>
        </div>

        <div className="page-card">
          <form onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            setLoading(true);
            try {
              const res = await fetch(`${API_URL}/jobs`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
                },
                body: JSON.stringify({ title, department, location, type, summary }),
              });
              if (!res.ok) throw new Error("Failed to save job");
              await res.json();
              navigate("/jobs");
            } catch (err) {
              setError(err.message || "Unable to save job");
            } finally {
              setLoading(false);
            }
          }}>
            <div className="form-row">
              <div style={{ flex: 1 }}>
                <label htmlFor="title">Job Title</label>
                <input
                  id="title"
                  type="text"
                  placeholder="e.g. Senior Software Engineer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="department">Department</label>
                <input
                  id="department"
                  type="text"
                  placeholder="Technology"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div style={{ flex: 1 }}>
                <label htmlFor="location">Location</label>
                <input
                  id="location"
                  type="text"
                  placeholder="Remote / City, Country"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="type">Employment Type</label>
                <select id="type" value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="Full-time">Full-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="summary">Role Summary</label>
              <textarea
                id="summary"
                rows="4"
                placeholder="Outline responsibilities, requirements, and expectations."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              ></textarea>
            </div>
            {error && <div className="muted" style={{ color: "#f75555" }}>{error}</div>}
            <div className="form-row">
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Job"}
              </button>
              <button className="btn btn-ghost" type="button" onClick={() => navigate("/jobs")}>Back to Jobs</button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
