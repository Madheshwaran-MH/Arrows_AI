import { requestGeneratedJobDescription } from '../api/jobDescription';

const humanizeValue = (value) =>
  String(value || '')
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());

const toList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }

  const normalized = String(value || '').trim();
  return normalized ? [normalized] : [];
};

const pushLine = (lines, label, value) => {
  const normalized = String(value || '').trim();
  if (!normalized) return;
  lines.push(`${label}: ${normalized}`);
};

export const buildRoleRequirementInput = (input) => {
  if (typeof input === 'string') {
    const jobTitle = input.trim();
    return jobTitle ? `Job Title: ${jobTitle}` : '';
  }

  if (!input || typeof input !== 'object') {
    return '';
  }

  const lines = [];
  const positionName =
    input.positionName ||
    input.postingTitle ||
    input.jobTitle ||
    input.roleName ||
    '';

  pushLine(lines, 'Job Title', positionName);

  const minExperience = String(input.minExperience || '').trim();
  const maxExperience = String(input.maxExperience || '').trim();
  if (minExperience || maxExperience) {
    pushLine(
      lines,
      'Experience Required',
      [minExperience && `Min ${minExperience} years`, maxExperience && `Max ${maxExperience} years`]
        .filter(Boolean)
        .join(', '),
    );
  }

  pushLine(lines, 'Position Level', humanizeValue(input.positionLevel));
  pushLine(lines, 'Employment Type', humanizeValue(input.jobType));
  pushLine(lines, 'Work Type', humanizeValue(input.hiringType || input.workType));
  pushLine(lines, 'Number of Positions', input.noOfPositions);
  pushLine(lines, 'Client Name', input.clientName);

  const locationValues = toList(input.location || input.city).map(humanizeValue);
  if (locationValues.length > 0) {
    pushLine(lines, 'Location', locationValues.join(', '));
  }

  const technicalSkills = [
    ...toList(input.technicalSkills),
    ...toList(input.extraTechnicalSkills),
    ...toList(input.addTechnicalSkills),
  ]
    .map(humanizeValue)
    .filter(Boolean);
  if (technicalSkills.length > 0) {
    pushLine(lines, 'Technical Skills', [...new Set(technicalSkills)].join(', '));
  }

  const softSkills = toList(input.softSkills).map(humanizeValue).filter(Boolean);
  if (softSkills.length > 0) {
    pushLine(lines, 'Soft Skills', [...new Set(softSkills)].join(', '));
  }

  pushLine(lines, 'Additional Skills', humanizeValue(input.additionalSkills));
  pushLine(lines, 'Target Date', input.targetDate || input.jobReceivedDate);

  const existingNotes = String(input.jobDescription || '').trim();
  if (existingNotes) {
    pushLine(lines, 'Existing Notes', existingNotes);
  }

  return lines.join('\n');
};

export async function generateJDWithAI(input) {
  const roleRequirement = buildRoleRequirementInput(input);

  if (!roleRequirement) {
    throw new Error('Add at least a job title before generating a job description.');
  }

  const response = await requestGeneratedJobDescription({ roleRequirement });
  const jobDescription = String(response?.jobDescription || '').trim();

  if (!jobDescription) {
    throw new Error('The AI service returned an empty job description. Please try again.');
  }

  return {
    ...response,
    roleRequirement,
    jobDescription,
  };
}

