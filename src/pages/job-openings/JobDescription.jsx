import * as React from "react";
import { FiArrowLeft, FiCheck, FiEye, FiFileText, FiTrash2, FiX } from "react-icons/fi";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import styles from "./JobDescription.module.scss";

  const fallbackJob = {
    openingJobId: "ZR_431212_JOB",
    postingTitle: "Senior Developer",
    minExperience: 5,
    maxExperience: 10,
  jobReceivedDate: "2025-09-15",
  clientId: "1298338",
    importance: "High Importance",
    candidates: [
      {
        candidateId: "C00123342",
        candidateName: "Ravi Patel",
        candidateEmail: "ravi.patel@example.com",
        recruiterName: "Parthiban",
        source: "Naukri",
        rating: "2/5",
        matchingScore: 92,
        stage: "Pre-Screening",
        status: "In Progress",
      },
      {
        candidateId: "C00123342",
        candidateName: "Vikram Singh",
        candidateEmail: "vikram.singh@example.com",
        recruiterName: "Parthiban",
        source: "Resume Inbox",
        rating: "2/5",
        matchingScore: 90,
        stage: "Pre-Screening",
        status: "In Progress",
      },
      {
        candidateId: "C00123342",
        candidateName: "Ananya Rao",
        candidateEmail: "ananya.rao@example.com",
        recruiterName: "Parthiban",
        source: "LinkedIn",
        rating: "3/5",
        matchingScore: 85,
        stage: "Assessment",
        status: "Completed",
      },
    ],
  };

const DEFAULT_STAGE_TABS = [
  "Map Candidates",
  "Sourced",
  "Pre-Screening",
  "Assessment",
  "Client Interview",
  "Offer",
];
const TEAM_OPTIONS = ["Pre-Screening Panel", "Java Team", "JD 1", "Python Team"];
const DURATION_OPTIONS = ["15 minutes", "30 minutes", "45 minutes", "60 minutes"];
const PANEL_OPTIONS = ["Panel Name 1", "Panel Name 2", "Panel Name 3"];
const PLATFORM_OPTIONS = ["Microsoft Teams", "Google Meet", "Zoom"];
const DUMMY_SOURCED_CANDIDATE = {
  rowId: "dummy-sourced-candidate-1",
  candidateId: "C009901",
  candidateName: "Demo Sourced Candidate",
  candidateEmail: "demo.sourced@example.com",
  recruiterName: "Parthiban",
  source: "Added by User",
  rating: "3/5",
  matchingScore: 88,
  stage: "Sourced",
  status: "In Progress",
};

const normalizeLegacyStageLabel = (stage) => {
  const safeStage = String(stage || "").trim();
  if (!safeStage) return "";

  const normalized = safeStage.toLowerCase();
  if (normalized === "client interview") return "Client Interview";
  return safeStage;
};

const formatHiringStageLabel = (value) => {
  const safeValue = String(value || "").trim();
  if (!safeValue) return "";

  const matchedInterview = safeValue.match(/^interview-(\d+)$/i);
  if (matchedInterview?.[1]) {
    return `Interview ${matchedInterview[1]}`;
  }

  const normalized = safeValue.toLowerCase();
  if (normalized === "client-interview") return "Client Interview";
  if (normalized === "hr-interview") return "HR Interview";
  if (normalized === "preboarding") return "Preboarding";

  return safeValue
    .replace(/[-_]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};

const buildStageTabsFromJob = (job) => {
  const hasHiringProcessConfig =
    Array.isArray(job?.interviewStages) ||
    Array.isArray(job?.clientInterviewStages) ||
    Array.isArray(job?.finalStages) ||
    (job?.interviewStageNames && typeof job.interviewStageNames === "object") ||
    (job?.interviewCount !== undefined && job?.interviewCount !== null && job?.interviewCount !== "");

  if (!hasHiringProcessConfig) {
    return DEFAULT_STAGE_TABS;
  }

  const interviewStages = Array.isArray(job?.interviewStages)
    ? job.interviewStages
    : [];
  const clientInterviewStages = Array.isArray(job?.clientInterviewStages)
    ? job.clientInterviewStages
    : [];
  const stageNames =
    job?.interviewStageNames && typeof job.interviewStageNames === "object"
      ? job.interviewStageNames
      : {};
  const interviewCount = Number.parseInt(job?.interviewCount, 10);
  const generatedInterviewStages = Number.isFinite(interviewCount) && interviewCount > 0
    ? Array.from({ length: interviewCount }, (_, index) => `interview-${index + 1}`)
    : [];

  const normalizedInterviewStageLabels = [
    ...new Set([...interviewStages, ...generatedInterviewStages, ...clientInterviewStages])
  ]
    .map((stage) => {
      const customName = String(stageNames?.[stage] || "").trim();
      return customName || formatHiringStageLabel(stage);
    })
    .filter(Boolean);

  const defaultFinalStages = ["preboarding"];
  const selectedFinalStages = Array.isArray(job?.finalStages) && job.finalStages.length > 0
    ? job.finalStages
    : defaultFinalStages;

  const finalStageLabels = selectedFinalStages
    .map((stage) => {
      const customName = String(stageNames?.[stage] || "").trim();
      return customName || formatHiringStageLabel(stage);
    })
    .filter(Boolean);

  const dynamicTabs = [
    "Map Candidates",
    "Sourced",
    "Pre-Screening",
    ...normalizedInterviewStageLabels,
    ...finalStageLabels,
  ];

  const uniqueDynamicTabs = [...new Set(dynamicTabs)];
  if (uniqueDynamicTabs.length <= 2) {
    return DEFAULT_STAGE_TABS;
  }

  return uniqueDynamicTabs;
};

const getPreScreeningInitialState = (rowId) => ({
  open: true,
  rowId,
  step: 1,
  scheduleMode: "panel",
  assignTeam: "",
  duration: "",
  scheduleDateTime: "",
  panelName: "",
  comments: "",
  confirmTime: false,
  platform: "",
  meetingLink: "",
  password: "",
  sendInvite: true,
});

const toTitleCase = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const getSavedJobDescription = (job) =>
  String(
    job?.jobDescription ||
      job?.generatedJobDescription ||
      job?.generatedJd ||
      job?.generated_jd ||
      job?.jd ||
      ""
  ).trim();

const deriveCandidateFromFile = (file, existingRows, recruiterName) => {
  const baseName = String(file?.name || "")
    .replace(/\.[^/.]+$/, "")
    .replace(/[_\-]+/g, " ")
    .trim();

  const tokens = baseName.split(/\s+/).filter(Boolean);
  const fullName = toTitleCase(tokens.slice(0, 2).join(" ")) || "Uploaded Candidate";
  const emailToken = fullName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, ".");

  const numericIds = existingRows
    .map((row) => {
      const matched = String(row.candidateId || "").match(/\d+/);
      return matched ? Number(matched[0]) : 0;
    })
    .filter((value) => Number.isFinite(value));
  const nextNumericId = (numericIds.length ? Math.max(...numericIds) : 0) + 1;
  const candidateId = `C${String(nextNumericId).padStart(6, "0")}`;

  const matchingScore = Math.max(65, Math.min(95, 60 + Math.round((file?.size || 0) / 100000)));

  return {
    rowId: `${candidateId}-${Date.now()}`,
    candidateId,
    candidateName: fullName,
    candidateEmail: emailToken ? `${emailToken}@example.com` : "candidate@example.com",
    recruiterName: recruiterName || "Parthiban",
    source: "Uploaded Document",
    rating: "0/5",
    matchingScore,
    stage: "Map Candidates",
    status: "In Progress",
  };
};

const JobDescription = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { jobId } = useParams();
  const job = state?.job || fallbackJob;
  const uploadModalInputRef = React.useRef(null);
  const jobDescriptionText = React.useMemo(() => getSavedJobDescription(job), [job]);

  const stageTabs = React.useMemo(() => buildStageTabsFromJob(job), [job]);
  const pipelineStages = React.useMemo(
    () => stageTabs.filter((tab) => tab !== "Map Candidates"),
    [stageTabs]
  );

  const normalizeStage = React.useCallback((stage) => {
    const safeStage = normalizeLegacyStageLabel(stage);
    if (!safeStage) return "Sourced";

    const matchedStage = pipelineStages.find(
      (tab) => tab.toLowerCase() === safeStage.toLowerCase()
    );

    return matchedStage || safeStage;
  }, [pipelineStages]);

  const preparedRows = React.useMemo(() => {
    const normalizedRows = (job.candidates || []).map((row, index) => ({
      ...row,
      rowId: row.rowId || `${row.candidateId || "cand"}-${index}`,
      recruiterName: row.recruiterName || job.hiringManager || "Parthiban",
      source: row.source || "Resume Inbox",
      stage: normalizeStage(row.stage),
      status:
        row.status ||
        (normalizeStage(row.stage) === "Assessment" ? "Completed" : "In Progress"),
      matchingScore:
        typeof row.matchingScore === "number"
          ? row.matchingScore
          : Math.max(65, 92 - index * 5),
    }));

    const hasSourcedCandidate = normalizedRows.some(
      (row) => normalizeStage(row.stage) === "Sourced"
    );

    return hasSourcedCandidate
      ? normalizedRows
      : [...normalizedRows, { ...DUMMY_SOURCED_CANDIDATE }];
  }, [job.candidates, job.hiringManager, normalizeStage]);

  const [activeStage, setActiveStage] = React.useState("Map Candidates");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [candidateRows, setCandidateRows] = React.useState(preparedRows);
  const [selectedRowIds, setSelectedRowIds] = React.useState([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = React.useState(false);
  const [uploadCandidateFile, setUploadCandidateFile] = React.useState(null);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [candidatePreview, setCandidatePreview] = React.useState(null);
  const [preScreeningModal, setPreScreeningModal] = React.useState(null);
  const [stageMoveToast, setStageMoveToast] = React.useState("");

  React.useEffect(() => {
    if (!stageTabs.includes(activeStage)) {
      setActiveStage("Map Candidates");
    }
  }, [activeStage, stageTabs]);

  const displayedRows = React.useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return candidateRows.filter((row) => {
        const rowStage = normalizeStage(row.stage);
        const matchesStage =
          activeStage === "Map Candidates"
            ? rowStage !== "Sourced"
            : activeStage === "Sourced"
            ? rowStage === "Sourced"
            : rowStage.toLowerCase() === activeStage.toLowerCase();
        const searchableNameFields = [
          row.candidateName,
          row.recruiterName,
          row.candidateEmail,
        ]
          .map((value) => String(value || "").toLowerCase())
          .filter(Boolean);
        const matchesSearch =
          !normalizedSearch ||
          searchableNameFields.some((value) => value.includes(normalizedSearch));
        return matchesStage && matchesSearch;
      });
  }, [candidateRows, activeStage, searchTerm, normalizeStage]);

  const isMapStage = activeStage === "Map Candidates";
  const isSourcedStage = activeStage === "Sourced";

  const allMapRowsSelected =
    isMapStage &&
    displayedRows.length > 0 &&
    displayedRows.every((row) => selectedRowIds.includes(row.rowId));

  const getStageClass = React.useCallback((stage) => {
    const normalized = String(stage || "").toLowerCase();
    if (normalized === "sourced") return styles.stageSourced;
    if (normalized === "pre-screening") return styles.stageScreening;
    if (normalized === "assessment") return styles.stageAssessment;
    if (normalized.includes("interview")) return styles.stageInterview;
    if (normalized === "offer") return styles.stageOffer;
    if (normalized === "rejected") return styles.stageRejected;
    return styles.stageNeutral;
  }, []);

  const getForwardStageOptions = React.useCallback(
    (currentStage) => {
      const normalizedCurrentStage = normalizeStage(currentStage);
      const currentIndex = pipelineStages.findIndex(
        (tab) => tab.toLowerCase() === normalizedCurrentStage.toLowerCase()
      );

      if (currentIndex < 0) return pipelineStages;
      return pipelineStages.slice(currentIndex + 1);
    },
    [normalizeStage, pipelineStages]
  );

  const handleMoveTo = (rowId, nextStage) => {
    const normalizedNextStage = normalizeStage(nextStage);
    if (!normalizedNextStage) return;

    const currentRow = candidateRows.find((row) => row.rowId === rowId);
    if (!currentRow) return;

    const currentStageIndex = pipelineStages.findIndex(
      (tab) => tab.toLowerCase() === normalizeStage(currentRow.stage).toLowerCase()
    );
    const nextStageIndex = pipelineStages.findIndex(
      (tab) => tab.toLowerCase() === normalizedNextStage.toLowerCase()
    );

    if (currentStageIndex >= 0 && nextStageIndex >= 0 && nextStageIndex <= currentStageIndex) {
      return;
    }

    if (isSourcedStage && normalizedNextStage === "Pre-Screening") {
      setPreScreeningModal(getPreScreeningInitialState(rowId));
      return;
    }

    setCandidateRows((prev) =>
      prev.map((row) =>
        row.rowId === rowId
          ? {
              ...row,
              stage: normalizedNextStage,
              status: normalizedNextStage === "Assessment" ? "Completed" : row.status,
            }
          : row
      )
    );
  };

  const closePreScreeningModal = React.useCallback(() => {
    setPreScreeningModal(null);
  }, []);

  const updatePreScreeningModal = React.useCallback((key, value) => {
    setPreScreeningModal((prev) => (prev ? { ...prev, [key]: value } : prev));
  }, []);

  const commitPreScreeningMove = React.useCallback(() => {
    if (!preScreeningModal?.rowId) return;

    setCandidateRows((prev) =>
      prev.map((row) =>
        row.rowId === preScreeningModal.rowId
          ? {
              ...row,
              stage: "Pre-Screening",
              status: "In Progress",
            }
          : row
      )
    );
    setActiveStage("Pre-Screening");
    setSearchTerm("");
    setPreScreeningModal(null);
    setStageMoveToast("Candidate Moved Pre-Screening");
  }, [preScreeningModal]);

  const handleCandidateEyeClick = React.useCallback((row) => {
    setCandidatePreview(row);
  }, []);

  const closeCandidatePreview = React.useCallback(() => {
    setCandidatePreview(null);
  }, []);

  const handleRowCheckboxChange = React.useCallback((rowId) => {
    setSelectedRowIds((prev) =>
      prev.includes(rowId) ? prev.filter((id) => id !== rowId) : [...prev, rowId]
    );
  }, []);

  const handleSelectAllMapRows = React.useCallback(() => {
    const visibleRowIds = displayedRows.map((row) => row.rowId);
    if (visibleRowIds.length === 0) return;

    setSelectedRowIds((prev) => {
      const allVisibleSelected = visibleRowIds.every((rowId) => prev.includes(rowId));
      if (allVisibleSelected) {
        return prev.filter((rowId) => !visibleRowIds.includes(rowId));
      }
      return Array.from(new Set([...prev, ...visibleRowIds]));
    });
  }, [displayedRows]);

  const handleApproveMappedCandidates = React.useCallback(() => {
    if (selectedRowIds.length === 0) return;

    setCandidateRows((prev) =>
      prev.map((row) =>
        selectedRowIds.includes(row.rowId)
          ? { ...row, stage: normalizeStage("Sourced"), status: "In Progress" }
          : row
      )
    );
    setActiveStage("Sourced");
    setSearchTerm("");
    setSelectedRowIds([]);
  }, [selectedRowIds]);

  React.useEffect(() => {
    if (!stageMoveToast) return undefined;
    const timer = window.setTimeout(() => setStageMoveToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [stageMoveToast]);

  React.useEffect(() => {
    if (!candidatePreview) return undefined;
    const onEsc = (event) => {
      if (event.key === "Escape") setCandidatePreview(null);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onEsc);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onEsc);
    };
  }, [candidatePreview]);

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
  };

  const handleUploadClick = () => {
    setIsUploadModalOpen(true);
  };

  const handleUploadModalClose = () => {
    setIsUploadModalOpen(false);
  };

  const handleUploadFileChange = (event) => {
    const [file] = event.target.files || [];
    if (!file) return;
    setUploadCandidateFile(file);
    setUploadProgress(72);
  };

  const handleUploadFilePickerOpen = () => {
    uploadModalInputRef.current?.click();
  };

  const handleRemoveUploadFile = () => {
    setUploadCandidateFile(null);
    setUploadProgress(0);
    if (uploadModalInputRef.current) {
      uploadModalInputRef.current.value = "";
    }
  };

  const handleUploadSubmit = () => {
    if (!uploadCandidateFile) return;
    setCandidateRows((prev) => [
      ...prev,
      deriveCandidateFromFile(uploadCandidateFile, prev, job.hiringManager || "Parthiban"),
    ]);
    setActiveStage("Map Candidates");
    setSearchTerm("");
    setUploadCandidateFile(null);
    setUploadProgress(0);
    if (uploadModalInputRef.current) {
      uploadModalInputRef.current.value = "";
    }
    setIsUploadModalOpen(false);
  };

  const getScoreCircleStyle = (score) => {
    const safeScore = Math.max(0, Math.min(100, Number(score) || 0));
    return {
      background: `conic-gradient(#f97316 ${safeScore * 3.6}deg, #e2e8f0 0deg)`,
    };
  };

  const isPanelMode = preScreeningModal?.scheduleMode === "panel";
  const isStepOneValid = Boolean(
    preScreeningModal &&
      (isPanelMode
        ? preScreeningModal.assignTeam && preScreeningModal.duration
        : preScreeningModal.scheduleDateTime &&
          preScreeningModal.panelName &&
          preScreeningModal.confirmTime)
  );
  const isStepTwoValid = Boolean(
    preScreeningModal &&
      preScreeningModal.platform &&
      preScreeningModal.meetingLink &&
      preScreeningModal.sendInvite
  );

  return (
    <div className={styles.page}>
      {stageMoveToast ? (
        <div className={styles.stageMoveToast}>
          <span className={styles.toastIcon}>
            <FiCheck size={14} />
          </span>
          <span className={styles.toastText}>{stageMoveToast}</span>
        </div>
      ) : null}
      <div className={styles.card}>
        <div className={styles.headerRow}>
          <div className={styles.headerLeft}>
            <button type="button" className={styles.backBtn} onClick={() => navigate(-1)}>
              <FiArrowLeft />
            </button>
            <div>
              <h2 className={styles.title}>Job Description</h2>
              <div className={styles.breadcrumb}>
                <span>Dashboard</span>
                <span className={styles.separator}>/</span>
                <span>Job List</span>
                <span className={styles.separator}>/</span>
                <span className={styles.current}>Job Description</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.detailCard}>
          <div className={styles.detailHeader}>
            <div className={styles.avatar}>Z</div>
            <div className={styles.jobMeta}>
              <div className={styles.jobId}>{job.openingJobId || jobId}</div>
              <div className={styles.jobSub}>
                <span>{job.postingTitle}</span>
                <span>•</span>
                <span>Exp: {job.minExperience || 0}-{job.maxExperience || 0}y</span>
                <span>•</span>
                <span>Created Date: {formatDate(job.jobReceivedDate)}</span>
              </div>
            </div>
            <div className={styles.tags}>
              <span className={styles.tagPrimary}>Client Id: {job.clientId || "1298338"}</span>
              <span className={styles.tagWarning}>{job.importance || "High Importance"}</span>
            </div>
          </div>

          <div className={styles.jdSummaryCard}>
            <div className={styles.jdSummaryHeader}>
              <div>
                <h3 className={styles.jdSummaryTitle}>Generated Job Description</h3>
                <p className={styles.jdSummarySubtitle}>
                  AI draft created from the role details captured by the Account Manager module.
                </p>
              </div>
              <span className={styles.jdSummaryBadge}>
                {jobDescriptionText ? "Saved JD" : "Draft Pending"}
              </span>
            </div>

            {jobDescriptionText ? (
              <div className={styles.jdSummaryContent}>{jobDescriptionText}</div>
            ) : (
              <div className={styles.jdSummaryEmpty}>
                No generated job description has been saved for this opening yet.
              </div>
            )}
          </div>

          <div className={styles.stageRow}>
            <div className={styles.stageTabs}>
              {stageTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`${styles.stageTab}${activeStage === tab ? ` ${styles.stageTabActive}` : ""}`}
                  onClick={() => setActiveStage(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className={styles.stageActions}>
              <button type="button" className={styles.mapBtn} disabled={!isMapStage}>
                Map Job
              </button>
              {isMapStage && (
                <button type="button" className={styles.uploadBtn} onClick={handleUploadClick}>
                  Upload Candidate
                </button>
              )}
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table
              className={`${styles.candidateTable}${isMapStage ? ` ${styles.candidateTableMapped}` : ""}`}
            >
              <thead>
                <tr>
                  {isMapStage ? (
                    <th className={styles.checkboxHead}>
                      <input
                        type="checkbox"
                        checked={allMapRowsSelected}
                        onChange={handleSelectAllMapRows}
                        className={styles.rowCheckbox}
                        aria-label="Select all candidates"
                      />
                    </th>
                  ) : null}
                  <th>Application Id</th>
                  <th>Candidate Name</th>
                  <th>Email Address</th>
                  <th>Recruiter Name</th>
                  <th>Source</th>
                  {isMapStage ? <th>Matching Score</th> : <th>Rating</th>}
                  {!isMapStage ? <th>Stage</th> : null}
                  {!isMapStage ? <th>Status</th> : null}
                  <th className={styles.actionsHead}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedRows.map((row, index) => (
                  <tr key={row.rowId || `${row.candidateId}-${index}`}>
                    {isMapStage ? (
                      <td className={styles.checkboxCell}>
                        <input
                          type="checkbox"
                          checked={selectedRowIds.includes(row.rowId)}
                          onChange={() => handleRowCheckboxChange(row.rowId)}
                          className={styles.rowCheckbox}
                          aria-label={`Select ${row.candidateName}`}
                        />
                      </td>
                    ) : null}
                    <td>{row.candidateId}</td>
                    <td>{row.candidateName}</td>
                    <td>{row.candidateEmail}</td>
                    <td>{row.recruiterName}</td>
                    <td className={styles.sourceCell}>{row.source}</td>
                    {isMapStage ? (
                      <td className={styles.matchScoreCell}>
                        <span className={styles.matchScoreWrap} style={getScoreCircleStyle(row.matchingScore)}>
                          <span className={styles.matchScoreInner}>{row.matchingScore}%</span>
                        </span>
                      </td>
                    ) : (
                      <td className={styles.ratingCell}>
                        <div className={styles.ratingWrap}>
                          {row.rating}
                          <span className={styles.ratingStar}>★</span>
                        </div>
                      </td>
                    )}
                    {!isMapStage ? (
                      <td className={styles.stageCell}>
                        <span className={`${styles.stagePill} ${getStageClass(row.stage)}`}>{row.stage}</span>
                      </td>
                    ) : null}
                    {!isMapStage ? (
                      <td className={styles.statusCell}>
                        <span
                          className={`${styles.statusDot} ${
                            row.status === "Completed" ? styles.statusGreen : styles.statusDark
                          }`}
                        />
                        {row.status}
                      </td>
                    ) : null}
                    <td className={isMapStage ? styles.actionsCell : styles.actionsCellWide}>
                      {isMapStage ? (
                        <button
                          type="button"
                          className={styles.eyeActionBtn}
                          onClick={() => handleCandidateEyeClick(row)}
                          aria-label="View mapped candidate"
                        >
                          <FiEye size={16} />
                        </button>
                      ) : (
                        (() => {
                          const forwardOptions = getForwardStageOptions(row.stage);
                          return (
                        <select
                          className={`${styles.moveSelect}${isSourcedStage ? ` ${styles.moveSelectWide}` : ""}`}
                          value=""
                          onChange={(event) => handleMoveTo(row.rowId, event.target.value)}
                          disabled={forwardOptions.length === 0}
                        >
                          <option value="">{forwardOptions.length === 0 ? "No next stage" : "Move to"}</option>
                          {forwardOptions.map((tab) => (
                            <option key={tab} value={tab}>
                              {tab}
                            </option>
                          ))}
                        </select>
                          );
                        })()
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className={styles.tableFooter}>
              <span>Show</span>
              <select className={styles.entriesSelect} defaultValue="10">
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
              <span>entries</span>
            </div>
          </div>
          {isMapStage ? (
            <div className={styles.approvalFooter}>
              <button
                type="button"
                className={styles.approveBtn}
                onClick={handleApproveMappedCandidates}
                disabled={selectedRowIds.length === 0}
              >
                Approve
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {candidatePreview ? (
        <div className={styles.previewOverlay} onClick={closeCandidatePreview}>
          <div className={styles.previewModal} onClick={(event) => event.stopPropagation()}>
            <div className={styles.previewHeader}>
              <h3 className={styles.previewTitle}>Candidate Profile</h3>
              <button
                type="button"
                className={styles.previewClose}
                onClick={closeCandidatePreview}
                aria-label="Close candidate profile"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className={styles.previewIdentity}>
              <div className={styles.previewAvatar}>
                {(candidatePreview.candidateName || "C").charAt(0).toUpperCase()}
              </div>
              <div>
                <h4>{candidatePreview.candidateName || "-"}</h4>
                <p>{candidatePreview.candidateId || "-"}</p>
              </div>
            </div>

            <div className={styles.previewGrid}>
              <div className={styles.previewItem}>
                <span>Email Address</span>
                <strong>{candidatePreview.candidateEmail || "-"}</strong>
              </div>
              <div className={styles.previewItem}>
                <span>Recruiter Name</span>
                <strong>{candidatePreview.recruiterName || "-"}</strong>
              </div>
              <div className={styles.previewItem}>
                <span>Source</span>
                <strong>{candidatePreview.source || "-"}</strong>
              </div>
              <div className={styles.previewItem}>
                <span>Rating</span>
                <strong>{candidatePreview.rating || "-"}</strong>
              </div>
              <div className={styles.previewItem}>
                <span>Matching Score</span>
                <strong>
                  {candidatePreview.matchingScore !== null && candidatePreview.matchingScore !== undefined
                    ? `${candidatePreview.matchingScore}%`
                    : "-"}
                </strong>
              </div>
              <div className={styles.previewItem}>
                <span>Stage</span>
                <strong>{candidatePreview.stage || "-"}</strong>
              </div>
              <div className={styles.previewItem}>
                <span>Status</span>
                <strong>{candidatePreview.status || "-"}</strong>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {preScreeningModal?.open ? (
        <div className={styles.preScreenOverlay} onClick={closePreScreeningModal}>
          <div className={styles.preScreenModal} onClick={(event) => event.stopPropagation()}>
            <div className={styles.preScreenHeader}>
              <h3 className={styles.preScreenTitle}>Pre-Screening</h3>
              <button
                type="button"
                className={styles.preScreenClose}
                onClick={closePreScreeningModal}
                aria-label="Close pre-screening modal"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className={styles.preScreenStepper}>
              <div className={styles.preStep}>
                <span
                  className={`${styles.preStepCircle} ${
                    preScreeningModal.step === 1 ? styles.preStepCircleActive : styles.preStepCircleComplete
                  }`}
                >
                  {preScreeningModal.step === 1 ? <span className={styles.preStepDot} /> : <FiCheck size={12} />}
                </span>
                <span className={styles.preStepLabel}>Checking Availability</span>
              </div>
              <div
                className={`${styles.preStepLine} ${
                  preScreeningModal.step === 2 ? styles.preStepLineActive : ""
                }`}
              />
              <div className={styles.preStep}>
                <span
                  className={`${styles.preStepCircle} ${
                    preScreeningModal.step === 2 ? styles.preStepCircleActive : ""
                  }`}
                >
                  {preScreeningModal.step === 2 ? <span className={styles.preStepDot} /> : null}
                </span>
                <span
                  className={`${styles.preStepLabel} ${
                    preScreeningModal.step === 2 ? styles.preStepLabelActive : ""
                  }`}
                >
                  Schedule Interview
                </span>
              </div>
            </div>

            {preScreeningModal.step === 1 ? (
              <div className={styles.preScreenBody}>
                <div className={styles.preFieldLabel}>
                  Schedule the interview <span className={styles.requiredStar}>*</span>
                </div>
                <div className={styles.preRadioRow}>
                  <label className={styles.preRadioLabel}>
                    <input
                      type="radio"
                      name="scheduleMode"
                      checked={preScreeningModal.scheduleMode === "panel"}
                      onChange={() => updatePreScreeningModal("scheduleMode", "panel")}
                    />
                    Checking panel availability
                  </label>
                  <label className={styles.preRadioLabel}>
                    <input
                      type="radio"
                      name="scheduleMode"
                      checked={preScreeningModal.scheduleMode === "manual"}
                      onChange={() => updatePreScreeningModal("scheduleMode", "manual")}
                    />
                    Selecting date & time manually
                  </label>
                </div>

                {isPanelMode ? (
                  <div className={styles.preFieldGrid}>
                    <div className={styles.preFieldGroup}>
                      <label className={styles.preFieldLabel}>
                        Assign Team <span className={styles.requiredStar}>*</span>
                      </label>
                      <select
                        value={preScreeningModal.assignTeam}
                        onChange={(event) => updatePreScreeningModal("assignTeam", event.target.value)}
                      >
                        <option value="">Select Team</option>
                        {TEAM_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.preFieldGroup}>
                      <label className={styles.preFieldLabel}>
                        Duration <span className={styles.requiredStar}>*</span>
                      </label>
                      <select
                        value={preScreeningModal.duration}
                        onChange={(event) => updatePreScreeningModal("duration", event.target.value)}
                      >
                        <option value="">Select Duration</option>
                        {DURATION_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={styles.preFieldGrid}>
                      <div className={styles.preFieldGroup}>
                        <label className={styles.preFieldLabel}>
                          Select Date & Time <span className={styles.requiredStar}>*</span>
                        </label>
                        <input
                          type="datetime-local"
                          value={preScreeningModal.scheduleDateTime}
                          onChange={(event) =>
                            updatePreScreeningModal("scheduleDateTime", event.target.value)
                          }
                        />
                      </div>
                      <div className={styles.preFieldGroup}>
                        <label className={styles.preFieldLabel}>
                          Panel Name <span className={styles.requiredStar}>*</span>
                        </label>
                        <select
                          value={preScreeningModal.panelName}
                          onChange={(event) => updatePreScreeningModal("panelName", event.target.value)}
                        >
                          <option value="">Panel Name</option>
                          {PANEL_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <label className={styles.preCheckLabel}>
                      <input
                        type="checkbox"
                        checked={preScreeningModal.confirmTime}
                        onChange={(event) =>
                          updatePreScreeningModal("confirmTime", event.target.checked)
                        }
                      />
                      I confirm that all panel members have agreed to the interview time
                    </label>
                  </>
                )}

                <div className={styles.preFieldGroup}>
                  <label className={styles.preFieldLabel}>Comments / Remarks</label>
                  <textarea
                    rows={3}
                    value={preScreeningModal.comments}
                    onChange={(event) => updatePreScreeningModal("comments", event.target.value)}
                  />
                </div>

                <div className={styles.preActionRow}>
                  <button
                    type="button"
                    className={`${styles.preBtn} ${styles.preBtnPrimary}`}
                    onClick={commitPreScreeningMove}
                    disabled={!isPanelMode || !isStepOneValid}
                  >
                    Submit
                  </button>
                  <button
                    type="button"
                    className={`${styles.preBtn} ${styles.preBtnSecondary}`}
                    onClick={() => updatePreScreeningModal("step", 2)}
                    disabled={isPanelMode || !isStepOneValid}
                  >
                    Next
                  </button>
                  <button
                    type="button"
                    className={`${styles.preBtn} ${styles.preBtnGhost}`}
                    onClick={closePreScreeningModal}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.preScreenBody}>
                <div className={styles.preFieldGrid}>
                  <div className={styles.preFieldGroup}>
                    <label className={styles.preFieldLabel}>
                      Platform <span className={styles.requiredStar}>*</span>
                    </label>
                    <select
                      value={preScreeningModal.platform}
                      onChange={(event) => updatePreScreeningModal("platform", event.target.value)}
                    >
                      <option value="">Select Platform</option>
                      {PLATFORM_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.preFieldGroup}>
                    <label className={styles.preFieldLabel}>
                      Meeting Link <span className={styles.requiredStar}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter meeting link"
                      value={preScreeningModal.meetingLink}
                      onChange={(event) => updatePreScreeningModal("meetingLink", event.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.preFieldGroup}>
                  <label className={styles.preFieldLabel}>Password</label>
                  <input
                    type="text"
                    placeholder="Meeting Password"
                    value={preScreeningModal.password}
                    onChange={(event) => updatePreScreeningModal("password", event.target.value)}
                  />
                </div>

                <label className={styles.preCheckLabel}>
                  <input
                    type="checkbox"
                    checked={preScreeningModal.sendInvite}
                    onChange={(event) => updatePreScreeningModal("sendInvite", event.target.checked)}
                  />
                  All selected members will receive the invitation.
                </label>

                <div className={styles.preActionRow}>
                  <button
                    type="button"
                    className={`${styles.preBtn} ${styles.preBtnPrimary}`}
                    onClick={commitPreScreeningMove}
                    disabled={!isStepTwoValid}
                  >
                    Submit
                  </button>
                  <button
                    type="button"
                    className={`${styles.preBtn} ${styles.preBtnSecondary}`}
                    onClick={() => updatePreScreeningModal("step", 1)}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className={`${styles.preBtn} ${styles.preBtnGhost}`}
                    onClick={closePreScreeningModal}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {isUploadModalOpen ? (
        <div className={styles.uploadModalOverlay} onClick={handleUploadModalClose}>
          <div className={styles.uploadModal} onClick={(event) => event.stopPropagation()}>
            <div className={styles.uploadModalHeader}>
              <h3 className={styles.uploadModalTitle}>Upload Candidates</h3>
              <button
                type="button"
                className={styles.uploadModalClose}
                onClick={handleUploadModalClose}
                aria-label="Close upload candidates modal"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className={styles.uploadModalFieldLabel}>Upload Document</div>

            <div className={styles.uploadDropzone}>
              <span className={styles.uploadDropzoneIcon}>
                <FiFileText size={16} />
              </span>
              <div className={styles.uploadDropzoneText}>
                <button
                  type="button"
                  className={styles.uploadDropzoneLink}
                  onClick={handleUploadFilePickerOpen}
                >
                  Click Here
                </button>
                <span> to upload your Documents or drag.</span>
              </div>
              <div className={styles.uploadDropzoneHint}>Supported Format. PDF (20 mb)</div>
              <input
                ref={uploadModalInputRef}
                type="file"
                className={styles.hiddenFileInput}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                onChange={handleUploadFileChange}
              />
            </div>

            {uploadCandidateFile ? (
              <div className={styles.uploadFileCard}>
                <div className={styles.uploadFileIconWrap}>
                  <FiFileText size={16} />
                </div>
                <div className={styles.uploadFileMeta}>
                  <div className={styles.uploadFileName}>{uploadCandidateFile.name}</div>
                  <div className={styles.uploadFileProgressTrack}>
                    <div
                      className={styles.uploadFileProgressFill}
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.uploadFileDeleteBtn}
                  onClick={handleRemoveUploadFile}
                  aria-label="Remove uploaded file"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            ) : null}

            <div className={styles.uploadModalActions}>
              <button
                type="button"
                className={styles.uploadModalSubmitBtn}
                onClick={handleUploadSubmit}
                disabled={!uploadCandidateFile}
              >
                Submit
              </button>
              <button
                type="button"
                className={styles.uploadModalCancelBtn}
                onClick={handleUploadModalClose}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default JobDescription;
