import API from './axiosConfig';
import { resolveEmbedSupersetDomain } from '../utils/embedSupersetDomain';

/** Arrows_back: GET /api/superset-token (see Arrows_back/routes/supersetRoutes.js) */
const SUPERSET_TOKEN_PATH = 'superset-token';
const INTERNAL_DEV_TOKEN_PATH = '/internal/superset/guest-token';

function isLikelyJwt(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) {
    return false;
  }

  // Superset guest tokens are JWTs with non-empty header/payload/signature.
  return parts.every((part) => part.length > 0);
}

function normalizeGuestTokenPayload(data = {}) {
  return {
    token: data.token || data.guest_token || '',
    dashboardUuid:
      data.dashboardUuid ||
      data.dashboard_uuid ||
      import.meta.env.VITE_SUPERSET_EMBED_ID ||
      '',
    supersetDomain: resolveEmbedSupersetDomain(
      data.supersetDomain ||
        data.superset_domain ||
        import.meta.env.VITE_SUPERSET_URL ||
        '',
    ),
    raw: data,
  };
}

function guestTokenFromEnv() {
  const token = import.meta.env.VITE_SUPERSET_GUEST_TOKEN || '';
  if (!token) {
    return null;
  }
  if (!isLikelyJwt(token)) {
    console.warn(
      '[superset] Ignoring VITE_SUPERSET_GUEST_TOKEN because it is not a valid JWT. Provide a real guest token, not a session cookie.',
    );
    return null;
  }
  const hint =
    import.meta.env.VITE_SUPERSET_EMBED_ORIGIN ||
    import.meta.env.VITE_SUPERSET_URL ||
    '';
  return {
    token,
    dashboardUuid: import.meta.env.VITE_SUPERSET_EMBED_ID || '',
    supersetDomain: resolveEmbedSupersetDomain(String(hint).replace(/\/+$/, '')),
    raw: { source: 'VITE_SUPERSET_GUEST_TOKEN' },
  };
}

async function fetchViaInternalDevEndpoint() {
  const response = await fetch(INTERNAL_DEV_TOKEN_PATH, {
    method: 'GET',
    credentials: 'same-origin',
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data?.error ||
        data?.message ||
        `Vite dev token endpoint failed with status ${response.status}`,
    );
  }

  return normalizeGuestTokenPayload(data);
}

export const fetchDashboardGuestToken = async () => {
  try {
    const proxyResponse = await API.get(SUPERSET_TOKEN_PATH, {
      skipAuth: true,
      skipAuthRedirect: true,
    });
    if (!proxyResponse?.data) {
      throw new Error('Guest token response was empty');
    }

    return normalizeGuestTokenPayload(proxyResponse.data);
  } catch (proxyError) {
    if (import.meta.env.DEV) {
      try {
        console.warn(
          '[superset] GET /api/superset-token failed. Falling back to Vite internal endpoint /internal/superset/guest-token for local development.',
        );
        return await fetchViaInternalDevEndpoint();
      } catch (internalError) {
        console.warn(
          '[superset] Internal dev token endpoint also failed:',
          internalError?.message || internalError,
        );
      }
    }

    const fromEnv = guestTokenFromEnv();
    if (fromEnv?.token) {
      console.warn(
        '[superset] Using VITE_SUPERSET_GUEST_TOKEN because GET /api/superset-token failed. Prefer fixing Arrows_back + VITE_API_URL proxy; static guest JWTs expire.',
      );
      return fromEnv;
    }

    const errorMessage =
      proxyError?.response?.data?.error ||
      proxyError?.response?.data?.message ||
      proxyError?.message ||
      'Failed to fetch guest token from Arrows_back (GET /api/superset-token). Is the embed backend running?';
    throw new Error(errorMessage);
  }
};
