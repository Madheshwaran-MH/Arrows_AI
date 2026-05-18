import * as React from "react";
import {
  FiChevronDown,
  FiEdit2,
  FiEye,
  FiFileText,
  FiFilter,
  FiMail,
  FiMapPin,
  FiPhone,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import { jobOpeningConfig } from "../../components/forms/formConfigs";
import ReusableForm from "../../components/forms/ReusableForm";
import { getClientOptions, loadClientRows } from "../../utils/clientStore";
import { generateJDWithAI } from "../../utils/generateJD";
import styles from "./JobOpenings.module.scss";

const DEFAULT_TEAM_MEMBERS = [
  { id: "A83261", name: "Rahul Mehta" },
  { id: "A83233", name: "Priya Sharma" },
];

const resolveUserName = () => {
  const email = localStorage.getItem("userEmail");
  if (email) {
    const namePart = email.split("@")[0];
    if (namePart) {
      return namePart
        .split(".")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }
  }
  return localStorage.getItem("userName") || "Divya Mehta";
};

const JOB_OPENING_DRAFT_STORAGE_KEY = "job-openings:add-draft:v1";
const JOB_OPENING_TABLE_STORAGE_KEY = "job-openings:table:v1";
const createJobOpeningDraftId = () => `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const saveJobOpeningTableData = (rows) => {
  try {
    localStorage.setItem(JOB_OPENING_TABLE_STORAGE_KEY, JSON.stringify(rows));
  } catch (error) {
    console.error("Failed to save job openings:", error);
  }
};

const getJobOpeningSequence = (value) => {
  const matchedDigits = String(value || "").match(/(\d+)/);
  if (!matchedDigits) return 0;
  const parsed = Number(matchedDigits[1]);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const getJobOpeningIdValue = (item) =>
  item?.jobPositionId || item?.openingJobId || item?.jobId || "";

const getNextJobOpeningId = (rows = []) => {
  const usedSequences = new Set(
    rows
      .map((item) => getJobOpeningSequence(getJobOpeningIdValue(item)))
      .filter((sequence) => sequence > 0)
  );

  let nextSequence = 1;
  while (usedSequences.has(nextSequence)) {
    nextSequence += 1;
  }

  return `JOP-${String(nextSequence).padStart(3, "0")}`;
};

const formatAssignedRecruiters = (assignedRecruiters, customTeamMembers = []) => {
  const teamDirectory = [
    ...DEFAULT_TEAM_MEMBERS,
    ...(Array.isArray(customTeamMembers) ? customTeamMembers : []),
  ];
  const memberNameById = new Map(teamDirectory.map((member) => [member.id, member.name]));

  if (Array.isArray(assignedRecruiters)) {
    const names = assignedRecruiters
      .map((memberId) => memberNameById.get(memberId) || String(memberId || "").trim())
      .filter(Boolean);
    return names.length ? names.join(", ") : "-";
  }

  const textValue = String(assignedRecruiters || "").trim();
  return textValue || "-";
};

const resolveAssignedRecruiterNames = (teamMembers, customTeamMembers = []) => {
  const teamDirectory = [
    ...DEFAULT_TEAM_MEMBERS,
    ...(Array.isArray(customTeamMembers) ? customTeamMembers : []),
  ];
  const memberNameById = new Map(teamDirectory.map((member) => [member.id, member.name]));

  if (!Array.isArray(teamMembers)) {
    return String(teamMembers || "").trim();
  }

  return teamMembers
    .map((memberId) => memberNameById.get(memberId) || String(memberId || "").trim())
    .filter(Boolean)
    .join(", ");
};

// Memoized filter bar component to prevent unnecessary re-renders
const FilterBar = React.memo(({
  searchTerm,
  onSearchChange,
  filterPostingTitle,
  onFilterPostingTitleChange,
  filterTargetDate,
  onFilterTargetDateChange,
  filterJobStatus,
  onFilterJobStatusChange,
  filterPriority,
  onFilterPriorityChange,
  uniquePostingTitles,
  uniqueJobStatuses,
  uniquePriorities,
  hasFilters,
  onClearFilters
}) => {
  return (
    <div className={styles.filtersBar}>
      <div className={styles.filtersLeft}>
        <FiFilter className={styles.filterIcon} aria-hidden="true" />
        <div className={styles.searchField}>
          <FiSearch className={styles.searchIcon} aria-hidden="true" />
          <input
            type="text"
            placeholder="Search here..."
            value={searchTerm}
            onChange={onSearchChange}
            className={styles.searchInput}
          />
        </div>

        <select
          value={filterPostingTitle}
          onChange={onFilterPostingTitleChange}
          className={styles.selectField}
        >
          <option value="">Posting Title</option>
          {uniquePostingTitles.map(title => (
            <option key={title} value={title}>{title}</option>
          ))}
        </select>

        <input
          type="date"
          value={filterTargetDate}
          onChange={onFilterTargetDateChange}
          className={styles.dateField}
        />

        <select
          value={filterJobStatus}
          onChange={onFilterJobStatusChange}
          className={styles.selectField}
        >
          <option value="">Job Status</option>
          {uniqueJobStatuses.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>

        <select
          value={filterPriority}
          onChange={onFilterPriorityChange}
          className={styles.selectField}
        >
          <option value="">Priority</option>
          {uniquePriorities.map(priority => (
            <option key={priority} value={priority}>{priority}</option>
          ))}
        </select>

      </div>

      <div className={styles.filtersRight}>
        <button
          className={styles.clearButton}
          type="button"
          onClick={onClearFilters}
          disabled={!hasFilters}
        >
          Clear
        </button>
      </div>
    </div>
  );
});

FilterBar.displayName = 'FilterBar';

export default function JobOpenings({ createMode = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUserRole = React.useMemo(() => {
    if (typeof window === "undefined") return "";
    return String(window.localStorage.getItem("userRole") || "").toLowerCase();
  }, []);
  const jobOpeningsPageDescription = React.useMemo(() => {
    if (currentUserRole === "recruiter") {
      return <><strong>Manage job openings, track application progress,</strong> and <strong>monitor hiring requirements</strong> efficiently.</>;
    }

    if (currentUserRole === "accountmanager" || currentUserRole === "manager" || currentUserRole === "management") {
      return <><strong>Centralize hiring demands, application pipelines,</strong> and <strong> recruitment progress</strong> across all openings.</>;
    }

    return <strong>Centralize hiring demands, application pipelines, and recruitment progress across all openings.</strong>;
  }, [currentUserRole]);
  const isRecruiter = currentUserRole === "recruiter";
  const [showJobOpeningForm, setShowJobOpeningForm] = React.useState(false);
  const [showDataTable, setShowDataTable] = React.useState(true);
  const [submittedData, setSubmittedData] = React.useState(() => {
    try {
      const savedData = localStorage.getItem(JOB_OPENING_TABLE_STORAGE_KEY);
      const parsedData = savedData ? JSON.parse(savedData) : null;
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        return parsedData;
      }
    } catch (error) {
      console.error("Failed to load saved job openings:", error);
    }

    return [
      {
        jobPositionId: "JOP-001",
        positionName: "Senior React Developer",
        minExperience: 4,
        maxExperience: 7,
        jobDescriptionLink: "https://example.com/jd/react",
        positionLevel: "senior",
        location: "Delhi",
        noOfPositions: 2,
        jobReceivedDate: "2026-01-12",
        hiringType: "on-site",
        minSalary: 1200000,
        maxSalary: 2000000,
        jobType: "full-time",
        technicalSkills: ["react", "javascript", "typescript"],
        softSkills: ["communication", "teamwork"],
        additionalSkills: "Redux",
        addTechnicalSkills: ["machine-learning", "azure"],
        clientId: "C1292938",
        clientName: "MethodHub",
        contactPersonName: "Divya Mehta",
        contactPersonEmail: "divya.mehta@email.com",
        assignedRecruiters: "Asha, Rohan",
        targetDate: "2026-02-15",
        jobOpeningStatus: "Active",
        priority: "High",
        hiringManager: "Karthik Rao",
        candidates: [
          {
            candidateId: "C001",
            candidateName: "Rahul Mehta",
            candidateEmail: "rahul.mehta@email.com",
            modifiedTime: "11/10/2025 05:30 PM",
            source: "Resume Inbox",
            rating: "3/5",
            stage: "Assessment",
            round: "Round 3"
          },
          {
            candidateId: "C002",
            candidateName: "Arun Kumar",
            candidateEmail: "arun.kumar@email.com",
            modifiedTime: "11/10/2025 05:30 PM",
            source: "LinkedIn",
            rating: "4/5",
            stage: "Client Interview",
            round: "Round 4"
          },
          {
            candidateId: "C003",
            candidateName: "Priya Sharma",
            candidateEmail: "priya.sharma@email.com",
            modifiedTime: "11/10/2025 05:30 PM",
            source: "Naukri",
            rating: "2/5",
            stage: "Pre-Screening",
            round: "Round 2"
          }
        ]
      },
      {
        jobPositionId: "JOP-002",
        positionName: "Product Manager",
        minExperience: 6,
        maxExperience: 10,
        jobDescriptionLink: "https://example.com/jd/pm",
        positionLevel: "manager",
        location: "Pune",
        noOfPositions: 1,
        jobReceivedDate: "2026-01-20",
        hiringType: "remote",
        minSalary: 1400000,
        maxSalary: 2200000,
        jobType: "contract",
        technicalSkills: ["sql", "aws"],
        softSkills: ["leadership", "communication"],
        additionalSkills: "Roadmapping",
        addTechnicalSkills: ["data-science"],
        clientId: "C1292432",
        clientName: "Arrows Inc",
        contactPersonName: "Rahul Mehta",
        contactPersonEmail: "rahul.mehta@email.com",
        assignedRecruiters: "Priya, Naveen",
        targetDate: "2026-03-01",
        jobOpeningStatus: "Draft",
        priority: "Medium",
        hiringManager: "Sneha Nair",
        candidates: [
          {
            candidateId: "C011",
            candidateName: "Ananya Rao",
            candidateEmail: "ananya.rao@email.com",
            modifiedTime: "11/12/2025 11:20 AM",
            source: "LinkedIn",
            rating: "4/5",
            stage: "Sourced",
            round: "Round 1"
          },
          {
            candidateId: "C012",
            candidateName: "Vikram Singh",
            candidateEmail: "vikram.singh@email.com",
            modifiedTime: "11/12/2025 11:20 AM",
            source: "Resume Inbox",
            rating: "3/5",
            stage: "Assessment",
            round: "Round 2"
          }
        ]
      },
      {
        jobPositionId: "JOP-003",
        positionName: "UI/UX Designer",
        minExperience: 3,
        maxExperience: 6,
        jobDescriptionLink: "https://example.com/jd/uiux",
        positionLevel: "mid",
        location: "Bangalore",
        noOfPositions: 1,
        jobReceivedDate: "2026-01-18",
        hiringType: "hybrid",
        minSalary: 900000,
        maxSalary: 1400000,
        jobType: "full-time",
        technicalSkills: ["html", "css"],
        softSkills: ["creativity", "presentation"],
        additionalSkills: "Figma",
        extraTechnicalSkills: ["computer-vision"],
        clientId: "C1292921",
        clientName: "NovaLabs",
        contactPersonName: "Arjun Rao",
        contactPersonEmail: "arjun.rao@email.com",
        assignedRecruiters: "Nisha",
        targetDate: "2026-02-05",
        jobOpeningStatus: "Closed",
        priority: "Low",
        hiringManager: "Anitha Kumar",
        candidates: [
          {
            candidateId: "C021",
            candidateName: "Sneha Iyer",
            candidateEmail: "sneha.iyer@email.com",
            modifiedTime: "11/18/2025 03:00 PM",
            source: "LinkedIn",
            rating: "4/5",
            stage: "Pre-Screening",
            round: "Round 1"
          }
        ]
      }
    ];
  });
  const [showSuccessMessage, setShowSuccessMessage] = React.useState(false);
  const [successMessageText, setSuccessMessageText] = React.useState("Job opening created successfully");
  const [editingIndex, setEditingIndex] = React.useState(null);
  const [editingData, setEditingData] = React.useState(null);
  const [editLocked, setEditLocked] = React.useState(false);
  const [activeDraftId, setActiveDraftId] = React.useState(null);
  const [jobOpeningDrafts, setJobOpeningDrafts] = React.useState([]);
  const [isAddJobOpeningMenuOpen, setIsAddJobOpeningMenuOpen] = React.useState(false);
  const [jobOpeningFormKey, setJobOpeningFormKey] = React.useState(0);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterPostingTitle, setFilterPostingTitle] = React.useState('');
  const [filterTargetDate, setFilterTargetDate] = React.useState('');
  const [filterJobStatus, setFilterJobStatus] = React.useState('');
  const [filterPriority, setFilterPriority] = React.useState('');
  const [entriesPerPage, setEntriesPerPage] = React.useState(10);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [expandedRows, setExpandedRows] = React.useState({});
  const [isViewDrawerOpen, setIsViewDrawerOpen] = React.useState(false);
  const [selectedJobOpening, setSelectedJobOpening] = React.useState(null);
  const [isCandidateDrawerOpen, setIsCandidateDrawerOpen] = React.useState(false);
  const [selectedCandidate, setSelectedCandidate] = React.useState(null);
  const [drawerTab, setDrawerTab] = React.useState("Job Information");
  const [sortConfig, setSortConfig] = React.useState({ key: null, direction: 'asc' });
  const [clientOptions, setClientOptions] = React.useState(() => getClientOptions(loadClientRows()));
  const addJobOpeningMenuRef = React.useRef(null);
  const createModeInitializedRef = React.useRef(false);

  const handleSort = React.useCallback((key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const deferredSearchTerm = React.useDeferredValue(searchTerm);

  const showTransientMessage = React.useCallback((message) => {
    setSuccessMessageText(message);
    setShowSuccessMessage(true);
    window.setTimeout(() => {
      setShowSuccessMessage(false);
    }, 60000);
  }, []);

  React.useEffect(() => {
    saveJobOpeningTableData(submittedData);
  }, [submittedData]);

  React.useEffect(() => {
    const refreshClientOptions = () => {
      setClientOptions(getClientOptions(loadClientRows()));
    };

    const handleWindowFocus = () => {
      // File picker close also triggers window focus; avoid rerendering while form is active.
      if (showJobOpeningForm) {
        return;
      }
      refreshClientOptions();
    };

    refreshClientOptions();
    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("storage", refreshClientOptions);

    return () => {
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("storage", refreshClientOptions);
    };
  }, [showJobOpeningForm]);

  const sanitizeDraftValue = React.useCallback((value) => {
    const sanitize = (input) => {
      if (input === null || input === undefined) return input;
      if (Array.isArray(input)) return input.map((item) => sanitize(item));
      if (typeof input !== "object") return input;
      if (input instanceof Date) return input.toISOString();
      if (typeof File !== "undefined" && input instanceof File) return input.name;
      if (typeof Blob !== "undefined" && input instanceof Blob) return "blob";

      return Object.entries(input).reduce((acc, [key, nestedValue]) => {
        acc[key] = sanitize(nestedValue);
        return acc;
      }, {});
    };

    return sanitize(value);
  }, []);

  const persistJobOpeningDrafts = React.useCallback((drafts) => {
    localStorage.setItem(JOB_OPENING_DRAFT_STORAGE_KEY, JSON.stringify(drafts));
  }, []);

  const getJobOpeningDrafts = React.useCallback(() => {
    try {
      const rawDrafts = localStorage.getItem(JOB_OPENING_DRAFT_STORAGE_KEY);
      if (!rawDrafts) return [];
      const parsedDrafts = JSON.parse(rawDrafts);
      if (!Array.isArray(parsedDrafts)) return [];
      return parsedDrafts
        .filter((draft) => draft && typeof draft === "object" && draft.id)
        .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
    } catch (error) {
      console.error("Failed to read job opening drafts:", error);
      return [];
    }
  }, []);

  const getJobOpeningDraftTitle = React.useCallback((formData, fallbackCount) => {
    if (formData?.positionName) return String(formData.positionName);
    if (formData?.jobPositionId) return `Job ${formData.jobPositionId}`;
    return `Untitled Draft ${fallbackCount}`;
  }, []);

  React.useEffect(() => {
    setJobOpeningDrafts(getJobOpeningDrafts());
  }, [getJobOpeningDrafts]);

  const saveJobOpeningDraft = React.useCallback((formData) => {
    try {
      const sanitizedData = sanitizeDraftValue({
        ...formData,
        jobOpeningStatus: "Draft",
      });
      const now = new Date().toISOString();
      let didUpdateExistingDraft = false;
      let savedDraftId = activeDraftId;

      setJobOpeningDrafts((prevDrafts) => {
        const hasActiveDraft = Boolean(savedDraftId) && prevDrafts.some((draft) => draft.id === savedDraftId);
        let nextDrafts;

        if (hasActiveDraft) {
          didUpdateExistingDraft = true;
          nextDrafts = prevDrafts.map((draft) =>
            draft.id === savedDraftId
              ? {
                ...draft,
                title: getJobOpeningDraftTitle(sanitizedData, prevDrafts.length),
                updatedAt: now,
                data: sanitizedData,
              }
              : draft
          );
        } else {
          savedDraftId = createJobOpeningDraftId();
          nextDrafts = [
            {
              id: savedDraftId,
              title: getJobOpeningDraftTitle(sanitizedData, prevDrafts.length + 1),
              createdAt: now,
              updatedAt: now,
              data: sanitizedData,
            },
            ...prevDrafts,
          ];
        }

        persistJobOpeningDrafts(nextDrafts);
        return nextDrafts;
      });

      setActiveDraftId(savedDraftId);
      showTransientMessage(didUpdateExistingDraft ? "Draft updated successfully" : "Draft saved successfully");
    } catch (error) {
      console.error("Failed to save job opening draft:", error);
      alert("Unable to save draft right now. Please try again.");
    }
  }, [activeDraftId, getJobOpeningDraftTitle, persistJobOpeningDrafts, sanitizeDraftValue, showTransientMessage]);

  React.useEffect(() => {
    if (!isAddJobOpeningMenuOpen) return undefined;
    const handleOutsideClick = (event) => {
      if (addJobOpeningMenuRef.current && !addJobOpeningMenuRef.current.contains(event.target)) {
        setIsAddJobOpeningMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isAddJobOpeningMenuOpen]);

  const handleSearchChange = React.useCallback((e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  }, []);

  // useCallback for filter handlers - prevents unnecessary re-renders
  const handleFilterPostingTitleChange = React.useCallback((e) => {
    setFilterPostingTitle(e.target.value);
    setCurrentPage(1);
  }, []);

  const handleFilterTargetDateChange = React.useCallback((e) => {
    setFilterTargetDate(e.target.value);
    setCurrentPage(1);
  }, []);

  const handleFilterJobStatusChange = React.useCallback((e) => {
    setFilterJobStatus(e.target.value);
    setCurrentPage(1);
  }, []);

  const handleFilterPriorityChange = React.useCallback((e) => {
    setFilterPriority(e.target.value);
    setCurrentPage(1);
  }, []);


  const normalizedData = React.useMemo(() => (
    submittedData.map((item, sourceIndex) => ({
      ...item,
      _sourceIndex: sourceIndex,
      openingJobId: item.openingJobId ?? item.jobPositionId ?? item.jobId ?? "",
      postingTitle: item.postingTitle ?? item.positionName ?? item.jobTitle ?? "",
      clientId: item.clientId ?? item.clientID ?? "",
      clientName: item.clientName ?? "",
      assignedRecruiters: formatAssignedRecruiters(
        item.assignedRecruiters ?? item.assignedRecruiter ?? item.recruiters ?? item.teamMembers ?? "",
        item.customTeamMembers
      ),
      targetDate: item.targetDate ?? item.jobReceivedDate ?? "",
      jobOpeningStatus: item.jobOpeningStatus ?? item.jobStatus ?? "",
      workType: ["remote", "hybrid", "on-site"].includes(String(item.workType ?? item.hiringType ?? "").toLowerCase())
        ? (item.workType ?? item.hiringType)
        : "",
      city: item.city ?? item.location ?? "",
      priority: item.priority ?? "Medium",
      hiringManager: item.hiringManager ?? "",
      accountManager: item.accountManager || item.hiringManager || resolveUserName(),
    }))
  ), [submittedData]);

  // Get unique values for filter dropdowns - memoized to avoid recalculations
  const uniquePostingTitles = React.useMemo(() =>
    [...new Set(normalizedData.map(item => item.postingTitle).filter(Boolean))],
    [normalizedData]
  );

  const uniqueJobStatuses = React.useMemo(() =>
    [...new Set(normalizedData.map(item => item.jobOpeningStatus).filter(Boolean))],
    [normalizedData]
  );

  const uniquePriorities = React.useMemo(() =>
    [...new Set(normalizedData.map(item => item.priority).filter(Boolean))],
    [normalizedData]
  );

  // Memoized filter logic - only recalculates when dependencies change
  const filteredData = React.useMemo(() => {
    let result = normalizedData.filter(item => {
      const matchesSearch =
        !deferredSearchTerm ||
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(deferredSearchTerm.toLowerCase())
        );

      const matchesPostingTitle = !filterPostingTitle || item.postingTitle === filterPostingTitle;
      const matchesTargetDate = !filterTargetDate || item.targetDate === filterTargetDate;
      const matchesJobStatus = !filterJobStatus || item.jobOpeningStatus === filterJobStatus;
      const matchesPriority = !filterPriority || item.priority === filterPriority;

      return (
        matchesSearch &&
        matchesPostingTitle &&
        matchesTargetDate &&
        matchesJobStatus &&
        matchesPriority
      );
    });


    if (sortConfig.key) {
      result.sort((a, b) => {
        const aValue = String(a[sortConfig.key] || '').toLowerCase();
        const bValue = String(b[sortConfig.key] || '').toLowerCase();

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  },
    [normalizedData, deferredSearchTerm, filterPostingTitle, filterTargetDate, filterJobStatus, filterPriority, sortConfig]
  );

  const hasFilters = Boolean(
    searchTerm ||
    filterPostingTitle ||
    filterTargetDate ||
    filterJobStatus ||
    filterPriority
  );

  const clearFilters = React.useCallback(() => {
    setSearchTerm('');
    setFilterPostingTitle('');
    setFilterTargetDate('');
    setFilterJobStatus('');
    setFilterPriority('');
    setCurrentPage(1);
  }, []);

  const totalRecords = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / entriesPerPage));

  React.useEffect(() => {
    setCurrentPage((prevPage) => Math.min(prevPage, totalPages));
  }, [totalPages]);

  const paginatedData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * entriesPerPage;
    return filteredData.slice(startIndex, startIndex + entriesPerPage);
  }, [filteredData, currentPage, entriesPerPage]);

  const pageNumbers = React.useMemo(
    () => Array.from({ length: totalPages }, (_, index) => index + 1),
    [totalPages]
  );

  const startEntry = totalRecords === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1;
  const endEntry = Math.min(currentPage * entriesPerPage, totalRecords);

  const handleEntriesPerPageChange = React.useCallback((event) => {
    setEntriesPerPage(Number(event.target.value));
    setCurrentPage(1);
  }, []);

  const handlePageChange = React.useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handlePreviousPage = React.useCallback(() => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  }, []);

  const handleNextPage = React.useCallback(() => {
    setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages));
  }, [totalPages]);

  const getStatusClass = React.useCallback((status) => {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'active') return styles.statusActive;
    if (normalized === 'closed') return styles.statusClosed;
    if (normalized === 'draft') return styles.statusDraft;
    return styles.statusNeutral;
  }, []);

  const getPriorityClass = React.useCallback((priority) => {
    const normalized = String(priority || '').toLowerCase();
    if (normalized === 'high') return styles.priorityHigh;
    if (normalized === 'medium') return styles.priorityMedium;
    if (normalized === 'low') return styles.priorityLow;
    return styles.priorityNeutral;
  }, []);

  const getStageClass = React.useCallback((stage) => {
    const normalized = String(stage || '').toLowerCase();
    if (normalized === 'added') return styles.stageAdded;
    if (normalized === 'sourced') return styles.stageSourced;
    if (normalized === 'pre-screening') return styles.stageScreening;
    if (normalized === 'assessment') return styles.stageAssessment;
    if (normalized === 'client interview') return styles.stageInterview;
    if (normalized === 'offer') return styles.stageOffer;
    if (normalized === 'rejected') return styles.stageRejected;
    return styles.stageNeutral;
  }, []);

  const toggleRow = React.useCallback((rowKey) => {
    setExpandedRows((prev) => ({ ...prev, [rowKey]: !prev[rowKey] }));
  }, []);

  const nextJobPositionId = React.useMemo(() => {
    return getNextJobOpeningId(submittedData);
  }, [submittedData]);

  React.useEffect(() => {
    if (isRecruiter && createMode) {
      setShowJobOpeningForm(false);
      setShowDataTable(true);
      navigate("/job-openings", { replace: true });
      showTransientMessage("Recruiter access is view-only for job opening creation.");
      return;
    }

    if (!createMode) {
      createModeInitializedRef.current = false;
      return;
    }

    if (createModeInitializedRef.current) {
      return;
    }

    createModeInitializedRef.current = true;

    if (createMode) {
      setShowJobOpeningForm(true);
      setShowDataTable(false);
      setEditingIndex(null);
      setEditingData((prev) => {
        if (!prev || (prev.jobPositionId !== nextJobPositionId && !prev.jobId)) {
          return {
            jobPositionId: nextJobPositionId,
          };
        }
        return prev;
      });
      setEditLocked(false);
    }
  }, [createMode, isRecruiter, navigate, nextJobPositionId, showTransientMessage]);

  React.useEffect(() => {
    if (location.pathname !== "/job-openings/edit") return;

    const routeJob = location.state?.job;
    if (!routeJob) return;

    const routeEditingIndex = Number.isInteger(location.state?.editingIndex)
      ? location.state.editingIndex
      : submittedData.findIndex((item) =>
        (item.openingJobId || item.jobPositionId) === (routeJob.openingJobId || routeJob.jobPositionId)
      );

    setEditingIndex(routeEditingIndex >= 0 ? routeEditingIndex : null);
    setEditingData({
      ...routeJob,
    });
    setShowJobOpeningForm(true);
    setShowDataTable(false);
    setEditLocked(false);
    setActiveDraftId(null);
  }, [location.pathname, location.state, submittedData]);

  // Helper to check if a jobPositionId is already used
  const isJobIdUsed = React.useCallback((jobId) => {
    const allIds = submittedData.map(item => String(getJobOpeningIdValue(item)).trim());
    return allIds.includes(String(jobId).trim());
  }, [submittedData]);

  // When opening a draft, if its job ID is already used, assign the next available
  const openJobOpeningForm = React.useCallback((draftData = null, draftId = null) => {
    setShowJobOpeningForm(true);
    setShowDataTable(false);
    setEditingIndex(null);
    let jobId = String(draftData?.jobPositionId || "").trim();
    if (!jobId || isJobIdUsed(jobId)) {
      jobId = nextJobPositionId;
    }
    setEditingData({
      ...(draftData ? { ...draftData } : {}),
      jobPositionId: jobId,
      accountManager: draftData?.accountManager || resolveUserName(),
    });
    setEditLocked(false);
    setActiveDraftId(draftId);
    setJobOpeningFormKey((prev) => prev + 1);
    setIsAddJobOpeningMenuOpen(false);
  }, [nextJobPositionId, isJobIdUsed]);

  const handleCreateJobOpening = React.useCallback(() => {
    navigate("/job-openings/create");
  }, [navigate]);

  const handleJobOpeningMenuToggle = React.useCallback(() => {
    setJobOpeningDrafts(getJobOpeningDrafts());
    setIsAddJobOpeningMenuOpen((prev) => !prev);
  }, [getJobOpeningDrafts]);

  const handleUseJobOpeningDraft = React.useCallback((draftId) => {
    const selectedDraft = jobOpeningDrafts.find((draft) => draft.id === draftId);
    if (!selectedDraft) return;
    openJobOpeningForm(selectedDraft.data || {}, selectedDraft.id);
    showTransientMessage(`Loaded draft: ${selectedDraft.title}`);
  }, [jobOpeningDrafts, openJobOpeningForm, showTransientMessage]);

  const handleDeleteJobOpeningDraft = React.useCallback((draftId) => {
    setJobOpeningDrafts((prevDrafts) => {
      const nextDrafts = prevDrafts.filter((draft) => draft.id !== draftId);
      persistJobOpeningDrafts(nextDrafts);
      return nextDrafts;
    });

    if (activeDraftId === draftId) {
      setActiveDraftId(null);
      setEditingData(null);
      setJobOpeningFormKey((prev) => prev + 1);
    }

    showTransientMessage("Draft deleted successfully");
  }, [activeDraftId, persistJobOpeningDrafts, showTransientMessage]);

  const handleCancelJobOpeningForm = React.useCallback(() => {
    setShowJobOpeningForm(false);
    setShowDataTable(true);
    setEditingIndex(null);
    setEditingData(null);
    setEditLocked(false);
    setActiveDraftId(null);
    setIsAddJobOpeningMenuOpen(false);
    navigate("/job-openings");
  }, [navigate]);

  const handleViewJobOpening = React.useCallback((row, index) => {
    console.log('View job opening:', row);
    setSelectedJobOpening({
      ...row,
      openingJobId: row.openingJobId || row.jobPositionId || String(index),
    });
    setIsCandidateDrawerOpen(false);
    setDrawerTab("Job Information");
    setIsViewDrawerOpen(true);
  }, []);

  const handleViewCandidate = React.useCallback((candidate, row, index) => {
    setSelectedCandidate({
      ...candidate,
      openingJobId: row.openingJobId || row.jobPositionId || String(index),
      postingTitle: row.postingTitle || row.positionName || "-",
      clientName: row.clientName || "-",
      priority: row.priority || "-",
      hiringManager: row.hiringManager || "-",
      accountManager: row.accountManager || "-",
    });
    setIsViewDrawerOpen(false);
    setIsCandidateDrawerOpen(true);
  }, []);

  const handleOpenJobDescription = React.useCallback((row, index) => {
    navigate(`/job-openings/${row.openingJobId || row.jobPositionId || index}`, { state: { job: row } });
  }, [navigate]);

  const handleEditJobOpening = React.useCallback((row, index) => {
    console.log('Edit job opening:', row);
    setEditingIndex(index);
    setEditingData({
      ...row,
    });
    setShowJobOpeningForm(true);
    setShowDataTable(false);
    setEditLocked(false);
    navigate("/job-openings/edit", {
      state: {
        job: row,
        editingIndex: index,
      },
    });
  }, [navigate]);

  const handleDeleteJobOpening = React.useCallback((row, index) => {
    console.log('Delete job opening:', row);
    if (window.confirm('Are you sure you want to delete this job opening?')) {
      setSubmittedData(prev => prev.filter((_, i) => i !== index));
    }
  }, []);

  const jobOpeningFormInitialData = React.useMemo(() => {
    if (!editingData) {
      return editingData;
    }

    return {
      ...editingData,
      extraTechnicalSkills:
        editingData.extraTechnicalSkills ?? editingData.addTechnicalSkills ?? []
    };
  }, [editingData]);

  const handleJobOpeningSubmit = React.useCallback((data = {}) => {
    const safeData = data && typeof data === "object" ? data : {};
    let requestedJobPositionId = String(safeData.jobPositionId || safeData.openingJobId || nextJobPositionId).trim();
    // Always enforce unique job ID for new jobs
    if (editingIndex === null && isJobIdUsed(requestedJobPositionId)) {
      requestedJobPositionId = nextJobPositionId;
    }
    const jobPositionId = requestedJobPositionId;
    const effectiveJdAttachment = safeData.jdAttachment || null;
    const resolvedLocation = Array.isArray(safeData.location)
      ? safeData.location.filter(Boolean).join(", ")
      : String(safeData.location || "").trim();
    const hasTeamMemberSelection = Array.isArray(safeData.teamMembers);
    const resolvedFromTeamMembers = resolveAssignedRecruiterNames(
      safeData.teamMembers,
      safeData.customTeamMembers
    );
    const resolvedAssignedRecruiters = hasTeamMemberSelection
      ? (resolvedFromTeamMembers || "-")
      : (
        safeData.assignedRecruiters ||
        resolvedFromTeamMembers ||
        "-"
      );
    const normalized = {
      ...safeData,
      jobPositionId,
      openingJobId: safeData.openingJobId || jobPositionId,
      postingTitle: safeData.postingTitle || safeData.positionName || "",
      jdAttachment: effectiveJdAttachment,
      extraTechnicalSkills: safeData.extraTechnicalSkills ?? safeData.addTechnicalSkills ?? [],
      targetDate: safeData.targetDate || safeData.jobReceivedDate || "",
      jobOpeningStatus: safeData.jobOpeningStatus || safeData.jobStatus || 'Active',
      city: safeData.city || resolvedLocation,
      priority: safeData.priority || "Medium",
      accountManager: safeData.accountManager || safeData.hiringManager || resolveUserName(),
      assignedRecruiters: resolvedAssignedRecruiters,
      candidates: Array.isArray(safeData.candidates) ? safeData.candidates : [],
    };
    if (editingIndex !== null) {
      setSubmittedData(prev => {
        const nextRows = prev.map((item, idx) => (idx === editingIndex ? normalized : item));
        saveJobOpeningTableData(nextRows);
        return nextRows;
      });
    } else {
      setSubmittedData(prev => {
        const nextRows = [...prev, normalized];
        saveJobOpeningTableData(nextRows);
        return nextRows;
      });
    }
    if (activeDraftId) {
      setJobOpeningDrafts((prevDrafts) => {
        const nextDrafts = prevDrafts.filter((draft) => draft.id !== activeDraftId);
        persistJobOpeningDrafts(nextDrafts);
        return nextDrafts;
      });
    }
    setShowJobOpeningForm(false);
    setShowDataTable(true);
    showTransientMessage(editingIndex !== null ? "JD updated successfully" : "JD Created successfully");
    setEditingIndex(null);
    setEditingData(null);
    setEditLocked(false);
    setActiveDraftId(null);
    setIsAddJobOpeningMenuOpen(false);
    navigate("/job-openings");
    // Here you would typically send the data to your backend API
  }, [activeDraftId, editingIndex, navigate, nextJobPositionId, persistJobOpeningDrafts, showTransientMessage, isJobIdUsed]);

  const handleGenerateJobDescription = React.useCallback(async (formData = {}) => {
    const response = await generateJDWithAI(formData);
    return {
      ...response,
      message: "AI-generated JD is ready. Review it and save when you are happy with the draft.",
    };
  }, []);

  const prepareJobOpeningSubmitData = React.useCallback(async (formData = {}) => {
    const existingJobDescription = String(formData.jobDescription || "").trim();
    const shouldReuseExistingDescription = existingJobDescription.length >= 50;

    if (shouldReuseExistingDescription) {
      return formData;
    }

    const response = await handleGenerateJobDescription(formData);
    const generatedDescription = String(response?.jobDescription || "").trim();

    if (!generatedDescription) {
      throw new Error("Unable to generate the JD from the entered job details. Please try again.");
    }

    return {
      ...formData,
      jobDescription: generatedDescription,
    };
  }, [handleGenerateJobDescription]);

  const formatInrAmount = React.useCallback((value) => {
    const numericValue = Number(value);
    if (Number.isNaN(numericValue) || numericValue <= 0) return "-";
    return numericValue.toLocaleString("en-IN");
  }, []);

  const formatDateDDMMYYYY = React.useCallback((value) => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return String(value);
    const day = String(parsed.getDate()).padStart(2, "0");
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const year = parsed.getFullYear();
    return `${day}/${month}/${year}`;
  }, []);

  const formatLabelCase = React.useCallback((value) => {
    const raw = String(value || "").trim();
    if (!raw) return "-";
    return raw
      .replace(/[-_]/g, " ")
      .split(" ")
      .filter(Boolean)
      .map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
      .join(" ");
  }, []);

  const formatSkills = React.useCallback((skills) => {
    if (!Array.isArray(skills) || skills.length === 0) return "-";
    return skills
      .map((skill) => {
        const token = String(skill || "").trim();
        if (!token) return "";
        if (token.toUpperCase() === "AWS") return "AWS";
        if (token.toLowerCase() === "javascript") return "Javascript";
        return token
          .replace(/[-_]/g, " ")
          .split(" ")
          .filter(Boolean)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join(" ");
      })
      .filter(Boolean)
      .join(", ");
  }, []);

  const closeViewDrawer = React.useCallback(() => {
    setIsViewDrawerOpen(false);
  }, []);

  const closeCandidateDrawer = React.useCallback(() => {
    setIsCandidateDrawerOpen(false);
    setSelectedCandidate(null);
  }, []);

  const jobOpeningFormConfig = React.useMemo(
    () => ({
      ...jobOpeningConfig,
      submitLabel: editingIndex !== null ? "Save JD" : (jobOpeningConfig.submitLabel || "Create JD"),
      steps: jobOpeningConfig.steps.map((step) => ({
        ...step,
        fields: (step.fields || []).map((field) =>
          field.name === "clientName"
            ? {
              ...field,
              options: clientOptions,
            }
            : field.name === "jobDescription"
              ? {
                ...field,
                generateAction: handleGenerateJobDescription,
                generateActionLabel: "Generate JD",
              }
              : field
        ),
      })),
      localSubmitOnly: true,
      prepareSubmitData: prepareJobOpeningSubmitData,
      showDraftAction: editingIndex === null,
      showCancelAction: true,
      cancelLabel: "Cancel",
      onCancel: handleCancelJobOpeningForm,
      onSaveDraft: saveJobOpeningDraft,
    }),
    [clientOptions, editingIndex, handleCancelJobOpeningForm, handleGenerateJobDescription, prepareJobOpeningSubmitData, saveJobOpeningDraft]
  );

  React.useEffect(() => {
    if (!isViewDrawerOpen && !isCandidateDrawerOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isViewDrawerOpen, isCandidateDrawerOpen]);

  React.useEffect(() => {
    if (!isViewDrawerOpen && !isCandidateDrawerOpen) return undefined;
    const onEsc = (event) => {
      if (event.key !== "Escape") return;
      if (isCandidateDrawerOpen) {
        closeCandidateDrawer();
        return;
      }
      setIsViewDrawerOpen(false);
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [closeCandidateDrawer, isCandidateDrawerOpen, isViewDrawerOpen]);

  return (
    <div className={styles.page}>
      {showSuccessMessage && (
        <div className={styles.successMessage}>
          <span>{successMessageText}</span>
          <button
            onClick={() => setShowSuccessMessage(false)}
            className={styles.closeButton}
            aria-label="Close success message"
          >
            ✕
          </button>
        </div>
      )}

      <div className={styles.jobCard}>
        {!showJobOpeningForm && (
          <div className={styles.infoRow}>
            <p className={styles.description}>
              {jobOpeningsPageDescription}
            </p>
            {!isRecruiter && (
              <div ref={addJobOpeningMenuRef} className={styles.createJobMenuAnchor}>
                <div className={styles.createJobSplit}>
                  <button type="button" className={styles.createButton} onClick={handleCreateJobOpening}>
                    <FiPlus size={16} />
                    Create Job Opening
                  </button>
                  <button
                    type="button"
                    className={`${styles.createButtonDropdownTrigger}${isAddJobOpeningMenuOpen ? ` ${styles.createButtonDropdownTriggerOpen}` : ""}`}
                    onClick={handleJobOpeningMenuToggle}
                    aria-label="Open create job opening options"
                    aria-haspopup="menu"
                    aria-expanded={isAddJobOpeningMenuOpen}
                  >
                    <FiChevronDown size={14} />
                  </button>
                </div>

                {isAddJobOpeningMenuOpen && (
                  <div className={styles.createJobMenu} role="menu" aria-label="Create job opening options">
                    <div className={styles.createJobMenuTitle}>Saved Drafts</div>

                    {jobOpeningDrafts.length === 0 ? (
                      <div className={styles.createJobMenuEmpty}>No saved drafts available.</div>
                    ) : (
                      <div className={styles.createJobDraftList} role="none">
                        {jobOpeningDrafts.map((draft) => (
                          <div key={draft.id} className={styles.createJobDraftRow}>
                            <button
                              type="button"
                              className={styles.createJobMenuOption}
                              onClick={() => handleUseJobOpeningDraft(draft.id)}
                              title={draft.title || "Untitled Draft"}
                            >
                              <span className={styles.createJobDraftTitle}>{draft.title || "Untitled Draft"}</span>
                              <span className={styles.createJobDraftMeta}>
                                {draft.updatedAt || draft.createdAt
                                  ? new Date(draft.updatedAt || draft.createdAt).toLocaleString()
                                  : "-"}
                              </span>
                            </button>
                            <button
                              type="button"
                              className={styles.createJobDraftDelete}
                              onClick={() => handleDeleteJobOpeningDraft(draft.id)}
                              aria-label="Delete draft"
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {showJobOpeningForm && (
          <div className={styles.formWrap}>
            {editingIndex !== null && editLocked && (
              <div className={styles.formHeader}>
                <button
                  type="button"
                  className={styles.editCta}
                  onClick={() => setEditLocked(false)}
                >
                  Edit JD
                </button>
                <button
                  type="button"
                  className={styles.closeCta}
                  onClick={() => {
                    setShowJobOpeningForm(false);
                    setShowDataTable(true);
                    setEditingIndex(null);
                    setEditingData(null);
                    setEditLocked(false);
                  }}
                  aria-label="Close and return to job listing"
                  title="Close"
                >
                  <FiX size={14} />
                </button>
              </div>
            )}
            <ReusableForm
              key={`job-opening-form-${jobOpeningFormKey}`}
              config={jobOpeningFormConfig}
              initialData={jobOpeningFormInitialData}
              readOnly={editLocked}
              onSubmit={handleJobOpeningSubmit}
            />
          </div>
        )}

        {showDataTable && (
          <div className={styles.tableSection}>
            <FilterBar
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
              filterPostingTitle={filterPostingTitle}
              onFilterPostingTitleChange={handleFilterPostingTitleChange}
              filterTargetDate={filterTargetDate}
              onFilterTargetDateChange={handleFilterTargetDateChange}
              filterJobStatus={filterJobStatus}
              onFilterJobStatusChange={handleFilterJobStatusChange}
              filterPriority={filterPriority}
              onFilterPriorityChange={handleFilterPriorityChange}
              uniquePostingTitles={uniquePostingTitles}
              uniqueJobStatuses={uniqueJobStatuses}
              uniquePriorities={uniquePriorities}
              hasFilters={hasFilters}
              onClearFilters={clearFilters}
            />

            <div className={styles.tableWrap}>
              <table className={styles.jobTable}>
                <colgroup>
                  <col className={styles.colOpeningJobId} />
                  <col />
                  <col className={styles.colClientId} />
                  <col />
                  <col className={styles.colTargetDate} />
                  <col />
                  <col className={styles.colWorkType} />
                  <col />
                  <col />
                  <col className={styles.colActions} />
                </colgroup>
                <thead>
                  <tr>
                    {[
                      { key: "openingJobId", label: "Job Id" },
                      { key: "postingTitle", label: "Job Title" },
                      { key: "clientName", label: "Client Name" },
                      { key: "assignedRecruiters", label: "Assigned Recruiter(s)" },
                      { key: "targetDate", label: "Target Date" },
                      { key: "jobOpeningStatus", label: "Job Opening Status" },
                      { key: "workType", label: "Work Type" },
                      { key: "accountManager", label: "Account Manager" },
                      { key: "priority", label: "Priority" },
                    ].map((col) => (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        style={{ cursor: 'pointer', position: 'relative' }}
                      >
                        <span className={styles.headerLabel}>{col.label}</span>
                        <span className={styles.sortArrows} aria-hidden="true">
                          <span className={sortConfig.key === col.key && sortConfig.direction === 'asc' ? styles.sortArrowActive : ""}>▲</span>
                          <span className={sortConfig.key === col.key && sortConfig.direction === 'desc' ? styles.sortArrowActive : ""}>▼</span>
                        </span>
                      </th>
                    ))}
                    <th className={styles.actionsCol}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={10} className={styles.emptyTableCell}>
                        No jobs found
                      </td>
                    </tr>
                  ) : paginatedData.map((row, index) => {
                    const sourceIndex = Number.isInteger(row?._sourceIndex) ? row._sourceIndex : index;
                    const rowKey = row.openingJobId || row.jobPositionId || String(sourceIndex);
                    const isExpanded = Boolean(expandedRows[rowKey]);
                    return (
                      <React.Fragment key={rowKey}>
                        <tr>
                          <td>
                            <button
                              type="button"
                              className={`${styles.expandBtn}${isExpanded ? ` ${styles.expandBtnActive}` : ''}`}
                              onClick={() => toggleRow(rowKey)}
                              aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
                            >
                              {isExpanded ? '▾' : '▸'}
                            </button>
                            {row.openingJobId}
                          </td>
                          <td>{row.postingTitle}</td>
                          <td>{row.clientName}</td>
                          <td>{row.assignedRecruiters}</td>
                          <td>{row.targetDate}</td>
                          <td>
                            {row.jobOpeningStatus ? (
                              <span className={`${styles.statusPill} ${getStatusClass(row.jobOpeningStatus)}`}>
                                {row.jobOpeningStatus}
                              </span>
                            ) : "-"}
                          </td>
                          <td>{formatLabelCase(row.workType)}</td>
                          <td>{row.accountManager}</td>
                          <td>
                            <span className={`${styles.priorityPill} ${getPriorityClass(row.priority)}`}>
                              {row.priority}
                            </span>
                          </td>
                          <td className={styles.actionsCol}>
                            <div className={styles.actionIcons}>
                              <button
                                type="button"
                                className={styles.actionBtn}
                                onClick={() => handleOpenJobDescription(row, sourceIndex)}
                                aria-label="Open job description"
                              >
                                <FiEye size={16} />
                              </button>
                              <button
                                type="button"
                                className={styles.actionBtn}
                                onClick={() => handleViewJobOpening(row, sourceIndex)}
                                aria-label="View job opening details"
                              >
                                <FiFileText size={16} />
                              </button>
                              {!isRecruiter && (
                                <button
                                  type="button"
                                  className={styles.actionBtn}
                                  onClick={() => handleEditJobOpening(row, sourceIndex)}
                                  aria-label="Edit"
                                >
                                  <FiEdit2 size={16} />
                                </button>
                              )}
                              <button
                                type="button"
                                className={styles.actionBtn}
                                onClick={() => handleDeleteJobOpening(row, sourceIndex)}
                                aria-label="Delete"
                              >
                                <FiTrash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className={styles.expandedRow}>
                            <td colSpan={10}>
                              <div className={styles.innerTableWrap}>
                                <table className={styles.innerTable}>
                                  <thead>
                                    <tr>
                                      <th>Application Id</th>
                                      <th>Candidate Name</th>
                                      <th>Email Address</th>
                                      <th>Modified Time</th>
                                      <th>Source</th>
                                      <th>Rating</th>
                                      <th>Stage</th>
                                      <th>Round</th>
                                      <th>Action</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(row.candidates || []).map((candidate) => (
                                      <tr key={`${rowKey}-${candidate.candidateId}`}>
                                        <td>{candidate.candidateId}</td>
                                        <td>{candidate.candidateName}</td>
                                        <td>{candidate.candidateEmail}</td>
                                        <td>{candidate.modifiedTime}</td>
                                        <td>{candidate.source}</td>
                                        <td className={styles.ratingCell}>
                                          {candidate.rating}
                                          <span className={styles.ratingStar}>★</span>
                                        </td>
                                        <td>
                                          <span className={`${styles.stagePill} ${getStageClass(candidate.stage)}`}>
                                            {candidate.stage}
                                          </span>
                                        </td>
                                        <td>{candidate.round}</td>
                                        <td>
                                          <button
                                            type="button"
                                            className={styles.actionBtn}
                                            aria-label="View candidate"
                                            onClick={() => handleViewCandidate(candidate, row, sourceIndex)}
                                          >
                                            <FiEye size={16} />
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className={styles.tableFooter}>
              <div className={styles.footerLeft}>
                <span>Show</span>
                <select
                  className={styles.entriesSelect}
                  value={entriesPerPage}
                  onChange={handleEntriesPerPageChange}
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
                <span>entries</span>
                <span>
                  ({startEntry}-{endEntry} of {totalRecords})
                </span>
              </div>
              <>
                <div className={styles.pagination}>
                  <button
                    type="button"
                    className={styles.pageBtn}
                    aria-label="Previous page"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                  >
                    {"<"}
                  </button>
                  {pageNumbers.map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      className={`${styles.pageBtn}${currentPage === pageNumber ? ` ${styles.pageBtnActive}` : ""}`}
                      onClick={() => handlePageChange(pageNumber)}
                      aria-label={`Page ${pageNumber}`}
                      aria-current={currentPage === pageNumber ? "page" : undefined}
                    >
                      {pageNumber}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={styles.pageBtn}
                    aria-label="Next page"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                  >
                    {">"}
                  </button>
                </div>
                <div className={styles.pagination} style={{ display: "none" }}>
                  <button type="button" className={styles.pageBtn} aria-label="Previous page">
                    ‹
                  </button>
                  <button type="button" className={`${styles.pageBtn} ${styles.pageBtnActive}`}>
                    1
                  </button>
                  <button type="button" className={styles.pageBtn}>
                    2
                  </button>
                  <button type="button" className={styles.pageBtn}>
                    3
                  </button>
                  <button type="button" className={styles.pageBtn} aria-label="Next page">
                    ›
                  </button>
                </div>
              </>
            </div>
          </div>
        )}
      </div>

      {isViewDrawerOpen && selectedJobOpening ? (
        <div className={styles.viewDrawerOverlay} onClick={closeViewDrawer}>
          <aside className={styles.viewDrawer} onClick={(event) => event.stopPropagation()}>
            <div className={styles.drawerHead}>
              <div className={styles.drawerIdentity}>
                <div className={styles.drawerAvatar}>
                  {selectedJobOpening.postingTitle?.charAt(0)?.toUpperCase() || "J"}
                </div>
                <div className={styles.drawerTitleWrap}>
                  <h3>{selectedJobOpening.openingJobId || "-"}</h3>
                  <p>{selectedJobOpening.postingTitle || "-"}</p>
                  <div className={styles.drawerMeta}>
                    <span>{selectedJobOpening.contactPersonEmail || "hr@email.com"}</span>
                    <span><FiMapPin size={11} /> {selectedJobOpening.city || "Bangalore, India"}</span>
                    <span><FiPhone size={11} /> 9876543210</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className={styles.drawerClose}
                onClick={closeViewDrawer}
                aria-label="Close panel"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className={styles.drawerTabs}>
              {["Job Information", "Client Details", "Client Requirement", "Team Members"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`${styles.drawerTab}${drawerTab === tab ? ` ${styles.drawerTabActive}` : ""}`}
                  onClick={() => setDrawerTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className={styles.drawerBody}>
              {drawerTab === "Job Information" && (
                <div className={styles.drawerGrid}>
                  <div className={styles.drawerField}>
                    <span>JD id</span>
                    <strong>{selectedJobOpening.openingJobId || "-"}</strong>
                  </div>
                  <div className={styles.drawerField}>
                    <span>Position Name</span>
                    <strong>{selectedJobOpening.postingTitle || "-"}</strong>
                  </div>
                  <div className={styles.drawerField}>
                    <span>Experience</span>
                    <strong>
                      Min {selectedJobOpening.minExperience || 0} to max {selectedJobOpening.maxExperience || 0}
                    </strong>
                  </div>
                  <div className={styles.drawerField}>
                    <span>Position Level</span>
                    <strong>{formatLabelCase(selectedJobOpening.positionLevel)}</strong>
                  </div>
                  <div className={styles.drawerField}>
                    <span>Location</span>
                    <strong>{selectedJobOpening.city || "-"}</strong>
                  </div>
                  <div className={styles.drawerField}>
                    <span>No of Position</span>
                    <strong>{selectedJobOpening.noOfPositions || "-"}</strong>
                  </div>
                  <div className={styles.drawerField}>
                    <span>Job Received Date:</span>
                    <strong>{formatDateDDMMYYYY(selectedJobOpening.jobReceivedDate)}</strong>
                  </div>
                  <div className={styles.drawerField}>
                    <span>Work Type</span>
                    <strong>{formatLabelCase(selectedJobOpening.workType)}</strong>
                  </div>
                  <div className={styles.drawerField}>
                    <span>Salary in CTC</span>
                    <strong>
                      Min: {formatInrAmount(selectedJobOpening.minSalary)} Max: {formatInrAmount(selectedJobOpening.maxSalary)}
                    </strong>
                  </div>
                  <div className={styles.drawerField}>
                    <span>Job Type</span>
                    <strong>{formatLabelCase(selectedJobOpening.jobType)}</strong>
                  </div>
                </div>
              )}

              {drawerTab === "Client Details" && (
                <div className={styles.drawerGrid}>
                  <div className={styles.drawerField}>
                    <span>Client ID</span>
                    <strong>{selectedJobOpening.clientId || "-"}</strong>
                  </div>
                  <div className={styles.drawerField}>
                    <span>Client Name</span>
                    <strong>{selectedJobOpening.clientName || "-"}</strong>
                  </div>
                  <div className={styles.drawerField}>
                    <span>Contact Person</span>
                    <strong>{selectedJobOpening.contactPersonName || "-"}</strong>
                  </div>
                  <div className={styles.drawerField}>
                    <span>Contact Email</span>
                    <strong>{selectedJobOpening.contactPersonEmail || "-"}</strong>
                  </div>
                  <div className={styles.drawerField}>
                    <span>Priority</span>
                    <strong>
                      <span className={`${styles.priorityPill} ${getPriorityClass(selectedJobOpening.priority)}`}>
                        {selectedJobOpening.priority || "-"}
                      </span>
                    </strong>
                  </div>
                  <div className={styles.drawerField}>
                    <span>Assigned Recruiters</span>
                    <strong>{selectedJobOpening.assignedRecruiters || "-"}</strong>
                  </div>
                </div>
              )}

              {drawerTab === "Client Requirement" && (
                <div className={styles.drawerGrid}>
                  <div className={styles.drawerField}>
                    <span>Technical Skill</span>
                    <strong>{formatSkills(selectedJobOpening.technicalSkills)}</strong>
                  </div>
                  <div className={styles.drawerField}>
                    <span>Soft Skill</span>
                    <strong>{formatSkills(selectedJobOpening.softSkills)}</strong>
                  </div>
                  <div className={styles.drawerField}>
                    <span>Additional Skill</span>
                    <strong>{selectedJobOpening.additionalSkills || "-"}</strong>
                  </div>
                  <div className={styles.drawerField}>
                    <span>Target Date</span>
                    <strong>{formatDateDDMMYYYY(selectedJobOpening.targetDate)}</strong>
                  </div>
                  <div className={styles.drawerField}>
                    <span>Job Type</span>
                    <strong>{formatLabelCase(selectedJobOpening.jobType)}</strong>
                  </div>
                  <div className={`${styles.drawerField} ${styles.drawerFieldWide}`}>
                    <span>Job Description</span>
                    <div className={styles.drawerLongText}>
                      {selectedJobOpening.jobDescription || "No generated job description saved yet."}
                    </div>
                  </div>
                </div>
              )}

              {drawerTab === "Team Members" && (
                <div className={styles.drawerGrid}>
                  <div className={styles.drawerField}>
                    <span>Priority</span>
                    <strong>
                      <span className={`${styles.priorityPill} ${getPriorityClass(selectedJobOpening.priority)}`}>
                        {selectedJobOpening.priority || "-"}
                      </span>
                    </strong>
                  </div>
                  <div className={styles.drawerField}>
                    <span>Assigned Recruiters</span>
                    <strong>{selectedJobOpening.assignedRecruiters || "-"}</strong>
                  </div>
                  <div className={styles.drawerField}>
                    <span>Contact Person</span>
                    <strong>{selectedJobOpening.contactPersonName || "-"}</strong>
                  </div>
                  <div className={styles.drawerField}>
                    <span>Contact Email</span>
                    <strong>{selectedJobOpening.contactPersonEmail || "-"}</strong>
                  </div>
                  <div className={styles.drawerField}>
                    <span>Candidate Count</span>
                    <strong>{selectedJobOpening.candidates?.length ?? 0}</strong>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      ) : null}

      {isCandidateDrawerOpen && selectedCandidate ? (
        <div className={styles.viewDrawerOverlay} onClick={closeCandidateDrawer}>
          <aside className={styles.candidateDrawer} onClick={(event) => event.stopPropagation()}>
            <div className={styles.candidateHead}>
              <div>
                <h3 className={styles.candidateTitle}>{selectedCandidate.candidateName || "Candidate"}</h3>
                <p className={styles.candidateSubtitle}>{selectedCandidate.candidateId || "-"}</p>
              </div>
              <button
                type="button"
                className={styles.drawerClose}
                onClick={closeCandidateDrawer}
                aria-label="Close candidate details"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className={styles.candidateBody}>
              <div className={styles.candidateField}>
                <span>Email</span>
                <strong><FiMail size={12} /> {selectedCandidate.candidateEmail || "-"}</strong>
              </div>
              <div className={styles.candidateField}>
                <span>Modified Time</span>
                <strong>{selectedCandidate.modifiedTime || "-"}</strong>
              </div>
              <div className={styles.candidateField}>
                <span>Source</span>
                <strong>{selectedCandidate.source || "-"}</strong>
              </div>
              <div className={styles.candidateField}>
                <span>Rating</span>
                <strong>{selectedCandidate.rating || "-"}</strong>
              </div>
              <div className={styles.candidateField}>
                <span>Stage</span>
                <strong>
                  <span className={`${styles.stagePill} ${getStageClass(selectedCandidate.stage)}`}>
                    {selectedCandidate.stage || "-"}
                  </span>
                </strong>
              </div>
              <div className={styles.candidateField}>
                <span>Round</span>
                <strong>{selectedCandidate.round || "-"}</strong>
              </div>
              <div className={styles.candidateField}>
                <span>Opening Job Id</span>
                <strong>{selectedCandidate.openingJobId || "-"}</strong>
              </div>
              <div className={styles.candidateField}>
                <span>Posting Title</span>
                <strong>{selectedCandidate.postingTitle || "-"}</strong>
              </div>
              <div className={styles.candidateField}>
                <span>Client Name</span>
                <strong>{selectedCandidate.clientName || "-"}</strong>
              </div>
              <div className={styles.candidateDetail}>
                <span>Priority</span>
                <strong>
                  <span className={`${styles.priorityPill} ${getPriorityClass(selectedCandidate.priority || selectedCandidate.hiringManager)}`}>
                    {selectedCandidate.priority || selectedCandidate.hiringManager || "-"}
                  </span>
                </strong>
              </div>
              <div className={styles.candidateField}>
                <span>Account Manager</span>
                <strong>{selectedCandidate.accountManager || "-"}</strong>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
