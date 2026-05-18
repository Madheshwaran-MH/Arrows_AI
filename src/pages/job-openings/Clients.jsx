import * as React from "react";
import { FiChevronDown, FiFilter, FiMail, FiMapPin, FiPhone, FiSearch, FiTrash2, FiUser, FiX } from "react-icons/fi";
import DataTable from "../../components/forms/DataTable";
import { clientConfig } from "../../components/forms/formConfigs";
import ReusableForm from "../../components/forms/ReusableForm";
import { loadClientRows, saveClientRows } from "../../utils/clientStore";
import styles from "./Clients.module.scss";

const CLIENT_DRAFT_STORAGE_KEY = "clients:add-draft:v1";
const createClientDraftId = () => `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export default function Clients() {
  const currentUserRole = React.useMemo(() => {
    if (typeof window === "undefined") return "";
    return String(window.localStorage.getItem("userRole") || "").trim().toLowerCase();
  }, []);

  const clientsPageDescription = React.useMemo(() => {
    if (currentUserRole === "recruiter") {
      return <><strong>Manage client accounts, monitor account ownership, engagement status,</strong> and <strong>coordination activity</strong> in one place.</>;
    }

    if (currentUserRole === "accountmanager" || currentUserRole === "manager" || currentUserRole === "management") {
      return <strong>Track client relationships, account ownership, and account activity with centralized visibility.</strong>;
    }

    return <><strong>Track client relationships, account ownership,</strong> and <strong>account activity</strong> with centralized visibility.</>;
  }, [currentUserRole]);

  const [showClientForm, setShowClientForm] = React.useState(false);
  const [showDataTable, setShowDataTable] = React.useState(true);
  const [submittedData, setSubmittedData] = React.useState(() => loadClientRows());
  const [entriesPerPage, setEntriesPerPage] = React.useState(10);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [editingIndex, setEditingIndex] = React.useState(null);
  const [editingData, setEditingData] = React.useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = React.useState(false);
  const [successMessageText, setSuccessMessageText] = React.useState("Client added successfully");
  const [isViewDrawerOpen, setIsViewDrawerOpen] = React.useState(false);
  const [selectedClient, setSelectedClient] = React.useState(null);
  const [clientDrafts, setClientDrafts] = React.useState([]);
  const [activeDraftId, setActiveDraftId] = React.useState(null);
  const [isAddClientMenuOpen, setIsAddClientMenuOpen] = React.useState(false);
  const [clientFormKey, setClientFormKey] = React.useState(0);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterActiveFromStart, setFilterActiveFromStart] = React.useState("");
  const [filterActiveFromEnd, setFilterActiveFromEnd] = React.useState("");
  const [filterAssignedPerson, setFilterAssignedPerson] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState("");
  const [isDateRangeOpen, setIsDateRangeOpen] = React.useState(false);
  const deferredSearchTerm = React.useDeferredValue(searchTerm);
  const addClientMenuRef = React.useRef(null);
  const dateRangeRef = React.useRef(null);

  const showTransientMessage = React.useCallback((message) => {
    setSuccessMessageText(message);
    setShowSuccessMessage(true);
    window.setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
  }, []);

  const formatPhoneNumber = React.useCallback((value) => {
    const raw = String(value || "").replace(/\D/g, "");
    if (!raw) return "-";
    if (raw.length <= 10) return `+91 ${raw}`;
    return `+${raw}`;
  }, []);

  const formatDate = React.useCallback((value) => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return String(value);
    return parsed.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, []);

  const normalizeClientRecord = React.useCallback((data) => {
    const contactEmail = data.contactEmail || "";
    const contactNumber = String(data.contactNumber || "").trim();

    return {
      ...data,
      clientId: data.clientId || "",
      clientName: data.clientName || "",
      contactEmail,
      contactNumber,
      primaryContactPerson: data.primaryContactPerson || "",
      secondaryContactPerson: data.secondaryContactPerson || "",
      accountManager: data.accountManager || "",
      activeFrom: data.activeFrom || "",
      comments: data.comments || "",
      clientStatus: data.clientStatus || "Active",
      clientLocation: data.clientLocation || "-",
    };
  }, []);

  const mapClientToFormData = React.useCallback((row) => ({
    clientId: row.clientId || "",
    clientName: row.clientName || "",
    contactEmail: row.contactEmail || "",
    contactNumber: String(row.contactNumber || "").replace(/^\+91\s?/, "").trim(),
    primaryContactPerson: row.primaryContactPerson || "",
    secondaryContactPerson: row.secondaryContactPerson || "",
    accountManager: row.accountManager || "",
    activeFrom: row.activeFrom || "",
    comments: row.comments || "",
  }), []);

  React.useEffect(() => {
    saveClientRows(submittedData);
  }, [submittedData]);

  React.useEffect(() => {
    if (!isViewDrawerOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isViewDrawerOpen]);

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

  const persistClientDrafts = React.useCallback((drafts) => {
    localStorage.setItem(CLIENT_DRAFT_STORAGE_KEY, JSON.stringify(drafts));
  }, []);

  const getClientDrafts = React.useCallback(() => {
    try {
      const rawDrafts = localStorage.getItem(CLIENT_DRAFT_STORAGE_KEY);
      if (!rawDrafts) return [];
      const parsedDrafts = JSON.parse(rawDrafts);
      if (!Array.isArray(parsedDrafts)) return [];
      return parsedDrafts
        .filter((draft) => draft && typeof draft === "object" && draft.id)
        .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
    } catch (error) {
      console.error("Failed to read client drafts:", error);
      return [];
    }
  }, []);

  React.useEffect(() => {
    setClientDrafts(getClientDrafts());
  }, [getClientDrafts]);

  React.useEffect(() => {
    if (!isAddClientMenuOpen) return undefined;
    const handleOutsideClick = (event) => {
      if (addClientMenuRef.current && !addClientMenuRef.current.contains(event.target)) {
        setIsAddClientMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isAddClientMenuOpen]);

  React.useEffect(() => {
    if (!isViewDrawerOpen) return undefined;
    const onEsc = (event) => {
      if (event.key === "Escape") setIsViewDrawerOpen(false);
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [isViewDrawerOpen]);

  React.useEffect(() => {
    if (!isDateRangeOpen) return undefined;
    const handleOutsideClick = (event) => {
      if (dateRangeRef.current && !dateRangeRef.current.contains(event.target)) {
        setIsDateRangeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isDateRangeOpen]);

  const getStatusClass = React.useCallback((status) => {
    const normalized = String(status || "").toLowerCase();
    if (normalized === "active") return styles.statusActive;
    if (normalized === "inactive") return styles.statusInactive;
    if (normalized === "on hold") return styles.statusOnHold;
    return styles.statusNeutral;
  }, []);

  const tableColumns = React.useMemo(
    () => [
      { key: "clientId", label: "Client Id" },
      { key: "clientName", label: "Client Name" },
      {
        key: "contactNumber",
        label: "Contact Number",
        render: (value) => formatPhoneNumber(value),
      },
      { key: "contactEmail", label: "Contact Email Address" },
      { key: "primaryContactPerson", label: "Contact Person" },
      {
        key: "activeFrom",
        label: "Active From",
        render: (value) => formatDate(value),
      },
      { key: "accountManager", label: "Assigned Person" },
      {
        key: "clientStatus",
        label: "Status",
        render: (value) => (
          <span className={`${styles.statusPill} ${getStatusClass(value)}`}>{value || "-"}</span>
        ),
      },
    ],
    [formatDate, formatPhoneNumber, getStatusClass]
  );

  const uniqueAssignedPeople = React.useMemo(() => {
    return [...new Set(submittedData.map((item) => item.accountManager).filter(Boolean))];
  }, [submittedData]);

  const uniqueStatuses = React.useMemo(() => {
    return [...new Set(submittedData.map((item) => item.clientStatus).filter(Boolean))];
  }, [submittedData]);

  const filteredData = React.useMemo(() => {
    return submittedData.filter((item) => {
      const matchesSearch =
        !deferredSearchTerm.trim() ||
        Object.values(item).some((val) =>
          String(val || "").toLowerCase().includes(deferredSearchTerm.toLowerCase())
        );

      const matchesActiveFrom =
        (!filterActiveFromStart || item.activeFrom >= filterActiveFromStart) &&
        (!filterActiveFromEnd || item.activeFrom <= filterActiveFromEnd);
      const matchesAssignedPerson = !filterAssignedPerson || item.accountManager === filterAssignedPerson;
      const matchesStatus = !filterStatus || item.clientStatus === filterStatus;

      return matchesSearch && matchesActiveFrom && matchesAssignedPerson && matchesStatus;
    });
  }, [submittedData, deferredSearchTerm, filterActiveFromStart, filterActiveFromEnd, filterAssignedPerson, filterStatus]);

  const totalRecords = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / entriesPerPage));

  const generateNextClientId = React.useCallback(() => {
    const maxNumericId = submittedData.reduce((maxValue, item) => {
      const matched = String(item?.clientId || "").match(/(\d+)/);
      const parsed = matched ? Number.parseInt(matched[1], 10) : Number.NaN;
      if (!Number.isFinite(parsed)) return maxValue;
      return parsed > maxValue ? parsed : maxValue;
    }, 0);

    const nextNumericId = maxNumericId + 1;
    return `CL${String(nextNumericId).padStart(3, "0")}`;
  }, [submittedData]);

  React.useEffect(() => {
    setCurrentPage((previousPage) => Math.min(previousPage, totalPages));
  }, [totalPages]);

  const paginatedData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * entriesPerPage;
    return filteredData.slice(startIndex, startIndex + entriesPerPage).map((item, offset) => ({
      ...item,
      _sourceIndex: startIndex + offset,
    }));
  }, [currentPage, entriesPerPage, filteredData]);

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
    setCurrentPage((previousPage) => Math.max(previousPage - 1, 1));
  }, []);

  const handleNextPage = React.useCallback(() => {
    setCurrentPage((previousPage) => Math.min(previousPage + 1, totalPages));
  }, [totalPages]);

  const handleSearchChange = React.useCallback((event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  }, []);

  const clearFilters = React.useCallback(() => {
    setSearchTerm("");
    setFilterActiveFromStart("");
    setFilterActiveFromEnd("");
    setFilterAssignedPerson("");
    setFilterStatus("");
    setCurrentPage(1);
  }, []);

  const handleAddClient = React.useCallback(() => {
    setShowClientForm(true);
    setShowDataTable(false);
    setEditingIndex(null);
    setEditingData({ clientId: generateNextClientId() });
    setActiveDraftId(null);
    setClientFormKey((prev) => prev + 1);
    setIsAddClientMenuOpen(false);
  }, [generateNextClientId]);

  const openClientForm = React.useCallback((draftData = null, draftId = null) => {
    setShowClientForm(true);
    setShowDataTable(false);
    setEditingIndex(null);
    setEditingData({
      ...(draftData ? { ...draftData } : {}),
      clientId: String(draftData?.clientId || "").trim() || generateNextClientId(),
    });
    setActiveDraftId(draftId);
    setClientFormKey((prev) => prev + 1);
    setIsAddClientMenuOpen(false);
  }, [generateNextClientId]);

  const handleAddClientMenuToggle = React.useCallback(() => {
    setClientDrafts(getClientDrafts());
    setIsAddClientMenuOpen((prev) => !prev);
  }, [getClientDrafts]);

  const getClientDraftTitle = React.useCallback((formData, fallbackCount) => {
    if (formData?.clientName) return String(formData.clientName);
    if (formData?.clientId) return `Client ${formData.clientId}`;
    if (formData?.contactEmail) return String(formData.contactEmail);
    return `Untitled Draft ${fallbackCount}`;
  }, []);

  const saveClientDraft = React.useCallback((formData) => {
    try {
      const sanitizedData = sanitizeDraftValue(formData);
      const now = new Date().toISOString();
      let didUpdateExistingDraft = false;
      let savedDraftId = activeDraftId;

      setClientDrafts((prevDrafts) => {
        const hasActiveDraft = Boolean(savedDraftId) && prevDrafts.some((draft) => draft.id === savedDraftId);
        let nextDrafts;

        if (hasActiveDraft) {
          didUpdateExistingDraft = true;
          nextDrafts = prevDrafts.map((draft) =>
            draft.id === savedDraftId
              ? {
                  ...draft,
                  title: getClientDraftTitle(sanitizedData, prevDrafts.length),
                  updatedAt: now,
                  data: sanitizedData,
                }
              : draft
          );
        } else {
          savedDraftId = createClientDraftId();
          nextDrafts = [
            {
              id: savedDraftId,
              title: getClientDraftTitle(sanitizedData, prevDrafts.length + 1),
              createdAt: now,
              updatedAt: now,
              data: sanitizedData,
            },
            ...prevDrafts,
          ];
        }

        persistClientDrafts(nextDrafts);
        return nextDrafts;
      });

      setActiveDraftId(savedDraftId);
      showTransientMessage(didUpdateExistingDraft ? "Draft updated successfully" : "Draft saved successfully");
    } catch (error) {
      console.error("Failed to save client draft:", error);
      alert("Unable to save draft right now. Please try again.");
    }
  }, [activeDraftId, getClientDraftTitle, persistClientDrafts, sanitizeDraftValue, showTransientMessage]);

  const handleCancelClientForm = React.useCallback(() => {
    setShowClientForm(false);
    setShowDataTable(true);
    setEditingIndex(null);
    setEditingData(null);
    setActiveDraftId(null);
    setIsAddClientMenuOpen(false);
  }, []);

  const handleUseClientDraft = React.useCallback((draftId) => {
    const selectedDraft = clientDrafts.find((draft) => draft.id === draftId);
    if (!selectedDraft) return;
    openClientForm(selectedDraft.data || {}, selectedDraft.id);
    showTransientMessage(`Loaded draft: ${selectedDraft.title}`);
  }, [clientDrafts, openClientForm, showTransientMessage]);

  const handleDeleteClientDraft = React.useCallback((draftId) => {
    setClientDrafts((prevDrafts) => {
      const nextDrafts = prevDrafts.filter((draft) => draft.id !== draftId);
      persistClientDrafts(nextDrafts);
      return nextDrafts;
    });

    if (activeDraftId === draftId) {
      setActiveDraftId(null);
      setEditingData(null);
      setClientFormKey((prev) => prev + 1);
    }

    showTransientMessage("Draft deleted successfully");
  }, [activeDraftId, persistClientDrafts, showTransientMessage]);

  const handleViewClient = React.useCallback(
    (row) => {
      setSelectedClient(normalizeClientRecord(row));
      setIsViewDrawerOpen(true);
    },
    [normalizeClientRecord]
  );

  const handleEditClient = React.useCallback(
    (row, index) => {
      const resolvedIndex = Number.isInteger(row?._sourceIndex) ? row._sourceIndex : index;
      setEditingIndex(resolvedIndex);
      setEditingData(mapClientToFormData(row));
      setShowClientForm(true);
      setShowDataTable(false);
    },
    [mapClientToFormData]
  );

  const handleDeleteClient = React.useCallback((row, index) => {
    const resolvedIndex = Number.isInteger(row?._sourceIndex) ? row._sourceIndex : index;
    if (window.confirm("Are you sure you want to delete this client?")) {
      setSubmittedData((prev) => prev.filter((item, itemIndex) => itemIndex !== resolvedIndex));
    }
  }, []);

  const handleClientSubmit = React.useCallback(
    (data) => {
      const normalized = normalizeClientRecord({
        ...data,
        clientId: String(data?.clientId || "").trim() || generateNextClientId(),
      });
      const isEditMode = editingIndex !== null;

      setSubmittedData((prev) =>
        isEditMode
          ? prev.map((item, idx) => (idx === editingIndex ? { ...item, ...normalized } : item))
          : [...prev, normalized]
      );

      setShowClientForm(false);
      setShowDataTable(true);
      setEditingIndex(null);
      setEditingData(null);
      setActiveDraftId(null);
      setIsAddClientMenuOpen(false);
      showTransientMessage(isEditMode ? "Client updated successfully" : "Client added successfully");
    },
    [editingIndex, generateNextClientId, normalizeClientRecord, showTransientMessage]
  );

  const closeViewDrawer = React.useCallback(() => {
    setIsViewDrawerOpen(false);
  }, []);

  const clientFormConfig = React.useMemo(
    () => ({
      ...clientConfig,
      showDraftAction: editingIndex === null,
      showCancelAction: true,
      cancelLabel: "Cancel",
      onCancel: handleCancelClientForm,
      onSaveDraft: saveClientDraft,
    }),
    [editingIndex, handleCancelClientForm, saveClientDraft]
  );

  return (
    <div className={styles.page}>
      {showSuccessMessage && <div className={styles.successMessage}>{successMessageText}</div>}

      <div className={`${styles.card}${showDataTable ? ` ${styles.cardAutoHeight}` : ""}`}>
        {!showClientForm && (
          <div className={styles.infoRow}>
            <p className={styles.description}>
              {clientsPageDescription}
            </p>
            <div ref={addClientMenuRef} className={styles.addClientMenuAnchor}>
              <div className={styles.addClientSplit}>
                <button className={styles.addButton} onClick={handleAddClient} type="button">
                  <span className={styles.addIcon}>+</span>
                  Add Client
                </button>
                <button
                  type="button"
                  className={`${styles.addButtonDropdownTrigger}${isAddClientMenuOpen ? ` ${styles.addButtonDropdownTriggerOpen}` : ""}`}
                  onClick={handleAddClientMenuToggle}
                  aria-label="Open add client options"
                  aria-haspopup="menu"
                  aria-expanded={isAddClientMenuOpen}
                >
                  <FiChevronDown size={14} />
                </button>
              </div>

              {isAddClientMenuOpen && (
                <div className={styles.addClientMenu} role="menu" aria-label="Add client options">
                  <div className={styles.addClientMenuTitle}>Saved Drafts</div>

                  {clientDrafts.length === 0 ? (
                    <div className={styles.addClientMenuEmpty}>No saved drafts available.</div>
                  ) : (
                    <div className={styles.addClientDraftList} role="none">
                      {clientDrafts.map((draft) => (
                        <div key={draft.id} className={styles.addClientDraftRow}>
                          <button
                            type="button"
                            className={styles.addClientMenuOption}
                            onClick={() => handleUseClientDraft(draft.id)}
                            title={draft.title || "Untitled Draft"}
                          >
                            <span className={styles.addClientDraftTitle}>{draft.title || "Untitled Draft"}</span>
                            <span className={styles.addClientDraftMeta}>
                              {draft.updatedAt || draft.createdAt
                                ? new Date(draft.updatedAt || draft.createdAt).toLocaleString()
                                : "-"}
                            </span>
                          </button>
                          <button
                            type="button"
                            className={styles.addClientDraftDelete}
                            onClick={() => handleDeleteClientDraft(draft.id)}
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
          </div>
        )}

        {showClientForm && (
          <div className={styles.formWrap}>
            <ReusableForm
              key={`client-form-${clientFormKey}`}
              config={clientFormConfig}
              onSubmit={handleClientSubmit}
              initialData={editingData}
            />
          </div>
        )}

        {showDataTable && (
          <div className={styles.tableSection}>
            <div className={styles.filtersBar}>
              <div className={styles.filtersLeft}>
                <FiFilter className={styles.filterIcon} aria-hidden="true" />
                <div className={styles.searchField}>
                  <FiSearch className={styles.searchIcon} aria-hidden="true" />
                  <input
                    type="text"
                    placeholder="Search here..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className={styles.searchInput}
                  />
                </div>

                <div ref={dateRangeRef} className={styles.dateRangeAnchor}>
                  <button
                    type="button"
                    className={`${styles.selectField} ${styles.dateRangeToggle}${isDateRangeOpen ? ` ${styles.dateRangeToggleActive}` : ""}`}
                    onClick={() => setIsDateRangeOpen((prev) => !prev)}
                  >
                    Active From
                    <FiChevronDown size={14} className={styles.dropdownIcon} />
                  </button>

                  {isDateRangeOpen && (
                    <div className={styles.dateRangeMenu}>
                      <div className={styles.dateRangeItem}>
                        <label className={styles.dateRangeLabel}>From Date</label>
                        <input
                          type="date"
                          value={filterActiveFromStart}
                          onChange={(e) => {
                            setFilterActiveFromStart(e.target.value);
                            setCurrentPage(1);
                          }}
                          className={styles.dateField}
                        />
                      </div>
                      <div className={styles.dateRangeItem}>
                        <label className={styles.dateRangeLabel}>To Date</label>
                        <input
                          type="date"
                          value={filterActiveFromEnd}
                          onChange={(e) => {
                            setFilterActiveFromEnd(e.target.value);
                            setCurrentPage(1);
                          }}
                          className={styles.dateField}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <select
                  value={filterAssignedPerson}
                  onChange={(e) => {
                    setFilterAssignedPerson(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={styles.selectField}
                >
                  <option value="">Assigned Person</option>
                  {uniqueAssignedPeople.map((person) => (
                    <option key={person} value={person}>
                      {person}
                    </option>
                  ))}
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={styles.selectField}
                >
                  <option value="">Status</option>
                  {uniqueStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.filtersRight}>
                <button
                  type="button"
                  className={styles.clearButton}
                  onClick={clearFilters}
                  disabled={
                    !searchTerm &&
                    !filterActiveFromStart &&
                    !filterActiveFromEnd &&
                    !filterAssignedPerson &&
                    !filterStatus
                  }
                >
                  Clear
                </button>
              </div>
            </div>

            <div className={styles.tableWrap}>
              <DataTable
                data={paginatedData}
                columns={tableColumns}
                onView={handleViewClient}
                onEdit={handleEditClient}
                onDelete={handleDeleteClient}
              />
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
            </div>
          </div>
        )}
      </div>

      {isViewDrawerOpen && selectedClient && (
        <div className={styles.viewDrawerOverlay} onClick={closeViewDrawer}>
          <aside className={styles.viewDrawer} onClick={(event) => event.stopPropagation()}>
            <div className={styles.drawerTop}>
              <div className={styles.drawerIdentity}>
                <div className={styles.drawerAvatar}>{selectedClient.clientName?.charAt(0) || "C"}</div>
                <div>
                  <h3>{selectedClient.clientName}</h3>
                  <p>{selectedClient.clientId}</p>
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

            <div className={styles.drawerMeta}>
              <span>
                <FiMail size={12} /> {selectedClient.contactEmail || "-"}
              </span>
              <span>
                <FiPhone size={12} /> {formatPhoneNumber(selectedClient.contactNumber)}
              </span>
              <span>
                <FiMapPin size={12} /> {selectedClient.clientLocation || "-"}
              </span>
            </div>

            <div className={styles.drawerGrid}>
              <div className={styles.drawerItem}>
                <span className={styles.drawerLabel}>Primary Contact</span>
                <span className={styles.drawerValue}>{selectedClient.primaryContactPerson || "-"}</span>
              </div>
              <div className={styles.drawerItem}>
                <span className={styles.drawerLabel}>Secondary Contact</span>
                <span className={styles.drawerValue}>{selectedClient.secondaryContactPerson || "-"}</span>
              </div>
              <div className={styles.drawerItem}>
                <span className={styles.drawerLabel}>Assigned Person</span>
                <span className={styles.drawerValue}>{selectedClient.accountManager || "-"}</span>
              </div>
              <div className={styles.drawerItem}>
                <span className={styles.drawerLabel}>Active From</span>
                <span className={styles.drawerValue}>{formatDate(selectedClient.activeFrom)}</span>
              </div>
              <div className={styles.drawerItem}>
                <span className={styles.drawerLabel}>Status</span>
                <span className={`${styles.statusPill} ${getStatusClass(selectedClient.clientStatus)}`}>
                  {selectedClient.clientStatus || "-"}
                </span>
              </div>
            </div>

            <div className={styles.drawerNote}>
              <span className={styles.drawerLabel}>
                <FiUser size={12} /> Comments / Remarks
              </span>
              <p>{selectedClient.comments || "No remarks available."}</p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
