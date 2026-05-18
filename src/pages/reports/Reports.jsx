import * as React from "react";
import { FiCalendar } from "react-icons/fi";
import styles from "./Reports.module.scss";

export default function Reports() {
  const [activeTab, setActiveTab] = React.useState("overall");
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  // Sample data
  const [metricsData] = React.useState([
    { label: "Profile", value: 1048 },
    { label: "MH Pre Screen", value: 583 },
    { label: "HackerEarth", value: 136 },
    { label: "HackerEarth Test", value: 63 },
    { label: "MH Interview", value: 482 },
    { label: "MH Interview", value: 156 }
  ]);

  const [chartData] = React.useState([
    { name: "Vinayak Hiremath", value: 53, skills: ["Java Developer, Responsive"] },
    { name: "Vaishnavi R", value: 118, skills: ["Java Developer, TransUnion", "Python De"] },
    { name: "Vaishnavi G", value: 43, skills: ["Java Developer"] },
    { name: "Sri Gnanam U", value: 133, skills: ["Java Developer, Responsive"] },
    { name: "Mohammad Shabnam", value: 46, skills: ["Python Developer"] },
    { name: "M Jagadish Kumar", value: 11, skills: ["Java Developer"] },
    { name: "M Jagadish", value: 1, skills: ["Python Developer"] },
    { name: "Karthik Paramaswam", value: 139, skills: ["Java Developer, TransUnion"] },
    { name: "Jenifer Anthony Babu", value: 191, skills: ["Java Developer, Responsive"] }
  ]);

  React.useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        // TODO: Replace with actual API call
        setLoading(false);
      } catch (error) {
        console.error("Error fetching reports:", error);
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const colors = ["#0087BE", "#1A1A1A", "#0066CC", "#FF6B35", "#4CAF50", "#FFC107", "#FF5722", "#9C27B0", "#00BCD4"];

  const getMaxValue = () => {
    return Math.max(...chartData.map(item => item.value));
  };

  return (
    <div className={styles.reportsContainer}>
      {/* Header Section */}
      <div className={styles.headerSection}>
        <h1 className={styles.pageTitle}>Reports</h1>
      </div>

      {/* Date Range Filter */}
      <div className={styles.dateRangeSection}>
        <div className={styles.dateField}>
          <label className={styles.dateLabel}>From <span className={styles.required}>*</span></label>
          <div className={styles.dateInputWrapper}>
            <FiCalendar className={styles.dateIcon} />
            <input
              type="date"
              className={styles.dateInput}
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              placeholder="00/00/0000"
            />
          </div>
        </div>

        <div className={styles.dateField}>
          <label className={styles.dateLabel}>To <span className={styles.required}>*</span></label>
          <div className={styles.dateInputWrapper}>
            <FiCalendar className={styles.dateIcon} />
            <input
              type="date"
              className={styles.dateInput}
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              placeholder="00/00/0000"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsSection}>
        <button
          className={`${styles.tab} ${activeTab === "overall" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("overall")}
        >
          Over all
        </button>
        <button
          className={`${styles.tab} ${activeTab === "client" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("client")}
        >
          Client Round Status
        </button>
      </div>

      {/* Content Area */}
      <div className={styles.contentArea}>
        {loading ? (
          <div className={styles.loadingState}>
            <p>Loading reports...</p>
          </div>
        ) : (
          <>
            {/* Metrics Cards */}
            <div className={styles.metricsSection}>
              {metricsData.map((metric, index) => (
                <div key={index} className={styles.metricCard}>
                  <h3 className={styles.metricLabel}>{metric.label}</h3>
                  <p className={styles.metricValue}>{metric.value.toLocaleString()}</p>
                </div>
              ))}
            </div>

            {/* Chart Section */}
            <div className={styles.chartSection}>
              <h2 className={styles.chartTitle}>Profile Sourced by Each</h2>
              
              <div className={styles.chartContainer}>
                {chartData.map((item, index) => {
                  const maxValue = getMaxValue();
                  const percentage = (item.value / maxValue) * 100;
                  
                  return (
                    <div key={index} className={styles.chartRow}>
                      <div className={styles.chartLabel}>{item.name}</div>
                      <div className={styles.chartBarWrapper}>
                        <div className={styles.chartBar}>
                          {item.skills.map((skill, skillIndex) => {
                            const skillWidth = (percentage * 0.3) + (skillIndex * 5);
                            return (
                              <div
                                key={skillIndex}
                                className={styles.chartSegment}
                                style={{
                                  width: `${skillWidth}px`,
                                  backgroundColor: colors[skillIndex % colors.length]
                                }}
                                title={skill}
                              />
                            );
                          })}
                          <div
                            className={styles.chartFill}
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: colors[index % colors.length]
                            }}
                          />
                        </div>
                        <span className={styles.chartValue}>{item.value}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
