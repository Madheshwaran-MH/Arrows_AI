import { useState } from 'react';
import FormField from './FormField';
import './Step1.css';

const Step1 = ({ formData, onChange }) => {
  const [validationErrors, setValidationErrors] = useState({});

  // Simulate AJAX validation for experience fields
  const validateExperience = async (value, fieldName, formDataParam) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // For empty required fields
        if (!value && value !== 0) {
          reject({ isValid: false, message: 'This field is required' });
          return;
        }

        const numValue = parseFloat(value);
        
        if (isNaN(numValue)) {
          reject({ isValid: false, message: 'Please enter a valid number' });
          return;
        }
        
        if (numValue < 0) {
          reject({ isValid: false, message: 'Experience cannot be negative' });
          return;
        }
        
        if (numValue > 50) {
          reject({ isValid: false, message: 'Experience cannot exceed 50 years' });
          return;
        }
        
        // Get current form data - use formDataParam passed from FormField, fallback to component formData
        const currentFormData = formDataParam || { ...formData, [fieldName]: value };
        const minExp = parseFloat(currentFormData.minExperience || 0);
        const maxExp = parseFloat(currentFormData.maxExperience || 0);
        
        console.log(`[Step1.validateExperience] fieldName: ${fieldName}, value: ${value}, minExp: ${minExp}, maxExp: ${maxExp}, currentFormData:`, currentFormData);
        
        // Check if both min and max are defined (not empty)
        const minDefined = currentFormData.minExperience !== undefined && currentFormData.minExperience !== '' && currentFormData.minExperience !== null;
        const maxDefined = currentFormData.maxExperience !== undefined && currentFormData.maxExperience !== '' && currentFormData.maxExperience !== null;
        
        console.log(`[Step1.validateExperience] minDefined: ${minDefined}, maxDefined: ${maxDefined}`);
        
        if (minDefined && maxDefined && minExp > maxExp) {
          console.log(`[Step1.validateExperience] ❌ Min > Max error`);
          reject({ isValid: false, message: 'Min experience cannot be greater than max experience' });
          return;
        }
        
        console.log(`[Step1.validateExperience] ✅ Valid`);
        resolve({ isValid: true });
      }, 500); // Reduced delay for better UX
    });
  };

  const handleValidation = (fieldName, result) => {
    setValidationErrors(prev => ({
      ...prev,
      [fieldName]: result.isValid ? null : result.message
    }));
    
    // When either min or max changes, also validate the other field to show cross-field errors
    if (fieldName === 'minExperience' || fieldName === 'maxExperience') {
      const otherField = fieldName === 'minExperience' ? 'maxExperience' : 'minExperience';
      const otherValue = formData[otherField];
      
      // If other field has a value, validate it too to update cross-field error
      if (otherValue !== undefined && otherValue !== '') {
        validateExperience(otherValue, otherField)
          .then(() => {
            setValidationErrors(prev => ({
              ...prev,
              [otherField]: null
            }));
          })
          .catch(err => {
            setValidationErrors(prev => ({
              ...prev,
              [otherField]: err.message
            }));
          });
      }
    }
  };

  return (
    <div>
      <h3>Personal Information</h3>
      <FormField
        label="First Name"
        type="text"
        name="firstName"
        value={formData.firstName || ''}
        onChange={onChange}
        required
      />
      <FormField
        label="Last Name"
        type="text"
        name="lastName"
        value={formData.lastName || ''}
        onChange={onChange}
        required
      />
      <FormField
        label="Email"
        type="email"
        name="email"
        value={formData.email || ''}
        onChange={onChange}
        required
      />
      <div className="experience-row">
        <FormField
          label="Min Experience (years)"
          type="number"
          name="minExperience"
          value={formData.minExperience || ''}
          onChange={onChange}
          required
          validate={validateExperience}
          error={validationErrors.minExperience}
          onValidation={handleValidation}
          formData={formData}
        />
        <FormField
          label="Max Experience (years)"
          type="number"
          name="maxExperience"
          value={formData.maxExperience || ''}
          onChange={onChange}
          required
          validate={validateExperience}
          error={validationErrors.maxExperience}
          onValidation={handleValidation}
          formData={formData}
        />
      </div>
    </div>
  );
};

export default Step1;