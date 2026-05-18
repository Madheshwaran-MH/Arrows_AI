const LOOPBACK_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "[::1]",
]);

function isLoopbackHost(hostname) {
  return LOOPBACK_HOSTS.has(hostname);
}

/** Vite dev/preview ports where /embedded is proxied to Superset (see vite.config.js). */
const LOCAL_EMBED_PROXY_PORTS = new Set(["5173", "4173"]);

/**
 * Resolves the origin passed to @superset-ui/embedded-sdk as `supersetDomain`.
 * postMessage(..., targetOrigin) must equal the iframe document origin exactly.
 *
 * Precedence:
 * 1. VITE_SUPERSET_EMBED_ORIGIN — use when you know the browser load origin (e.g. http://localhost:5173 with Vite proxy).
 * 2. VITE_SUPERSET_EMBED_SAME_ORIGIN=true — force window.location.origin.
 * 3. Dev heuristic: API says loopback :8080 but the page is :5173/:4173 → same-origin proxy (iframe must hit Vite).
 * 4. Loopback: same port as page → window.origin (localhost vs 127.0.0.1).
 * 5. Loopback: different port → keep API port, match page hostname spelling.
 */
export function resolveEmbedSupersetDomain(apiDomain) {
  const explicit = String(import.meta.env.VITE_SUPERSET_EMBED_ORIGIN || "").trim();
  if (explicit) {
    return explicit.replace(/\/+$/, "");
  }

  if (
    import.meta.env.VITE_SUPERSET_EMBED_SAME_ORIGIN === "true" &&
    typeof window !== "undefined"
  ) {
    return window.location.origin.replace(/\/+$/, "");
  }

  const normalized = String(apiDomain || "").replace(/\/+$/, "");
  if (typeof window === "undefined") return normalized;

  try {
    const u = new URL(normalized);
    const win = new URL(window.location.href);

    if (
      import.meta.env.DEV &&
      isLoopbackHost(u.hostname) &&
      isLoopbackHost(win.hostname) &&
      u.protocol === win.protocol
    ) {
      const apiPort = u.port || (u.protocol === "https:" ? "443" : "80");
      const pagePort =
        win.port || (win.protocol === "https:" ? "443" : "80");
      if (
        apiPort === "8080" &&
        LOCAL_EMBED_PROXY_PORTS.has(pagePort) &&
        apiPort !== pagePort
      ) {
        return win.origin.replace(/\/+$/, "");
      }
    }

    if (!isLoopbackHost(u.hostname)) {
      return normalized;
    }

    if (!isLoopbackHost(win.hostname) || u.protocol !== win.protocol) {
      return normalized;
    }

    const apiPort = u.port || (u.protocol === "https:" ? "443" : "80");
    const pagePort =
      win.port || (win.protocol === "https:" ? "443" : "80");

    if (apiPort === pagePort) {
      return win.origin.replace(/\/+$/, "");
    }

    const portSuffix = u.port ? `:${u.port}` : "";
    return `${u.protocol}//${win.hostname}${portSuffix}`.replace(/\/+$/, "");
  } catch {
    return normalized;
  }
}
