import React, { useEffect } from "react";
import FormField from "./FormField";

const FOCUS_LOCATION_OPTIONS = [
  { value: "base", label: "Base" },
  { value: "any", label: "Any" },
];

const FOCUS_LOCATION_VALUE_OPTIONS = [
  { value: "chennai", label: "Chennai" },
  { value: "bangalore", label: "Bangalore" },
  { value: "hyderabad", label: "Hyderabad" },
  { value: "pune", label: "Pune" },
  { value: "mumbai", label: "Mumbai" },
  { value: "delhi", label: "Delhi" },
  { value: "noida", label: "Noida" },
  { value: "gurgaon", label: "Gurgaon" },
  { value: "coimbatore", label: "Coimbatore" },
  { value: "kolkata", label: "Kolkata" },
];

const FOCUS_LOCATION_VALUES = new Set(FOCUS_LOCATION_VALUE_OPTIONS.map((option) => option.value));

const AVAILABILITY_OPTIONS = [
  { value: "immediate", label: "Immediate" },
  { value: "1week", label: "1 week" },
  { value: "2week", label: "2 week" },
  { value: "1month", label: "1 month" },
  { value: "2month", label: "2 month" },
  { value: "3month", label: "3 month" },
];

const getInterviewStageLabel = (value) => {
  const matched = String(value).match(/^interview-(\d+)$/i);
  if (matched?.[1]) {
    return `Interview ${matched[1]}`;
  }
  const clientMatched = String(value).match(/^client-interview-(\d+)$/i);
  if (clientMatched?.[1]) {
    return `Client Interview ${clientMatched[1]}`;
  }
  if (value === "client-interview") return "Client Interview";
  if (value === "hr-interview") return "HR Interview";
  if (value === "preboarding") return "Preboarding";
  return String(value);
};

const PermissionStep = ({ formData, onChange, onSetStepFields, fields = [], validationErrors = {}, disabled = false }) => {
  const [isInterviewPopupOpen, setInterviewPopupOpen] = React.useState(false);
  const [stagePopupMode, setStagePopupMode] = React.useState("interview");
  const [interviewCountInput, setInterviewCountInput] = React.useState(
    String(formData.interviewCount || "")
  );

  const fieldMap = React.useMemo(() => {
    const map = {};
    fields.forEach((field) => {
      if (field?.name) {
        map[field.name] = field;
      }
    });
    return map;
  }, [fields]);

  const clientIdConfig = fieldMap.clientId || {
    name: "clientId",
    label: "Client Id",
    type: "text",
    required: false,
    options: []
  };
  const clientNameConfig = fieldMap.clientName || {
    name: "clientName",
    label: "Client Name *",
    type: "select",
    required: true,
    options: []
  };
  const contactPersonNameConfig = fieldMap.contactPersonName || {
    name: "contactPersonName",
    label: "Contact Person Name",
    type: "text",
    required: false
  };
  const contactPersonEmailConfig = fieldMap.contactPersonEmail || {
    name: "contactPersonEmail",
    label: "Contact Person Email Id",
    type: "email",
    required: false
  };
  const priorityConfig = fieldMap.priority || {
    name: "priority",
    label: "Priority",
    type: "select",
    required: false,
    options: []
  };
  const hiringTypeConfig = fieldMap.hiringType;

  const focusLocationType = formData.focusLocationType || "base";
  const selectedJobLocations = (Array.isArray(formData.location)
    ? formData.location
    : formData.location
      ? [formData.location]
      : [])
    .map((item) => String(item || "").toLowerCase())
    .filter((item) => FOCUS_LOCATION_VALUES.has(item));
  const availabilitySelection = Array.isArray(formData.availabilityOptions)
    ? (formData.availabilityOptions[0] || "")
    : String(formData.availabilityOptions || "");
  const interviewStages = Array.isArray(formData.interviewStages)
    ? formData.interviewStages
    : [];
  const clientInterviewStages = Array.isArray(formData.clientInterviewStages)
    ? formData.clientInterviewStages
    : [];
  const interviewStageNames =
    formData.interviewStageNames && typeof formData.interviewStageNames === "object"
      ? formData.interviewStageNames
      : {};
  const finalStages = Array.isArray(formData.finalStages)
    ? formData.finalStages
    : [];

  useEffect(() => {
    setInterviewCountInput(String(formData.interviewCount || ""));
  }, [formData.interviewCount]);

  useEffect(() => {
    if (formData.focusLocationType === undefined) {
      onChange("focusLocationType", "base");
    }
    if (formData.focusLocationValue === undefined) {
      const fallbackLocations = selectedJobLocations.length ? selectedJobLocations : ["chennai"];
      onChange("focusLocationValue", fallbackLocations);
    }
    if (formData.availabilityOptions === undefined) {
      onChange("availabilityOptions", "immediate");
    } else if (Array.isArray(formData.availabilityOptions)) {
      onChange("availabilityOptions", formData.availabilityOptions[0] || "");
    }
    if (formData.interviewStages === undefined) {
      onChange("interviewStages", []);
    }
    if (formData.clientInterviewStages === undefined) {
      onChange("clientInterviewStages", []);
    }
    if (formData.clientInterviewCount === undefined) {
      onChange("clientInterviewCount", 0);
    }
    if (formData.interviewStageNames === undefined) {
      onChange("interviewStageNames", {});
    }
    if (formData.finalStages === undefined) {
      onChange("finalStages", ["preboarding"]);
    }
  }, [
    formData.focusLocationType,
    formData.focusLocationValue,
    selectedJobLocations,
    formData.availabilityOptions,
    formData.interviewStages,
    formData.clientInterviewStages,
    formData.clientInterviewCount,
    formData.interviewStageNames,
    formData.finalStages,
    onChange,
  ]);

  useEffect(() => {
    const currentValues = Array.isArray(formData.focusLocationValue)
      ? formData.focusLocationValue
      : formData.focusLocationValue
        ? [formData.focusLocationValue]
        : [];

    if (focusLocationType === "base") {
      const nextBaseValues = selectedJobLocations.length ? selectedJobLocations : ["chennai"];
      const normalizedCurrent = currentValues.map((item) => String(item || "").toLowerCase());
      const isSame =
        normalizedCurrent.length === nextBaseValues.length &&
        normalizedCurrent.every((item, index) => item === nextBaseValues[index]);
      if (!isSame) {
        onChange("focusLocationValue", nextBaseValues);
      }
      return;
    }
  }, [focusLocationType, formData.focusLocationValue, selectedJobLocations, onChange]);

  const handleFocusLocationTypeChange = (nextType) => {
    onChange("focusLocationType", nextType);

    const currentValues = Array.isArray(formData.focusLocationValue)
      ? formData.focusLocationValue
      : formData.focusLocationValue
        ? [formData.focusLocationValue]
        : [];

    const fallbackValues = selectedJobLocations.length ? selectedJobLocations : ["chennai"];

    if (nextType === "base") {
      onChange("focusLocationValue", fallbackValues);
      return;
    }

    onChange("focusLocationValue", []);
  };

  const getClientIdForName = React.useCallback((clientName) => {
    const matchedClient = (clientNameConfig.options || []).find(
      (option) => String(option.value) === String(clientName)
    );
    return matchedClient?.clientId || matchedClient?.id || "";
  }, [clientNameConfig.options]);

  const handleClientNameChange = (fieldName, value) => {
    onChange(fieldName, value);
    onChange(clientIdConfig.name, getClientIdForName(value));
  };

  useEffect(() => {
    if (!formData[clientNameConfig.name]) return;

    const mappedClientId = getClientIdForName(formData[clientNameConfig.name]);
    if (mappedClientId && mappedClientId !== formData[clientIdConfig.name]) {
      onChange(clientIdConfig.name, mappedClientId);
    }
  }, [
    clientIdConfig.name,
    clientNameConfig.name,
    formData,
    getClientIdForName,
    onChange,
  ]);

  useEffect(() => {
    if (onSetStepFields) {
      const mappedStepFields = [
        clientIdConfig,
        clientNameConfig,
        contactPersonNameConfig,
        contactPersonEmailConfig,
        priorityConfig,
        hiringTypeConfig,
      ].filter(Boolean).map((field) => ({
        name: field.name,
        label: field.label,
        required: Boolean(field.required),
      }));

      onSetStepFields([
        ...mappedStepFields,
        { name: "jobActivationDate", label: "Validity Upto", required: true },
        { name: "targetDate", label: "Target", required: true },
        { name: "focusLocationType", label: "Focus Location", required: false },
        { name: "focusLocationValue", label: "Focus Location Value", required: false },
        { name: "availabilityOptions", label: "Availability", required: false },
        { name: "interviewCount", label: "Interview Count", required: false },
        { name: "interviewStages", label: "Interview Stages", required: false },
        { name: "clientInterviewCount", label: "Client Interview Count", required: false },
        { name: "clientInterviewStages", label: "Client Interview Stages", required: false },
        { name: "interviewStageNames", label: "Interview Stage Names", required: false },
        { name: "finalStages", label: "Final Hiring Stages", required: false },
      ]);
    }
  }, [
    clientIdConfig,
    clientNameConfig,
    contactPersonNameConfig,
    contactPersonEmailConfig,
    priorityConfig,
    hiringTypeConfig,
    onSetStepFields,
  ]);

  const handleAvailabilityChange = (option) => {
    onChange("availabilityOptions", option);
  };

  const openStagePopup = (mode) => {
    setStagePopupMode(mode);
    if (mode === "clientInterview") {
      setInterviewCountInput(String(formData.clientInterviewCount || 0));
    } else {
      setInterviewCountInput(String(formData.interviewCount || 0));
    }
    setInterviewPopupOpen(true);
  };

  const generateInterviewStages = () => {
    const parsedCount = Number.parseInt(interviewCountInput, 10);
    const normalizedCount = Number.isNaN(parsedCount)
      ? 0
      : Math.max(0, Math.min(parsedCount, 20));

    const stagePrefix = stagePopupMode === "clientInterview" ? "client-interview" : "interview";
    const stages = Array.from({ length: normalizedCount }, (_, index) => `${stagePrefix}-${index + 1}`);
    const nextStageNames = stages.reduce((acc, stage) => {
      const fallbackLabel = getInterviewStageLabel(stage);
      acc[stage] = interviewStageNames[stage] ?? fallbackLabel;
      return acc;
    }, {});

    if (stagePopupMode === "clientInterview") {
      onChange("clientInterviewCount", normalizedCount);
      onChange("clientInterviewStages", stages);
      onChange("interviewStageNames", {
        ...interviewStageNames,
        ...nextStageNames,
      });
    } else {
      onChange("interviewCount", normalizedCount);
      onChange("interviewStages", stages);
      onChange("interviewStageNames", {
        ...interviewStageNames,
        ...nextStageNames,
      });
    }
    setInterviewPopupOpen(false);
  };

  const handleInterviewStageNameChange = (stage, nextLabel) => {
    const normalizedLabel = String(nextLabel || "").slice(0, 40);
    onChange("interviewStageNames", {
      ...interviewStageNames,
      [stage]: normalizedLabel,
    });
  };

  const toggleFinalStage = (stage) => {
    const nextStages = finalStages.includes(stage)
      ? finalStages.filter((item) => item !== stage)
      : [...finalStages, stage];
    onChange("finalStages", nextStages);
  };

  const orderedFinalStages = ["hr-interview", "preboarding"].filter((stage) =>
    finalStages.includes(stage)
  );

  const hiringProcessFlow = [
    { key: "sourced", label: "Sourced", meta: "" },
    { key: "screening", label: "Screening", meta: "1 stage" },
    ...interviewStages.map((stage) => ({
      key: stage,
      label: interviewStageNames[stage] ?? getInterviewStageLabel(stage),
      meta: "Interview stage",
      isEditable: true,
    })),
    ...clientInterviewStages.map((stage) => ({
      key: stage,
      label: interviewStageNames[stage] ?? getInterviewStageLabel(stage),
      meta: "Client interview stage",
      isEditable: true,
    })),
    ...orderedFinalStages.map((stage) => ({
      key: stage,
      label: interviewStageNames[stage] ?? getInterviewStageLabel(stage),
      meta: stage === "preboarding" ? "" : "Final stage",
      isEditable: false,
    })),
  ];

  return (
    <div className="permission-step">
      <div className="job-section">
        <div className="job-section-header">
          <h3 className="job-section-title">Client Details</h3>
          <div className="job-section-divider" />
        </div>

        <div className="job-basic-info-grid job-basic-info-grid--client">
          <div className="grid-cell grid-col-1 grid-row-1">
            <FormField
              label={clientNameConfig.label}
              type={clientNameConfig.type || "select"}
              name={clientNameConfig.name}
              value={formData[clientNameConfig.name] || ""}
              onChange={handleClientNameChange}
              required={Boolean(clientNameConfig.required)}
              options={clientNameConfig.options || []}
              placeholder={clientNameConfig.placeholder || "Select Client Name"}
              error={validationErrors[clientNameConfig.name]}
              formData={formData}
              disabled={disabled || Boolean(clientNameConfig.disabled)}
            />
          </div>
          <div className="grid-cell grid-col-2 grid-row-1">
            <FormField
              label={clientIdConfig.label}
              type={clientIdConfig.type || "text"}
              name={clientIdConfig.name}
              value={formData[clientIdConfig.name] || ""}
              onChange={onChange}
              required={Boolean(clientIdConfig.required)}
              placeholder={clientIdConfig.placeholder || "Auto Selected"}
              error={validationErrors[clientIdConfig.name]}
              formData={formData}
              disabled
            />
          </div>
          <div className="grid-cell grid-col-3 grid-row-1">
            <FormField
              label={contactPersonNameConfig.label}
              type={contactPersonNameConfig.type || "text"}
              name={contactPersonNameConfig.name}
              value={formData[contactPersonNameConfig.name] || ""}
              onChange={onChange}
              required={Boolean(contactPersonNameConfig.required)}
              validate={contactPersonNameConfig.validate}
              placeholder={contactPersonNameConfig.placeholder || "Enter Contact Person Name"}
              error={validationErrors[contactPersonNameConfig.name]}
              formData={formData}
              disabled={disabled || Boolean(contactPersonNameConfig.disabled)}
            />
          </div>
          <div className="grid-cell grid-col-1 grid-row-2">
            <FormField
              label={contactPersonEmailConfig.label}
              type={contactPersonEmailConfig.type || "email"}
              name={contactPersonEmailConfig.name}
              value={formData[contactPersonEmailConfig.name] || ""}
              onChange={onChange}
              required={Boolean(contactPersonEmailConfig.required)}
              validate={contactPersonEmailConfig.validate}
              placeholder={contactPersonEmailConfig.placeholder || "Enter Contact Person Email"}
              error={validationErrors[contactPersonEmailConfig.name]}
              formData={formData}
              disabled={disabled || Boolean(contactPersonEmailConfig.disabled)}
            />
          </div>
          <div className="grid-cell grid-col-2 grid-row-2">
            <FormField
              label={priorityConfig.label}
              type={priorityConfig.type || "select"}
              name={priorityConfig.name}
              value={formData[priorityConfig.name] || ""}
              onChange={onChange}
              required={Boolean(priorityConfig.required)}
              options={priorityConfig.options || []}
              placeholder={priorityConfig.placeholder || "Select Priority"}
              error={validationErrors[priorityConfig.name]}
              formData={formData}
              disabled={disabled || Boolean(priorityConfig.disabled)}
            />
          </div>
          {hiringTypeConfig ? (
            <div className="grid-cell grid-col-3 grid-row-1">
              <FormField
                label={hiringTypeConfig.label}
                type={hiringTypeConfig.type || "select"}
                name={hiringTypeConfig.name}
                value={formData[hiringTypeConfig.name] || ""}
                onChange={onChange}
                required={Boolean(hiringTypeConfig.required)}
                options={hiringTypeConfig.options || []}
                placeholder={hiringTypeConfig.placeholder || "Select"}
                error={validationErrors[hiringTypeConfig.name]}
                formData={formData}
                disabled={disabled || Boolean(hiringTypeConfig.disabled)}
              />
            </div>
          ) : null}
        </div>
      </div>

      <div className="permission-grid">
        <section className="permission-panel">
          <div className="permission-header">
            <h3 className="permission-title">Job Activation</h3>
            <p className="permission-subtitle">
              Status &amp; Duration of the Job to be active
            </p>
          </div>
          <div className="permission-date-grid">
            <label className="permission-field">
              <span>Validity Upto *</span>
              <input
                id="jobActivationDate"
                type="date"
                className="permission-input"
                value={formData.jobActivationDate || ""}
                onChange={(event) => onChange("jobActivationDate", event.target.value)}
                required
                disabled={disabled}
              />
              {validationErrors.jobActivationDate ? (
                <span className="permission-error">{validationErrors.jobActivationDate}</span>
              ) : null}
            </label>
            <label className="permission-field">
              <span>Target *</span>
              <input
                id="targetDate"
                type="date"
                className="permission-input"
                value={formData.targetDate || ""}
                onChange={(event) => onChange("targetDate", event.target.value)}
                min={formData.jobReceivedDate || undefined}
                max={formData.jobActivationDate || undefined}
                required
                disabled={disabled}
              />
              {validationErrors.targetDate ? (
                <span className="permission-error">{validationErrors.targetDate}</span>
              ) : null}
            </label>
          </div>
        </section>

        <section className="permission-panel">
          <div className="permission-header">
            <h3 className="permission-title">Preferred Location</h3>
            <p className="permission-subtitle">Candidate Location</p>
          </div>
          <div className="permission-options inline">
            {FOCUS_LOCATION_OPTIONS.map((option) => (
              <label key={option.value} className="permission-option">
                <input
                  type="radio"
                  name="focusLocationType"
                  value={option.value}
                  checked={focusLocationType === option.value}
                  onChange={() => handleFocusLocationTypeChange(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
          <FormField
            label="Location"
            type="multiselect"
            name="focusLocationValue"
            value={Array.isArray(formData.focusLocationValue) ? formData.focusLocationValue : (formData.focusLocationValue ? [formData.focusLocationValue] : [])}
            onChange={onChange}
            required={false}
            options={FOCUS_LOCATION_VALUE_OPTIONS}
            placeholder="Select locations"
            formData={formData}
            disabled={disabled}
            hideLabel
          />
        </section>

        <section className="permission-panel permission-panel--availability">
          <div className="permission-header">
            <h3 className="permission-title">Availability</h3>
            <p className="permission-subtitle">
              Candidate availability for the Job
            </p>
          </div>
          <div className="permission-options inline">
            {AVAILABILITY_OPTIONS.map((option) => (
              <label key={option.value} className="permission-option">
                <input
                  type="radio"
                  name="availabilityOptions"
                  value={option.value}
                  checked={availabilitySelection === option.value}
                  onChange={() => handleAvailabilityChange(option.value)}
                  disabled={disabled}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="permission-panel permission-panel--hiring-process">
          <div className="permission-header">
            <h3 className="permission-title">Hiring Process</h3>
            <p className="permission-subtitle">Configure the hiring flow including interview stages</p>
          </div>

          <div className="permission-options inline">
            <div className="hiring-process-toolbar">
              <button
                type="button"
                className="hiring-process-add-btn"
                onClick={() => openStagePopup("interview")}
                aria-label="Add interview stages"
              >
                +
              </button>
              <span className="hiring-process-count-text">
                {formData.interviewCount ? `${formData.interviewCount} interview stages configured` : "No interview stages configured"}
              </span>
            </div>
            <div className="hiring-process-toolbar">
              <button
                type="button"
                className="hiring-process-add-btn"
                onClick={() => openStagePopup("clientInterview")}
                aria-label="Add client interview stages"
              >
                +
              </button>
              <span className="hiring-process-count-text">
                {formData.clientInterviewCount
                  ? `${formData.clientInterviewCount} client interview stages configured`
                  : "No client interview stages configured"}
              </span>
            </div>
            <label className="permission-option">
              <input
                type="checkbox"
                checked={finalStages.includes("hr-interview")}
                onChange={() => toggleFinalStage("hr-interview")}
              />
              <span>HR Interview</span>
            </label>
            <label className="permission-option">
              <input
                type="checkbox"
                checked={finalStages.includes("preboarding")}
                onChange={() => toggleFinalStage("preboarding")}
              />
              <span>Preboarding</span>
            </label>
          </div>

          <div className="hiring-flow-widget" aria-label="Hiring process flow">
            <div className="hiring-flow-header">Hiring Flow</div>
            <div className="hiring-flow-track">
              {hiringProcessFlow.map((stage, index) => (
                <div key={`${stage.key}-${index}`} className="hiring-flow-stage">
                  {stage.isEditable ? (
                    <input
                      type="text"
                      className="hiring-flow-stage-input"
                      value={stage.label}
                      onChange={(event) => handleInterviewStageNameChange(stage.key, event.target.value)}
                      placeholder={getInterviewStageLabel(stage.key)}
                      disabled={disabled}
                      aria-label={`Rename ${getInterviewStageLabel(stage.key)}`}
                      maxLength={40}
                    />
                  ) : (
                    <span className="hiring-flow-stage-title">{stage.label}</span>
                  )}
                  {stage.meta ? <span className="hiring-flow-stage-meta">{stage.meta}</span> : null}
                </div>
              ))}
            </div>
          </div>

          {isInterviewPopupOpen ? (
            <div className="hiring-process-popup-backdrop" role="dialog" aria-modal="true">
              <div className="hiring-process-popup">
                <h4 className="hiring-process-popup-title">
                  {stagePopupMode === "clientInterview" ? "Set Client Interview Stages" : "Set Interview Stages"}
                </h4>
                <label className="hiring-process-popup-label" htmlFor="interview-count-input">
                  Number of {stagePopupMode === "clientInterview" ? "Client Interviews" : "Interviews"}
                </label>
                <input
                  id="interview-count-input"
                  type="number"
                  min="0"
                  max="20"
                  className="hiring-process-popup-input"
                  value={interviewCountInput}
                  onChange={(event) => setInterviewCountInput(event.target.value)}
                  placeholder="Enter count (e.g. 2)"
                />
                <div className="hiring-process-popup-actions">
                  <button
                    type="button"
                    className="hiring-process-popup-btn secondary"
                    onClick={() => setInterviewPopupOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="hiring-process-popup-btn primary"
                    onClick={generateInterviewStages}
                  >
                    Generate
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
};

export default PermissionStep;
