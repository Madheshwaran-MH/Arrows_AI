const JOB_DESCRIPTION_PATH = '/api/job-description/generate';
const INTERNAL_DEV_JOB_DESCRIPTION_PATH = '/internal/ai/job-description';

const normalizeGeneratedJobDescription = (data = {}) => {
  if (typeof data === 'string') {
    return {
      jobDescription: data.trim(),
      roleRequirement: '',
      source: '',
      raw: data,
    };
  }

  const jobDescription = String(
    data.jobDescription ||
      data.generatedJd ||
      data.generatedJD ||
      data.generated_jd ||
      data.jd ||
      data.content ||
      data.result ||
      ''
  ).trim();

  return {
    jobDescription,
    roleRequirement: String(data.roleRequirement || data.role_requirement || '').trim(),
    source: String(data.source || '').trim(),
    raw: data,
  };
};

async function fetchViaInternalDevEndpoint(payload) {
  const response = await fetch(INTERNAL_DEV_JOB_DESCRIPTION_PATH, {
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
        `Vite internal JD generator failed with status ${response.status}`,
    );
  }

  return normalizeGeneratedJobDescription(data);
}

async function fetchViaPrimaryApi(payload) {
  const response = await fetch(JOB_DESCRIPTION_PATH, {
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
        `JD generator API failed with status ${response.status}`,
    );
  }

  return normalizeGeneratedJobDescription(data);
}

export const requestGeneratedJobDescription = async (payload = {}) => {
  try {
    return await fetchViaPrimaryApi(payload);
  } catch (proxyError) {
    if (import.meta.env.DEV) {
      try {
        console.warn(
          '[job-description] POST /api/job-description/generate failed. Falling back to Vite internal endpoint /internal/ai/job-description for local development.',
        );
        return await fetchViaInternalDevEndpoint(payload);
      } catch (internalError) {
        console.warn(
          '[job-description] Internal dev JD endpoint also failed:',
          internalError?.message || internalError,
        );
      }
    }

    const errorMessage =
      proxyError?.response?.data?.error ||
      proxyError?.response?.data?.message ||
      proxyError?.message ||
      'Failed to generate a job description. Confirm the API route or local Vite fallback is available.';

    throw new Error(errorMessage);
  }
};
