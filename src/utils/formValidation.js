/**
 * Form Validation Utilities
 * Provides AJAX validation for form fields including mandatory field checking
 */

import axios from 'axios';
import { debounce } from './debounce';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Validates a mandatory field (checks if value is provided)
 * @param {*} value - The field value to validate
 * @param {string} fieldName - Name of the field
 * @param {string} fieldLabel - Display label of the field
 * @returns {Promise} - Promise with { isValid, message }
 */
export const validateMandatoryField = async (value, fieldName, fieldLabel = fieldName) => {
  return new Promise((resolve) => {
    // Simulate async behavior for consistency with AJAX pattern
    setTimeout(() => {
      const isEmpty = 
        value === null || 
        value === undefined || 
        (typeof value === 'string' && value.trim() === '') ||
        (Array.isArray(value) && value.length === 0);

      if (isEmpty) {
        resolve({
          isValid: false,
          message: `${fieldLabel} is required`,
          fieldName,
          type: 'mandatory'
        });
      } else {
        resolve({
          isValid: true,
          message: '',
          fieldName,
          type: 'mandatory'
        });
      }
    }, 0); // No delay for instant error clearing on change
  });
};

/**
 * Validates email format
 * @param {string} value - Email to validate
 * @param {string} fieldName - Field name
 * @returns {Promise}
 */
export const validateEmail = async (value, fieldName) => {
  return new Promise((resolve) => {
    if (!value || value.trim() === '') {
      return resolve({
        isValid: false,
        message: 'Email is required',
        fieldName,
        type: 'email'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(value);

    resolve({
      isValid,
      message: isValid ? '' : 'Please enter a valid email address',
      fieldName,
      type: 'email'
    });
  });
};

/**
 * Validates phone number format
 * @param {string} value - Phone number to validate
 * @param {string} fieldName - Field name
 * @returns {Promise}
 */
export const validatePhoneNumber = async (value, fieldName) => {
  return new Promise((resolve) => {
    if (!value || value.trim() === '') {
      return resolve({
        isValid: false,
        message: 'Phone number is required',
        fieldName,
        type: 'phone'
      });
    }

    const phoneRegex = /^[\d\s\-+()]{7,}$/;
    const isValid = phoneRegex.test(value.replace(/\s/g, ''));

    resolve({
      isValid,
      message: isValid ? '' : 'Please enter a valid phone number',
      fieldName,
      type: 'phone'
    });
  });
};

/**
 * Validates minimum length
 * @param {*} value - Value to validate
 * @param {string} fieldName - Field name
 * @param {number} minLength - Minimum length required
 * @returns {Promise}
 */
export const validateMinLength = async (value, fieldName, minLength = 3) => {
  return new Promise((resolve) => {
    if (!value) {
      return resolve({
        isValid: false,
        message: `This field is required`,
        fieldName,
        type: 'minLength'
      });
    }

    const strValue = String(value).trim();
    const isValid = strValue.length >= minLength;

    resolve({
      isValid,
      message: isValid ? '' : `Must be at least ${minLength} characters`,
      fieldName,
      type: 'minLength'
    });
  });
};

/**
 * Validates number range
 * @param {*} value - Number value
 * @param {string} fieldName - Field name
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {Promise}
 */
export const validateNumberRange = async (value, fieldName, min = 0, max = 100) => {
  return new Promise((resolve) => {
    if (value === null || value === undefined || value === '') {
      return resolve({
        isValid: false,
        message: `This field is required`,
        fieldName,
        type: 'range'
      });
    }

    const numValue = Number(value);
    const isValid = !isNaN(numValue) && numValue >= min && numValue <= max;

    resolve({
      isValid,
      message: isValid ? '' : `Must be between ${min} and ${max}`,
      fieldName,
      type: 'range'
    });
  });
};

/**
 * Validates multiple mandatory fields at once
 * Useful for form submission
 * @param {Object} formData - Form data object
 * @param {Array} fields - Array of field configurations with { name, label, required }
 * @returns {Promise<Object>} - { isValid: boolean, errors: Object }
 */
export const validateAllMandatoryFields = async (formData, fields) => {
  const validationPromises = fields
    .filter(field => field.required)
    .map(field => 
      validateMandatoryField(formData[field.name], field.name, field.label)
    );

  const results = await Promise.all(validationPromises);
  
  const errors = {};
  const isValid = results.every(result => {
    if (!result.isValid) {
      errors[result.fieldName] = result.message;
    }
    return result.isValid;
  });

  return {
    isValid,
    errors
  };
};

/**
 * AJAX endpoint validation - checks if value exists on server
 * @param {*} value - Value to validate
 * @param {string} fieldName - Field name
 * @param {string} endpoint - API endpoint to check against
 * @param {string} paramName - Parameter name for API call
 * @returns {Promise}
 */
export const validateAgainstServer = async (value, fieldName, endpoint, paramName = 'value') => {
  if (!value) {
    return {
      isValid: false,
      message: 'This field is required',
      fieldName,
      type: 'server'
    };
  }

  try {
    const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
      params: {
        [paramName]: value
      },
      timeout: 5000
    });

    return {
      isValid: response.data.isValid !== false,
      message: response.data.message || '',
      fieldName,
      type: 'server',
      data: response.data
    };
  } catch (error) {
    console.error(`Validation error for ${fieldName}:`, error);
    return {
      isValid: false,
      message: error.response?.data?.message || 'Validation failed',
      fieldName,
      type: 'server',
      error: error.message
    };
  }
};

/**
 * Creates a debounced validation function
 * Useful for real-time field validation during typing
 * @param {Function} validationFn - The validation function
 * @param {number} delay - Debounce delay in ms (default: 300ms)
 * @returns {Function} - Debounced validation function
 */
export const createDebouncedValidator = (validationFn, delay = 300) => {
  return debounce(validationFn, delay);
};

/**
 * Validates entire form and returns all errors
 * @param {Object} formData - Form data object
 * @param {Object} fieldConfigs - Field configurations from form config
 * @returns {Promise<Object>} - { isValid: boolean, errors: Object }
 */
export const validateForm = async (formData, fieldConfigs) => {
  const errors = {};
  let isValid = true;

  // Validate all required fields
  for (const fieldConfig of fieldConfigs) {
    if (fieldConfig.required) {
      const result = await validateMandatoryField(
        formData[fieldConfig.name],
        fieldConfig.name,
        fieldConfig.label
      );

      if (!result.isValid) {
        errors[fieldConfig.name] = result.message;
        isValid = false;
      }
    }

    // Additional validation based on type
    if (formData[fieldConfig.name] && fieldConfig.type === 'email') {
      const emailResult = await validateEmail(formData[fieldConfig.name], fieldConfig.name);
      if (!emailResult.isValid) {
        errors[fieldConfig.name] = emailResult.message;
        isValid = false;
      }
    }

    if (formData[fieldConfig.name] && fieldConfig.type === 'phone') {
      const phoneResult = await validatePhoneNumber(formData[fieldConfig.name], fieldConfig.name);
      if (!phoneResult.isValid) {
        errors[fieldConfig.name] = phoneResult.message;
        isValid = false;
      }
    }
  }

  return { isValid, errors };
};

/**
 * Formats validation error message for display
 * @param {Object} error - Error object from validation
 * @returns {string} - Formatted error message
 */
export const formatValidationError = (error) => {
  if (!error) return '';
  
  if (typeof error === 'string') {
    return error;
  }

  if (typeof error === 'object' && error.message) {
    return error.message;
  }

  return 'Validation failed';
};

/**
 * Creates validation rules object for form config
 * @param {Object} options - Validation options
 * @returns {Object} - Validation rules for form config
 */
export const createValidationRules = (options = {}) => {
  return {
    email: async (value) => {
      return validateEmail(value, 'email');
    },
    phone: async (value) => {
      return validatePhoneNumber(value, 'phone');
    },
    mandatory: async (value, fieldName) => {
      return validateMandatoryField(value, fieldName);
    },
    minLength: async (value, fieldName) => {
      const minLen = options.minLength || 3;
      return validateMinLength(value, fieldName, minLen);
    },
    numberRange: async (value, fieldName) => {
      return validateNumberRange(
        value,
        fieldName,
        options.min || 0,
        options.max || 100
      );
    },
    ...options.custom
  };
};

export default {
  validateMandatoryField,
  validateEmail,
  validatePhoneNumber,
  validateMinLength,
  validateNumberRange,
  validateAllMandatoryFields,
  validateAgainstServer,
  createDebouncedValidator,
  validateForm,
  formatValidationError,
  createValidationRules
};
