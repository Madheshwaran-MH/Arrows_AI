import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { requestParsedCandidateResume } from '../api/candidateResumeParser';

const SUPPORTED_RESUME_EXTENSIONS = new Set(['pdf', 'doc', 'docx', 'txt']);

const DEFAULT_SKILL = {
  primarySkill: '',
  enableSecondarySkill: false,
  secondarySkill: '',
  skillExperienceLevel: '',
  skillExperienceYears: '',
  skillRating: '',
  skillComments: '',
  secondarySkillExperienceLevel: '',
  secondarySkillExperienceYears: '',
  secondarySkillRating: '',
  secondarySkillComments: '',
};

const normalizeText = (value) => String(value || '').replace(/\s+/g, ' ').trim();

const normalizeToken = (value) => normalizeText(value).toLowerCase();

const isBlank = (value) =>
  value === undefined ||
  value === null ||
  (typeof value === 'string' && value.trim() === '') ||
  (Array.isArray(value) && value.length === 0);

const uniqueValues = (items = []) => [...new Set(items.map((item) => normalizeText(item)).filter(Boolean))];

const getFieldMap = (fields = []) =>
  fields.reduce((accumulator, field) => {
    if (field?.name) {
      accumulator[field.name] = field;
    }
    return accumulator;
  }, {});

const getFileExtension = (file) => String(file?.name || '').split('.').pop()?.toLowerCase() || '';

const getUnsupportedFileMessage = (extension) => {
  if (!extension) {
    return 'Upload a PDF, DOC, DOCX, or TXT resume to auto-fill candidate details.';
  }

  if (!SUPPORTED_RESUME_EXTENSIONS.has(extension)) {
    return `.${extension} files are not supported for resume auto-fill. Use PDF, DOC, DOCX, or TXT.`;
  }

  return '';
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

  return normalizeText(pageTexts.join('\n'));
};

export const readCandidateResumeText = async (file) => {
  const extension = getFileExtension(file);
  const unsupportedMessage = getUnsupportedFileMessage(extension);

  if (unsupportedMessage) {
    throw new Error(unsupportedMessage);
  }

  if (extension === 'pdf') {
    return readPdfText(file);
  }

  if (extension === 'docx') {
    return readDocxText(file);
  }

  return normalizeText(await file.text());
};

const splitCandidateName = (fullName) => {
  const cleanedName = normalizeText(String(fullName || '').replace(/[^A-Za-z\s.-]/g, ' '));
  if (!cleanedName) {
    return { firstName: '', lastName: '' };
  }

  const parts = cleanedName.split(' ').filter(Boolean);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
};

const mapYearsToBucket = (yearsNumber) => {
  if (!Number.isFinite(yearsNumber) || yearsNumber < 0) return '';
  if (yearsNumber <= 1) return '0-1';
  if (yearsNumber <= 3) return '1-3';
  if (yearsNumber <= 5) return '3-5';
  if (yearsNumber <= 8) return '5-8';
  if (yearsNumber <= 12) return '8-12';
  return '12+';
};

const deriveCandidateType = (yearsBucket, totalYears) => {
  if (Number.isFinite(totalYears)) {
    return totalYears > 0 ? 'experienced' : 'fresher';
  }

  if (yearsBucket === '0-1') {
    return 'fresher';
  }

  return yearsBucket ? 'experienced' : '';
};

const deriveSkillLevel = (yearsBucket) => {
  if (!yearsBucket) return '';
  if (yearsBucket === '0-1' || yearsBucket === '1-3') return 'beginner';
  if (yearsBucket === '3-5' || yearsBucket === '5-8') return 'intermediate';
  return 'expert';
};

const deriveSkillRating = (yearsBucket) => {
  switch (yearsBucket) {
    case '0-1':
      return '1';
    case '1-3':
      return '2';
    case '3-5':
      return '3';
    case '5-8':
      return '4';
    case '8-12':
    case '12+':
      return '5';
    default:
      return '';
  }
};

const formatYearsValue = (yearsNumber) => {
  if (!Number.isFinite(yearsNumber) || yearsNumber < 0) return '';
  const rounded = Number(yearsNumber.toFixed(1));
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
};

const extractExperienceYears = (text) => {
  const normalized = normalizeText(text);
  if (!normalized) return Number.NaN;

  const explicitRangeMatch = normalized.match(
    /(\d+(?:\.\d+)?)\s*(?:to|\-|–)\s*(\d+(?:\.\d+)?)\s*(?:years?|yrs?)/i,
  );
  if (explicitRangeMatch?.[2]) {
    return Number.parseFloat(explicitRangeMatch[2]);
  }

  const yearsMonthsMatch = normalized.match(
    /(\d+(?:\.\d+)?)\s*(?:years?|yrs?)\s*(\d{1,2})\s*(?:months?|mos?)/i,
  );
  if (yearsMonthsMatch?.[1]) {
    const years = Number.parseFloat(yearsMonthsMatch[1]);
    const months = Number.parseFloat(yearsMonthsMatch[2] || '0');
    return years + months / 12;
  }

  const standardMatch = normalized.match(
    /(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)(?:\s+of\s+experience)?/i,
  );
  if (standardMatch?.[1]) {
    return Number.parseFloat(standardMatch[1]);
  }

  const labelledMatch = normalized.match(/(?:total\s+)?experience\s*[:\-]?\s*(\d+(?:\.\d+)?)/i);
  if (labelledMatch?.[1]) {
    return Number.parseFloat(labelledMatch[1]);
  }

  return Number.NaN;
};

const parseExperienceToNumber = (value) => {
  if (typeof value === 'number') {
    return value;
  }

  const normalized = normalizeText(value);
  if (!normalized) {
    return Number.NaN;
  }

  const directNumber = Number.parseFloat(normalized);
  if (Number.isFinite(directNumber)) {
    return directNumber;
  }

  return extractExperienceYears(normalized);
};

const extractEmail = (text) => text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || '';

const extractPhoneNumber = (text) => {
  const phoneMatch = text.match(
    /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{3,5}\)?[\s-]?)?\d{3,5}[\s-]?\d{4,6}/,
  );
  if (!phoneMatch?.[0]) {
    return '';
  }

  const digits = phoneMatch[0].replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : '';
};

const cleanResumeValue = (value) =>
  normalizeText(String(value || '').replace(/[|•]/g, ' ').replace(/\s+/g, ' ')).slice(0, 120);

const extractCompanyAndRole = (text) => {
  const normalized = normalizeText(text);
  if (!normalized) return { company: '', role: '' };

  const companyMatch = normalized.match(
    /(?:current\s+company|company|organization|employer)\s*[:\-]\s*([^\n\r,|]+)/i,
  );
  const roleMatch = normalized.match(
    /(?:current\s+(?:designation|role)|designation|job\s*title|title|role)\s*[:\-]\s*([^\n\r,|]+)/i,
  );

  let company = cleanResumeValue(companyMatch?.[1] || '');
  let role = cleanResumeValue(roleMatch?.[1] || '');

  if (!company || !role) {
    const lineWithAt = normalized
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => /\s+at\s+/i.test(line) && !/mailto:|http/i.test(line));

    if (lineWithAt) {
      const [left = '', right = ''] = lineWithAt.split(/\s+at\s+/i);
      if (!role) role = cleanResumeValue(left);
      if (!company) company = cleanResumeValue(right);
    }
  }

  return { company, role };
};

const extractEmploymentType = (text) => {
  const normalized = normalizeToken(text);
  if (!normalized) return '';
  if (normalized.includes('internship') || normalized.includes('intern ')) return 'internship';
  if (normalized.includes('contract')) return 'contract';
  if (
    normalized.includes('full time') ||
    normalized.includes('full-time') ||
    normalized.includes('permanent')
  ) {
    return 'full-time';
  }
  return '';
};

const extractNoticePeriodDays = (text) => {
  const normalized = normalizeText(text);
  if (!normalized) return '';

  const immediateMatch = normalized.match(
    /(?:notice\s*period|availability|join(?:ing)?\s*time)\s*[:\-]?\s*(immediate|join\s*immediately)/i,
  );
  if (immediateMatch?.[1]) {
    return '0';
  }

  const daysMatch = normalized.match(
    /(?:notice\s*period|availability|join(?:ing)?\s*time)\s*[:\-]?\s*(\d{1,3})\s*days?/i,
  );
  if (daysMatch?.[1]) {
    return String(Number.parseInt(daysMatch[1], 10));
  }

  const monthsMatch = normalized.match(
    /(?:notice\s*period|availability|join(?:ing)?\s*time)\s*[:\-]?\s*(\d{1,2})\s*months?/i,
  );
  if (monthsMatch?.[1]) {
    return String(Number.parseInt(monthsMatch[1], 10) * 30);
  }

  return '';
};

const extractLpaValue = (text, labelPattern) => {
  const normalized = normalizeText(text);
  if (!normalized) return '';

  const regex = new RegExp(
    `${labelPattern}\\s*[:\\-]?\\s*(?:INR|Rs\\.?|₹)?\\s*(\\d+(?:\\.\\d+)?)\\s*(?:LPA|Lakhs?|Lakh\\s+Per\\s+Annum)?`,
    'i',
  );
  const match = normalized.match(regex);
  return match?.[1] ? String(Number.parseFloat(match[1])) : '';
};

const toIsoDateString = (value) => {
  const normalized = normalizeText(value);
  if (!normalized) return '';

  const isoMatch = normalized.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  const dayFirstMatch = normalized.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dayFirstMatch) {
    const [, day, month, year] = dayFirstMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  return '';
};

const extractDateOfBirth = (text) => {
  const normalized = normalizeText(text);
  if (!normalized) return '';

  const dobMatch = normalized.match(
    /(?:date\s+of\s+birth|dob)\s*[:\-]?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2})/i,
  );

  return toIsoDateString(dobMatch?.[1] || '');
};

const extractGender = (text) => {
  const normalized = normalizeText(text);
  if (!normalized) return '';

  const genderMatch = normalized.match(/gender\s*[:\-]?\s*(male|female|other)/i);
  return normalizeToken(genderMatch?.[1] || '');
};

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
      .map((option) => option?.value),
  );
};

const normalizeSkillList = (skills) => {
  if (Array.isArray(skills)) {
    return uniqueValues(
      skills.flatMap((skill) => {
        if (typeof skill === 'string') {
          return skill;
        }

        if (skill && typeof skill === 'object') {
          return [skill.name, skill.skill, skill.primarySkill, skill.secondarySkill];
        }

        return [];
      }),
    );
  }

  if (typeof skills === 'string') {
    return uniqueValues(skills.split(/[,\n|/]/g));
  }

  return [];
};

const findPreferredSourceName = (options = []) => {
  const preferenceOrder = ['Resume Inbox', 'Added by User', 'LinkedIn', 'Seek'];

  for (const preferred of preferenceOrder) {
    const matched = options.find((option) => normalizeToken(option?.label ?? option?.value) === normalizeToken(preferred));
    if (matched?.value) {
      return matched.value;
    }
  }

  return options[0]?.value || '';
};

const chooseFirstNonEmpty = (...values) => values.find((value) => !isBlank(value)) ?? '';

const buildHeuristicCandidateData = (text, fieldMap) => {
  const firstLine = text.split(/\r?\n/).map((line) => line.trim()).find(Boolean) || '';
  const fullName = firstLine.replace(/[^A-Za-z\s.-]/g, ' ').replace(/\s+/g, ' ').trim();
  const name = splitCandidateName(fullName);
  const totalExperienceYears = extractExperienceYears(text);
  const yearsExperience = mapYearsToBucket(totalExperienceYears);
  const { company, role } = extractCompanyAndRole(text);
  const normalizedText = normalizeText(text);

  return {
    fullName,
    firstName: name.firstName,
    lastName: name.lastName,
    primaryEmail: extractEmail(text),
    phoneNumber: extractPhoneNumber(text),
    gender: extractGender(text),
    dateOfBirth: extractDateOfBirth(text),
    totalExperienceYears: Number.isFinite(totalExperienceYears) ? totalExperienceYears : Number.NaN,
    yearsExperience,
    candidateType: deriveCandidateType(yearsExperience, totalExperienceYears),
    offersInHand: '',
    currentCompanyName: company,
    jobTitleRole: role,
    employmentType: extractEmploymentType(text),
    noticePeriod: extractNoticePeriodDays(text),
    currentCtc: extractLpaValue(text, '(?:current\\s*(?:ctc|salary|compensation))'),
    expectedCtc: extractLpaValue(text, '(?:expected\\s*(?:ctc|salary|compensation)|expected)'),
    primarySkill: findMatchingOptionValue(normalizedText, fieldMap.primarySkill?.options || []),
    secondarySkill: '',
    skillNames: collectMatchingOptionValues(
      normalizedText,
      [
        ...(fieldMap.primarySkill?.options || []),
        ...(fieldMap.secondarySkill?.options || []),
      ],
    ),
    recommendedRole: '',
    comments: '',
  };
};

const buildAiCandidateData = (parsedData = {}, fieldMap = {}) => {
  const fullName = chooseFirstNonEmpty(parsedData.fullName, parsedData.raw?.name);
  const nameParts = splitCandidateName(fullName);
  const totalExperienceYears = chooseFirstNonEmpty(
    parsedData.totalExperienceYears,
    parsedData.experience,
    parsedData.raw?.experience,
  );
  const totalExperienceNumber = parseExperienceToNumber(totalExperienceYears);
  const yearsExperience = chooseFirstNonEmpty(
    parsedData.yearsExperience,
    mapYearsToBucket(totalExperienceNumber),
  );
  const normalizedComments = uniqueValues(
    [
      parsedData.comments,
      parsedData.raw?.ai_summary,
      parsedData.education ? `Education: ${parsedData.education}` : '',
      Array.isArray(parsedData.certifications) && parsedData.certifications.length
        ? `Certifications: ${parsedData.certifications.join(', ')}`
        : '',
    ],
  ).join('\n');
  const aiSkills = normalizeSkillList(chooseFirstNonEmpty(parsedData.skills, parsedData.raw?.skills));
  const normalizedSkillText = aiSkills.join(' ');

  return {
    fullName,
    firstName: chooseFirstNonEmpty(parsedData.firstName, nameParts.firstName),
    lastName: chooseFirstNonEmpty(parsedData.lastName, nameParts.lastName),
    primaryEmail: parsedData.primaryEmail,
    phoneNumber: parsedData.phoneNumber,
    gender: parsedData.gender,
    dateOfBirth: toIsoDateString(parsedData.dateOfBirth),
    totalExperienceYears: totalExperienceNumber,
    yearsExperience,
    candidateType: chooseFirstNonEmpty(
      parsedData.candidateType,
      deriveCandidateType(yearsExperience, totalExperienceNumber),
    ),
    offersInHand: parsedData.offersInHand,
    currentCompanyName: parsedData.currentCompanyName,
    jobTitleRole: chooseFirstNonEmpty(parsedData.jobTitleRole, parsedData.recommendedRole),
    employmentType: chooseFirstNonEmpty(
      findMatchingOptionValue(parsedData.employmentType, fieldMap.employmentType?.options || []),
      extractEmploymentType(parsedData.employmentType),
    ),
    noticePeriod: normalizeText(parsedData.noticePeriod),
    currentCtc: normalizeText(parsedData.currentCtc),
    expectedCtc: normalizeText(parsedData.expectedCtc),
    primarySkill: chooseFirstNonEmpty(
      findMatchingOptionValue(parsedData.primarySkill || normalizedSkillText, fieldMap.primarySkill?.options || []),
      findMatchingOptionValue(normalizedSkillText, fieldMap.primarySkill?.options || []),
    ),
    secondarySkill: chooseFirstNonEmpty(
      findMatchingOptionValue(parsedData.secondarySkill || normalizedSkillText, fieldMap.secondarySkill?.options || []),
      findMatchingOptionValue(
        aiSkills.slice(1).join(' '),
        fieldMap.secondarySkill?.options || fieldMap.primarySkill?.options || [],
      ),
    ),
    skillNames: aiSkills,
    recommendedRole: parsedData.recommendedRole,
    comments: normalizedComments,
  };
};

const getSkillUpdates = ({
  formData,
  primarySkill,
  secondarySkill,
  skillExperienceLevel,
  skillExperienceYears,
  skillRating,
  skillComments,
}) => {
  const existingSkills = Array.isArray(formData.skills) && formData.skills.length
    ? formData.skills
    : [DEFAULT_SKILL];
  const firstSkill = { ...DEFAULT_SKILL, ...(existingSkills[0] || {}) };
  let didUpdateSkills = false;

  if (isBlank(firstSkill.primarySkill) && primarySkill) {
    firstSkill.primarySkill = primarySkill;
    didUpdateSkills = true;
  }

  if (isBlank(firstSkill.skillExperienceLevel) && skillExperienceLevel) {
    firstSkill.skillExperienceLevel = skillExperienceLevel;
    didUpdateSkills = true;
  }

  if (isBlank(firstSkill.skillExperienceYears) && skillExperienceYears) {
    firstSkill.skillExperienceYears = skillExperienceYears;
    didUpdateSkills = true;
  }

  if (isBlank(firstSkill.skillRating) && skillRating) {
    firstSkill.skillRating = skillRating;
    didUpdateSkills = true;
  }

  if (isBlank(firstSkill.skillComments) && skillComments) {
    firstSkill.skillComments = skillComments;
    didUpdateSkills = true;
  }

  if (
    secondarySkill &&
    secondarySkill !== firstSkill.primarySkill &&
    isBlank(firstSkill.secondarySkill)
  ) {
    firstSkill.secondarySkill = secondarySkill;
    firstSkill.enableSecondarySkill = true;
    if (!firstSkill.secondarySkillExperienceLevel && skillExperienceLevel) {
      firstSkill.secondarySkillExperienceLevel = skillExperienceLevel;
    }
    if (!firstSkill.secondarySkillExperienceYears && skillExperienceYears) {
      firstSkill.secondarySkillExperienceYears = skillExperienceYears;
    }
    if (!firstSkill.secondarySkillRating && skillRating) {
      firstSkill.secondarySkillRating = skillRating;
    }
    didUpdateSkills = true;
  }

  if (!didUpdateSkills) {
    return {};
  }

  return {
    skills: [firstSkill, ...existingSkills.slice(1)],
    primarySkill: firstSkill.primarySkill || '',
    skillExperienceLevel: firstSkill.skillExperienceLevel || '',
    skillExperienceYears: firstSkill.skillExperienceYears || '',
    skillRating: firstSkill.skillRating || '',
    secondarySkill: firstSkill.secondarySkill || '',
    secondarySkillExperienceLevel: firstSkill.secondarySkillExperienceLevel || '',
    secondarySkillExperienceYears: firstSkill.secondarySkillExperienceYears || '',
    secondarySkillRating: firstSkill.secondarySkillRating || '',
    skillComments: firstSkill.skillComments || '',
    secondarySkillComments: firstSkill.secondarySkillComments || '',
  };
};

export const parseCandidateResumeFile = async ({
  file,
  formData = {},
  fields = [],
}) => {
  if (!file) {
    return {
      extractedText: '',
      updates: {},
      source: 'none',
      message: 'No resume file selected.',
    };
  }

  const fieldMap = getFieldMap(fields);
  const extractedText = await readCandidateResumeText(file);

  if (!extractedText) {
    throw new Error(
      'Resume uploaded, but readable text was not detected. Use a PDF, DOCX, DOC, or TXT file with selectable text.',
    );
  }

  const heuristicData = buildHeuristicCandidateData(extractedText, fieldMap);
  let aiData = {};
  let source = 'heuristic';

  try {
    aiData = await requestParsedCandidateResume({
      fileName: file.name,
      resumeText: extractedText,
      availablePrimarySkills: (fieldMap.primarySkill?.options || []).map(
        (option) => option?.label || option?.value,
      ),
      availableSecondarySkills: (fieldMap.secondarySkill?.options || []).map(
        (option) => option?.label || option?.value,
      ),
      availableEmploymentTypes: (fieldMap.employmentType?.options || []).map(
        (option) => option?.label || option?.value,
      ),
    });
    source = 'ai';
  } catch (error) {
    console.warn('[candidate-resume] Falling back to local extraction only:', error?.message || error);
  }

  const aiCandidateData = buildAiCandidateData(aiData, fieldMap);
  const totalExperienceYears = Number.isFinite(aiCandidateData.totalExperienceYears)
    ? aiCandidateData.totalExperienceYears
    : heuristicData.totalExperienceYears;
  const yearsExperience = chooseFirstNonEmpty(
    aiCandidateData.yearsExperience,
    heuristicData.yearsExperience,
  );
  const skillExperienceLevel = chooseFirstNonEmpty(
    aiData.skillExperienceLevel,
    deriveSkillLevel(yearsExperience),
  );
  const skillExperienceYears = chooseFirstNonEmpty(
    aiData.skillExperienceYears,
    formatYearsValue(totalExperienceYears),
  );
  const skillRating = chooseFirstNonEmpty(aiData.skillRating, deriveSkillRating(yearsExperience));
  const preferredSourceName = findPreferredSourceName(fieldMap.sourceName?.options || []);
  const updates = {};

  const setIfBlank = (fieldName, value, currentValue = formData[fieldName]) => {
    if (!isBlank(currentValue) || isBlank(value)) {
      return;
    }
    updates[fieldName] = value;
  };

  setIfBlank('namePrefix', 'none');
  setIfBlank('firstName', chooseFirstNonEmpty(aiCandidateData.firstName, heuristicData.firstName));
  setIfBlank('lastName', chooseFirstNonEmpty(aiCandidateData.lastName, heuristicData.lastName));
  setIfBlank('primaryEmail', chooseFirstNonEmpty(aiCandidateData.primaryEmail, heuristicData.primaryEmail));
  setIfBlank('phoneNumber', chooseFirstNonEmpty(aiCandidateData.phoneNumber, heuristicData.phoneNumber));
  setIfBlank(
    'gender',
    chooseFirstNonEmpty(
      findMatchingOptionValue(aiCandidateData.gender, fieldMap.gender?.options || []),
      findMatchingOptionValue(heuristicData.gender, fieldMap.gender?.options || []),
    ),
  );
  setIfBlank('dateOfBirth', chooseFirstNonEmpty(aiCandidateData.dateOfBirth, heuristicData.dateOfBirth));
  setIfBlank('yearsExperience', yearsExperience);
  setIfBlank(
    'candidateType',
    chooseFirstNonEmpty(aiCandidateData.candidateType, heuristicData.candidateType),
  );
  setIfBlank(
    'offersInHand',
    chooseFirstNonEmpty(
      findMatchingOptionValue(aiCandidateData.offersInHand, fieldMap.offersInHand?.options || []),
      fieldMap.offersInHand?.options?.[0]?.value || '0',
    ),
  );
  setIfBlank(
    'currentCompanyName',
    chooseFirstNonEmpty(aiCandidateData.currentCompanyName, heuristicData.currentCompanyName),
  );
  setIfBlank('jobTitleRole', chooseFirstNonEmpty(aiCandidateData.jobTitleRole, heuristicData.jobTitleRole));
  setIfBlank(
    'employmentType',
    chooseFirstNonEmpty(
      aiCandidateData.employmentType,
      findMatchingOptionValue(heuristicData.employmentType, fieldMap.employmentType?.options || []),
    ),
  );
  setIfBlank('noticePeriod', chooseFirstNonEmpty(aiCandidateData.noticePeriod, heuristicData.noticePeriod));
  setIfBlank('currentCtc', chooseFirstNonEmpty(aiCandidateData.currentCtc, heuristicData.currentCtc));
  setIfBlank('expectedCtc', chooseFirstNonEmpty(aiCandidateData.expectedCtc, heuristicData.expectedCtc));
  setIfBlank('sourceName', preferredSourceName);
  setIfBlank('sourcedDate', new Date().toISOString().slice(0, 10));
  setIfBlank('comments', chooseFirstNonEmpty(aiCandidateData.comments, heuristicData.comments));

  const detectedSkillNames = uniqueValues([
    ...(aiCandidateData.skillNames || []),
    ...(heuristicData.skillNames || []),
  ]);
  const detectedSkillText = detectedSkillNames.join(' ');
  const primarySkill = chooseFirstNonEmpty(
    aiCandidateData.primarySkill,
    heuristicData.primarySkill,
    findMatchingOptionValue(detectedSkillText, fieldMap.primarySkill?.options || []),
  );
  const secondarySkill = chooseFirstNonEmpty(
    aiCandidateData.secondarySkill,
    findMatchingOptionValue(
      detectedSkillNames.slice(1).join(' '),
      fieldMap.secondarySkill?.options || fieldMap.primarySkill?.options || [],
    ),
  );

  Object.assign(
    updates,
    getSkillUpdates({
      formData,
      primarySkill,
      secondarySkill,
      skillExperienceLevel,
      skillExperienceYears,
      skillRating,
      skillComments: chooseFirstNonEmpty(aiCandidateData.comments, ''),
    }),
  );

  const updatedFieldCount = Object.entries(updates).filter(([, value]) => !isBlank(value)).length;
  const message =
    updatedFieldCount > 0
      ? `Auto-filled ${updatedFieldCount} field(s) from the uploaded resume.`
      : 'Resume uploaded, but no matching candidate fields were detected.';

  return {
    extractedText,
    updates,
    source,
    message,
  };
};
