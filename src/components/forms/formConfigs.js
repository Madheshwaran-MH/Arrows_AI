import TeamMembersStep from "./TeamMembersStep";
import PermissionStep from "./PermissionStep";
import CandidateBasicInfoStep from "./CandidateBasicInfoStep";
import CandidateDocumentsStep from "./CandidateDocumentsStep";
import ClientBasicInfoStep from "./ClientBasicInfoStep";

const isEmptyValue = (value) =>
  value === undefined ||
  value === null ||
  (typeof value === "string" && value.trim() === "") ||
  (Array.isArray(value) && value.length === 0);

const isStrictInteger = (value) => /^\d+$/.test(String(value).trim());

const validateIntegerValue = (value, { label, min, max }) => {
  if (isEmptyValue(value)) {
    return { isValid: false, message: `${label} is required` };
  }

  if (!isStrictInteger(value)) {
    return { isValid: false, message: `${label} must contain digits only` };
  }

  const parsedValue = parseInt(String(value).trim(), 10);

  if (parsedValue < min || parsedValue > max) {
    return {
      isValid: false,
      message: `${label} must be between ${min} and ${max}`
    };
  }

  return { isValid: true };
};

const isValidEmail = (value) =>
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(String(value).trim());

const isValidPhoneNumber = (value, minDigits = 10, maxDigits = 10) => {
  const digits = String(value || "").replace(/\D/g, "");
  const isWithinRange = digits.length >= minDigits && digits.length <= maxDigits;
  return isWithinRange && /^\d+$/.test(digits);
};

const isFresherCandidate = (formData) => formData?.candidateType === "fresher";

const SOURCE_DIRECTORY = [
  { id: "SRC-001", name: "Resume Inbox" },
  { id: "SRC-002", name: "Employee Referral" },
  { id: "SRC-003", name: "LinkedIn" },
  { id: "SRC-004", name: "Seek" },
  { id: "SRC-005", name: "Added by User" }
];

const RECRUITER_DIRECTORY = [
  { id: "REC-001", name: "Parthiban" },
  { id: "REC-002", name: "Manigandan" },
  { id: "REC-003", name: "Saravanan" },
  { id: "REC-004", name: "Priya" }
];

const SOURCE_NAME_OPTIONS = SOURCE_DIRECTORY.map(({ id, name }) => ({
  value: name,
  label: name,
  sourceId: id,
}));

const RECRUITER_OPTIONS = RECRUITER_DIRECTORY.map(({ id, name }) => ({
  value: id,
  label: `${id} - ${name}`,
}));

// Example configurations for different forms
// Job Application Form Configuration
export const jobApplicationConfig = {
  title: "Job Application Form",
  itemName: "Applications",
  steps: [
    {
      title: "Personal Information",
      fields: [
        {
          name: "firstName",
          label: "First Name",
          type: "text",
          required: true
        },
        {
          name: "lastName",
          label: "Last Name",
          type: "text",
          required: true
        },
        {
          name: "email",
          label: "Email",
          type: "email",
          required: true
        }
      ]
    },
    {
      title: "Experience & Skills",
      fields: [
        {
          name: "minExperience",
          label: "Min Experience (years)",
          type: "number",
          required: true,
          validationRule: "experience"
        },
        {
          name: "maxExperience",
          label: "Max Experience (years)",
          type: "number",
          required: true,
          validationRule: "experience"
        },
        {
          name: "skills",
          label: "Skills",
          type: "text",
          required: true
        }
      ]
    },
    {
      title: "Contact Information",
      fields: [
        {
          name: "phone",
          label: "Phone Number",
          type: "tel",
          required: true,
          validationRule: "phone"
        },
        {
          name: "address",
          label: "Address",
          type: "text",
          required: true
        }
      ]
    }
  ],
  validationRules: {
    experience: (value) => {
      return validateIntegerValue(value, {
        label: "Experience",
        min: 0,
        max: 50
      });
    },
    phone: (value) => {
      if (isEmptyValue(value)) {
        return { isValid: false, message: "Phone number is required" };
      }

      if (!isValidPhoneNumber(value, 10, 15)) {
        return { isValid: false, message: "Please enter a valid phone number" };
      }

      return { isValid: true };
    }
  },
  columns: [
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'email', label: 'Email' },
    { key: 'minExperience', label: 'Min Exp' },
    { key: 'maxExperience', label: 'Max Exp' },
    { key: 'skills', label: 'Skills' },
    { key: 'phone', label: 'Phone' },
    { key: 'address', label: 'Address' }
  ]
};

// Contact Form Configuration
export const contactFormConfig = {
  title: "Contact Us",
  itemName: "Messages",
  steps: [
    {
      title: "Your Information",
      fields: [
        {
          name: "name",
          label: "Full Name",
          type: "text",
          required: true
        },
        {
          name: "email",
          label: "Email",
          type: "email",
          required: true
        }
      ]
    },
    {
      title: "Message",
      fields: [
        {
          name: "subject",
          label: "Subject",
          type: "text",
          required: true
        },
        {
          name: "message",
          label: "Message",
          type: "textarea",
          required: true
        }
      ]
    }
  ],
  validationRules: {
    message: (value) => {
      if (!value) {
        return { isValid: false, message: 'Message is required' };
      }

      if (value.length < 10) {
        return { isValid: false, message: 'Message must be at least 10 characters' };
      }

      return { isValid: true };
    }
  },
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'subject', label: 'Subject' },
    { key: 'message', label: 'Message' }
  ]
};

// Job Opening Creation Form Configuration
export const jobOpeningConfig = {
  title: "Create Job Opening",
  itemName: "Job Openings",
  formClassName: "job-opening-form",
  hideTitle: true,
  showDraftAction: true,
  draftLabel: "Save as Draft",
  submitLabel: "Create JD",
  steps: [
    {
      title: "Job Information",
      fields: [
        {
          name: "jobPositionId",
          label: "Job Id *",
          type: "text",
          required: true,
          cssClass: "grid-col-1 grid-row-1",
          validationRule: "requiredField",
          placeholder: "Auto Generated",
          disabled: true
        },
        {
          name: "positionName",
          label: "Job Name *",
          type: "text",
          required: true,
          cssClass: "grid-col-2 grid-row-1",
          validationRule: "requiredField",
          placeholder: "Job Name"
        },
        {
          name: "minExperience",
          label: "Experience Min",
          type: "number",
          required: true,
          cssClass: "grid-col-1 grid-row-2",
          validationRule: "experience",
          hideLabel: true,
          prefix: "Min"
        },
        {
          name: "maxExperience",
          label: "Experience Max",
          type: "number",
          required: true,
          cssClass: "grid-col-1 grid-row-2",
          validationRule: "experience",
          hideLabel: true,
          prefix: "Max"
        },
        {
          name: "positionLevel",
          label: "Position Level *",
          type: "select",
          required: true,
          cssClass: "grid-col-2 grid-row-2",
          placeholder: "Select",
          options: [
            { value: "entry", label: "Entry Level" },
            { value: "junior", label: "Junior" },
            { value: "mid", label: "Mid Level" },
            { value: "senior", label: "Senior" },
            { value: "lead", label: "Lead" },
            { value: "manager", label: "Manager" },
            { value: "director", label: "Director" },
            { value: "executive", label: "Executive" }
          ]
        },
        {
          name: "location",
          label: "Location *",
          type: "multiselect",
          required: true,
          cssClass: "grid-col-3 grid-row-4",
          placeholder: "Select locations",
          options: [
            { value: "chennai", label: "Chennai" },
            { value: "bangalore", label: "Bangalore" },
            { value: "hyderabad", label: "Hyderabad" },
            { value: "pune", label: "Pune" },
            { value: "mumbai", label: "Mumbai" },
            { value: "delhi", label: "Delhi" },
            { value: "noida", label: "Noida" },
            { value: "gurgaon", label: "Gurgaon" },
            { value: "coimbatore", label: "Coimbatore" },
            { value: "kolkata", label: "Kolkata" }
          ]
        },
        {
          name: "noOfPositions",
          label: "No of Positions *",
          type: "number",
          required: true,
          cssClass: "grid-col-1 grid-row-3",
          validationRule: "numberOfPositions",
          placeholder: "No of positions"
        },
        {
          name: "jobReceivedDate",
          label: "Job Received Date (dd-mm-yyyy) *",
          type: "date",
          required: true,
          cssClass: "grid-col-2 grid-row-3"
        },
        {
          name: "minSalary",
          label: "Salary Min (in CTC)",
          type: "number",
          required: true,
          cssClass: "grid-col-3 grid-row-3",
          validationRule: "salary",
          hideLabel: true,
          prefix: "Min",
          suffix: "LPA"
        },
        {
          name: "maxSalary",
          label: "Salary Max (in CTC)",
          type: "number",
          required: true,
          cssClass: "grid-col-3 grid-row-3",
          validationRule: "salary",
          hideLabel: true,
          prefix: "Max",
          suffix: "LPA"
        },
        {
          name: "jobType",
          label: "Employment Type *",
          type: "select",
          required: true,
          cssClass: "grid-col-2 grid-row-4",
          placeholder: "Select",
          options: [
            { value: "full-time", label: "Full Time Employment" },
            { value: "part-time", label: "Part Time" },
            { value: "contract", label: "Contract" },
            { value: "internship", label: "Internship" }
          ]
        },
        {
          name: "hiringType",
          label: "Work Type *",
          type: "select",
          required: true,
          cssClass: "grid-col-3 grid-row-2",
          placeholder: "Select",
          options: [
            { value: "remote", label: "Remote" },
            { value: "hybrid", label: "Hybrid" },
            { value: "on-site", label: "On-site" }
          ]
        },
        {
          name: "jdAttachmentMode",
          label: "Have JD Template? *",
          type: "radio-choice",
          required: false,
          cssClass: "grid-col-1 grid-row-1",
          defaultValue: "no"
        },
        {
          name: "jdAttachment",
          label: "JD Attachment",
          type: "file",
          required: false,
          accept: ".pdf,.docx,.txt",
          placeholder: "Attachment",
          showBrowseButton: true,
          cssClass: "grid-col-1 grid-row-1"
        },
        {
          name: "technicalSkills",
          label: "Technical Skill *",
          type: "multiselect",
          required: true,
          cssClass: "grid-col-1 grid-row-5",
          validationRule: "skills",
          options: [
            { value: "javascript", label: "JavaScript" },
            { value: "react", label: "React" },
            { value: "node", label: "Node.js" },
            { value: "python", label: "Python" },
            { value: "java", label: "Java" },
            { value: "csharp", label: "C#" },
            { value: "php", label: "PHP" },
            { value: "ruby", label: "Ruby" },
            { value: "sql", label: "SQL" },
            { value: "mongodb", label: "MongoDB" },
            { value: "aws", label: "AWS" },
            { value: "docker", label: "Docker" },
            { value: "kubernetes", label: "Kubernetes" },
            { value: "git", label: "Git" },
            { value: "html", label: "HTML" },
            { value: "css", label: "CSS" },
            { value: "typescript", label: "TypeScript" },
            { value: "vue", label: "Vue.js" },
            { value: "angular", label: "Angular" },
            { value: "dotnet", label: ".NET" },
            { value: "machine-learning", label: "Machine Learning" },
            { value: "azure", label: "Microsoft Azure" }
          ]
        },
        {
          name: "softSkills",
          label: "Soft Skill *",
          type: "multiselect",
          required: true,
          cssClass: "grid-col-2 grid-row-5",
          validationRule: "skills",
          options: [
            { value: "communication", label: "Communication" },
            { value: "leadership", label: "Leadership" },
            { value: "teamwork", label: "Teamwork" },
            { value: "problem-solving", label: "Problem Solving" },
            { value: "time-management", label: "Time Management" },
            { value: "adaptability", label: "Adaptability" },
            { value: "creativity", label: "Creativity" },
            { value: "critical-thinking", label: "Critical Thinking" },
            { value: "emotional-intelligence", label: "Emotional Intelligence" },
            { value: "conflict-resolution", label: "Conflict Resolution" },
            { value: "negotiation", label: "Negotiation" },
            { value: "decision-making", label: "Decision Making" },
            { value: "mentoring", label: "Mentoring" },
            { value: "presentation", label: "Presentation Skills" },
            { value: "networking", label: "Networking" },
            { value: "cultural-awareness", label: "Cultural Awareness" }
          ]
        },
        {
          name: "additionalSkills",
          label: "Additional Skill",
          type: "text",
          required: false,
          cssClass: "grid-col-3 grid-row-5",
          placeholder: "Select Skill"
        },
        {
          name: "addTechnicalSkills",
          label: "Add Technical Skill",
          type: "multiselect",
          required: false,
          cssClass: "grid-col-1 grid-row-6",
          options: [
            { value: "machine-learning", label: "Machine Learning" },
            { value: "deep-learning", label: "Deep Learning" },
            { value: "nlp", label: "NLP" },
            { value: "data-science", label: "Data Science" },
            { value: "computer-vision", label: "Computer Vision" },
            { value: "azure", label: "Microsoft Azure" },
            { value: "gcp", label: "Google Cloud Platform" }
          ]
        },
        {
          name: "accountManager",
          label: "Account Manager",
          type: "text",
          required: false,
          cssClass: "grid-col-2 grid-row-6",
          placeholder: "Account Manager",
          disabled: true
        },
        {
          name: "jobDescription",
          label: "Job Description *",
          type: "textarea",
          required: true,
          validationRule: "description",
          placeholder: "Generate or enter the complete job description for this opening.",
          rows: 14,
          maxLength: 8000
        }
      ]
    },
    {
      title: "Client Details and Requirement",
      component: PermissionStep,
      fields: [
        {
          name: "clientId",
          label: "Client Id",
          type: "text",
          required: false,
          cssClass: "grid-col-2 grid-row-1",
          placeholder: "Client ID",
          disabled: true
        },
        {
          name: "clientName",
          label: "Client Name *",
          type: "select",
          required: true,
          cssClass: "grid-col-1 grid-row-1",
          placeholder: "Select Client Name",
          options: [
            { value: "MethodHub", label: "MethodHub", clientId: "C1292938" },
            { value: "Arrows Inc", label: "Arrows Inc", clientId: "C1292432" },
            { value: "NovaLabs", label: "NovaLabs", clientId: "C1292921" }
          ]
        },
        {
          name: "contactPersonName",
          label: "Contact Person Name",
          type: "text",
          required: false,
          validationRule: "contactPersonName",
          cssClass: "grid-col-3 grid-row-1",
          placeholder: "Enter Contact Person Name"
        },
        {
          name: "contactPersonEmail",
          label: "Contact Person Email Id",
          type: "email",
          required: false,
          validationRule: "emailOptional",
          cssClass: "grid-col-1 grid-row-2",
          placeholder: "Enter Contact Person Email"
        },
        {
          name: "priority",
          label: "Priority",
          type: "select",
          required: false,
          cssClass: "grid-col-2 grid-row-2",
          placeholder: "Select Priority",
          options: [
            { value: "high", label: "High" },
            { value: "medium", label: "Medium" },
            { value: "low", label: "Low" }
          ]
        },
        {
          name: "permissionVisibility",
          label: "Visibility",
          type: "custom",
          required: false
        },
        {
          name: "jobActivationDate",
          label: "Validity Upto *",
          type: "date",
          required: true
        },
        {
          name: "targetDate",
          label: "Target *",
          type: "date",
          required: true,
          validationRule: "targetDate"
        },
        {
          name: "permissionAccess",
          label: "Access",
          type: "custom",
          required: false
        }
      ]
    },
    {
      title: "Team Members",
      component: TeamMembersStep,
      skipValidation: true,
      fields: [
        {
          name: "teamMembers",
          label: "Team Members",
          type: "custom",
          required: false
        }
      ]
    }
  ],
  validationRules: {
    experience: (value, fieldName, formData) => {
      const label = fieldName === "maxExperience" ? "Max experience" : "Min experience";
      const integerValidation = validateIntegerValue(value, {
        label,
        min: 0,
        max: 50
      });

      if (!integerValidation.isValid) {
        return integerValidation;
      }

      const currentFormData = { ...(formData || {}), [fieldName]: String(value).trim() };
      const minDefined = !isEmptyValue(currentFormData.minExperience);
      const maxDefined = !isEmptyValue(currentFormData.maxExperience);

      if (minDefined && maxDefined) {
        const minExperience = parseInt(String(currentFormData.minExperience).trim(), 10);
        const maxExperience = parseInt(String(currentFormData.maxExperience).trim(), 10);

        if (minExperience > maxExperience) {
          return { isValid: false, message: "Min experience cannot be greater than max experience" };
        }
      }

      return { isValid: true };
    },
    numberOfPositions: (value) =>
      validateIntegerValue(value, {
        label: "No of positions",
        min: 1,
        max: 999
      }),
    salary: (value, fieldName, formData) => {
      const label = fieldName === "maxSalary" ? "Max salary" : "Min salary";
      
      // Validate as lakh values (e.g., 5.5 lakhs for 550000)
      const integerValidation = validateIntegerValue(value, {
        label,
        min: 0,
        max: 200
      });

      if (!integerValidation.isValid) {
        return { isValid: false, message: `${label} must be between 0 and 200 lakhs` };
      }

      // Check if value looks like it might be in actual rupees instead of lakhs
      const numValue = parseInt(value, 10);
      if (numValue > 200 && numValue < 100000) {
        return { isValid: false, message: `${label} should be in lakhs (e.g., 5 for 5 lakhs or 5,00,000 rupees)` };
      }

      const currentFormData = { ...(formData || {}), [fieldName]: String(value).trim() };
      const minDefined = !isEmptyValue(currentFormData.minSalary);
      const maxDefined = !isEmptyValue(currentFormData.maxSalary);

      if (minDefined && maxDefined) {
        const minSalary = parseInt(String(currentFormData.minSalary).trim(), 10);
        const maxSalary = parseInt(String(currentFormData.maxSalary).trim(), 10);

        if (minSalary > maxSalary) {
          return { isValid: false, message: "Min salary cannot be greater than max salary" };
        }
      }

      return { isValid: true };
    },
    skills: (value) => {
      if (!value || (Array.isArray(value) && value.length === 0)) {
        return { isValid: false, message: 'Please select at least one required skill' };
      }

      if (Array.isArray(value) && value.length > 10) {
        return { isValid: false, message: 'Please select no more than 10 skills' };
      }

      return { isValid: true };
    },
    benefits: () => {
      // Benefits is optional, so no validation required
      return { isValid: true };
    },
    targetDate: (value, fieldName, formData) => {
      if (isEmptyValue(value)) {
        return { isValid: false, message: "Target is required" };
      }

      const requirementReceivedDate = formData?.jobReceivedDate;
      const validityUpto = formData?.jobActivationDate;

      if (!isEmptyValue(requirementReceivedDate) && String(value) < String(requirementReceivedDate)) {
        return { isValid: false, message: "Target date cannot be before Requirement Received date" };
      }

      if (!isEmptyValue(validityUpto) && String(value) > String(validityUpto)) {
        return { isValid: false, message: "Target date cannot be after Validity Upto date" };
      }

      return { isValid: true };
    },
    requiredField: async (value, fieldName) => {
      // Check if value is empty
      if (isEmptyValue(value)) {
        const fieldLabels = {
          jobPositionId: 'Job Position Id',
          positionName: 'Position Name'
        };
        const fieldLabel = fieldLabels[fieldName] || fieldName;
        return { isValid: false, message: `${fieldLabel} is required` };
      }

      // Additional validation for specific fields
      if (fieldName === "positionName") {
        const trimmedValue = String(value).trim();
        if (trimmedValue.length < 2 || trimmedValue.length > 100) {
          return {
            isValid: false,
            message: "Position Name must be between 2 and 100 characters"
          };
        }

        if (!/^[A-Za-z0-9][A-Za-z0-9 &(),./-]*$/.test(trimmedValue)) {
          return {
            isValid: false,
            message: "Position Name contains unsupported special characters"
          };
        }
      }

      if (fieldName === 'jobPositionId') {
        // Validate Job Position ID format
        const trimmedValue = String(value).trim();
        if (!/^[A-Z0-9\-_]{1,20}$/.test(trimmedValue)) {
          return {
            isValid: false,
            message: 'Job Position ID must be 1-20 characters (alphanumeric, hyphens, underscores only)'
          };
        }

        try {
          // Try to validate against backend if available.
          // This field is auto-generated and disabled in UI, so auth failures
          // should not block submission.
          const authToken = localStorage.getItem('authToken') || localStorage.getItem('token');
          const response = await fetch('/api/validate-job-position-id', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            },
            body: JSON.stringify({ jobPositionId: trimmedValue })
          });

          if (response.ok) {
            const result = await response.json();
            return result;
          } else if (response.status === 401 || response.status === 403) {
            console.warn('Skipping backend Job Position ID validation due to authentication/authorization response');
            return { isValid: true };
          } else {
            // Only block submission when backend explicitly marks the ID invalid.
            // For endpoint/config/transient errors, keep client-side validation as source of truth.
            try {
              const error = await response.json();

              if (typeof error?.isValid === 'boolean') {
                return {
                  isValid: error.isValid,
                  message: error?.message || (error.isValid ? '' : 'This Job Position ID is not valid')
                };
              }

              if (response.status === 400 || response.status === 409 || response.status === 422) {
                return {
                  isValid: false,
                  message: error?.message || 'This Job Position ID is not valid'
                };
              }
            } catch {
              // Non-JSON backend response, fall back to client-side validation.
            }

            console.warn(`Skipping backend Job Position ID validation due to non-validation response: ${response.status}`);
            return { isValid: true };
          }
        } catch (error) {
          console.warn(`Backend validation unavailable for ${fieldName}, using client-side validation only`, error);
          // Return success for client-side validation only
          return { isValid: true };
        }
      }

      return { isValid: true };
    },
    emailOptional: (value) => {
      if (isEmptyValue(value)) {
        return { isValid: true };
      }

      if (!isValidEmail(value)) {
        return { isValid: false, message: "Please enter a valid email address" };
      }

      return { isValid: true };
    },
    contactPersonName: (value) => {
      if (isEmptyValue(value)) {
        return { isValid: true };
      }

      const trimmedValue = String(value).trim();

      if (!/^[A-Za-z\s]+$/.test(trimmedValue)) {
        return {
          isValid: false,
          message: "Contact Person Name should only contain alphabetic characters"
        };
      }

      const letterCount = (trimmedValue.match(/[A-Za-z]/g) || []).length;
      if (letterCount < 3) {
        return {
          isValid: false,
          message: "Contact Person Name should contain at least 3 letters"
        };
      }

      return { isValid: true };
    },
    description: async (value, fieldName) => {
      if (fieldName === 'jobDescription') {
        if (!value) {
          return { isValid: true };
        }

        if (String(value).length > 8000) {
          return { isValid: false, message: 'Description cannot exceed 8000 characters' };
        }

        return { isValid: true };
      }

      if (!value) {
        return { isValid: false, message: 'This field is required' };
      }

      try {
        // Make AJAX call to validate description
        const response = await fetch('/api/validate-description', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ description: value })
        });

        const result = await response.json();

        if (!response.ok) {
          return { isValid: false, message: result.message || 'Description validation failed' };
        }

        return result;
      } catch (error) {
        console.error('Error validating description:', error);

        // Fallback to basic client-side validation if server is unavailable
        if (value.length < 50) {
          return { isValid: false, message: 'Description must be at least 50 characters' };
        }

        if (value.length > 5000) {
          return { isValid: false, message: 'Description cannot exceed 5000 characters' };
        }

        return { isValid: true };
      }
    }
  },
  columns: [
    { key: 'jobTitle', label: 'Job Title' },
    { key: 'department', label: 'Department' },
    { key: 'employmentType', label: 'Type' },
    { key: 'location', label: 'Location' },
    { key: 'minExperience', label: 'Min Exp' },
    { key: 'maxExperience', label: 'Max Exp' },
    { key: 'minSalary', label: 'Min Salary (CTC in Lakhs)' },
    { key: 'maxSalary', label: 'Max Salary (CTC in Lakhs)' },
    { key: 'requiredSkills', label: 'Required Skills' }
  ]
};

// Candidate Configuration
export const candidateConfig = {
  title: "Add Candidate",
  itemName: "Candidates",
  formClassName: "candidate-form",
  hideTitle: true,
  showDraftAction: true,
  draftLabel: "Save as Draft",
  submitLabel: "Submit",
  steps: [
    {
      title: "Candidate Information",
      component: CandidateBasicInfoStep,
      fields: [
        {
          name: "candidateTemplateMode",
          label: "Candidate Template",
          type: "text",
          required: false,
          placeholder: "No"
        },
        {
          name: "candidateTemplateFile",
          label: "Candidate Resume",
          type: "file",
          required: false,
          accept: ".pdf,.doc,.docx,.txt",
          placeholder: "Resume",
          showBrowseButton: true
        },
        {
          name: "candidateId",
          label: "Application Id *",
          type: "text",
          required: true,
          validationRule: "requiredField",
          placeholder: "Auto Generated",
          disabled: true
        },
        {
          name: "namePrefix",
          label: "Title",
          type: "select",
          required: true,
          validationRule: "namePrefixRequired",
          hideLabel: true,
          placeholder: "None",
          options: [
            { value: "none", label: "None" },
            { value: "mr", label: "Mr." },
            { value: "mrs", label: "Mrs." },
            { value: "ms", label: "Ms." }
          ]
        },
        {
          name: "firstName",
          label: "First Name *",
          type: "text",
          required: true,
          validationRule: "requiredField",
          hideLabel: true,
          placeholder: "Enter First Name"
        },
        {
          name: "lastName",
          label: "Last Name *",
          type: "text",
          required: true,
          validationRule: "requiredField",
          placeholder: "Enter Last Name"
        },
        {
          name: "primaryEmail",
          label: "Primary Email Address *",
          type: "email",
          required: true,
          validationRule: "emailRequired",
          placeholder: "Enter Email Address"
        },
        {
          name: "phoneNumber",
          label: "Phone Number *",
          type: "tel",
          required: true,
          validationRule: "phoneRequired",
          placeholder: "Enter Phone Number",
          prefix: "+91"
        },
        {
          name: "gender",
          label: "Gender",
          type: "select",
          required: false,
          placeholder: "Select",
          options: [
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
            { value: "other", label: "Other" }
          ]
        },
        {
          name: "dateOfBirth",
          label: "Date Of Birth",
          type: "date",
          required: false
        },
        {
          name: "yearsExperience",
          label: "Years of Experience *",
          type: "select",
          required: true,
          validationRule: "requiredField",
          placeholder: "Select",
          options: [
            { value: "0-1", label: "0-1 years" },
            { value: "1-3", label: "1-3 years" },
            { value: "3-5", label: "3-5 years" },
            { value: "5-8", label: "5-8 years" },
            { value: "8-12", label: "8-12 years" },
            { value: "12+", label: "12+ years" }
          ]
        },
        {
          name: "offersInHand",
          label: "Offers In Hand *",
          type: "select",
          required: true,
          validationRule: "requiredField",
          placeholder: "Select",
          options: [
            { value: "0", label: "0" },
            { value: "1", label: "1" },
            { value: "2", label: "2" },
            { value: "3+", label: "3+" }
          ]
        },
        {
          name: "comments",
          label: "Comments / Remarks",
          type: "textarea",
          required: false,
          placeholder: "Comments / Remarks",
          maxLength: 1000,
          validationRule: "comments"
        },
        {
          name: "currentCompanyName",
          label: "Current Company Name *",
          type: "text",
          required: true,
          validationRule: "requiredField",
          placeholder: "Enter Company Name"
        },
        {
          name: "jobTitleRole",
          label: "Job Title / Role *",
          type: "text",
          required: true,
          validationRule: "requiredField",
          placeholder: "Enter Job Title"
        },
        {
          name: "employmentType",
          label: "Employment Type",
          type: "select",
          required: false,
          placeholder: "Select Employment Type",
          options: [
            { value: "full-time", label: "Full Time" },
            { value: "contract", label: "Contract" },
            { value: "internship", label: "Internship" }
          ]
        },
        {
          name: "noticePeriod",
          label: "Notice Period (Days) *",
          type: "number",
          required: true,
          validationRule: "noticePeriod",
          placeholder: "Enter notice period in days"
        },
        {
          name: "currentCtc",
          label: "Current CTC (LPA) *",
          type: "number",
          required: true,
          validationRule: "ctc",
          placeholder: "Enter current CTC in LPA (e.g., 10)"
        },
        {
          name: "expectedCtc",
          label: "Expected CTC (LPA) *",
          type: "number",
          required: true,
          validationRule: "ctc",
          placeholder: "Enter expected CTC in LPA (e.g., 15)"
        },
        {
          name: "primarySkill",
          label: "Primary Skill *",
          type: "select",
          required: true,
          validationRule: "requiredField",
          placeholder: "Select Primary Skill",
          options: [
            { value: "java", label: "Core Java" },
            { value: "python", label: "Python" },
            { value: "react", label: "React" },
            { value: "node", label: "Node.js" },
            { value: "aws", label: "AWS" }
          ]
        },
        {
          name: "secondarySkill",
          label: "Secondary Skill",
          type: "select",
          required: false,
          placeholder: "Select Secondary Skill",
          options: [
            { value: "java", label: "Core Java" },
            { value: "python", label: "Python" },
            { value: "react", label: "React" },
            { value: "node", label: "Node.js" },
            { value: "aws", label: "AWS" }
          ]
        },
        {
          name: "skillExperienceLevel",
          label: "Experience Level *",
          type: "select",
          required: true,
          validationRule: "requiredField",
          placeholder: "Select Experience Level",
          options: [
            { value: "beginner", label: "Beginner" },
            { value: "intermediate", label: "Intermediate" },
            { value: "expert", label: "Expert" }
          ]
        },
        {
          name: "secondarySkillExperienceLevel",
          label: "Secondary Experience Level",
          type: "select",
          required: false,
          placeholder: "Select Experience Level",
          options: [
            { value: "beginner", label: "Beginner" },
            { value: "intermediate", label: "Intermediate" },
            { value: "expert", label: "Expert" }
          ]
        },
        {
          name: "skillRating",
          label: "Ratings *",
          type: "select",
          required: true,
          validationRule: "requiredField",
          placeholder: "Select Rating",
          options: [
            { value: "0", label: "0" },
            { value: "1", label: "1" },
            { value: "2", label: "2" },
            { value: "3", label: "3" },
            { value: "4", label: "4" },
            { value: "5", label: "5" }
          ]
        },
        {
          name: "secondarySkillRating",
          label: "Secondary Ratings",
          type: "select",
          required: false,
          placeholder: "Select Rating",
          options: [
            { value: "0", label: "0" },
            { value: "1", label: "1" },
            { value: "2", label: "2" },
            { value: "3", label: "3" },
            { value: "4", label: "4" },
            { value: "5", label: "5" }
          ]
        },
        {
          name: "skillComments",
          label: "Comments",
          type: "text",
          required: false,
          placeholder: "Add comments"
        },
        {
          name: "secondarySkillComments",
          label: "Secondary Comments",
          type: "text",
          required: false,
          placeholder: "Add comments"
        },
        {
          name: "skillExperienceYears",
          label: "Experience (Years) *",
          type: "number",
          required: true,
          validationRule: "requiredField",
          allowDecimal: true,
          placeholder: "Enter years"
        },
        {
          name: "secondarySkillExperienceYears",
          label: "Secondary Experience (Years)",
          type: "number",
          required: false,
          allowDecimal: true,
          placeholder: "Enter years"
        },
        {
          name: "recruiterId",
          label: "Recruiter",
          type: "select",
          required: false,
          placeholder: "Select Recruiter",
          options: RECRUITER_OPTIONS
        },
        {
          name: "sourceName",
          label: "Source Name *",
          type: "select",
          required: true,
          validationRule: "sourceReference",
          placeholder: "Select Source Name",
          options: SOURCE_NAME_OPTIONS
        },
        {
          name: "sourcedDate",
          label: "Sourced Date *",
          type: "date",
          required: true,
          validationRule: "requiredField"
        }
      ]
    },
    {
      title: "Candidate Documents",
      component: CandidateDocumentsStep,
      fields: [
        {
          name: "candidateResume",
          label: "Resume",
          type: "file",
          required: false,
          accept: ".pdf,.doc,.docx",
          placeholder: "Upload Resume"
        },
        {
          name: "candidateCoverLetter",
          label: "Cover Letter",
          type: "file",
          required: false,
          accept: ".pdf,.doc,.docx",
          placeholder: "Upload Cover Letter"
        },
        {
          name: "candidatePortfolio",
          label: "Portfolio Link",
          type: "text",
          required: false,
          placeholder: "Enter Portfolio URL"
        },
        {
          name: "candidateAdditionalDocs",
          label: "Additional Documents",
          type: "file",
          required: false,
          accept: ".pdf,.doc,.docx",
          multiple: true,
          placeholder: "Upload Supporting Docs"
        }
      ]
    }
  ],
  validationRules: {
    requiredField: async (value, fieldName, formData) => {
      if (
        isFresherCandidate(formData) &&
        ["currentCompanyName", "jobTitleRole", "currentCtc"].includes(fieldName)
      ) {
        return { isValid: true };
      }

      if (isEmptyValue(value)) {
        const fieldLabels = {
          candidateId: 'Application Id',
          firstName: 'First Name',
          lastName: 'Last Name',
          primaryEmail: 'Primary Email Address',
          phoneNumber: 'Phone Number',
          yearsExperience: 'Years of Experience',
          offersInHand: 'Offers In Hand',
          currentCompanyName: 'Current Company Name',
          jobTitleRole: 'Job Title / Role',
          noticePeriod: 'Notice Period',
          currentCtc: 'Current CTC',
          expectedCtc: 'Expected CTC',
          primarySkill: 'Primary Skill',
          secondarySkill: 'Secondary Skill',
          skillExperienceLevel: 'Experience Level',
          secondarySkillExperienceLevel: 'Secondary Experience Level',
          skillRating: 'Ratings',
          secondarySkillRating: 'Secondary Ratings',
          skillExperienceYears: 'Experience (Years)',
          secondarySkillExperienceYears: 'Secondary Experience (Years)',
          secondarySkillComments: 'Secondary Comments',
          sourceName: 'Source Name',
          sourcedDate: 'Sourced Date',
          candidateResume: 'Resume'
        };
        const fieldLabel = fieldLabels[fieldName] || fieldName;
        return { isValid: false, message: `${fieldLabel} is required` };
      }

      // Strict format validation for Application ID
      if (fieldName === 'candidateId') {
        const trimmedValue = String(value).trim();
        // Alphanumeric with specific length (e.g. 4-20 chars) and must start with a letter
        if (!/^[A-Za-z][A-Za-z0-9\-]{3,19}$/.test(trimmedValue)) {
          return {
            isValid: false,
            message: 'Application ID must be 4-20 characters, start with a letter and contain only letters, numbers, or hyphens'
          };
        }
      }

      // Name validation: Letters, spaces, hyphens, and dots only
      if (fieldName === 'firstName' || fieldName === 'lastName') {
        const trimmedValue = String(value).trim();
        if (!/^[A-Za-z\s.\-]+$/.test(trimmedValue)) {
          const fieldLabel = fieldName === 'firstName' ? 'First Name' : 'Last Name';
          return {
            isValid: false,
            message: `${fieldLabel} should only contain letters, spaces, dots or hyphens`
          };
        }

        const normalizedFirstName = String(
          fieldName === "firstName" ? value : formData?.firstName || ""
        ).trim().toLowerCase();
        const normalizedLastName = String(
          fieldName === "lastName" ? value : formData?.lastName || ""
        ).trim().toLowerCase();

        if (normalizedFirstName && normalizedLastName && normalizedFirstName === normalizedLastName) {
          return {
            isValid: false,
            message: "First Name and Last Name cannot be the same"
          };
        }
      }

      // Alphanumeric validation for Job Title/Role (must not be numeric alone)
      if (fieldName === 'jobTitleRole') {
        const trimmedValue = String(value).trim();
        if (!/^[A-Za-z0-9\s]+$/.test(trimmedValue)) {
          return {
            isValid: false,
            message: "Job Title / Role should only contain letters, numbers and spaces"
          };
        }
        if (!/[A-Za-z]/.test(trimmedValue)) {
          return {
            isValid: false,
            message: "Job Title / Role cannot consist of numbers alone. Please include at least one letter"
          };
        }
      }

      // Alphanumeric validation for Company Name (must not be numeric alone)
      if (fieldName === 'currentCompanyName') {
        const trimmedValue = String(value).trim();
        // 1. Basic allowed characters check
        if (!/^[A-Za-z0-9\s.\-&',]+$/.test(trimmedValue)) {
          return {
            isValid: false,
            message: "Company Name should only contain letters, numbers, spaces, and basic punctuation"
          };
        }
        // 2. Reject numeric-only values (must contain at least one letter)
        if (!/[A-Za-z]/.test(trimmedValue)) {
          return {
            isValid: false,
            message: "Company Name cannot consist of numbers alone. Please include at least one letter"
          };
        }
      }

      return { isValid: true };
    },
    namePrefixRequired: async (value) => {
      if (isEmptyValue(value) || String(value).toLowerCase() === "none") {
        return { isValid: false, message: "Title is required" };
      }
      return { isValid: true };
    },
    emailRequired: async (value) => {
      if (isEmptyValue(value)) {
        return { isValid: false, message: "Email is required" };
      }

      if (!isValidEmail(value)) {
        return { isValid: false, message: "Please enter a valid email address" };
      }

      return { isValid: true };
    },
    emailOptional: async (value, fieldName, formData) => {
      if (isEmptyValue(value)) {
        return { isValid: true };
      }

      if (!isValidEmail(value)) {
        return { isValid: false, message: "Please enter a valid email address" };
      }

      const primaryEmail = String(formData?.primaryEmail || "").trim().toLowerCase();
      const secondaryEmail = String(value).trim().toLowerCase();

      if (primaryEmail && primaryEmail === secondaryEmail) {
        return { isValid: false, message: "Secondary email must be different from primary email" };
      }

      return { isValid: true };
    },
    alphabeticOnly: async (value) => {
      if (isEmptyValue(value)) return { isValid: true };
      if (!/^[A-Za-z\s.\-]+$/.test(String(value).trim())) {
        return { isValid: false, message: "Source Name should only contain alphabetic characters" };
      }
      return { isValid: true };
    },
    sourceReference: async (_, fieldName, formData) => {
      const hasSourceId = !isEmptyValue(formData?.sourceId);
      const hasSourceName = !isEmptyValue(formData?.sourceName);

      if (!hasSourceId && !hasSourceName) {
        return { isValid: false, message: "Select a Source Name" };
      }

      return { isValid: true };
    },
    comments: async (value) => {
      if (isEmptyValue(value)) return { isValid: true };
      if (String(value).length > 1000) {
        return { isValid: false, message: "Comments cannot exceed 1000 characters" };
      }
      return { isValid: true };
    },
    phoneRequired: async (value) => {
      if (isEmptyValue(value)) {
        return { isValid: false, message: "Phone Number is required" };
      }

      const digits = String(value).replace(/\D/g, "");
      if (!isValidPhoneNumber(value, 10, 10)) {
        return { isValid: false, message: "Phone Number must be exactly 10 digits" };
      }

      // Reject unrealistic numbers (all same digits like 0000000000, 1111111111, etc.)
      if (/^(\d)\1{9}$/.test(digits)) {
        return { isValid: false, message: "Please enter a valid, realistic phone number" };
      }

      return { isValid: true };
    },
    noticePeriod: async (value, fieldName, formData) => {
      if (isFresherCandidate(formData) && isEmptyValue(value)) {
        return { isValid: true };
      }
      return validateIntegerValue(value, {
        label: "Notice Period (Days)",
        min: 0,
        max: 365
      });
    },
    ctc: async (value, fieldName, formData) => {
      const label = fieldName === "expectedCtc" ? "Expected CTC" : "Current CTC";

      if (isFresherCandidate(formData) && isEmptyValue(value)) {
        return { isValid: true };
      }

      const integerValidation = validateIntegerValue(value, {
        label,
        min: 0,
        max: 1000
      });

      if (!integerValidation.isValid) {
        return integerValidation;
      }

      const currentFormData = { ...(formData || {}), [fieldName]: String(value).trim() };
      const currentDefined = !isEmptyValue(currentFormData.currentCtc);
      const expectedDefined = !isEmptyValue(currentFormData.expectedCtc);

      if (currentDefined && expectedDefined) {
        const currentCtc = parseInt(String(currentFormData.currentCtc).trim(), 10);
        const expectedCtc = parseInt(String(currentFormData.expectedCtc).trim(), 10);

        if (expectedCtc < currentCtc) {
          return { isValid: false, message: "Expected CTC cannot be less than Current CTC" };
        }
      }

      return { isValid: true };
    }
  },
  columns: [
    { key: 'candidateId', label: 'Application Id' },
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'primaryEmail', label: 'Primary Email' },
    { key: 'phoneNumber', label: 'Phone' },
    { key: 'yearsExperience', label: 'Experience' },
    { key: 'currentCompanyName', label: 'Current Company' },
    { key: 'jobTitleRole', label: 'Job Title' }
  ]
};

// Client Configuration
export const clientConfig = {
  title: "Add Client",
  itemName: "Clients",
  formClassName: "client-form",
  hideTitle: true,
  showDraftAction: true,
  draftLabel: "Save as Draft",
  submitLabel: "Submit",
  hideStepper: true,
  steps: [
    {
      title: "Client Information",
      component: ClientBasicInfoStep,
      fields: [
        {
          name: "clientId",
          label: "Client ID *",
          type: "text",
          required: true,
          validationRule: "requiredField",
          placeholder: "Auto Generated",
          disabled: true
        },
        {
          name: "clientName",
          label: "Client Name *",
          type: "text",
          required: true,
          validationRule: "requiredField",
          placeholder: "Enter Last Name"
        },
        {
          name: "contactEmail",
          label: "Contact Email Address *",
          type: "email",
          required: true,
          validationRule: "emailRequired",
          placeholder: "Enter Email Address"
        },
        {
          name: "contactNumber",
          label: "Contact Number *",
          type: "tel",
          required: true,
          validationRule: "phoneRequired",
          placeholder: "Enter Phone Number",
          prefix: "+91"
        },
        {
          name: "primaryContactPerson",
          label: "Primary Contact Person *",
          type: "text",
          required: true,
          validationRule: "requiredField",
          placeholder: "Person Name"
        },
        {
          name: "secondaryContactPerson",
          label: "Secondary Contact Person *",
          type: "text",
          required: true,
          validationRule: "requiredField",
          placeholder: "Person Name"
        },
        {
          name: "accountManager",
          label: "Account Manager *",
          type: "text",
          required: true,
          validationRule: "requiredField",
          placeholder: "Account Manager"
        },
        {
          name: "activeFrom",
          label: "Active From *",
          type: "date",
          required: true,
          validationRule: "requiredField"
        },
        {
          name: "comments",
          label: "Comments / Remarks",
          type: "textarea",
          required: false,
          placeholder: "Comments / Remarks"
        }
      ]
    }
  ],
  validationRules: {
    requiredField: async (value, fieldName) => {
      if (isEmptyValue(value)) {
        const fieldLabels = {
          clientId: 'Client ID',
          clientName: 'Client Name',
          contactEmail: 'Contact Email Address',
          contactNumber: 'Contact Number',
          primaryContactPerson: 'Primary Contact Person',
          secondaryContactPerson: 'Secondary Contact Person',
          accountManager: 'Account Manager',
          activeFrom: 'Active From'
        };
        const fieldLabel = fieldLabels[fieldName] || fieldName;
        return { isValid: false, message: `${fieldLabel} is required` };
      }
      return { isValid: true };
    },
    emailRequired: async (value) => {
      if (isEmptyValue(value)) {
        return { isValid: false, message: "Contact Email Address is required" };
      }

      if (!isValidEmail(value)) {
        return { isValid: false, message: "Please enter a valid email address" };
      }

      return { isValid: true };
    },
    phoneRequired: async (value) => {
      if (isEmptyValue(value)) {
        return { isValid: false, message: "Contact Number is required" };
      }

      const digits = String(value).replace(/\D/g, "");
      if (!isValidPhoneNumber(value, 10, 10)) {
        return { isValid: false, message: "Contact Number must be exactly 10 digits" };
      }

      // Reject unrealistic numbers (all same digits like 0000000000, 1111111111, etc.)
      if (/^(\d)\1{9}$/.test(digits)) {
        return { isValid: false, message: "Please enter a valid, realistic phone number" };
      }

      return { isValid: true };
    },
    namePrefixRequired: async (value) => {
      if (!value || value === 'none') {
        return { isValid: false, message: 'Title is required' };
      }
      return { isValid: true };
    }
  },
  columns: [
    { key: 'clientId', label: 'Client ID' },
    { key: 'clientName', label: 'Client Name' },
    { key: 'contactEmail', label: 'Email' },
    { key: 'contactNumber', label: 'Phone' },
    { key: 'primaryContactPerson', label: 'Primary Contact Person' },
    { key: 'accountManager', label: 'Account Manager' },
    { key: 'activeFrom', label: 'Active From' }
  ]
};
