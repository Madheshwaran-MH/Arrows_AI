import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { Buffer } from 'node:buffer'
import process from 'node:process'

const DEFAULT_SUPERSET_URL = 'http://172.174.201.208:8088';

function trimTrailingSlash(url) {
  return (url || '').replace(/\/+$/, '');
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

async function readJsonSafely(response) {
  const raw = await response.text();

  try {
    return { raw, json: JSON.parse(raw) };
  } catch {
    return { raw, json: null };
  }
}

async function readRequestJson(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const rawBody = Buffer.concat(chunks).toString('utf8');
  return rawBody ? JSON.parse(rawBody) : {};
}

function attachSessionCookieIfMissing(proxy, sessionCookie) {
  if (!sessionCookie) {
    return;
  }

  proxy.on('proxyReq', (proxyReq) => {
    const existingCookieHeader = proxyReq.getHeader('cookie');
    if (!existingCookieHeader) {
      proxyReq.setHeader('cookie', `session=${sessionCookie}`);
    }
  });
}

function buildJobDescriptionPrompt(roleInput) {
  return `
You are an enterprise recruitment AI assistant.

Generate a professional enterprise-grade job description.

Role Requirement:
${roleInput}

The JD should contain:

1. Job Title
2. Role Summary
3. Key Responsibilities
4. Required Skills
5. Preferred Skills
6. Experience Required
7. Tools/Technologies
8. Educational Qualification

Requirements:
- professional
- recruiter-grade
- concise
- enterprise-style
- no generic buzzwords
- structured formatting
`.trim();
}

async function generateJobDescriptionWithGroq(roleInput, env) {
  const apiKey = String(env.GROQ_API_KEY || '').trim();
  const model = String(env.GROQ_JD_MODEL || 'llama-3.1-8b-instant').trim();

  if (!apiKey) {
    throw new Error(
      'Missing GROQ_API_KEY in environment. Add it to .env.dev or expose POST /api/job-description/generate from your backend.',
    );
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: buildJobDescriptionPrompt(roleInput),
        },
      ],
    }),
  });

  const payload = await readJsonSafely(response);

  if (!response.ok || !payload.json) {
    const details =
      payload.json?.error?.message ||
      payload.json?.error ||
      payload.raw ||
      'Unknown error from Groq';
    throw new Error(`Groq request failed: ${details}`);
  }

  const content = String(payload.json?.choices?.[0]?.message?.content || '').trim();
  if (!content) {
    throw new Error('Groq returned an empty job description.');
  }

  return content;
}

function cleanJsonResponse(content) {
  const raw = String(content || '').trim();
  const withoutFence = raw
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
  const startIndex = withoutFence.indexOf('{');
  const endIndex = withoutFence.lastIndexOf('}');

  if (startIndex >= 0 && endIndex > startIndex) {
    return withoutFence.slice(startIndex, endIndex + 1);
  }

  return withoutFence;
}

function buildCandidateResumePrompt({ resumeText, availablePrimarySkills, availableSecondarySkills, availableEmploymentTypes }) {
  return `
You are an enterprise AI recruitment intelligence engine.

Analyze the resume professionally and extract structured candidate data for a recruitment CRM.

Return ONLY valid JSON. Do not include markdown.

Required JSON format:
{
  "name": "",
  "firstName": "",
  "lastName": "",
  "primaryEmail": "",
  "phoneNumber": "",
  "gender": "",
  "dateOfBirth": "",
  "experience": "",
  "totalExperienceYears": "",
  "yearsExperience": "",
  "candidateType": "",
  "offersInHand": "",
  "currentCompanyName": "",
  "jobTitleRole": "",
  "employmentType": "",
  "noticePeriod": "",
  "currentCtc": "",
  "expectedCtc": "",
  "primarySkill": "",
  "secondarySkill": "",
  "skillExperienceLevel": "",
  "skillExperienceYears": "",
  "skillRating": "",
  "skills": [],
  "projects": [
    {
      "project_name": "",
      "skills_used": [],
      "project_summary": ""
    }
  ],
  "certifications": [],
  "education": "",
  "recommended_role": "",
  "ai_summary": ""
}

Field guidance:
- yearsExperience must be one of: 0-1, 1-3, 3-5, 5-8, 8-12, 12+.
- candidateType must be fresher or experienced.
- employmentType should match one of these if possible: ${availableEmploymentTypes || 'full-time, contract, internship'}.
- primarySkill should match one of these values if possible: ${availablePrimarySkills || 'java, python, react, node, aws'}.
- secondarySkill should match one of these values if possible: ${availableSecondarySkills || availablePrimarySkills || 'java, python, react, node, aws'}.
- skillExperienceLevel must be beginner, intermediate, or expert.
- skillRating must be a string from 1 to 5.
- phoneNumber should contain the 10 digit local number only when possible.
- noticePeriod should be days only, for example "30".
- currentCtc and expectedCtc should be LPA numbers only, for example "12".
- dateOfBirth should be YYYY-MM-DD if available.
- Do not hallucinate. Use empty strings or empty arrays when information is not available.

Resume Text:
${String(resumeText || '').slice(0, 8000)}
`.trim();
}

async function parseCandidateResumeWithGroq(payload, env) {
  const apiKey = String(env.GROQ_API_KEY || '').trim();
  const model = String(env.GROQ_RESUME_MODEL || env.GROQ_JD_MODEL || 'llama-3.1-8b-instant').trim();
  const resumeText = String(payload?.resumeText || payload?.resume_text || '').trim();

  if (!apiKey) {
    throw new Error(
      'Missing GROQ_API_KEY in environment. Add it to .env.dev or expose POST /api/candidate/parse-resume from your backend.',
    );
  }

  if (!resumeText) {
    throw new Error('resumeText is required to parse a candidate resume.');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      messages: [
        {
          role: 'user',
          content: buildCandidateResumePrompt({
            resumeText,
            availablePrimarySkills: Array.isArray(payload.availablePrimarySkills)
              ? payload.availablePrimarySkills.join(', ')
              : '',
            availableSecondarySkills: Array.isArray(payload.availableSecondarySkills)
              ? payload.availableSecondarySkills.join(', ')
              : '',
            availableEmploymentTypes: Array.isArray(payload.availableEmploymentTypes)
              ? payload.availableEmploymentTypes.join(', ')
              : '',
          }),
        },
      ],
    }),
  });

  const groqPayload = await readJsonSafely(response);

  if (!response.ok || !groqPayload.json) {
    const details =
      groqPayload.json?.error?.message ||
      groqPayload.json?.error ||
      groqPayload.raw ||
      'Unknown error from Groq';
    throw new Error(`Groq request failed: ${details}`);
  }

  const content = String(groqPayload.json?.choices?.[0]?.message?.content || '').trim();
  if (!content) {
    throw new Error('Groq returned an empty resume parser response.');
  }

  return JSON.parse(cleanJsonResponse(content));
}

function jobDescriptionDevEndpointPlugin(env) {
  return {
    name: 'job-description-dev-endpoint',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/internal/ai/job-description', async (req, res) => {
        if (req.method !== 'POST') {
          sendJson(res, 405, { error: 'Method not allowed. Use POST.' });
          return;
        }

        try {
          const payload = await readRequestJson(req);
          const roleRequirement = String(payload?.roleRequirement || payload?.role_requirement || '').trim();

          if (!roleRequirement) {
            sendJson(res, 400, { error: 'roleRequirement is required to generate a JD.' });
            return;
          }

          const jobDescription = await generateJobDescriptionWithGroq(roleRequirement, env);

          sendJson(res, 200, {
            jobDescription,
            roleRequirement,
            source: 'vite-internal-groq',
          });
        } catch (error) {
          sendJson(res, 500, {
            error: error?.message || 'Unexpected error while generating job description.',
          });
        }
      });
    },
  };
}

function candidateResumeDevEndpointPlugin(env) {
  return {
    name: 'candidate-resume-dev-endpoint',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/internal/ai/parse-resume', async (req, res) => {
        if (req.method !== 'POST') {
          sendJson(res, 405, { error: 'Method not allowed. Use POST.' });
          return;
        }

        try {
          const payload = await readRequestJson(req);
          const parsedResume = await parseCandidateResumeWithGroq(payload, env);

          sendJson(res, 200, {
            ...parsedResume,
            source: 'vite-internal-groq',
          });
        } catch (error) {
          sendJson(res, 500, {
            error: error?.message || 'Unexpected error while parsing candidate resume.',
          });
        }
      });
    },
  };
}

function supersetGuestTokenPlugin(env) {
  const supersetBaseUrl = trimTrailingSlash(env.VITE_SUPERSET_URL || DEFAULT_SUPERSET_URL);
  const sessionCookie = env.SUPERSET_SESSION_COOKIE || '';
  const defaultEmbedId = env.VITE_SUPERSET_EMBED_ID || '';
  const defaultResourceId = env.VITE_SUPERSET_DASHBOARD_ID || '';

  function isUuidLike(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      String(value || ''),
    );
  }

  async function resolveDashboardResourceId(dashboardId) {
    const normalized = String(dashboardId || '').trim();
    if (!normalized) return '';
    if (!isUuidLike(normalized)) return normalized;

    const candidateUrls = [
      `${supersetBaseUrl}/api/v1/dashboard/${normalized}`,
      `${supersetBaseUrl}/api/v1/dashboard/${normalized}/embedded`,
    ];

    for (const url of candidateUrls) {
      try {
        const response = await fetch(url, {
          headers: {
            Cookie: `session=${sessionCookie}`,
          },
        });
        const payload = await readJsonSafely(response);
        if (!response.ok || !payload.json) {
          continue;
        }

        const result = payload.json.result || payload.json;
        const resolvedId =
          result?.id || result?.dashboard_id || result?.dashboardId || '';

        if (resolvedId) {
          return String(resolvedId);
        }
      } catch {
        // Continue to next lookup strategy.
      }
    }

    return normalized;
  }

  const embeddedUser = {
    username: 'embed_user',
    firstName: 'Embed',
    lastName: 'User',
    userId: 0,
    isActive: true,
    isAnonymous: false,
    email: '',
    loginCount: 0,
    createdOn: new Date().toISOString(),
    permissions: {},
    roles: {},
    groups: [],
  };

  function sendEmbeddedUser(res) {
    sendJson(res, 200, { result: embeddedUser });
  }

  return {
    name: 'superset-guest-token-dev-endpoint',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/static/service-worker.js', async (req, res) => {
        if (req.method !== 'GET') {
          sendJson(res, 405, { error: 'Method not allowed. Use GET.' });
          return;
        }

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/javascript');
        res.setHeader('Cache-Control', 'no-store');
        res.end(
          [
            "self.addEventListener('install', (event) => { self.skipWaiting(); });",
            "self.addEventListener('activate', (event) => { event.waitUntil(self.clients.claim()); });",
            "self.addEventListener('fetch', () => {});",
          ].join('\n'),
        );
      });

      server.middlewares.use('/api/v1/me/roles/', async (req, res) => {
        if (req.method !== 'GET') {
          sendJson(res, 405, { error: 'Method not allowed. Use GET.' });
          return;
        }

        sendEmbeddedUser(res);
      });

      server.middlewares.use('/internal/superset/guest-token', async (req, res) => {
        if (req.method !== 'GET') {
          sendJson(res, 405, { error: 'Method not allowed. Use GET.' });
          return;
        }

        if (!sessionCookie) {
          sendJson(res, 500, {
            error: 'Missing SUPERSET_SESSION_COOKIE in environment. Add it to .env.dev and restart Vite.',
          });
          return;
        }

        const requestUrl = new URL(req.url || '', 'http://localhost');
        const dashboardId = requestUrl.searchParams.get('embedId') || defaultEmbedId;
        const requestedResourceId =
          requestUrl.searchParams.get('resourceId') || defaultResourceId;

        if (!dashboardId) {
          sendJson(res, 400, {
            error: 'Missing embed id. Provide ?embedId=<uuid> or set VITE_SUPERSET_EMBED_ID.',
          });
          return;
        }

        const resourceId =
          requestedResourceId || (await resolveDashboardResourceId(dashboardId));

        if (!resourceId) {
          sendJson(res, 400, {
            error: 'Missing resource id. Provide ?resourceId=<id> or set VITE_SUPERSET_DASHBOARD_ID.',
          });
          return;
        }

        try {
          const csrfRes = await fetch(`${supersetBaseUrl}/api/v1/security/csrf_token/`, {
            headers: {
              Cookie: `session=${sessionCookie}`,
            },
          });
          const csrfBody = await readJsonSafely(csrfRes);

          if (!csrfRes.ok || !csrfBody.json?.result) {
            sendJson(res, csrfRes.status || 500, {
              error: 'Unable to fetch Superset CSRF token.',
              details: csrfBody.json || csrfBody.raw,
            });
            return;
          }

          const guestRes = await fetch(`${supersetBaseUrl}/api/v1/security/guest_token/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': csrfBody.json.result,
              Cookie: `session=${sessionCookie}`,
            },
            body: JSON.stringify({
              resources: [{ type: 'dashboard', id: String(resourceId) }],
              rls: [],
              user: {
                username: 'embed_user',
                first_name: 'Embed',
                last_name: 'User',
              },
            }),
          });
          const guestBody = await readJsonSafely(guestRes);

          if (!guestRes.ok || !guestBody.json?.token) {
            sendJson(res, guestRes.status || 500, {
              error: 'Unable to fetch Superset guest token.',
              details: guestBody.json || guestBody.raw,
            });
            return;
          }

          sendJson(res, 200, {
            token: guestBody.json.token,
            dashboardUuid: dashboardId,
            resourceId: String(resourceId),
            supersetDomain: supersetBaseUrl,
          });
        } catch (error) {
          sendJson(res, 500, {
            error: 'Unexpected error while generating Superset guest token.',
            details: error?.message || String(error),
          });
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const supersetSessionCookie = env.SUPERSET_SESSION_COOKIE || '';

  return {
    plugins: [
      react(),
      supersetGuestTokenPlugin(env),
      jobDescriptionDevEndpointPlugin(env),
      candidateResumeDevEndpointPlugin(env),
    ],
    css: {
      modules: {
        // Keep class names human-readable in DOM: JobOpenings__page
        generateScopedName: '[name]__[local]',
      },
    },
    server: {
      host: "0.0.0.0",
      port: Number(env.VITE_PORT || 5173),
      strictPort: true,
      proxy: {
        '/api/v1': {
          target: env.VITE_SUPERSET_URL || DEFAULT_SUPERSET_URL,
          changeOrigin: true,
          autoRewrite: true,
          hostRewrite: 'localhost:5173',
          protocolRewrite: 'http',
            configure: (proxy) => attachSessionCookieIfMissing(proxy, supersetSessionCookie),
        },
        '/static': {
          target: env.VITE_SUPERSET_URL || DEFAULT_SUPERSET_URL,
          changeOrigin: true,
          autoRewrite: true,
          hostRewrite: 'localhost:5173',
          protocolRewrite: 'http',
            configure: (proxy) => attachSessionCookieIfMissing(proxy, supersetSessionCookie),
        },
        '/superset': {
          target: env.VITE_SUPERSET_URL || DEFAULT_SUPERSET_URL,
          changeOrigin: true,
          autoRewrite: true,
          hostRewrite: 'localhost:5173',
          protocolRewrite: 'http',
            configure: (proxy) => attachSessionCookieIfMissing(proxy, supersetSessionCookie),
        },
        '/embedded': {
          target: env.VITE_SUPERSET_URL || DEFAULT_SUPERSET_URL,
          changeOrigin: true,
          autoRewrite: true,
          hostRewrite: 'localhost:5173',
          protocolRewrite: 'http',
            configure: (proxy) => attachSessionCookieIfMissing(proxy, supersetSessionCookie),
        },
        '/login': {
          target: env.VITE_SUPERSET_URL || DEFAULT_SUPERSET_URL,
          changeOrigin: true,
          autoRewrite: true,
          hostRewrite: 'localhost:5173',
          protocolRewrite: 'http',
            configure: (proxy) => attachSessionCookieIfMissing(proxy, supersetSessionCookie),
        },
        // Keep this last so /api/v1 continues to proxy to Superset.
        '/api': {
          target: env.VITE_BACKEND_URL || 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
    preview: {
      host: "0.0.0.0",
      port: Number(env.VITE_PREVIEW_PORT || 4173),
      strictPort: true,
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'mui-vendor': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'chart-vendor': ['recharts'],
            'utils': ['axios'],
          }
        }
      },
      chunkSizeWarningLimit: 1000,
      minify: 'esbuild',
      sourcemap: false,
    },
  };
});
