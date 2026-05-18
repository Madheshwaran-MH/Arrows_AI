import * as React from "react";
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiMail, FiMapPin, FiPhone, FiX } from "react-icons/fi";
import styles from "./UserRoles.module.scss";
import DataTable from "../../components/forms/DataTable.jsx";

export default function UserRoles() {
  const [users, setUsers] = React.useState([
    {
      id: "U1",
      userId: "C5342415",
      fullName: "Arun Kumar",
      email: "arun.kumar@email.com",
      mobileNumber: "9876543210",
      countryCode: "+91",
      userRole: "CEO",
      manager: "None",
      department: "Leadership",
      avatar: "https://i.pravatar.cc/150?img=12",
      comments: ""
    },
    {
      id: "U2",
      userId: "C5342416",
      fullName: "Priya Sharma",
      email: "priya.sharma@email.com",
      mobileNumber: "9876543211",
      countryCode: "+91",
      userRole: "Manager",
      manager: "Arun Kumar",
      department: "Hiring",
      avatar: "https://i.pravatar.cc/150?img=5",
      comments: ""
    },
    {
      id: "U3",
      userId: "C5342417",
      fullName: "Ravi Patel",
      email: "ravi.patel@email.com",
      mobileNumber: "9876543212",
      countryCode: "+91",
      userRole: "Manager",
      manager: "Arun Kumar",
      department: "Hiring",
      avatar: "https://i.pravatar.cc/150?img=13",
      comments: ""
    },
    {
      id: "U4",
      userId: "C5342418",
      fullName: "Sneha Iyer",
      email: "sneha.iyer@email.com",
      mobileNumber: "9876543213",
      countryCode: "+91",
      userRole: "Manager",
      manager: "Arun Kumar",
      department: "Hiring",
      avatar: "https://i.pravatar.cc/150?img=9",
      comments: ""
    },
    {
      id: "U5",
      userId: "C5342419",
      fullName: "Vikram Singh",
      email: "vikram.singh@email.com",
      mobileNumber: "9876543214",
      countryCode: "+91",
      userRole: "Manager",
      manager: "Arun Kumar",
      department: "Operations",
      avatar: "https://i.pravatar.cc/150?img=14",
      comments: ""
    },
    {
      id: "U6",
      userId: "C5342420",
      fullName: "Rajesh Kumar",
      email: "rajesh.kumar@email.com",
      mobileNumber: "9876543215",
      countryCode: "+91",
      userRole: "Recruiter",
      manager: "Priya Sharma",
      department: "Hiring",
      avatar: "https://i.pravatar.cc/150?img=33",
      comments: ""
    },
    {
      id: "U7",
      userId: "C5342421",
      fullName: "Anil Mehta",
      email: "anil.mehta@email.com",
      mobileNumber: "9876543216",
      countryCode: "+91",
      userRole: "Recruiter",
      manager: "Priya Sharma",
      department: "Hiring",
      avatar: "https://i.pravatar.cc/150?img=15",
      comments: ""
    },
    {
      id: "U8",
      userId: "C5342422",
      fullName: "Kavita Rao",
      email: "kavita.rao@email.com",
      mobileNumber: "9876543217",
      countryCode: "+91",
      userRole: "Recruiter",
      manager: "Priya Sharma",
      department: "Hiring",
      avatar: "https://i.pravatar.cc/150?img=44",
      comments: ""
    },
    {
      id: "U9",
      userId: "C5342423",
      fullName: "Suresh Nair",
      email: "suresh.nair@email.com",
      mobileNumber: "9876543218",
      countryCode: "+91",
      userRole: "Recruiter",
      manager: "Ravi Patel",
      department: "Hiring",
      avatar: "https://i.pravatar.cc/150?img=52",
      comments: ""
    },
    {
      id: "U10",
      userId: "C5342424",
      fullName: "Ananya Rao",
      email: "ananya.rao@email.com",
      mobileNumber: "9876543219",
      countryCode: "+91",
      userRole: "Recruiter",
      manager: "Ravi Patel",
      department: "Hiring",
      avatar: "https://i.pravatar.cc/150?img=45",
      comments: ""
    },
    {
      id: "U11",
      userId: "C5342425",
      fullName: "Rohit Verma",
      email: "rohit.verma@email.com",
      mobileNumber: "9876543220",
      countryCode: "+91",
      userRole: "Recruiter",
      manager: "Ravi Patel",
      department: "Hiring",
      avatar: "https://i.pravatar.cc/150?img=17",
      comments: ""
    },
    {
      id: "U12",
      userId: "C5342426",
      fullName: "Amit Shah",
      email: "amit.shah@email.com",
      mobileNumber: "9876543221",
      countryCode: "+91",
      userRole: "Recruiter",
      manager: "Vikram Singh",
      department: "Operations",
      avatar: "https://i.pravatar.cc/150?img=60",
      comments: ""
    },
    {
      id: "U13",
      userId: "C5342427",
      fullName: "Pankaj Malhotra",
      email: "pankaj.malhotra@email.com",
      mobileNumber: "9876543222",
      countryCode: "+91",
      userRole: "Recruiter",
      manager: "Vikram Singh",
      department: "Operations",
      avatar: "https://i.pravatar.cc/150?img=51",
      comments: ""
    }
  ]);
  const [showForm, setShowForm] = React.useState(false);
  const [editingId, setEditingId] = React.useState(null);
  const [viewMode, setViewMode] = React.useState("chart");
  const [viewUser, setViewUser] = React.useState(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = React.useState(false);
  const [pendingDeleteUser, setPendingDeleteUser] = React.useState(null);
  const [showWarningModal, setShowWarningModal] = React.useState(false);
  const [warningMessage, setWarningMessage] = React.useState("");
  const [formData, setFormData] = React.useState({
    userId: "",
    fullName: "",
    email: "",
    mobileNumber: "",
    countryCode: "+91",
    userRole: "",
    manager: "",
    department: "",
    avatar: "",
    comments: ""
  });

  const userRoles = ["CEO", "Manager", "Recruiter", "Interviewer", "Coordinator"];
  const departments = ["Leadership", "Hiring", "Operations", "Finance", "IT"];
  const countryCodes = ["+91", "+1", "+44", "+61", "+65"];

  const getManagers = () => {
    return ["None", ...users.map(u => u.fullName)];
  };

  const generateUserId = () => {
    const maxNumericId = users.reduce((maxValue, user) => {
      const matched = String(user?.userId || "").match(/(\d+)/);
      const parsed = matched ? Number.parseInt(matched[1], 10) : Number.NaN;
      if (!Number.isFinite(parsed)) return maxValue;
      return parsed > maxValue ? parsed : maxValue;
    }, 0);

    return `C${maxNumericId + 1}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddUser = () => {
    setEditingId(null);
    setFormData({
      userId: generateUserId(),
      fullName: "",
      email: "",
      mobileNumber: "",
      countryCode: "+91",
      userRole: "",
      manager: "",
      department: "",
      avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
      comments: ""
    });
    setShowForm(true);
  };

  const handleEditUser = (user) => {
    setEditingId(user.id);
    setFormData({
      userId: user.userId,
      fullName: user.fullName,
      email: user.email,
      mobileNumber: user.mobileNumber,
      countryCode: user.countryCode || "+91",
      userRole: user.userRole,
      manager: user.manager,
      department: user.department || "",
      avatar: user.avatar || "",
      comments: user.comments || ""
    });
    setShowForm(true);
  };

  const handleDeleteUser = (userOrId) => {
    const deleteId = typeof userOrId === "string" ? userOrId : userOrId?.id;
    const userToDelete = users.find(user => user.id === deleteId);
    
    if (!userToDelete) return;

    setPendingDeleteUser(userToDelete);
    setShowDeleteConfirmModal(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmModal(false);
    setPendingDeleteUser(null);
  };

  const handleConfirmDelete = () => {
    if (!pendingDeleteUser?.id) return;

    setUsers(prev => prev.filter(user => user.id !== pendingDeleteUser.id));
    setShowDeleteConfirmModal(false);
    setPendingDeleteUser(null);
  };

  const handleViewUser = (user) => {
    setViewUser(user);
  };

  const handleCloseViewUser = () => {
    setViewUser(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.userId || !formData.fullName || !formData.email || !formData.mobileNumber || !formData.userRole || !formData.manager || !formData.department) {
      alert("Please fill in all required fields");
      return;
    }

    if (editingId) {
      setUsers(prev => prev.map(user => 
        user.id === editingId 
          ? { ...formData, id: editingId }
          : user
      ));
    } else {
      const newUser = {
        ...formData,
        id: `U${Date.now()}`
      };
      setUsers(prev => [...prev, newUser]);
    }

    setShowForm(false);
    setFormData({
      userId: "",
      fullName: "",
      email: "",
      mobileNumber: "",
      countryCode: "+91",
      userRole: "",
      manager: "",
      department: "",
      avatar: "",
      comments: ""
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData({
      userId: "",
      fullName: "",
      email: "",
      mobileNumber: "",
      countryCode: "+91",
      userRole: "",
      manager: "",
      department: "",
      avatar: "",
      comments: ""
    });
  };

  const organizeHierarchy = () => {
    const ceo = users.find(u => u.userRole === "CEO");
    const managers = users.filter(u => u.userRole === "Manager");
    const recruiters = users.filter(u => u.userRole === "Recruiter");
    return { ceo, managers, recruiters };
  };

  const { ceo, managers, recruiters } = organizeHierarchy();

  const getRecruitersForManager = (managerName) => {
    return recruiters.filter(r => r.manager === managerName);
  };

  const getDepartmentColor = (dept) => {
    const colors = {
      "Leadership": "#3b82f6",
      "Hiring": "#f97316",
      "Operations": "#a855f7",
      "Finance": "#10b981",
      "IT": "#06b6d4"
    };
    return colors[dept] || "#6b7280";
  };

  const columns = [
    { key: "userId", label: "User ID" },
    { key: "fullName", label: "Full Name" },
    { key: "email", label: "Email Address" },
    { key: "mobileNumber", label: "Mobile Number" },
    { key: "userRole", label: "User Role" },
    { key: "department", label: "Department" },
    { key: "manager", label: "Manager" }
  ];

  return (
    <div className={styles.userRolesContainer}>
      <div className={styles.headerSection}>
        <div className={styles.headerContent}>
          <h1 className={styles.pageTitle}>User Roles</h1>
          <div className={styles.headerActions}>
            <div className={styles.viewToggle}>
              <button 
                className={`${styles.toggleBtn} ${viewMode === 'chart' ? styles.active : ''}`}
                onClick={() => setViewMode('chart')}
              >
                Organization Chart
              </button>
              <button 
                className={`${styles.toggleBtn} ${viewMode === 'table' ? styles.active : ''}`}
                onClick={() => setViewMode('table')}
              >
                Table View
              </button>
            </div>
          </div>
        </div>
        <p className={styles.pageDescription}>
          Manage user roles and permissions. Create, view, edit, and delete user accounts with different role assignments.
        </p>
      </div>

      <div className={styles.contentArea}>
        {users.length === 0 ? (
          <div className={styles.emptyState}>
            <h2>No Users Found</h2>
            <p>Create your first user to get started.</p>
          </div>
        ) : viewMode === 'table' ? (
          <DataTable
            data={users}
            columns={columns}
            onView={handleViewUser}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
          />
        ) : (
          <div className={styles.orgChart}>
            {ceo && (
              <div className={styles.orgLevel}>
                <div className={styles.userCard}>
                  <div className={styles.cardInner}>
                    <img src={ceo.avatar} alt={ceo.fullName} className={styles.avatar} />
                    <div className={styles.userInfo}>
                      <h3 className={styles.userName}>{ceo.fullName}</h3>
                      <p className={styles.userRole}>{ceo.userRole}</p>
                      <span 
                        className={styles.departmentBadge}
                        style={{ backgroundColor: getDepartmentColor(ceo.department) }}
                      >
                        {ceo.department}
                      </span>
                    </div>
                    <div className={styles.cardActions}>
                      <button 
                        className={styles.actionBtn}
                        onClick={() => handleViewUser(ceo)}
                        title="View"
                      >
                        <FiEye />
                      </button>
                    </div>
                  </div>
                  <div className={styles.connectorDown}></div>
                </div>
              </div>
            )}

            {managers.length > 0 && (
              <>
                <div className={styles.connectorHorizontal}></div>
                <div className={styles.orgLevel}>
                  <div className={styles.managerRow}>
                    {managers.map((manager) => (
                      <div key={manager.id} className={styles.managerColumn}>
                        <div className={styles.userCard}>
                          <div className={styles.connectorUp}></div>
                          <div className={styles.cardInner}>
                            <img src={manager.avatar} alt={manager.fullName} className={styles.avatar} />
                            <div className={styles.userInfo}>
                              <h3 className={styles.userName}>{manager.fullName}</h3>
                              <p className={styles.userRole}>{manager.userRole}</p>
                              <span 
                                className={styles.departmentBadge}
                                style={{ backgroundColor: getDepartmentColor(manager.department) }}
                              >
                                {manager.department}
                              </span>
                            </div>
                            <div className={styles.cardActions}>
                              <button 
                                className={styles.actionBtn}
                                onClick={() => handleViewUser(manager)}
                                title="View"
                              >
                                <FiEye />
                              </button>
                            </div>
                          </div>
                          {getRecruitersForManager(manager.fullName).length > 0 && (
                            <div className={styles.connectorDown}></div>
                          )}
                        </div>

                        {getRecruitersForManager(manager.fullName).length > 0 && (
                          <div className={styles.recruitersList}>
                            {getRecruitersForManager(manager.fullName).map(recruiter => (
                              <div key={recruiter.id} className={styles.userCard}>
                                <div className={styles.connectorUp}></div>
                                <div className={styles.cardInner}>
                                  <img src={recruiter.avatar} alt={recruiter.fullName} className={styles.avatar} />
                                  <div className={styles.userInfo}>
                                    <h3 className={styles.userName}>{recruiter.fullName}</h3>
                                    <p className={styles.userRole}>{recruiter.userRole}</p>
                                    <span 
                                      className={styles.departmentBadge}
                                      style={{ backgroundColor: getDepartmentColor(recruiter.department) }}
                                    >
                                      {recruiter.department}
                                    </span>
                                  </div>
                                  <div className={styles.cardActions}>
                                    <button 
                                      className={styles.actionBtn}
                                      onClick={() => handleViewUser(recruiter)}
                                      title="View"
                                    >
                                      <FiEye />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {showForm && (
        <div className={styles.modalOverlay} onClick={handleCancel}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingId ? "Edit User" : "Add User"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    User Id <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Auto Generated"
                    name="userId"
                    value={formData.userId}
                    onChange={handleInputChange}
                    disabled
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Full Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Enter Full Name"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Email Address <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="email"
                    className={styles.formInput}
                    placeholder="Enter Email Address"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Mobile Number <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.phoneInputGroup}>
                    <select
                      className={styles.countryCodeSelect}
                      name="countryCode"
                      value={formData.countryCode}
                      onChange={handleInputChange}
                    >
                      {countryCodes.map(code => (
                        <option key={code} value={code}>{code}</option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      className={styles.phoneInput}
                      placeholder="Enter Phone Number"
                      name="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    User Role <span className={styles.required}>*</span>
                  </label>
                  <select
                    className={styles.formSelect}
                    name="userRole"
                    value={formData.userRole}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Role</option>
                    {userRoles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Manager <span className={styles.required}>*</span>
                  </label>
                  <select
                    className={styles.formSelect}
                    name="manager"
                    value={formData.manager}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Manager</option>
                    {getManagers().map(manager => (
                      <option key={manager} value={manager}>{manager}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Department <span className={styles.required}>*</span>
                  </label>
                  <select
                    className={styles.formSelect}
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Avatar URL</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="https://example.com/avatar.jpg"
                    name="avatar"
                    value={formData.avatar}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label className={styles.formLabel}>Comments / Remarks</label>
                  <textarea
                    className={styles.formTextarea}
                    placeholder="Enter comments or remarks"
                    name="comments"
                    value={formData.comments}
                    onChange={handleInputChange}
                    rows="4"
                  />
                </div>
              </div>

              <div className={styles.formFooter}>
                <button type="submit" className={styles.submitBtn}>
                  {editingId ? "Update User" : "Create User"}
                </button>
                <button type="button" className={styles.cancelBtn} onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewUser && (
        <div className={`${styles.modalOverlay} ${styles.viewDrawerOverlay}`} onClick={handleCloseViewUser}>
          <div className={styles.viewModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.viewHeader}>
              <div className={styles.viewProfileRow}>
                <div className={styles.viewAvatarWrap}>
                  {viewUser.avatar ? (
                    <img src={viewUser.avatar} alt={viewUser.fullName} className={styles.viewAvatar} />
                  ) : (
                    <span className={styles.viewAvatarFallback}>{viewUser.fullName?.charAt(0)?.toUpperCase() || "U"}</span>
                  )}
                </div>

                <div className={styles.viewProfileInfo}>
                  <h2 className={styles.viewName}>{viewUser.fullName}</h2>
                  <p className={styles.viewRole}>{viewUser.userRole}</p>
                  <div className={styles.viewMetaRow}>
                    <span className={styles.viewMetaItem}><FiMail /> {viewUser.email}</span>
                    <span className={styles.viewMetaItem}><FiMapPin /> {viewUser.department}, India</span>
                    <span className={styles.viewMetaItem}><FiPhone /> {`${viewUser.countryCode || "+91"} ${viewUser.mobileNumber}`}</span>
                  </div>
                </div>
              </div>

              <button className={styles.viewCloseBtn} onClick={handleCloseViewUser} aria-label="Close view">
                <FiX />
              </button>
            </div>

            <div className={styles.viewBody}>
              <div className={styles.viewInfoGrid}>
                <div className={styles.viewInfoItem}>
                  <span className={styles.viewInfoLabel}>User ID</span>
                  <span className={styles.viewInfoValue}>{viewUser.userId}</span>
                </div>
                <div className={styles.viewInfoItem}>
                  <span className={styles.viewInfoLabel}>Full Name</span>
                  <span className={styles.viewInfoValue}>{viewUser.fullName}</span>
                </div>
                <div className={styles.viewInfoItem}>
                  <span className={styles.viewInfoLabel}>User Role</span>
                  <span className={styles.viewInfoValue}>{viewUser.userRole}</span>
                </div>
                <div className={styles.viewInfoItem}>
                  <span className={styles.viewInfoLabel}>Primary Email Address</span>
                  <span className={styles.viewInfoValueLink}>{viewUser.email}</span>
                </div>
                <div className={styles.viewInfoItem}>
                  <span className={styles.viewInfoLabel}>Phone Number</span>
                  <span className={styles.viewInfoValue}>{viewUser.mobileNumber}</span>
                </div>
                <div className={styles.viewInfoItem}>
                  <span className={styles.viewInfoLabel}>Manager</span>
                  <span className={styles.viewInfoValue}>{viewUser.manager}</span>
                </div>
                <div className={styles.viewInfoItem}>
                  <span className={styles.viewInfoLabel}>Department</span>
                  <span className={styles.viewInfoValue}>{viewUser.department}</span>
                </div>
                <div className={styles.viewInfoItem}>
                  <span className={styles.viewInfoLabel}>Country Code</span>
                  <span className={styles.viewInfoValue}>{viewUser.countryCode || "+91"}</span>
                </div>
                <div className={styles.viewInfoItem}>
                  <span className={styles.viewInfoLabel}>Comments / Remarks</span>
                  <span className={styles.viewInfoValue}>{viewUser.comments || "-"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showWarningModal && (
        <div className={styles.modalOverlay} onClick={() => setShowWarningModal(false)}>
          <div className={styles.warningModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.warningHeader}>
              <h2 className={styles.warningTitle}>⚠️ Cannot Delete User</h2>
            </div>
            <div className={styles.warningBody}>
              <p className={styles.warningText}>{warningMessage}</p>
            </div>
            <div className={styles.warningFooter}>
              <button 
                className={styles.warningCloseBtn} 
                onClick={() => setShowWarningModal(false)}
              >
                Okay, Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirmModal && (
        <div className={styles.modalOverlay} onClick={handleCancelDelete}>
          <div className={styles.deleteConfirmModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.deleteConfirmHeader}>
              <h2 className={styles.deleteConfirmTitle}>Delete User</h2>
            </div>
            <div className={styles.deleteConfirmBody}>
              <p className={styles.deleteConfirmText}>
                Are you sure you want to delete {pendingDeleteUser?.fullName}?
              </p>
            </div>
            <div className={styles.deleteConfirmFooter}>
              <button
                type="button"
                className={styles.deleteConfirmCancelBtn}
                onClick={handleCancelDelete}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.deleteConfirmDeleteBtn}
                onClick={handleConfirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
