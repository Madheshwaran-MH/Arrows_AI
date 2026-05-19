const LOCAL_API_FALLBACK = 'http://localhost:3001/api';

function trimTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

function normalizeBasePath(value) {
  const raw = String(value || '/').trim();

  if (!raw || raw === '/') {
    return '/';
  }

  return `/${raw.replace(/^\/+|\/+$/g, '')}/`;
}

function ensureLeadingSlash(value) {
  const raw = String(value || '').trim();
  return raw.startsWith('/') ? raw : `/${raw}`;
}

export function resolveApiBaseUrl() {
  const configured = String(import.meta.env.VITE_API_URL || '').trim();

  if (!configured) {
    return LOCAL_API_FALLBACK;
  }

  if (/https?:\/\/api\.example\.com\/?$/i.test(configured)) {
    return '/api';
  }

  return trimTrailingSlash(configured);
}

export function resolveApiUrl(path = '') {
  const normalizedPath = String(path || '').trim();
  const base = resolveApiBaseUrl();

  if (!normalizedPath) {
    return base;
  }

  if (/^https?:\/\//i.test(normalizedPath)) {
    return normalizedPath;
  }

  if (normalizedPath.startsWith('/api/')) {
    if (base.endsWith('/api')) {
      return `${base}${normalizedPath.slice(4)}`;
    }

    return `${base}${normalizedPath}`;
  }

  if (normalizedPath.startsWith('/')) {
    return `${trimTrailingSlash(window.location.origin)}${normalizedPath}`;
  }

  return `${base}/${normalizedPath.replace(/^\/+/, '')}`;
}

export function resolveAppBasePath() {
  return normalizeBasePath(import.meta.env.BASE_URL || '/');
}

export function buildAppHref(routePath = '/login') {
  const base = resolveAppBasePath();
  const normalizedRoute = ensureLeadingSlash(routePath || '/');
  return `${base}#${normalizedRoute}`;
}
