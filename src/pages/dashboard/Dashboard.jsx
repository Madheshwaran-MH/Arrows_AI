import * as React from "react";
import { embedDashboard } from "@superset-ui/embedded-sdk";
import styles from "./Dashboard.module.scss";
import { fetchDashboardGuestToken } from "../../api/guestToken";
import { resolveEmbedSupersetDomain } from "../../utils/embedSupersetDomain";
import { DASHBOARD_UUID_MAP } from "../../utils/constants";

/* ─────────────── Dashboard Stats Bar ─────────────── */
function DashboardStatsBar() {
  return (
    <div className={styles.statsBar}>

      {/* ── Col 1a: Total Open Positions ── */}
      <div className={`${styles.statCard} ${styles.statBlue}`}>
        <div className={styles.statCardHeader}>
          <span className={styles.statCardLabel}>Total Open Positions</span>
          <span className={styles.statCardIcon}>🕐</span>
        </div>
        <div className={styles.statBigNum}>186</div>
        <div className={styles.statSubRow}>
          <span>In Progress</span>
          <span>Yet to confirm</span>
          <span>Idle</span>
        </div>
        <div className={styles.multiBar}>
          <div className={styles.mbBlue}   style={{ flex: 40 }} />
          <div className={styles.mbGreen}  style={{ flex: 35 }} />
          <div className={styles.mbGray}   style={{ flex: 25 }} />
        </div>
        <div className={styles.circleRow}>
          <span className={styles.circle} style={{ background: "#3b82f6" }}>TC</span>
          <span className={styles.circle} style={{ background: "#10b981" }}>IP</span>
          <span className={styles.circle} style={{ background: "#d1d5db", color: "#6b7280" }}>IL</span>
        </div>
      </div>

      {/* ── Col 1b: Requirements ── */}
      <div className={`${styles.statCard} ${styles.statPeach}`}>
        <span className={styles.badge} style={{ background: "#ff7043", color: "#fff" }}>New</span>
        <div className={styles.statCardLabel} style={{ marginTop: 6 }}>Requirements</div>
        <div className={styles.statBigNum}>
          1200 <span className={styles.statNumSub}>This Week</span>
        </div>
        <div className={styles.circleRow}>
          <span className={styles.circle} style={{ background: "#fb923c" }}>TC</span>
          <span className={styles.circle} style={{ background: "#fbbf24" }}>IP</span>
          <span className={styles.circle} style={{ background: "#d1d5db", color: "#6b7280" }}>IL</span>
        </div>
      </div>

      {/* ── Col 2a: Core Clients ── */}
      <div className={`${styles.statCard} ${styles.statPurple}`}>
        <span className={styles.badge} style={{ background: "#a78bfa", color: "#fff" }}>Client List</span>
        <div className={styles.statCardLabel} style={{ marginTop: 6 }}>Core Clients</div>
        <div className={styles.statBigNum}>
          <span style={{ color: "#6d28d9" }}>94</span>{" "}
          <span className={styles.statNumSub}>Total Clients</span>
        </div>
        <div className={styles.circleRow}>
          <span className={styles.circle} style={{ background: "#8b5cf6" }}>TC</span>
          <span className={styles.circle} style={{ background: "#a78bfa" }}>VN</span>
          <span className={styles.circle} style={{ background: "#d1d5db", color: "#6b7280" }}>+</span>
        </div>
      </div>

      {/* ── Col 2b: New Hire ── */}
      <div className={`${styles.statCard} ${styles.statLavender}`}>
        <div className={styles.statCardHeader}>
          <span className={styles.statCardLabel}>New Hire</span>
          <span className={styles.statCardIcon}>👥</span>
        </div>
        <div className={styles.statBigNum}>
          210 <span className={styles.statNumSub}>This Week</span>
        </div>
        <div className={styles.avatarRow}>
          <span className={styles.avatar} style={{ background: "#818cf8" }}>A</span>
          <span className={styles.avatar} style={{ background: "#34d399" }}>B</span>
          <span className={styles.avatar} style={{ background: "#f87171" }}>C</span>
        </div>
      </div>

      {/* ── Col 3: Recruitment Status ── */}
      <div className={`${styles.statCard} ${styles.statWide}`}>
        <div className={styles.recruitHeader}>
          <span className={styles.recruitTitle}>Recruitment Status</span>
          <span className={styles.badge} style={{ background: "#eff6ff", color: "#3b82f6", border: "1px solid #bfdbfe" }}>
            📅 This week
          </span>
        </div>
        <div className={styles.recruitTotalRow}>
          <span className={styles.recruitTotalLabel}>Total recruitment</span>
          <span className={styles.recruitTotalNum}>140</span>
        </div>
        <div className={styles.colorBar}>
          <div style={{ background: "#a855f7", flex: 94 }} />
          <div style={{ background: "#22c55e", flex: 50 }} />
          <div style={{ background: "#f59e0b", flex: 45 }} />
          <div style={{ background: "#ef4444", flex: 55 }} />
        </div>
        <div className={styles.recruitGrid}>
          <div className={styles.recruitItem}>
            <span className={styles.dot} style={{ background: "#a855f7" }} />
            <span className={styles.recruitItemLabel}>Critical Roles</span>
            <span className={styles.recruitItemNum}>94</span>
          </div>
          <div className={styles.recruitItem}>
            <span className={styles.dot} style={{ background: "#22c55e" }} />
            <span className={styles.recruitItemLabel}>Skilled Positions</span>
            <span className={styles.recruitItemNum}>50</span>
          </div>
          <div className={styles.recruitItem}>
            <span className={styles.dot} style={{ background: "#f59e0b" }} />
            <span className={styles.recruitItemLabel}>Support Roles</span>
            <span className={styles.recruitItemNum}>45</span>
          </div>
          <div className={styles.recruitItem}>
            <span className={styles.dot} style={{ background: "#ef4444" }} />
            <span className={styles.recruitItemLabel}>Entry-Level</span>
            <span className={styles.recruitItemNum}>55</span>
          </div>
        </div>
        <div className={styles.divider} />
        <div className={styles.performerRow}>
          <span className={styles.performerLabel}>To Performer</span>
          <div className={styles.performerInfo}>
            <span className={styles.performerAvatar}>DE</span>
            <div>
              <div className={styles.performerName}>Daniel Esbella</div>
              <div className={styles.performerRole}>IOS Developer</div>
            </div>
            <div className={styles.performerScore}>
              <span className={styles.performerScoreLabel}>Performance</span>
              <span className={styles.performerScoreNum}>99%</span>
            </div>
          </div>
          <a className={styles.viewAll} href="#">View all</a>
        </div>
      </div>

      {/* ── Col 4: Today Tasks ── */}
      <div className={`${styles.statCard} ${styles.statTasks}`}>
        <div className={styles.tasksTitle}>Today Tasks</div>
        <div className={`${styles.taskItem} ${styles.taskGreen}`}>
          <div className={styles.taskName}>Review High Priority Role Applications</div>
          <div className={styles.taskBar}><div className={styles.taskBarFill} style={{ width: "35%", background: "#10b981" }} /></div>
          <span className={styles.taskBadge}>+35%</span>
        </div>
        <div className={`${styles.taskItem} ${styles.taskBlue}`}>
          <div className={styles.taskName}>Schedule Candidate Interviews</div>
          <span className={styles.taskIcon}>👤</span>
        </div>
        <div className={`${styles.taskItem} ${styles.taskYellow}`}>
          <div className={styles.taskName}>Update Recruitment Tracker</div>
          <div className={styles.taskBar}><div className={styles.taskBarFill} style={{ width: "35%", background: "#f59e0b" }} /></div>
          <span className={styles.taskBadge}>+35%</span>
        </div>
      </div>

    </div>
  );
}

const FALLBACK_SUPERSET_URL =
  import.meta.env.VITE_SUPERSET_URL || "http://172.174.201.208:8088";

const FALLBACK_EMBED_UUID =
  import.meta.env.VITE_SUPERSET_EMBED_ID || DASHBOARD_UUID_MAP.default;

export default function Dashboard() {
  const mountRef = React.useRef(null);
  const [embedError, setEmbedError] = React.useState("");

  React.useEffect(() => {
    let isDisposed = false;
    const mountPoint = mountRef.current;

    if (!mountPoint) {
      return;
    }

    const initializeEmbedding = async () => {
      try {
        setEmbedError("");
        mountPoint.innerHTML = "";

        const bootstrap = await fetchDashboardGuestToken();
        // Determine dashboard UUID based on user role
        let dashboardId = bootstrap.dashboardUuid;
        if (!dashboardId) {
          const userRole = localStorage.getItem("userRole");
          dashboardId = userRole && DASHBOARD_UUID_MAP[userRole.toLowerCase()]
            ? DASHBOARD_UUID_MAP[userRole.toLowerCase()]
            : FALLBACK_EMBED_UUID;
        }
        const supersetDomain = resolveEmbedSupersetDomain(
          bootstrap.supersetDomain || FALLBACK_SUPERSET_URL,
        );

        if (!dashboardId) {
          throw new Error(
            "Backend did not return dashboardUuid. Set SUPERSET_DASHBOARD_UUID in Arrows_back/.env.",
          );
        }

        const getGuestToken = async () => {
          const { token } = await fetchDashboardGuestToken();

          if (!token) {
            throw new Error("Unable to generate Superset guest token.");
          }

          return token;
        };

        await embedDashboard({
          id: dashboardId,
          supersetDomain,
          mountPoint,
          fetchGuestToken: getGuestToken,
          debug:
            import.meta.env.DEV ||
            import.meta.env.VITE_SUPERSET_EMBED_DEBUG === "true",
          dashboardUiConfig: {
            hideTitle: true,
            filters: { expanded: true },
          },
        });
      } catch (error) {
        if (!isDisposed) {
          setEmbedError(error?.message || "Failed to load Superset dashboard.");
          console.error("Failed to load embedded Superset dashboard", error);
        }
      }
    };

    initializeEmbedding();

    return () => {
      isDisposed = true;
      if (mountPoint) {
        mountPoint.innerHTML = "";
      }
    };
  }, []);

  return (
    <div className={styles.fullViewWrap}>
      <DashboardStatsBar />
      <div className={styles.embedFull}>
        {embedError ? (
          <div style={{ padding: 16, color: "#b91c1c" }}>
            {embedError}
          </div>
        ) : null}
        <div ref={mountRef} style={{ width: "100%", height: "100vh" }} />
      </div>
    </div>
  );
}
