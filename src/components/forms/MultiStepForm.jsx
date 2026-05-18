import React, { useState, useMemo, useCallback } from 'react';
import { FiCheck } from 'react-icons/fi';
import './MultiStepForm.css';

const MultiStepForm = ({
  steps,
  onSubmit,
  validationErrors = {},
  onValidateStep,
  onFieldChange,
  showDraftAction = false,
  draftLabel = "Save as Draft",
  onSaveDraft,
  submitLabel = "Submit",
  showCancelAction = false,
  cancelLabel = "Cancel",
  onCancel,
  hideStepper = false,
  initialData = null,
  readOnly = false
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(() => initialData || {});
  const [stepFields, setStepFields] = useState({});

  React.useEffect(() => {
    setCurrentStep(0);
    setFormData(initialData || {});
    setStepFields({});
  }, [initialData]);

  const normalizeLabel = (label, fallback) => {
    if (!label) return fallback;
    return label.replace('*', '').trim() || fallback;
  };

  const toUniqueList = (items = []) => [...new Set(items.filter(Boolean))];

  const buildWarningMessage = (missing = [], invalid = []) => {
    const lines = ['Please complete the required fields before continuing.'];
    if (missing.length) {
      lines.push('', `Missing: ${toUniqueList(missing).join(', ')}`);
    }
    if (invalid.length) {
      lines.push('', `Invalid: ${toUniqueList(invalid).join(', ')}`);
    }
    return lines.join('\n');
  };

  const getStepIssues = (stepIndex) => {
    const currentStepFields = stepFields[stepIndex] || steps[stepIndex]?.fields || [];

    if (currentStepFields.length === 0) {
      return { missing: [], invalid: [], missingNames: [], invalidNames: [] };
    }

    return currentStepFields.reduce(
      (acc, field) => {
        const fieldName = typeof field === 'string' ? field : field.name;
        const fieldLabel = normalizeLabel(
          typeof field === 'string' ? field : field.label,
          fieldName
        );
        const isRequired = typeof field === 'string' ? true : field.required;
        const value = formData[fieldName];
        const hasError = validationErrors[fieldName];

        const hasValue =
          value !== undefined &&
          value !== null &&
          value !== '' &&
          (Array.isArray(value) ? value.length > 0 : true);

        if (isRequired && !hasValue) {
          acc.missing.push(fieldLabel);
          acc.missingNames.push(fieldName);
        } else if (hasError) {
          acc.invalid.push(fieldLabel);
          acc.invalidNames.push(fieldName);
        }

        return acc;
      },
      { missing: [], invalid: [], missingNames: [], invalidNames: [] }
    );
  };

  const focusOnFirstIssue = (issues) => {
    if (!issues) return;
    const firstFieldName = issues.missingNames?.[0] || issues.invalidNames?.[0];
    if (firstFieldName) {
      setTimeout(() => {
        const element = document.getElementById(firstFieldName);
        if (element) {
          element.focus();
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  const showStepWarning = (issues) => {
    if (!issues) return;
    focusOnFirstIssue(issues);
  };

  const validateCurrentStep = (stepIndex) => {
    if (steps[stepIndex]?.skipValidation) {
      return true;
    }
    const issues = getStepIssues(stepIndex);
    return issues.missing.length === 0 && issues.invalid.length === 0;
  };

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      let isStepValid = true;
      let stepIssues = null;

      // Trigger validation for the current step fields
      if (onValidateStep && !steps[currentStep]?.skipValidation) {
        try {
          stepIssues = await Promise.resolve(onValidateStep(currentStep, formData));
        } catch (validationError) {
          stepIssues = {
            isValid: false,
            missingFields: [],
            invalidFields: ['Please review this step'],
            missingNames: [],
            invalidNames: []
          };
        }
      }

      if (stepIssues && typeof stepIssues.isValid === 'boolean') {
        isStepValid = stepIssues.isValid;
      } else {
        stepIssues = getStepIssues(currentStep);
        isStepValid = stepIssues.missing.length === 0 && stepIssues.invalid.length === 0;
      }

      // Check if current step is valid before proceeding
      if (isStepValid) {
        setCurrentStep(currentStep + 1);
      } else {
        if (!(stepIssues?.missingFields?.length || stepIssues?.invalidFields?.length)) {
          showStepWarning(stepIssues);
        }
        focusOnFirstIssue(stepIssues);
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleChange = useCallback((field, value) => {
    setFormData(prev => {
      const nextFormData = { ...prev, [field]: value };
      void onFieldChange?.(field, value, nextFormData);
      return nextFormData;
    });
  }, [onFieldChange]);

  const handleBulkChange = useCallback((updates) => {
    if (!updates || typeof updates !== 'object') {
      return;
    }

    setFormData(prev => {
      const nextFormData = { ...prev, ...updates };
      Object.entries(updates).forEach(([field, value]) => {
        void onFieldChange?.(field, value, nextFormData);
      });
      return nextFormData;
    });
  }, [onFieldChange]);

  const handleSetStepFields = useCallback((fields) => {
    setStepFields(prev => ({
      ...prev,
      [currentStep]: fields
    }));
  }, [currentStep]);

  const handleSubmit = (e) => {
    void (async () => {
      if (e) {
        e.preventDefault();
      }
      if (currentStep < steps.length - 1) {
        await handleNext();
        return;
      }

      let isStepValid = true;
      let stepIssues = null;

      if (onValidateStep && !steps[currentStep]?.skipValidation) {
        try {
          stepIssues = await Promise.resolve(onValidateStep(currentStep, formData));
        } catch (validationError) {
          stepIssues = {
            isValid: false,
            missingFields: [],
            invalidFields: ['Please review this step']
          };
          console.error('[MultiStepForm] Submit validation failed:', validationError);
        }
      }

      if (stepIssues && typeof stepIssues.isValid === 'boolean') {
        isStepValid = stepIssues.isValid;
      } else {
        isStepValid = validateCurrentStep(currentStep);
      }

      // Check if current step is valid before submitting
      if (isStepValid) {
        onSubmit(formData);
      } else if (!(stepIssues?.missingFields?.length || stepIssues?.invalidFields?.length)) {
        showStepWarning(stepIssues);
      }
    })();
  };

  const CurrentStepComponent = steps[currentStep].component;

  const getStepState = (index) => {
    if (index < currentStep) return 'complete';
    if (index === currentStep) return 'active';
    return 'upcoming';
  };

  const handleSaveDraft = () => {
    if (onSaveDraft) {
      onSaveDraft(formData);
    }
  };

  const handleCancel = () => {
    onCancel?.(formData);
  };


  return (
    <div className="multi-step-form">
      {!hideStepper && (
        <div className="step-indicator">
          {steps.map((step, index) => {
            const state = getStepState(index);
            return (
              <div
                key={index}
                className={`step ${state}`}
                aria-current={state === 'active' ? 'step' : undefined}
              >
                <span className="step-circle" aria-hidden="true">
                  {state === 'complete' ? (
                    <FiCheck className="step-check" aria-hidden="true" />
                  ) : (
                    <span className="step-dot" />
                  )}
                </span>
                <span className="step-label">{step.title || `Step ${index + 1}`}</span>
              </div>
            );
          })}
        </div>
      )}
      <div className="multi-step-form-body">
        <div className="form-step-scroll">
          <CurrentStepComponent
            formData={formData}
            onChange={handleChange}
            onBulkChange={handleBulkChange}
            onSetStepFields={handleSetStepFields}
            {...(steps[currentStep].componentProps || {})}
          />
        </div>
        <div className="form-buttons">
          {showDraftAction && (
            <button
              type="button"
              className="form-btn secondary"
              onClick={handleSaveDraft}
            >
              {draftLabel}
            </button>
          )}
          <div className="form-buttons-right">
            {currentStep > 0 && (
              <button
                type="button"
                className="form-btn secondary"
                onClick={handlePrev}
                disabled={readOnly}
              >
                Previous
              </button>
            )}
            {showCancelAction && (
              <button
                type="button"
                className="form-btn secondary"
                onClick={handleCancel}
                disabled={readOnly}
              >
                {cancelLabel}
              </button>
            )}
            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                className="form-btn primary"
                onClick={handleNext}
                disabled={readOnly}
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                className="form-btn primary"
                onClick={handleSubmit}
                disabled={readOnly}
              >
                {submitLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiStepForm;
