import axios from 'axios';
import React, { useState, useMemo, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { validateMandatoryField } from '../../utils/formValidation';
import FormField from './FormField';
import MultiStepForm from './MultiStepForm';
import './ReusableForm.css';

const DRAFT_STORAGE_PREFIX = 'reusable-form-draft';

const getDraftStorageKey = (config) => {
  const formIdentity =
    config?.draftKey ||
    config?.itemName ||
    config?.title ||
    config?.submitEndpoint ||
    'form';

  return `${DRAFT_STORAGE_PREFIX}:${String(formIdentity).toLowerCase().replace(/\s+/g, '-')}`;
};

const sanitizeDraftData = (value) => {
  if (value === null || value === undefined) return value;

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeDraftData(item));
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof File !== 'undefined' && value instanceof File) {
    return {
      name: value.name,
      size: value.size,
      type: value.type,
      lastModified: value.lastModified,
    };
  }

  if (typeof Blob !== 'undefined' && value instanceof Blob) {
    return {
      size: value.size,
      type: value.type,
    };
  }

  if (typeof value === 'object') {
    return Object.entries(value).reduce((acc, [key, val]) => {
      acc[key] = sanitizeDraftData(val);
      return acc;
    }, {});
  }

  return value;
};

const loadDraftData = (draftStorageKey) => {
  if (typeof window === 'undefined') return null;

  try {
    const rawDraft = window.localStorage.getItem(draftStorageKey);
    if (!rawDraft) return null;

    const parsed = JSON.parse(rawDraft);
    if (parsed && typeof parsed === 'object' && parsed.data && typeof parsed.data === 'object') {
      return parsed.data;
    }

    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (error) {
    console.error('Failed to load draft data:', error);
    return null;
  }
};

// Reusable form configuration
const createFormConfig = (config) => {
  const allFields = config.steps.flatMap((configStep) => configStep.fields || []);

  return {
    steps: config.steps.map(step => ({
      title: step.title,
      skipValidation: Boolean(step.skipValidation),
      component: step.component
        ? step.component
        : (props) => (
          <FormStep
            {...props}
            fields={step.fields || []}
            allFields={allFields}
            title={step.title}
          />
        )
    })),
    validationRules: config.validationRules || {},
    columns: config.columns || []
  };
};

const normalizeText = (value) => String(value || '').replace(/\s+/g, ' ').trim();

const normalizeToken = (value) => normalizeText(value).toLowerCase();

const toArray = (value) => (Array.isArray(value) ? value : []);

const uniqueValues = (items) => [...new Set(items.filter(Boolean))];

const mergeUnique = (existing, incoming) => uniqueValues([...toArray(existing), ...toArray(incoming)]);

const SUPPORTED_JD_TEXT_EXTENSIONS = new Set(['pdf', 'docx', 'txt']);

const findMatchingOptionValue = (text, options = []) => {
  const normalized = normalizeToken(text);
  if (!normalized) return '';

  const matched = options.find((option) => {
    const label = normalizeToken(option?.label ?? option?.value);
    const value = normalizeToken(option?.value);
    return (label && normalized.includes(label)) || (value && normalized.includes(value));
  });

  return matched?.value || '';
};

const collectMatchingOptionValues = (text, options = []) => {
  const normalized = normalizeToken(text);
  if (!normalized) return [];

  return uniqueValues(
    options
      .filter((option) => {
        const label = normalizeToken(option?.label ?? option?.value);
        const value = normalizeToken(option?.value);
        return (label && normalized.includes(label)) || (value && normalized.includes(value));
      })
      .map((option) => option?.value)
  );
};

const readDocxText = async (file) => {
  const mammoth = await import('mammoth/mammoth.browser');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return normalizeText(result?.value || '');
};

const readPdfText = async (file) => {
  if (pdfjsLib.GlobalWorkerOptions.workerSrc !== pdfjsWorkerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc;
  }

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDocument = await loadingTask.promise;
  const pageTexts = [];

  for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
    const page = await pdfDocument.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    pageTexts.push(pageText);
  }

  const extractedText = normalizeText(pageTexts.join('\n'));
  return extractedText;
};

const getUploadedFileExtension = (file) => String(file?.name || '').split('.').pop()?.toLowerCase() || '';

const getUnsupportedFileMessage = (extension) => {
  if (extension === 'doc') {
    return 'Legacy .doc files are not supported for auto-fill. Use PDF, DOCX, or TXT.';
  }

  if (extension && !SUPPORTED_JD_TEXT_EXTENSIONS.has(extension)) {
    return `.${extension} files are not supported for JD auto-fill. Use PDF, DOCX, or TXT.`;
  }

  return 'JD uploaded, but readable text was not detected. Use a PDF, DOCX, or TXT file with selectable text.';
};

const readUploadedFileText = async (file) => {
  const extension = getUploadedFileExtension(file);

  if (extension === 'pdf') {
    return readPdfText(file);
  }

  if (extension === 'docx') {
    return readDocxText(file);
  }

  if (extension === 'txt') {
    return normalizeText(await file.text());
  }

  return '';
};

// Reusable step component
const FormStep = ({
  formData,
  onChange,
  onBulkChange,
  fields,
  allFields = fields,
  title,
  onSetStepFields,
  validationErrors = {},
  disabled = false
}) => {
  const isJobBasicInfo = title === "Job Basic Information" || title === "Job Information";
  const fieldMetaSignatureRef = React.useRef('');
  const jdParsedFileRef = React.useRef('');
  const jdProcessingRef = React.useRef(false);
  const onChangeRef = React.useRef(onChange);
  const [jdTemplateMode, setJdTemplateMode] = React.useState(
    formData.jdAttachmentMode === 'yes' ? 'yes' : 'no'
  );
  const [jdExtractionStatus, setJdExtractionStatus] = React.useState({ state: 'idle', message: '' });
  const [jdGenerationStatus, setJdGenerationStatus] = React.useState({ state: 'idle', message: '' });
  const [isGeneratingJd, setIsGeneratingJd] = React.useState(false);

  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Notify parent about fields in this step
  React.useEffect(() => {
    if (onSetStepFields) {
      const fieldMeta = fields.map(field => ({
        name: field.name,
        label: field.label,
        required: Boolean(field.required)
      }));

      const nextSignature = JSON.stringify(fieldMeta);
      if (fieldMetaSignatureRef.current === nextSignature) {
        return;
      }
      fieldMetaSignatureRef.current = nextSignature;
      onSetStepFields(fieldMeta);
    }
  }, [fields, onSetStepFields, isJobBasicInfo]);

  React.useEffect(() => {
    const clientNameField = fields.find((field) => field.name === "clientName");
    const selectedClientName = formData.clientName;
    if (!clientNameField || !Array.isArray(clientNameField.options) || !selectedClientName) {
      return;
    }

    const matchedClient = clientNameField.options.find(
      (option) => String(option.value) === String(selectedClientName)
    );
    const mappedClientId = matchedClient?.clientId || matchedClient?.id || "";

    if (mappedClientId && mappedClientId !== formData.clientId) {
      onChangeRef.current("clientId", mappedClientId);
    }
  }, [fields, formData.clientId, formData.clientName]);

  React.useEffect(() => {
    if (!isJobBasicInfo) return;
    if (formData.jdAttachmentMode === 'yes' && jdTemplateMode !== 'yes') {
      setJdTemplateMode('yes');
      return;
    }
    if (formData.jdAttachmentMode === 'no' && jdTemplateMode !== 'no' && !formData.jdAttachment) {
      setJdTemplateMode('no');
    }
  }, [formData.jdAttachment, formData.jdAttachmentMode, isJobBasicInfo, jdTemplateMode]);

  React.useEffect(() => {
    if (!isJobBasicInfo) return;

    const uploadedFile = formData.jdAttachment;
    if (!uploadedFile || typeof uploadedFile !== 'object') {
      setJdExtractionStatus({ state: 'idle', message: '' });
      jdProcessingRef.current = false;
      jdParsedFileRef.current = '';
      return;
    }

    // Don't re-trigger extraction if we're already processing this file
    if (jdProcessingRef.current) {
      return;
    }

    if (jdTemplateMode !== 'yes') {
      setJdTemplateMode('yes');
    }
    if (formData.jdAttachmentMode !== 'yes') {
      onChangeRef.current('jdAttachmentMode', 'yes');
    }

    const fileKey = `${uploadedFile.name || ''}-${uploadedFile.size || 0}-${uploadedFile.lastModified || 0}`;
    if (jdParsedFileRef.current === fileKey) {
      return;
    }

    const extension = getUploadedFileExtension(uploadedFile);
    
    // Mark file as being processed immediately
    jdParsedFileRef.current = fileKey;
    jdProcessingRef.current = true;

    const parseAndPopulate = async () => {
      try {
        setJdExtractionStatus({ state: 'loading', message: 'Reading JD and extracting fields...' });

        if (!SUPPORTED_JD_TEXT_EXTENSIONS.has(extension)) {
          setJdExtractionStatus({ state: 'warning', message: getUnsupportedFileMessage(extension) });
          return;
        }

        const extractedText = await readUploadedFileText(uploadedFile);
        const rawDocumentText = String(extractedText || '');
        const fileNameWithoutExt = normalizeText(String(uploadedFile.name || '').replace(/\.[^.]+$/, ''));
        const documentText = normalizeText(rawDocumentText);
        const combinedText = normalizeText(`${fileNameWithoutExt} ${documentText}`);
        const normalizedText = normalizeToken(combinedText);
        const rawLines = rawDocumentText
          .split(/\r?\n/)
          .map((line) => line.replace(/\u00A0/g, ' '))
          .map((line) => line.trim())
          .filter(Boolean);

        if (!documentText) {
          setJdExtractionStatus({ state: 'warning', message: getUnsupportedFileMessage(extension) });
          return;
        }

        const updates = {};
        const availableFields = Array.isArray(allFields) && allFields.length ? allFields : fields;
        const getAvailableField = (fieldName) =>
          availableFields.find((field) => field.name === fieldName);
        const normalizeKey = (value) => normalizeToken(String(value || '').replace(/[^a-zA-Z0-9\s]/g, ' '));
        const keyValueEntries = rawLines
          .map((line) => {
            const colonSeparatedMatch = line.match(/^([^:\-]{2,80})\s*[:\-]\s*(.+)$/);
            const tableSeparatedMatch = colonSeparatedMatch
              ? null
              : line.match(/^(.{2,80}?)(?:\t+|\s{2,})(.{1,})$/);

            const match = colonSeparatedMatch || tableSeparatedMatch;
            if (!match) return null;

            const rawKey = normalizeText(match[1]);
            const rawValue = normalizeText(match[2]);
            if (!rawKey || !rawValue) return null;
            if (/^(yes|no)$/i.test(rawValue)) return null;

            return {
              key: normalizeKey(rawKey),
              value: rawValue
            };
          })
          .filter((entry) => entry && entry.key && entry.value);
        const getLineLabelValue = (labels = []) => {
          const normalizedLabels = labels.map((label) => normalizeKey(label));
          const matchedEntry = keyValueEntries.find((entry) =>
            normalizedLabels.some((label) => entry.key.includes(label) || label.includes(entry.key))
          );
          return normalizeText(matchedEntry?.value || '');
        };
        const extractLabelValue = (labels, stopLabels = []) => {
          const labelPattern = labels.map((label) => label.replace(/\s+/g, '\\s*')).join('|');
          const stopLabelPattern = [
            ...stopLabels,
            'job\\s*name',
            'position\\s*name',
            'job\\s*title',
            'role',
            'client\\s*id',
            'client\\s*name',
            'contact\\s*person\\s*name',
            'contact\\s*person\\s*email(?:\\s*id)?',
            'contact\\s*email(?:\\s*id)?',
            'position\\s*level',
            'location',
            'job\\s*type',
            'employment\\s*type',
            'work\\s*type',
            'hiring\\s*type',
            'positions?',
            'openings?',
            'min(?:imum)?\\s*(?:experience|exp|salary|ctc)',
            'max(?:imum)?\\s*(?:experience|exp|salary|ctc)',
            'salary',
            'ctc',
            'technical\\s*skills?',
            'soft\\s*skills?',
            'additional\\s*skills?'
          ].join('|');
          const match = documentText.match(
            new RegExp(`(?:${labelPattern})\\s*[:\\-]\\s*(.+?)(?=\\s+(?:${stopLabelPattern})\\s*[:\\-]|$)`, 'i')
          );
          return normalizeText(match?.[1] || '');
        };

        let positionMatch = getLineLabelValue(['job name', 'position name', 'position', 'job title', 'role', 'designation']) || documentText.match(
          /(?:job\s*name|position\s*name|job\s*title|role)\s*[:\-]\s*(.+?)(?=\s+(?:position\s*level|location|job\s*type|employment\s*type|work\s*type|hiring\s*type|positions?|openings?|min(?:imum)?\s*(?:experience|exp|salary|ctc)|max(?:imum)?\s*(?:experience|exp|salary|ctc)|salary|ctc|technical\s*skills?|soft\s*skills?|additional\s*skills?)\s*[:\-]|$)/i
        )?.[1];
        if (positionMatch) {
          // Stop at common adjacent field labels (e.g. "Min Experience", "Max Experience", "Experience")
          positionMatch = positionMatch.replace(/\s*(?:min(?:imum)?|max(?:imum)?)\s*(?:experience|exp)?.*$/i, '').trim();
          positionMatch = positionMatch.replace(/\s*experience\b.*$/i, '').trim();
          // Limit to first 4 words and 100 chars
          positionMatch = positionMatch.split(/\s+/).slice(0, 4).join(' ').substring(0, 100);
        }

        if (positionMatch && !normalizeText(formData.positionName)) {
          updates.positionName = normalizeText(positionMatch);
        }

        const rangeMatch = normalizedText.match(/(\d{1,2})\s*(?:to|\-|–)\s*(\d{1,2})\s*(?:years|year|yrs|yr)/i);
        const minMatch = normalizedText.match(/(?:minimum|min)\s*(?:experience)?\s*[:\-]?\s*(\d{1,2})/i);
        const maxMatch = normalizedText.match(/(?:maximum|max)\s*(?:experience)?\s*[:\-]?\s*(\d{1,2})/i);

        const minExperienceFromLine = getLineLabelValue(['min experience', 'minimum experience', 'experience min']).match(/\d{1,2}/)?.[0] || '';
        const maxExperienceFromLine = getLineLabelValue(['max experience', 'maximum experience', 'experience max']).match(/\d{1,2}/)?.[0] || '';

        const minExperience = rangeMatch?.[1] || minMatch?.[1] || minExperienceFromLine;
        const maxExperience = rangeMatch?.[2] || maxMatch?.[1] || maxExperienceFromLine;

        if (minExperience && !normalizeText(formData.minExperience)) {
          updates.minExperience = minExperience;
        }
        if (maxExperience && !normalizeText(formData.maxExperience)) {
          updates.maxExperience = maxExperience;
        }

        const normalizeSalaryNumber = (value) => {
          const raw = String(value || '').replace(/,/g, '').trim();
          if (!raw) return '';
          const parsed = Number.parseFloat(raw);
          if (!Number.isFinite(parsed)) return '';
          return String(Math.round(parsed));
        };

        const salaryRangeMatch = combinedText.match(
          /(?:salary|ctc|compensation|package)\s*(?:range)?\s*[:\-]?\s*(\d[\d,]*(?:\.\d+)?)\s*(?:to|\-|–)\s*(\d[\d,]*(?:\.\d+)?)/i
        );
        const minSalaryMatch = combinedText.match(
          /(?:min(?:imum)?\s*(?:salary|ctc|compensation|package)|(?:salary|ctc)\s*min)\s*[:\-]?\s*(\d[\d,]*(?:\.\d+)?)/i
        );
        const maxSalaryMatch = combinedText.match(
          /(?:max(?:imum)?\s*(?:salary|ctc|compensation|package)|(?:salary|ctc)\s*max)\s*[:\-]?\s*(\d[\d,]*(?:\.\d+)?)/i
        );

        const minSalaryFromLine = getLineLabelValue(['min salary', 'minimum salary', 'salary min', 'min ctc', 'minimum ctc']);
        const maxSalaryFromLine = getLineLabelValue(['max salary', 'maximum salary', 'salary max', 'max ctc', 'maximum ctc']);
        const minSalary = normalizeSalaryNumber(salaryRangeMatch?.[1] || minSalaryMatch?.[1] || minSalaryFromLine);
        const maxSalary = normalizeSalaryNumber(salaryRangeMatch?.[2] || maxSalaryMatch?.[1] || maxSalaryFromLine);

        if (minSalary && !normalizeText(formData.minSalary)) {
          updates.minSalary = minSalary;
        }
        if (maxSalary && !normalizeText(formData.maxSalary)) {
          updates.maxSalary = maxSalary;
        }

        const openingsMatch = normalizedText.match(/(?:positions?|openings?)\s*[:\-]?\s*(\d{1,3})/i);
        const openingsFromLine = getLineLabelValue(['positions', 'no of positions', 'number of positions', 'openings']).match(/\d{1,3}/)?.[0] || '';
        const openingsValue = openingsMatch?.[1] || openingsFromLine;
        if (openingsValue && !normalizeText(formData.noOfPositions)) {
          updates.noOfPositions = openingsValue;
        }

        if (!normalizeText(formData.jobReceivedDate)) {
          const today = new Date();
          const yyyy = today.getFullYear();
          const mm = String(today.getMonth() + 1).padStart(2, '0');
          const dd = String(today.getDate()).padStart(2, '0');
          updates.jobReceivedDate = `${yyyy}-${mm}-${dd}`;
        }

        const locationField = getAvailableField('location');
        const locationValues = collectMatchingOptionValues(normalizedText, locationField?.options || []);
        if (locationValues.length > 0 && !normalizeText(formData.location)) {
          updates.location = locationValues;
        }

        const positionLevelField = getAvailableField('positionLevel');
        const positionLevelValue = findMatchingOptionValue(normalizedText, positionLevelField?.options || []);
        if (positionLevelValue && !normalizeText(formData.positionLevel)) {
          updates.positionLevel = positionLevelValue;
        }

        const jobTypeField = getAvailableField('jobType');
        const jobTypeValue = findMatchingOptionValue(normalizedText, jobTypeField?.options || []);
        if (jobTypeValue && !normalizeText(formData.jobType)) {
          updates.jobType = jobTypeValue;
        }

        const hiringTypeField = getAvailableField('hiringType');
        const hiringTypeValue = findMatchingOptionValue(normalizedText, hiringTypeField?.options || []);
        if (hiringTypeValue && !normalizeText(formData.hiringType)) {
          updates.hiringType = hiringTypeValue;
        }

        const clientNameField = getAvailableField('clientName');
        const clientNameFromLabel = getLineLabelValue(['client name']) || extractLabelValue(['client\\s*name']);
        const clientNameValue = findMatchingOptionValue(
          clientNameFromLabel || normalizedText,
          clientNameField?.options || []
        );
        const clientName = clientNameValue || clientNameFromLabel;
        if (clientName && !normalizeText(formData.clientName)) {
          updates.clientName = clientName;
        }

        const matchedClientOption = clientNameField?.options?.find(
          (option) => String(option.value) === String(clientName || formData.clientName)
        );
        const clientIdFromLabel = getLineLabelValue(['client id']) || extractLabelValue(['client\\s*id']);
        const clientId = matchedClientOption?.clientId || matchedClientOption?.id || clientIdFromLabel;
        if (clientId && !normalizeText(formData.clientId)) {
          updates.clientId = clientId;
        }

        const contactPersonName = getLineLabelValue([
          'contact person name',
          'contact name'
        ]) || extractLabelValue([
          'contact\\s*person\\s*name',
          'contact\\s*name'
        ]);
        if (contactPersonName && !normalizeText(formData.contactPersonName)) {
          updates.contactPersonName = contactPersonName;
        }

        const contactEmail = getLineLabelValue([
          'contact person email',
          'contact email',
          'email'
        ]) || documentText.match(
          /(?:contact\s*person\s*email(?:\s*id)?|contact\s*email(?:\s*id)?|email)\s*[:\-]\s*([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i
        )?.[1];
        if (contactEmail && !normalizeText(formData.contactPersonEmail)) {
          const detectedEmail = String(contactEmail).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || '';
          if (detectedEmail) {
            updates.contactPersonEmail = detectedEmail;
          }
        }

        const technicalField = getAvailableField('technicalSkills');
        const technicalLineValue = getLineLabelValue(['technical skills', 'primary skills', 'mandatory skills', 'skills']);
        const extractedTechnicalSkills = collectMatchingOptionValues(
          normalizeToken(`${normalizedText} ${technicalLineValue}`),
          technicalField?.options || []
        );
        if (extractedTechnicalSkills.length > 0) {
          updates.technicalSkills = mergeUnique(formData.technicalSkills, extractedTechnicalSkills);
        }

        const softField = getAvailableField('softSkills');
        const softLineValue = getLineLabelValue(['soft skills', 'behavioral skills']);
        const extractedSoftSkills = collectMatchingOptionValues(
          normalizeToken(`${normalizedText} ${softLineValue}`),
          softField?.options || []
        );
        if (extractedSoftSkills.length > 0) {
          updates.softSkills = mergeUnique(formData.softSkills, extractedSoftSkills);
        }

        const additionalSkillsFromLine = getLineLabelValue(['additional skills', 'other skills']);
        const additionalSkillsMatch = combinedText.match(
          /(?:additional\s*skills?|additional\s*skill)\s*[:\-]\s*(.+?)(?=(?:technical\s*skills?|soft\s*skills?|job\s*type|hiring\s*type|location|position\s*level|positions?|openings?|minimum\s*experience|maximum\s*experience|min\s*experience|max\s*experience|job\s*description|responsibilities|qualifications|$))/i
        )?.[1];
        const extractedAdditionalSkills = normalizeText(additionalSkillsFromLine || additionalSkillsMatch);
        if (extractedAdditionalSkills && !normalizeText(formData.additionalSkills)) {
          updates.additionalSkills = extractedAdditionalSkills;
        }

        const fieldCount = Object.keys(updates).length;
        if (fieldCount > 0) {
          if (typeof onBulkChange === 'function') {
            onBulkChange(updates);
          } else {
            Object.entries(updates).forEach(([key, value]) => {
              onChangeRef.current(key, value);
            });
          }

          const message = `${fieldCount} field(s) auto-filled from uploaded JD.`;
          setJdExtractionStatus({ state: 'success', message });
        } else {
          setJdExtractionStatus({ state: 'warning', message: 'JD uploaded, but no matching values were detected for form fields.' });
        }
      } catch (error) {
        console.error('[JD EXTRACTION] Error during parsing:', error);
        setJdExtractionStatus({ state: 'error', message: 'Unable to parse this file. Try a PDF, DOCX, or TXT file.' });
      } finally {
        // Always reset processing flag when done
        jdProcessingRef.current = false;
      }
    };

    parseAndPopulate().catch((err) => {
      console.error('[JD EXTRACTION] Uncaught error in parseAndPopulate:', err);
      jdProcessingRef.current = false;
    });
  }, [formData.jdAttachment, isJobBasicInfo]);

  const renderField = (field) => {
    const isAutoMappedClientName = isJobBasicInfo && field.name === "clientName";
    const isRemoteWorkType = String(formData.hiringType || '').trim().toLowerCase() === 'remote';
    const isLocationField = field.name === 'location';
    const effectiveRequired = isLocationField ? !isRemoteWorkType : field.required;
    const effectiveLabel = isLocationField && isRemoteWorkType
      ? String(field.label || '').replace(/\s*\*\s*$/, '')
      : field.label;

    return (
      <FormField
        key={field.name}
        label={effectiveLabel}
        type={field.type}
        name={field.name}
        value={
          formData[field.name] !== undefined && formData[field.name] !== null
            ? formData[field.name]
            : (field.type === 'multiselect' ? [] : '')
        }
        onChange={onChange}
        required={effectiveRequired}
        options={field.options}
        validate={field.validate}
        error={validationErrors[field.name]}
        onValidation={field.onValidation}
        placeholder={field.placeholder}
        hideLabel={field.hideLabel}
        accept={field.accept}
        multiple={field.multiple}
        prefix={field.prefix}
        suffix={field.suffix}
        formData={formData}
        disabled={disabled || Boolean(field.disabled) || isAutoMappedClientName}
        showBrowseButton={field.showBrowseButton}
        rows={field.rows}
        maxLength={field.maxLength}
        useParentValidation
      />
    );
  };

  if (isJobBasicInfo) {
    const hasUploadedJdFile = Boolean(formData.jdAttachment && typeof formData.jdAttachment === 'object');
    const isJdTemplateEnabled = jdTemplateMode === 'yes' || hasUploadedJdFile;

    // Create a map of fields by name (and cssClass where helpful)
    const fieldMap = {};
    fields.forEach(field => {
      if (field.cssClass) {
        fieldMap[field.cssClass] = field;
      }
      fieldMap[field.name] = field;
    });

    const getField = (name) => (fieldMap[name] ? renderField(fieldMap[name]) : null);
    const getFirstAvailableField = (keys, predicate) => {
      for (const key of keys) {
        if (fieldMap[key]) {
          return renderField(fieldMap[key]);
        }
      }
      if (typeof predicate === 'function') {
        const matchedField = fields.find(predicate);
        if (matchedField) {
          return renderField(matchedField);
        }
      }
      return null;
    };

    const renderGroup = (label, required, minKey, maxKey) => (
      <div className="field-group">
        <div className="field-group-label">
          {label}
          {required && <span className="required-star">*</span>}
        </div>
        <div className="min-max-container">
          {getField(minKey)}
          {getField(maxKey)}
        </div>
      </div>
    );

    const technicalSkillsOptions = Array.isArray(fieldMap.technicalSkills?.options)
      ? fieldMap.technicalSkills.options
      : [];

    const fallbackAddTechnicalOptions = technicalSkillsOptions.length
      ? technicalSkillsOptions
      : [
        { value: 'machine-learning', label: 'Machine Learning' },
        { value: 'deep-learning', label: 'Deep Learning' },
        { value: 'nlp', label: 'NLP' },
        { value: 'data-science', label: 'Data Science' },
        { value: 'computer-vision', label: 'Computer Vision' },
        { value: 'azure', label: 'Microsoft Azure' }
      ];

    const addTechnicalConfig =
      fieldMap.addTechnicalSkills ||
      fieldMap.addTechnicalSkill ||
      fieldMap.additionalTechnicalSkills ||
      fieldMap['grid-col-1 grid-row-6'] ||
      fields.find((field) => {
        const fieldName = String(field?.name || '').toLowerCase();
        const fieldLabel = String(field?.label || '').toLowerCase();
        return (
          field?.cssClass?.includes('grid-row-6') ||
          fieldName.includes('addtechnical') ||
          (fieldName.includes('technical') && fieldName.includes('additional')) ||
          (fieldLabel.includes('add') && fieldLabel.includes('technical'))
        );
      }) ||
      {
        name: 'extraTechnicalSkills',
        label: 'Add Technical Skill',
        type: 'multiselect',
        required: false
      };

    const addTechnicalFieldName = addTechnicalConfig.name || 'extraTechnicalSkills';
    const addTechnicalFieldOptions = Array.isArray(addTechnicalConfig.options) && addTechnicalConfig.options.length
      ? addTechnicalConfig.options
      : fallbackAddTechnicalOptions;
    const normalizedAddTechnicalConfig = {
      ...addTechnicalConfig,
      name: addTechnicalFieldName,
      label: addTechnicalConfig.label || 'Add Technical Skill',
      type: 'multiselect',
      required: Boolean(addTechnicalConfig.required),
      options: addTechnicalFieldOptions,
      placeholder: addTechnicalConfig.placeholder || 'Select skills'
    };
    const jobDescriptionField = fieldMap.jobDescription || null;
    const canGenerateJobDescription =
      Boolean(jobDescriptionField) &&
      typeof jobDescriptionField.generateAction === 'function' &&
      !disabled;

    const handleGenerateJobDescription = async () => {
      if (!canGenerateJobDescription || isGeneratingJd) {
        return;
      }

      setIsGeneratingJd(true);
      setJdGenerationStatus({
        state: 'loading',
        message: 'Generating a recruiter-ready job description from the job details above...',
      });

      try {
        const result = await jobDescriptionField.generateAction(formData);
        const generatedText = String(
          typeof result === 'string'
            ? result
            : result?.jobDescription || result?.generatedJobDescription || result?.generatedJd || ''
        ).trim();

        if (!normalizeText(generatedText)) {
          throw new Error('The AI service returned an empty JD. Add more role details and try again.');
        }

        onChange('jobDescription', generatedText);
        setJdGenerationStatus({
          state: 'success',
          message:
            typeof result === 'object' && String(result?.message || '').trim()
              ? String(result.message).trim()
              : 'Job description generated. You can review and refine it before saving.',
        });
      } catch (error) {
        setJdGenerationStatus({
          state: 'error',
          message: error?.message || 'Unable to generate the job description right now.',
        });
      } finally {
        setIsGeneratingJd(false);
      }
    };

    return (
      <div className="job-basic-info-step">
        <div className="job-section">
          <div className="job-section-header">
            <h3 className="job-section-title">Job Details</h3>
            <div className="job-section-divider" />
          </div>

          <div className="job-basic-info-grid">
            <div className="grid-cell grid-col-1 grid-row-1">
              <div className="job-template-choice">
                <div className="job-template-choice-label">
                  Have JD Template?
                  <span className="required-star">*</span>
                </div>
                <div className="job-template-choice-options" role="radiogroup" aria-label="Have JD Template">
                  <label className="job-template-choice-option" htmlFor="jdAttachmentMode-no">
                    <input
                      id="jdAttachmentMode-no"
                      type="radio"
                      name="jdAttachmentMode"
                      value="no"
                      checked={!isJdTemplateEnabled}
                      onChange={() => {
                        setJdTemplateMode("no");
                        onChange("jdAttachmentMode", "no");
                        onChange("jdAttachment", "");
                        setJdExtractionStatus({ state: 'idle', message: '' });
                      }}
                    />
                    <span>No</span>
                  </label>
                  <label className="job-template-choice-option" htmlFor="jdAttachmentMode-yes">
                    <input
                      id="jdAttachmentMode-yes"
                      type="radio"
                      name="jdAttachmentMode"
                      value="yes"
                      checked={isJdTemplateEnabled}
                      onChange={() => {
                        setJdTemplateMode("yes");
                        onChange("jdAttachmentMode", "yes");
                      }}
                    />
                    <span>Yes</span>
                  </label>
                </div>
                {isJdTemplateEnabled && (
                  <div className="job-template-upload-wrap">
                    {getField('jdAttachment')}
                    {jdExtractionStatus.state !== 'idle' ? (
                      <div className={`jd-extraction-status jd-extraction-status--${jdExtractionStatus.state}`}>
                        {jdExtractionStatus.message}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
            <div className="grid-cell grid-col-2 grid-row-1">
              {getField('jobPositionId')}
            </div>
            <div className="grid-cell grid-col-3 grid-row-1">
              {getField('positionName')}
            </div>
            <div className="grid-cell grid-col-1 grid-row-2">
              {renderGroup('Experience', true, 'minExperience', 'maxExperience')}
            </div>
            <div className="grid-cell grid-col-2 grid-row-2">
              {getField('positionLevel')}
            </div>
            <div className="grid-cell grid-col-3 grid-row-2">
              {getField('hiringType')}
            </div>

            <div className="grid-cell grid-col-1 grid-row-3">
              {getField('noOfPositions')}
            </div>
            <div className="grid-cell grid-col-2 grid-row-3">
              {getField('jobReceivedDate')}
            </div>
            <div className="grid-cell grid-col-3 grid-row-3">
              {renderGroup('Salary In CTC', true, 'minSalary', 'maxSalary')}
            </div>

            <div className="grid-cell grid-col-1 grid-row-4">
              {getField('jobType')}
            </div>
            <div className="grid-cell grid-col-2 grid-row-4">
              {getField('softSkills')}
            </div>
            <div className="grid-cell grid-col-3 grid-row-4">
              {getField('location')}
            </div>

            <div className="grid-cell grid-col-1 grid-row-5">
              {getField('technicalSkills')}
            </div>
            <div className="grid-cell grid-col-2 grid-row-5">
              {getField('additionalSkills')}
            </div>
            <div className="grid-cell grid-col-3 grid-row-5">
              {renderField(normalizedAddTechnicalConfig)}
            </div>
          </div>
        </div>

        {jobDescriptionField ? (
          <div className="job-section">
            <div className="job-section-header">
              <h3 className="job-section-title">Job Description</h3>
              <div className="job-section-divider" />
            </div>

            <div className="jd-description-wrapper">
              {renderField(jobDescriptionField)}
              <div className="jd-description-actions">
                <div
                  className={`jd-generation-status jd-generation-status--${
                    jdGenerationStatus.state === 'idle' ? 'hint' : jdGenerationStatus.state
                  }`}
                >
                  {jdGenerationStatus.state === 'idle'
                    ? 'Leave this box empty if you want. "Generate JD" can draft it now, and "Create JD" will auto-generate it from the required fields before saving.'
                    : jdGenerationStatus.message}
                </div>
                {typeof jobDescriptionField.generateAction === 'function' ? (
                  <button
                    type="button"
                    className="generate-jd-button"
                    onClick={handleGenerateJobDescription}
                    disabled={disabled || isGeneratingJd}
                  >
                    {isGeneratingJd
                      ? 'Generating...'
                      : jobDescriptionField.generateActionLabel || 'Generate JD'}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

      </div>
    );
  }

  return (
    <div>
      <h3>{title}</h3>
      {fields.map(field => renderField(field))}
    </div>
  );
};

// Main reusable form component
const ReusableForm = ({ config, onSubmit, initialData, readOnly = false }) => {
  const [validationErrors, setValidationErrors] = useState({});
  const [showDraftRestoredMessage, setShowDraftRestoredMessage] = useState(false);

  const draftStorageKey = useMemo(() => getDraftStorageKey(config), [config]);

  const draftLoadResult = useMemo(() => {
    if (initialData) {
      return { data: initialData, restoredFromDraft: false };
    }

    const draftData = loadDraftData(draftStorageKey);
    return {
      data: draftData || null,
      restoredFromDraft: Boolean(draftData),
    };
  }, [initialData, draftStorageKey]);

  const resolvedInitialData = draftLoadResult.data;

  const formConfig = useMemo(() => createFormConfig(config), [config]);

  React.useEffect(() => {
    setValidationErrors({});
  }, [initialData, config]);

  React.useEffect(() => {
    if (!draftLoadResult.restoredFromDraft) return;

    setShowDraftRestoredMessage(true);
    const timer = window.setTimeout(() => {
      setShowDraftRestoredMessage(false);
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [draftLoadResult.restoredFromDraft]);

  const clearSavedDraft = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(draftStorageKey);
    } catch (error) {
      console.error('Failed to clear draft data:', error);
    }
  }, [draftStorageKey]);

  const handleSaveDraft = useCallback(
    async (formData) => {
      if (config.onSaveDraft) {
        await config.onSaveDraft(formData);
        return;
      }

      if (typeof window === 'undefined') return;

      try {
        const payload = {
          savedAt: new Date().toISOString(),
          data: sanitizeDraftData(formData),
        };

        window.localStorage.setItem(draftStorageKey, JSON.stringify(payload));
        alert(`${config.itemName || config.title || 'Form'} draft saved successfully`);
      } catch (error) {
        console.error('Failed to save draft data:', error);
        alert('Failed to save draft. Please try again.');
      }
    },
    [config, draftStorageKey]
  );

  // Create validation functions
  const createValidationFunction = useCallback((ruleName) => {
    const rule = config.validationRules?.[ruleName];
    if (!rule) return null;

    return async (value, fieldName, formData) => {
      try {
        const result = await rule(value, fieldName, formData);
        if (result && typeof result === 'object' && 'isValid' in result) {
          return result;
        }
        return { isValid: true };
      } catch (error) {
        if (error && typeof error === 'object' && 'isValid' in error) {
          return error;
        }
        return { isValid: false, message: 'Validation failed' };
      }
    };
  }, [config.validationRules]);

  // Handle validation - persist errors until field value is valid
  const handleValidation = useCallback((fieldName, result) => {
    setValidationErrors(prev => {
      const updatedErrors = { ...prev };

      if (result.isValid) {
        // Only clear error if field is actually valid
        delete updatedErrors[fieldName];
      } else {
        // Set error message and keep it
        updatedErrors[fieldName] = result.message;
      }

      return updatedErrors;
    });
  }, []);

  // Enhanced steps with validation
  const enhancedSteps = useMemo(() => {
    return formConfig.steps.map((step, index) => {
      const configStep = config.steps[index];
      const stepFields = configStep?.fields || [];
      const stepFieldsWithValidation = stepFields.map(field => ({
        ...field,
        validate: field.validationRule ? createValidationFunction(field.validationRule) : field.validate || null,
        onValidation: handleValidation
      }));

      return {
        title: step.title,
        skipValidation: Boolean(configStep?.skipValidation),
        fields: stepFieldsWithValidation,
        component: step.component || FormStep,
        componentProps: {
          fields: stepFieldsWithValidation,
          allFields: config.steps.flatMap((configStep) => configStep.fields || []),
          validationErrors: validationErrors,
          disabled: readOnly
        }
      };
    });
  }, [formConfig, config.steps, createValidationFunction, handleValidation, validationErrors, readOnly]);

  const resolveFieldValue = useCallback((data, fieldName) => {
    if (data && data[fieldName] !== undefined) {
      return data[fieldName];
    }

    if (["primarySkill", "skillExperienceYears", "skillRating", "skillExperienceLevel"].includes(fieldName)) {
      return data?.skills?.[0]?.[fieldName];
    }

    return data?.[fieldName];
  }, []);

  const isLocationRequired = useCallback((data) => {
    const hiringTypeValue = String(resolveFieldValue(data, 'hiringType') || '').trim().toLowerCase();
    return hiringTypeValue !== 'remote';
  }, [resolveFieldValue]);

  // Validate all mandatory fields at once
  const validateAllMandatoryFields = async (data, fields) => {
    const errors = {};

    const validationResults = await Promise.all(
      fields.map(async (field) => {
        const shouldTreatAsRequired =
          field.required && (field.name !== 'location' || isLocationRequired(data));

        if (!shouldTreatAsRequired && !field.validationRule) {
          return null;
        }

        if (field.validationRule) {
          const validateFn = createValidationFunction(field.validationRule);
          if (!validateFn) return null;
          const result = await validateFn(resolveFieldValue(data, field.name), field.name, data);
          return { field, result };
        }

        if (shouldTreatAsRequired) {
          const result = await validateMandatoryField(
            resolveFieldValue(data, field.name),
            field.name,
            field.label
          );
          return { field, result };
        }

        return null;
      })
    );

    validationResults.forEach((item) => {
      if (!item) return;
      const { field, result } = item;
      if (result && !result.isValid) {
        errors[result.fieldName || field.name] = result.message;
      }
    });

    return { isValid: Object.keys(errors).length === 0, errors };
  };

  const validateFieldOnChange = useCallback(async (fieldName, value, formData) => {
    const allFields = config.steps.flatMap((step) => step.fields || []);
    const field = allFields.find((item) => item.name === fieldName);

    if (fieldName === 'hiringType') {
      const required = isLocationRequired(formData);
      if (!required) {
        setValidationErrors((prev) => {
          if (!prev.location) {
            return prev;
          }
          const updated = { ...prev };
          delete updated.location;
          return updated;
        });
      }
    }

    const shouldTreatAsRequired =
      field?.required && (field.name !== 'location' || isLocationRequired(formData));

    if (!field || (!shouldTreatAsRequired && !field.validationRule)) {
      return;
    }

    let result = null;

    if (field.validationRule) {
      const validateFn = createValidationFunction(field.validationRule);
      if (validateFn) {
        result = await validateFn(value, fieldName, formData);
      }
    } else if (shouldTreatAsRequired) {
      const fieldLabel = field.label ? field.label.replace('*', '').trim() : field.name;
      result = await validateMandatoryField(value, field.name, fieldLabel);
    }

    if (result) {
      handleValidation(fieldName, result);
    }
  }, [config.steps, createValidationFunction, handleValidation, isLocationRequired]);

  const handleSubmit = async (formData) => {
    const itemLabel = String(config.itemName || 'Form').toLowerCase();
    let didRunSubmitCallback = false;

    try {
      let preparedFormData = formData;

      if (typeof config.prepareSubmitData === 'function') {
        preparedFormData = await config.prepareSubmitData(formData);
      }

      // Validate all mandatory fields before submission
      const allFields = config.steps.flatMap(step => step.fields || []);
      const { isValid: isMandatoryValid, errors: mandatoryErrors } = await validateAllMandatoryFields(
        preparedFormData,
        allFields
      );

      // Update validation errors state
      if (!isMandatoryValid) {
        setValidationErrors(prev => ({
          ...prev,
          ...mandatoryErrors
        }));
        const missingFields = Object.values(mandatoryErrors).join('\n');
        alert(`Please fill in all required fields:\n\n${missingFields}`);
        return;
      }

      // Clear validation errors on successful validation
      setValidationErrors({});

      if (config.submitRequest) {
        await config.submitRequest(preparedFormData);
      } else if (config.submitEndpoint) {
        await axios.post(config.submitEndpoint, preparedFormData);
      }

      // Call the onSubmit callback if provided
      didRunSubmitCallback = true;
      onSubmit?.(preparedFormData);

      clearSavedDraft();

      // Handle successful submission
    } catch (error) {
      console.error(`Error submitting ${itemLabel}:`, error);

      if (config.localSubmitOnly) {
        const canFallbackToLocalCallback =
          !config.prepareSubmitData &&
          !config.submitRequest &&
          !config.submitEndpoint;

        if (!didRunSubmitCallback && canFallbackToLocalCallback) {
          onSubmit?.(formData);
          clearSavedDraft();
          return;
        }
        alert(error?.message || `Error submitting ${itemLabel}. Please try again.`);
        return;
      }

      // For development purposes, treat as success if it's a network error (no backend)
      if (error.code === 'ERR_NETWORK' || error.response?.status === 404) {
        onSubmit?.(formData);
        clearSavedDraft();
      } else {
        alert(`Error submitting ${itemLabel}. Please try again.`);
        return;
      }
    }
  };

  // Validate fields on a specific step and update error state to show errors
  const validateStepFields = async (stepIndex, data) => {
    const stepFields = config.steps[stepIndex]?.fields || [];
    const updatedErrors = { ...validationErrors };
    const missingFields = [];
    const missingNames = [];
    const invalidFields = [];
    const invalidNames = [];

    const isEmptyValue = (value) =>
      value === undefined ||
      value === null ||
      (typeof value === 'string' && value.trim() === '') ||
      (Array.isArray(value) && value.length === 0);

    const fieldResults = await Promise.all(
      stepFields.map(async (field) => {
        const value = resolveFieldValue(data, field.name);
        const fieldLabel = field.label ? field.label.replace('*', '').trim() : field.name;
        const shouldTreatAsRequired =
          field.required && (field.name !== 'location' || isLocationRequired(data));
        let result = null;

        if (field.validationRule) {
          const validateFn = createValidationFunction(field.validationRule);
          if (validateFn) {
            result = await validateFn(value, field.name, data);
          }
        } else if (shouldTreatAsRequired) {
          result = await validateMandatoryField(value, field.name, fieldLabel);
        }

        return { field, fieldLabel, value, result, shouldTreatAsRequired };
      })
    );

    fieldResults.forEach(({ field, fieldLabel, value, result, shouldTreatAsRequired }) => {
      if (!result) return;

      if (!result.isValid) {
        updatedErrors[field.name] = result.message;

        if (shouldTreatAsRequired && isEmptyValue(value)) {
          missingFields.push(fieldLabel);
          missingNames.push(field.name);
        } else {
          invalidFields.push(fieldLabel);
          invalidNames.push(field.name);
        }
      } else if (updatedErrors[field.name]) {
        delete updatedErrors[field.name];
      }
    });

    // Update validation errors state all at once
    setValidationErrors(updatedErrors);

    return {
      isValid: missingFields.length === 0 && invalidFields.length === 0,
      errors: updatedErrors,
      missingFields,
      missingNames,
      invalidFields,
      invalidNames
    };
  };

  return (
    <div
      className={`reusable-form-page${config.formClassName ? ` ${config.formClassName}` : ''}${readOnly ? ' read-only' : ''}`}
    >
      {!config.hideTitle && <h1>{config.title}</h1>}
      {showDraftRestoredMessage && (
        <div className="draft-restored-alert">
          Draft restored successfully.
        </div>
      )}
      <MultiStepForm
        steps={enhancedSteps}
        onSubmit={handleSubmit}
        validationErrors={validationErrors}
        onValidateStep={validateStepFields}
        onFieldChange={validateFieldOnChange}
        hideStepper={config.hideStepper}
        showDraftAction={config.showDraftAction ?? true}
        draftLabel={config.draftLabel}
        onSaveDraft={handleSaveDraft}
        submitLabel={config.submitLabel}
        showCancelAction={config.showCancelAction}
        cancelLabel={config.cancelLabel}
        onCancel={config.onCancel}
        initialData={resolvedInitialData}
        readOnly={readOnly}
      />
    </div>
  );
};

export default ReusableForm;
