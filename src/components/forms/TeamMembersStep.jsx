import { useEffect, useMemo, useState } from "react";

const TEAM_MEMBERS = [
  {
    id: "A83261",
    name: "Rahul Mehta",
    email: "rahul.mehta@email.com",
    role: "Team Lead",
    reportingManager: "Arun Kumar",
  },
  {
    id: "A83233",
    name: "Priya Sharma",
    email: "priya.sharma@email.com",
    role: "Team Lead",
    reportingManager: "Divya Nair",
  },
];

const ADD_NEW_MEMBER_OPTION = "__add_new_member__";
const normalizeName = (value) => String(value || "").trim().replace(/\s+/g, " ");

const buildEmailFromName = (name) => {
  const normalized = normalizeName(name).toLowerCase();
  if (!normalized) return "";
  return `${normalized.replace(/\s+/g, ".")}@email.com`;
};

const generateMemberId = (members) => {
  const maxSequence = members.reduce((maxValue, member) => {
    const matchedDigits = String(member?.id || "").match(/(\d+)/);
    if (!matchedDigits) return maxValue;
    const parsedValue = Number(matchedDigits[1]);
    if (Number.isNaN(parsedValue)) return maxValue;
    return Math.max(maxValue, parsedValue);
  }, 0);

  return `A${String(maxSequence + 1).padStart(5, "0")}`;
};

const TeamMembersStep = ({
  formData,
  onChange,
  onSetStepFields,
  validationErrors = {},
}) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedRecruiterId, setSelectedRecruiterId] = useState("");
  const [recruiterRole, setRecruiterRole] = useState("");
  const [newTeamMemberName, setNewTeamMemberName] = useState("");
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const customTeamMembers = Array.isArray(formData.customTeamMembers)
    ? formData.customTeamMembers
    : [];
  const allTeamMembers = useMemo(
    () => [...TEAM_MEMBERS, ...customTeamMembers],
    [customTeamMembers]
  );
  const selectedMembers = Array.isArray(formData.teamMembers)
    ? formData.teamMembers
    : [];
  const memberRoles = useMemo(
    () => formData.teamMemberRoles || {},
    [formData.teamMemberRoles]
  );

  useEffect(() => {
    if (formData.teamMembers === undefined) {
      onChange("teamMembers", TEAM_MEMBERS.map((member) => member.id));
    }
  }, [formData.teamMembers, onChange]);

  useEffect(() => {
    if (onSetStepFields) {
      onSetStepFields([
        {
          name: "teamMembers",
          label: "Team Members",
          required: false,
        },
      ]);
    }
  }, [onSetStepFields]);

  const confirmDeleteMember = (memberId) => {
    setMemberToDelete(memberId);
    setDeleteConfirmOpen(true);
  };

  const executeDelete = () => {
    if (!memberToDelete) return;

    // Remove from selected members
    const nextSelection = selectedMembers.filter((id) => id !== memberToDelete);
    onChange("teamMembers", nextSelection);
    
    // Remove custom member if it's a custom member
    const isCustomMember = customTeamMembers.some((m) => m.id === memberToDelete);
    if (isCustomMember) {
      const updatedCustomMembers = customTeamMembers.filter((m) => m.id !== memberToDelete);
      onChange("customTeamMembers", updatedCustomMembers);
    }

    // Also remove from roles if exists
    const updatedRoles = { ...memberRoles };
    if (updatedRoles[memberToDelete]) {
      delete updatedRoles[memberToDelete];
      onChange("teamMemberRoles", updatedRoles);
    }

    // Close modal and reset state
    setDeleteConfirmOpen(false);
    setMemberToDelete(null);
  };

  const cancelDelete = () => {
    setDeleteConfirmOpen(false);
    setMemberToDelete(null);
  };

  const openAssignModal = () => {
    setSelectedRecruiterId("");
    setRecruiterRole("");
    setNewTeamMemberName("");
    setModalOpen(true);
  };

  const closeAssignModal = () => {
    setModalOpen(false);
  };

  const handleAssignSubmit = (event) => {
    if (event) {
      event.preventDefault();
    }
    const trimmedNewMemberName = normalizeName(newTeamMemberName);
    const isAddingNewMember = selectedRecruiterId === ADD_NEW_MEMBER_OPTION;
    let recruiterIdToAssign = selectedRecruiterId;

    if (isAddingNewMember) {
      if (!trimmedNewMemberName) {
        return;
      }

      const existingMember = allTeamMembers.find(
        (member) =>
          normalizeName(member.name).toLowerCase() === trimmedNewMemberName.toLowerCase()
      );

      if (existingMember) {
        recruiterIdToAssign = existingMember.id;
      } else {
        const newMember = {
          id: generateMemberId(allTeamMembers),
          name: trimmedNewMemberName,
          email: buildEmailFromName(trimmedNewMemberName),
          role: recruiterRole.trim() || "Recruiter",
        };
        onChange("customTeamMembers", [...customTeamMembers, newMember]);
        recruiterIdToAssign = newMember.id;
      }
    }

    if (!recruiterIdToAssign || recruiterIdToAssign === ADD_NEW_MEMBER_OPTION) {
      return;
    }

    if (!selectedMembers.includes(recruiterIdToAssign)) {
      onChange("teamMembers", [...selectedMembers, recruiterIdToAssign]);
    }
    if (recruiterRole.trim()) {
      onChange("teamMemberRoles", {
        ...memberRoles,
        [recruiterIdToAssign]: recruiterRole.trim(),
      });
    }
    closeAssignModal();
  };

  const resolveRecruiterRole = (recruiterId) => {
    if (!recruiterId) return "";
    if (memberRoles[recruiterId]) return memberRoles[recruiterId];
    const matchedRecruiter = allTeamMembers.find((member) => member.id === recruiterId);
    return matchedRecruiter?.role || "";
  };

  const resolveReportingManager = (member) => {
    if (!member) return "-";
    if (member.reportingManager) return member.reportingManager;
    return "Karthik Raman";
  };

  return (
    <div className="team-members-step">
      <div className="team-members-toolbar">
        <button className="assign-button" type="button" onClick={openAssignModal}>
          Assign Team Member
        </button>
      </div>

      <div className="team-members-table">
        <table>
          <thead>
            <tr>
              <th>Recruiter Name</th>
              <th>Email Address</th>
              <th>Role</th>
              <th>Reporting Manager</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {selectedMembers.map((memberId) => {
              const member = allTeamMembers.find((m) => m.id === memberId);
              if (!member) return null;
              return (
                <tr key={member.id}>
                  <td>{member.name}</td>
                  <td>{member.email}</td>
                  <td>{memberRoles[member.id] || member.role}</td>
                  <td>{resolveReportingManager(member)}</td>
                  <td className="action-col">
                    <button
                      type="button"
                      className="delete-icon-btn"
                      onClick={() => confirmDeleteMember(member.id)}
                      aria-label={`Delete ${member.name}`}
                      title="Delete member"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {validationErrors.teamMembers && (
        <div className="team-members-error">{validationErrors.teamMembers}</div>
      )}

      {isModalOpen && (
        <div className="team-members-backdrop" onClick={closeAssignModal}>
          <div
            className="team-members-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Assign Team Member"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">Assign Team Member</h3>
              <button
                type="button"
                className="modal-close"
                aria-label="Close"
                onClick={closeAssignModal}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-field">
                <label className="modal-label" htmlFor="recruiterName">
                  Recruiter Name
                </label>
                <select
                  id="recruiterName"
                  className="modal-input"
                  value={selectedRecruiterId}
                  onChange={(event) => {
                    const nextId = event.target.value;
                    setSelectedRecruiterId(nextId);
                    if (nextId === ADD_NEW_MEMBER_OPTION) {
                      setNewTeamMemberName("");
                      setRecruiterRole("");
                      return;
                    }
                    setRecruiterRole(resolveRecruiterRole(nextId));
                  }}
                >
                  <option value="" disabled>
                    Select recruiter
                  </option>
                  <option value={ADD_NEW_MEMBER_OPTION}>Add new team member</option>
                  {allTeamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedRecruiterId === ADD_NEW_MEMBER_OPTION && (
                <div className="modal-field">
                  <label className="modal-label" htmlFor="newTeamMemberName">
                    Name
                  </label>
                  <input
                    id="newTeamMemberName"
                    className="modal-input"
                    type="text"
                    placeholder="Add a new team member"
                    value={newTeamMemberName}
                    onChange={(event) => setNewTeamMemberName(event.target.value)}
                  />
                </div>
              )}

              <div className="modal-field">
                <label className="modal-label" htmlFor="recruiterRole">
                  Recruiter Role
                </label>
                <input
                  id="recruiterRole"
                  className="modal-input"
                  type="text"
                  placeholder="Input text"
                  value={recruiterRole}
                  onChange={(event) => setRecruiterRole(event.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-btn primary"
                  onClick={handleAssignSubmit}
                  disabled={
                    !selectedRecruiterId ||
                    (selectedRecruiterId === ADD_NEW_MEMBER_OPTION &&
                      !newTeamMemberName.trim())
                  }
                >
                  Submit
                </button>
                <button
                  type="button"
                  className="modal-btn secondary"
                  onClick={closeAssignModal}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isDeleteConfirmOpen && (
        <div className="delete-confirm-backdrop" onClick={cancelDelete}>
          <div
            className="delete-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Confirm deletion"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="confirm-modal-header">
              <h3 className="confirm-modal-title">Confirm Delete</h3>
            </div>
            <div className="confirm-modal-body">
              <p>Are you sure you want to delete this assigned team member?</p>
            </div>
            <div className="confirm-modal-actions">
              <button
                type="button"
                className="confirm-btn yes"
                onClick={executeDelete}
              >
                Yes
              </button>
              <button
                type="button"
                className="confirm-btn no"
                onClick={cancelDelete}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamMembersStep;
