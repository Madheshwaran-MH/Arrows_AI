import { FiTrash2 } from 'react-icons/fi';
import { useEffect, useRef, useState } from 'react';
import { validateMandatoryField } from '../../utils/formValidation';
import './FormField.css';

const FormField = ({
  label,
  type,
  name,
  value,
  onChange,
  required,
  options,
  validate,
  error,
  onValidation,
  placeholder,
  hideLabel,
  accept,
  multiple,
  prefix,
  suffix,
  formData,
  disabled,
  showBrowseButton,
  allowDecimal,
  suppressError,
  maxLength,
  rows
}) => {
  const [isValidating, setIsValidating] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customOption, setCustomOption] = useState('');
  const [customOptions, setCustomOptions] = useState([]);
  const [localError, setLocalError] = useState('');
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);
  const safeOptions = Array.isArray(options) ? options : [];
  const safeLabel = typeof label === 'string' ? label : '';
  const cleanedLabel = safeLabel.replace('*', '').trim();
  const normalizedSelectOptions = safeOptions
    .map((option, index) => {
      if (option && typeof option === 'object') {
        const optionValue = Object.prototype.hasOwnProperty.call(option, 'value') ? option.value : '';
        const optionLabel = Object.prototype.hasOwnProperty.call(option, 'label')
          ? option.label
          : optionValue;
        return {
          key: String(optionValue ?? `option-${index}`),
          value: optionValue,
          label: String(optionLabel ?? ''),
        };
      }

      return {
        key: String(option ?? `option-${index}`),
        value: option,
        label: String(option ?? ''),
      };
    })
    .filter((option) => option.label !== '');

  useEffect(() => {
    if (error) {
      setLocalError(error);
    } else {
      setLocalError('');
    }
  }, [error, name]);

  const handleValidationResult = (result) => {
    if (result && typeof result === 'object') {
      if (result.isValid) {
        setLocalError('');
      } else {
        setLocalError(result.message);
      }

      if (onValidation) {
        onValidation(name, result);
      }
    } else {
      setLocalError('Validation failed');
      if (onValidation) {
        onValidation(name, { isValid: false, message: 'Validation failed' });
      }
    }
  };

  const triggerFieldValidation = (newValue) => {
    const shouldValidate = validate || required || error || localError;
    if (!shouldValidate) return;

    if (validate) {
      setIsValidating(true);
      const currentFormData = formData || {};
      const updatedFormData = { ...currentFormData, [name]: newValue };
      Promise.resolve(validate(newValue, name, updatedFormData))
        .then(handleValidationResult)
        .catch(handleValidationResult)
        .finally(() => setIsValidating(false));
      return;
    }

    setIsValidating(true);
    const fieldLabel = cleanedLabel || name;
    validateMandatoryField(newValue, name, fieldLabel)
      .then(handleValidationResult)
      .catch(handleValidationResult)
      .finally(() => setIsValidating(false));
  };

  const handleChange = (e) => {
    let newValue = type === 'file'
      ? (e.target.multiple ? Array.from(e.target.files) : e.target.files[0])
      : e.target.value;

    if (type === 'number' && typeof newValue === 'string') {
      const sanitized = allowDecimal
        ? newValue
          .replace(/[^\d.]/g, '')
          .replace(/(\..*)\./g, '$1')
        : newValue.replace(/[^\d]/g, '');
      newValue = sanitized;
      if (sanitized !== e.target.value) {
        e.target.value = sanitized;
      }
    }

    onChange(name, newValue);
    triggerFieldValidation(newValue);
  };

  const resolvedInputType = type === 'number' ? 'text' : type;

  const handleNumberKeyDown = (event) => {
    if (type !== 'number') return;
    if (['e', 'E', '+', '-'].includes(event.key)) {
      event.preventDefault();
    }
    if (event.key === '.') {
      if (!allowDecimal) {
        event.preventDefault();
        return;
      }
      const currentValue = String(event.currentTarget?.value || '');
      if (currentValue.includes('.')) {
        event.preventDefault();
      }
    }
  };

  const handleMultiSelectChange = (selectedValues) => {
    onChange(name, selectedValues);

    if (validate) {
      setIsValidating(true);
      const currentFormData = formData || {};
      const updatedFormData = { ...currentFormData, [name]: selectedValues };
      Promise.resolve(validate(selectedValues, name, updatedFormData))
        .then(handleValidationResult)
        .catch(handleValidationResult)
        .finally(() => setIsValidating(false));
    } else if (required || error || localError) {
      setIsValidating(true);
      const fieldLabel = cleanedLabel || name;
      validateMandatoryField(selectedValues, name, fieldLabel)
        .then(handleValidationResult)
        .catch(handleValidationResult)
        .finally(() => setIsValidating(false));
    }
  };

  const removeMultiSelectItem = (itemToRemove) => {
    const newValue = value.filter((item) => item !== itemToRemove);
    setCustomOptions((prev) => prev.filter((item) => item.value !== itemToRemove));
    handleMultiSelectChange(newValue);
  };

  const removeCustomOption = (optionValue) => {
    setCustomOptions((prev) => prev.filter((item) => item.value !== optionValue));
    if (Array.isArray(value) && value.includes(optionValue)) {
      handleMultiSelectChange(value.filter((item) => item !== optionValue));
    }
  };

  const toggleMultiSelectItem = (optionValue) => {
    const selectedValues = Array.isArray(value) ? value : [];
    if (selectedValues.includes(optionValue)) {
      handleMultiSelectChange(selectedValues.filter((item) => item !== optionValue));
    } else {
      handleMultiSelectChange([...selectedValues, optionValue]);
    }
  };

  const handleAddCustomOption = () => {
    const trimmed = customOption.trim();
    if (!trimmed) return;

    const baseOptions = Array.isArray(options) ? options : [];
    const exists = [...baseOptions, ...customOptions].some(
      (opt) => String(opt.value).toLowerCase() === trimmed.toLowerCase()
    );

    const newOption = { value: trimmed, label: trimmed };
    if (!exists) {
      setCustomOptions((prev) => [...prev, newOption]);
    }
    if (!Array.isArray(value) || !value.includes(newOption.value)) {
      handleMultiSelectChange([...(Array.isArray(value) ? value : []), newOption.value]);
    }
    setCustomOption('');
  };

  const handleBlur = async () => {
    if (isValidating) return;

    setIsValidating(true);
    try {
      if (validate) {
        const currentFormData = formData || {};
        const updatedFormData = { ...currentFormData, [name]: value };
        const validationResult = await validate(value, name, updatedFormData);
        handleValidationResult(validationResult);
      } else if (required) {
        const fieldLabel = cleanedLabel || name;
        const validationResult = await validateMandatoryField(value, name, fieldLabel);
        handleValidationResult(validationResult);
      }
    } catch (err) {
      handleValidationResult(err);
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    if (!isDropdownOpen) {
      setSearchTerm('');
      return;
    }

    const handleOutsideClick = (event) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    if (type !== 'multiselect' || !Array.isArray(value) || value.length === 0) {
      return;
    }

    const baseOptionValues = new Set(
      safeOptions.map((option) =>
        option && typeof option === 'object' ? String(option.value) : String(option)
      )
    );

    const customValuesToAdd = value
      .filter((selectedValue) => !baseOptionValues.has(String(selectedValue)))
      .filter(
        (selectedValue) =>
          !customOptions.some((option) => String(option.value) === String(selectedValue))
      )
      .map((selectedValue) => ({
        value: selectedValue,
        label: String(selectedValue),
      }));

    if (customValuesToAdd.length > 0) {
      setCustomOptions((prev) => [...prev, ...customValuesToAdd]);
    }
  }, [customOptions, safeOptions, type, value]);

  const searchPlaceholder = safeLabel.toLowerCase().includes('skill')
    ? 'Search skills'
    : 'Search';

  const selectionPlaceholder = safeLabel.toLowerCase().includes('skill')
    ? 'Select skills'
    : 'Select options';
  const hasOpenDropdown = isDropdownOpen && (type === 'select' || type === 'multiselect');

  const baseOptions = safeOptions;
  const mergedOptions = [...baseOptions, ...customOptions].filter(
    (option, index, self) =>
      self.findIndex((item) => item.value === option.value) === index
  );
  const customOptionValues = new Set(customOptions.map((option) => String(option.value)));
  const filteredOptions = mergedOptions.filter((option) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return String(option.label || option.value).toLowerCase().includes(term);
  });

  const hasValue =
    value !== null &&
    value !== undefined &&
    (typeof value !== 'string' || value.trim() !== '') &&
    (!Array.isArray(value) || value.length > 0);
  const resolvedError = localError || error || '';
  const displayError =
    hasValue && typeof resolvedError === 'string' && resolvedError.toLowerCase().includes('required')
      ? ''
      : resolvedError;

  return (
    <div className={`form-field${name ? ` field-${name}` : ''}${hasOpenDropdown ? ' dropdown-open' : ''}`}>
      <label htmlFor={name} className={hideLabel ? 'label-hidden' : undefined}>
        {safeLabel.includes('*') ? (
          <>
            {cleanedLabel}
            <span className="required-star">*</span>
          </>
        ) : (
          safeLabel
        )}
      </label>

      {type === 'multiselect' ? (
        <div className={`multiselect-container${isDropdownOpen ? ' open' : ''}`} ref={dropdownRef}>
          <div
            id={name}
            className={`selected-items${isDropdownOpen ? ' open' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsDropdownOpen((prev) => !prev);
              }
            }}
          >
            {Array.isArray(value) && value.length > 0 ? (
              value.map((selectedValue) => {
                const option = mergedOptions.find((opt) => opt.value === selectedValue);
                return (
                  <span key={selectedValue} className="selected-item">
                    {option?.label || selectedValue}
                    <button
                      type="button"
                      className="remove-item"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeMultiSelectItem(selectedValue);
                      }}
                      aria-label={`Remove ${option?.label || selectedValue}`}
                    >
                      x
                    </button>
                  </span>
                );
              })
            ) : (
              <span className="selected-placeholder">{selectionPlaceholder}</span>
            )}
            <span className={`multiselect-chevron${isDropdownOpen ? ' open' : ''}`} aria-hidden="true" />
          </div>

          {isDropdownOpen && (
            <div className="multiselect-dropdown">
              <input
                type="text"
                className="multiselect-search"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <div className="multiselect-options">
                {filteredOptions.length === 0 && (
                  <div className="multiselect-empty">No results found</div>
                )}
                {filteredOptions.map((option) => {
                  const isCustomOption = customOptionValues.has(String(option.value));
                  return (
                    <div key={option.value} className="multiselect-option-row">
                      <label className="multiselect-option">
                        <input
                          type="checkbox"
                          checked={Array.isArray(value) && value.includes(option.value)}
                          onChange={() => toggleMultiSelectItem(option.value)}
                        />
                        <span>{option.label}</span>
                      </label>
                      {isCustomOption && (
                        <button
                          type="button"
                          className="multiselect-option-delete"
                          onClick={() => removeCustomOption(option.value)}
                          aria-label={`Delete ${option.label}`}
                        >
                          <FiTrash2 size={14} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="multiselect-add">
                <input
                  type="text"
                  value={customOption}
                  placeholder="Add more"
                  onChange={(e) => setCustomOption(e.target.value)}
                />
                <button type="button" onClick={handleAddCustomOption}>Add</button>
              </div>
            </div>
          )}
        </div>
      ) : type === 'select' ? (
        <div className={`select-field${isDropdownOpen ? ' open' : ''}`} ref={dropdownRef}>
          <button
            type="button"
            id={name}
            className={`select-trigger${displayError ? ' error' : ''}`}
            onClick={() => !disabled && setIsDropdownOpen((prev) => !prev)}
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={isDropdownOpen}
          >
            <span className="select-value">
              {normalizedSelectOptions.find((opt) => String(opt.value) === String(value))?.label || placeholder || 'Select...'}
            </span>
            <span className="select-chevron" aria-hidden="true" />
          </button>
          {isDropdownOpen && (
            <div className="select-dropdown" role="listbox">
              {normalizedSelectOptions.length === 0 ? (
                <div className="select-empty">No options available</div>
              ) : (
                normalizedSelectOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    className={`select-option${String(option.value) === String(value) ? ' selected' : ''}`}
                    onClick={() => {
                      onChange(name, option.value);
                      triggerFieldValidation(option.value);
                      setIsDropdownOpen(false);
                    }}
                    role="option"
                    aria-selected={String(option.value) === String(value)}
                  >
                    {option.label}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      ) : type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          required={required}
          className={displayError ? 'error' : ''}
          placeholder={placeholder}
          rows={rows || 4}
          maxLength={maxLength}
          disabled={disabled}
        />
      ) : (
        (() => {
          if (type === 'file') {
            const fileName = Array.isArray(value)
              ? value.map((f) => (f && f.name) || String(f)).join(', ')
              : (value && value.name) || (typeof value === 'string' ? value : '');

            return (
              <div className={`file-field${displayError ? ' error' : ''}`}>
                <input
                  ref={fileInputRef}
                  type="file"
                  id={name}
                  name={name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required={required}
                  className="file-input-hidden"
                  style={{ display: 'none' }}
                  accept={accept}
                  multiple={multiple}
                  aria-label={label}
                  disabled={disabled}
                />
                <div className={`file-input-display${showBrowseButton ? ' with-button' : ' no-button'}`}>
                  <span className="file-icon upload-icon" aria-hidden="true">^</span>
                  {showBrowseButton && (
                    <button
                      type="button"
                      className="file-browse-btn"
                      onClick={() => {
                        if (!disabled && fileInputRef.current) {
                          fileInputRef.current.click();
                        }
                      }}
                      disabled={disabled}
                    >
                      Browse
                    </button>
                  )}
                  <input
                    type="text"
                    readOnly
                    value={fileName || ''}
                    placeholder={placeholder || 'No file chosen'}
                    className={`file-visual-input${displayError ? ' error' : ''}`}
                    onClick={() => {
                      if (!disabled && fileInputRef.current) {
                        fileInputRef.current.click();
                      }
                    }}
                    disabled={disabled}
                  />
                </div>
              </div>
            );
          }

          const inputElement = (
            <input
              type={resolvedInputType}
              id={name}
              name={name}
              value={type === 'file' ? undefined : value}
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyDown={handleNumberKeyDown}
              onPaste={(event) => {
                if (type !== 'number') return;
                const pastedText = event.clipboardData?.getData('text') || '';
                if (/[^\d]/.test(pastedText)) {
                  event.preventDefault();
                  const digitsOnly = pastedText.replace(/[^\d]/g, '');
                  if (digitsOnly) {
                    const nextValue = `${event.currentTarget.value || ''}${digitsOnly}`;
                    onChange(name, nextValue);
                    triggerFieldValidation(nextValue);
                  }
                }
              }}
              required={required}
              min={type === 'number' ? '0' : undefined}
              inputMode={type === 'number' ? 'numeric' : undefined}
              pattern={type === 'number' ? '[0-9]*' : undefined}
              className={displayError ? 'error' : ''}
              placeholder={placeholder}
              maxLength={maxLength}
              accept={accept}
              multiple={type === 'file' ? multiple : undefined}
              disabled={disabled}
            />
          );

          if (!prefix) {
            return (
              <>
                {inputElement}
                {type === 'file' && value && (
                  Array.isArray(value) ? (
                    <div className="selected-files">
                      {value.map((f, idx) => (
                        <div key={idx} className="selected-file">{(f && f.name) || String(f)}</div>
                      ))}
                    </div>
                  ) : (
                    <div className="selected-files">
                      <div className="selected-file">{(value && value.name) || String(value)}</div>
                    </div>
                  )
                )}
              </>
            );
          }

          return (
            <div className={`field-control has-prefix${suffix ? ' has-suffix' : ''}${displayError ? ' error' : ''}`}>
              <span className="field-prefix">{prefix}</span>
              {inputElement}
              {suffix && <span className="field-suffix">{suffix}</span>}
              {type === 'file' && value && (
                Array.isArray(value) ? (
                  <div className="selected-files">
                    {value.map((f, idx) => (
                      <div key={idx} className="selected-file">{(f && f.name) || String(f)}</div>
                    ))}
                  </div>
                ) : (
                  <div className="selected-files">
                    <div className="selected-file">{(value && value.name) || String(value)}</div>
                  </div>
                )
              )}
            </div>
          );
        })()
      )}

      {isValidating && <span className="validation-loading">Validating...</span>}
      {!suppressError && displayError && (
        <>
          <span className="error-message">{displayError}</span>
        </>
      )}
    </div>
  );
};

export default FormField;
