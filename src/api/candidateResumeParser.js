const CANDIDATE_RESUME_PARSE_PATH = '/api/candidate/parse-resume';
const INTERNAL_CANDIDATE_RESUME_PARSE_PATH = '/internal/ai/parse-resume';

const normalizeParsedCandidateResume = (data = {}) => {
  if (!data || typeof data !== 'object') {
    return { raw: data };
  }

  const normalizedName = String(data.name || data.fullName || data.full_name || '').trim();
  const normalizedExperience = String(data.experience || '').trim();

  return {
    fullName: normalizedName,
    firstName: String(data.firstName || data.first_name || '').trim(),
    lastName: String(data.lastName || data.last_name || '').trim(),
    primaryEmail: String(data.primaryEmail || data.primary_email || '').trim(),
    phoneNumber: String(data.phoneNumber || data.phone_number || '').trim(),
    gender: String(data.gender || '').trim(),
    dateOfBirth: String(data.dateOfBirth || data.date_of_birth || '').trim(),
    yearsExperience: String(data.yearsExperience || data.years_experience || data.years_experience_bucket || '').trim(),
    totalExperienceYears: String(data.totalExperienceYears || data.total_experience_years || '').trim(),
    experience: normalizedExperience,
    candidateType: String(data.candidateType || data.candidate_type || '').trim(),
    offersInHand: String(data.offersInHand || data.offers_in_hand || '').trim(),
    currentCompanyName: String(data.currentCompanyName || data.current_company_name || '').trim(),
    jobTitleRole: String(data.jobTitleRole || data.job_title_role || '').trim(),
    employmentType: String(data.employmentType || data.employment_type || '').trim(),
    noticePeriod: String(data.noticePeriod || data.notice_period || data.notice_period_days || '').trim(),
    currentCtc: String(data.currentCtc || data.current_ctc || data.current_ctc_lpa || '').trim(),
    expectedCtc: String(data.expectedCtc || data.expected_ctc || data.expected_ctc_lpa || '').trim(),
    primarySkill: String(data.primarySkill || data.primary_skill || '').trim(),
    secondarySkill: String(data.secondarySkill || data.secondary_skill || '').trim(),
    skillExperienceLevel: String(data.skillExperienceLevel || data.skill_experience_level || '').trim(),
    skillExperienceYears: String(data.skillExperienceYears || data.skill_experience_years || '').trim(),
    skillRating: String(data.skillRating || data.skill_rating || '').trim(),
    comments: String(data.comments || data.aiSummary || data.ai_summary || '').trim(),
    education: String(data.education || '').trim(),
    certifications: Array.isArray(data.certifications) ? data.certifications : [],
    skills: Array.isArray(data.skills) ? data.skills : [],
    projects: Array.isArray(data.projects) ? data.projects : [],
    recommendedRole: String(data.recommendedRole || data.recommended_role || '').trim(),
    raw: data,
  };
};

async function requestParse(url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data?.error ||
        data?.message ||
        `Candidate resume parser failed with status ${response.status}`,
    );
  }

  return normalizeParsedCandidateResume(data);
}

export const requestParsedCandidateResume = async (payload = {}) => {
  try {
    return await requestParse(CANDIDATE_RESUME_PARSE_PATH, payload);
  } catch (primaryError) {
    if (import.meta.env.DEV) {
      try {
        console.warn(
          '[candidate-resume] POST /api/candidate/parse-resume failed. Falling back to Vite internal endpoint /internal/ai/parse-resume for local development.',
        );
        return await requestParse(INTERNAL_CANDIDATE_RESUME_PARSE_PATH, payload);
      } catch (internalError) {
        console.warn(
          '[candidate-resume] Internal resume parser endpoint also failed:',
          internalError?.message || internalError,
        );
      }
    }

    const errorMessage =
      primaryError?.response?.data?.error ||
      primaryError?.response?.data?.message ||
      primaryError?.message ||
      'Failed to parse the candidate resume.';

    throw new Error(errorMessage);
  }
};
