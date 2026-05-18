# AJAX Validation for Mandatory Fields - Implementation Guide

## Overview
This guide explains how to use the new AJAX validation system for mandatory fields in your forms. The validation system provides real-time and submission-time validation with detailed error messages.

## Features

✅ **Mandatory Field Validation** - Check if required fields are filled
✅ **Real-time Validation** - Validate as user types or on blur
✅ **Email Validation** - Validate email format
✅ **Phone Number Validation** - Validate phone numbers
✅ **Custom Validation** - Add your own validation rules
✅ **Server-side Validation** - Validate against backend API
✅ **Debounced Validation** - Prevent excessive validation calls
✅ **Error Messages** - Clear, user-friendly error messages
✅ **Form Submission Prevention** - Block submission if mandatory fields are missing

## Validation Utilities Available

### 1. **validateMandatoryField**
Validates if a mandatory field has a value.

```javascript
import { validateMandatoryField } from '../../utils/formValidation';

const result = await validateMandatoryField(value, 'fieldName', 'Field Label');
// Returns: { isValid: boolean, message: string, fieldName: string, type: 'mandatory' }
```

**Usage Example:**
```javascript
const result = await validateMandatoryField('', 'email', 'Email Address');
// Returns: { isValid: false, message: "Email Address is required", ... }
```

### 2. **validateEmail**
Validates email format.

```javascript
import { validateEmail } from '../../utils/formValidation';

const result = await validateEmail(emailValue, 'email');
// Returns: { isValid: boolean, message: string, fieldName: string, type: 'email' }
```

### 3. **validatePhoneNumber**
Validates phone number format.

```javascript
import { validatePhoneNumber } from '../../utils/formValidation';

const result = await validatePhoneNumber(phoneValue, 'phone');
// Returns: { isValid: boolean, message: string, fieldName: string, type: 'phone' }
```

### 4. **validateMinLength**
Validates minimum character length.

```javascript
import { validateMinLength } from '../../utils/formValidation';

const result = await validateMinLength(value, 'fieldName', 5);
// Returns: { isValid: boolean, message: string, ... }
```

### 5. **validateNumberRange**
Validates that a number is within a range.

```javascript
import { validateNumberRange } from '../../utils/formValidation';

const result = await validateNumberRange(value, 'age', 18, 65);
// Returns: { isValid: boolean, message: string, ... }
```

### 6. **validateAllMandatoryFields**
Validates all required fields at once (useful for form submission).

```javascript
import { validateAllMandatoryFields } from '../../utils/formValidation';

const { isValid, errors } = await validateAllMandatoryFields(
  formData,
  fieldsConfig // Array of { name, label, required }
);
```

**Returns:**
```javascript
{
  isValid: true/false,
  errors: {
    fieldName1: "Error message",
    fieldName2: "Error message"
  }
}
```

### 7. **validateAgainstServer**
Validates a value against a backend API endpoint.

```javascript
import { validateAgainstServer } from '../../utils/formValidation';

const result = await validateAgainstServer(
  value,
  'fieldName',
  '/validate/email',  // Endpoint
  'email'             // Parameter name
);
```

### 8. **createDebouncedValidator**
Creates a debounced version of any validation function to avoid excessive validation calls during rapid typing.

```javascript
import { createDebouncedValidator, validateMandatoryField } from '../../utils/formValidation';

const debouncedValidate = createDebouncedValidator(
  validateMandatoryField,
  300  // 300ms delay
);

// Use it as a normal validation function
await debouncedValidate(value, fieldName, fieldLabel);
```

## Integration with Forms

### In FormField Component
The FormField component automatically uses validation when provided:

```jsx
<FormField
  name="email"
  label="Email Address"
  type="email"
  value={email}
  onChange={handleChange}
  required={true}
  validate={async (value) => {
    return await validateEmail(value, 'email');
  }}
  onValidation={handleValidation}
  error={errors.email}  // Display error message
/>
```

### In ReusableForm Component
The form now validates all mandatory fields before submission:

```jsx
<ReusableForm
  config={jobOpeningConfig}
  onSubmit={handleSubmit}
/>
```

The form will:
1. ✅ Validate all required fields on submission
2. ✅ Show error messages for missing/invalid fields
3. ✅ Prevent submission if validation fails
4. ✅ Display an alert listing all missing fields

### Example Form Configuration

```javascript
export const jobOpeningConfig = {
  title: "Create Job Opening",
  steps: [
    {
      title: "Job Information",
      fields: [
        {
          name: "jobTitle",
          label: "Job Title",
          type: "text",
          required: true,  // Mark as mandatory
          placeholder: "Enter job title"
        },
        {
          name: "jobDescription",
          label: "Job Description",
          type: "textarea",
          required: true,  // Mark as mandatory
          placeholder: "Enter detailed job description"
        },
        {
          name: "email",
          label: "Contact Email",
          type: "email",
          required: true,  // Mark as mandatory
          placeholder: "Enter contact email"
        },
        {
          name: "phone",
          label: "Contact Phone",
          type: "phone",
          required: false,  // Optional field
          placeholder: "Enter phone number"
        }
      ]
    }
  ]
};
```

## Error Display

### In FormField
Errors are automatically displayed below the input:

```jsx
{error && <span className="error-message">{error}</span>}
```

### On Form Submission
All validation errors are collected and shown in an alert:

```
Please fill in all required fields:

Job Title is required
Job Description is required
Contact Email is required
```

### Error Message Styles
The FormField component shows:
- **Validation Loading**: "Validating..." text appears while validation is in progress
- **Error Message**: Red text displaying the validation error
- **Error Input**: Input field gets red border for visual feedback

## Real-Time Validation During Input

### On Blur (When User Leaves Field)
```javascript
const handleBlur = async () => {
  if (validate && !isValidating) {
    setIsValidating(true);
    try {
      const validationResult = await validate(value, name);
      handleValidationResult(validationResult);
    } catch (err) {
      handleValidationResult(err);
    } finally {
      setIsValidating(false);
    }
  }
};
```

### Debounced During Typing (Optional)
You can implement real-time validation while typing by using debounced validation:

```javascript
const debouncedValidate = createDebouncedValidator(
  validateMandatoryField,
  300
);

const handleChange = (e) => {
  const value = e.target.value;
  onChange(name, value);
  
  // Trigger debounced validation
  debouncedValidate(value, name, label)
    .then(result => onValidation(name, result));
};
```

## Form Submission Flow

1. **User clicks Submit**
2. **System validates all mandatory fields**
3. **If any field is missing/invalid:**
   - Error state is updated
   - Alert shows which fields need attention
   - Submission is blocked
   - User must fix errors and retry
4. **If all fields are valid:**
   - Form data is submitted via AJAX
   - API endpoint receives the data
   - Success/error response is handled

## Complete Example

```jsx
import React, { useState } from 'react';
import ReusableForm from './components/forms/ReusableForm';
import { validateMandatoryField, validateEmail } from './utils/formValidation';

const MyFormPage = () => {
  const [submittedData, setSubmittedData] = useState(null);

  const formConfig = {
    title: "Application Form",
    steps: [
      {
        title: "Personal Information",
        fields: [
          {
            name: "firstName",
            label: "First Name",
            type: "text",
            required: true,
            placeholder: "Enter your first name"
          },
          {
            name: "lastName",
            label: "Last Name",
            type: "text",
            required: true,
            placeholder: "Enter your last name"
          },
          {
            name: "email",
            label: "Email Address",
            type: "email",
            required: true,
            placeholder: "Enter your email"
          },
          {
            name: "phone",
            label: "Phone Number",
            type: "phone",
            required: false,
            placeholder: "Enter your phone (optional)"
          }
        ]
      },
      {
        title: "Additional Info",
        fields: [
          {
            name: "company",
            label: "Current Company",
            type: "text",
            required: true,
            placeholder: "Enter your company"
          },
          {
            name: "experience",
            label: "Years of Experience",
            type: "number",
            required: true,
            placeholder: "Enter years"
          }
        ]
      }
    ]
  };

  const handleFormSubmit = (data) => {
    console.log('Form submitted with data:', data);
    setSubmittedData(data);
    alert('Form submitted successfully!');
  };

  return (
    <div>
      <ReusableForm
        config={formConfig}
        onSubmit={handleFormSubmit}
      />
      {submittedData && (
        <div>
          <h3>Submitted Data:</h3>
          <pre>{JSON.stringify(submittedData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default MyFormPage;
```

## Testing Validation

### Test Case 1: Missing Mandatory Field
1. Leave a required field empty
2. Click Submit
3. **Expected**: Alert shows "Field Name is required"

### Test Case 2: Invalid Email
1. Enter invalid email (e.g., "notanemail")
2. Leave field (blur)
3. **Expected**: Error message "Please enter a valid email address"

### Test Case 3: Valid Data
1. Fill all required fields with valid data
2. Click Submit
3. **Expected**: Form submits and data is processed

## Error Handling

### Network Errors
If the backend is not available:
- Validation returns appropriate error message
- User is notified with clear message
- Form processing stops

### Timeout
- Validation timeout: 5 seconds
- If server doesn't respond, validation fails gracefully

### Custom Error Messages
You can customize error messages by extending the validation functions:

```javascript
export const customValidation = async (value, fieldName) => {
  if (!value) {
    return {
      isValid: false,
      message: "Custom error message here",
      fieldName,
      type: 'custom'
    };
  }
  return { isValid: true };
};
```

## Best Practices

1. **Always mark required fields**
   ```javascript
   { name: "email", label: "Email", required: true }
   ```

2. **Use appropriate field types**
   ```javascript
   { type: "email" }  // For emails
   { type: "phone" }  // For phone numbers
   ```

3. **Provide clear labels**
   ```javascript
   { label: "Contact Email Address" }  // Clear, descriptive
   ```

4. **Debounce real-time validation** to avoid excessive API calls

5. **Test validation** with edge cases:
   - Empty strings
   - Whitespace only
   - Special characters
   - Very long inputs

## File Structure

```
src/
├── utils/
│   └── formValidation.js         ← Validation utilities
├── components/forms/
│   ├── FormField.jsx             ← Updated with validation UI
│   ├── ReusableForm.jsx          ← Updated with submission validation
│   ├── MultiStepForm.jsx         ← Step validation
│   └── formConfigs.js            ← Form configurations
```

## Migration Guide

If you have existing forms:

1. **Update form config to mark required fields:**
   ```javascript
   // Before
   { name: "email", label: "Email", type: "text" }
   
   // After
   { name: "email", label: "Email", type: "text", required: true }
   ```

2. **No other changes needed** - validation is automatic!

## Troubleshooting

### Issue: Validation not triggered
- Check if field has `required: true`
- Verify FormField has `onValidation` callback
- Check browser console for errors

### Issue: Error message not showing
- Ensure FormField has `error` prop
- Check that error message is being passed from parent

### Issue: Form submitting despite errors
- Verify handleSubmit includes validation check
- Check that validation errors are blocking submission

## Support

For issues or questions about validation:
1. Check this guide
2. Review form configuration examples
3. Check browser console for errors
4. Verify all required props are passed to FormField
