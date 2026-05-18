import { PublicClientApplication } from "@azure/msal-browser";

const MICROSOFT_CLIENT_ID = import.meta.env.VITE_MS_CLIENT_ID || "";
const MICROSOFT_TENANT_ID = import.meta.env.VITE_MS_TENANT_ID || "common";
const MICROSOFT_REDIRECT_URI =
  import.meta.env.VITE_MS_REDIRECT_URI ||
  (typeof window !== "undefined" ? window.location.origin : "");
const MICROSOFT_SCOPES = (import.meta.env.VITE_MS_GRAPH_SCOPES || "User.Read,Calendars.Read")
  .split(",")
  .map((scope) => scope.trim())
  .filter(Boolean);

const GRAPH_BASE_URL = "https://graph.microsoft.com/v1.0";

const msalConfig = {
  auth: {
    clientId: MICROSOFT_CLIENT_ID || "missing-client-id",
    authority: `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}`,
    redirectUri: MICROSOFT_REDIRECT_URI,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    allowNativeBroker: false,
  },
};

let msalInstance = null;
let msalInitPromise = null;

const TONE_BY_STAGE = {
  sourced: "purple",
  "pre-screening": "purple",
  assessment: "green",
  "client interview": "blue",
  offer: "orange",
  rejected: "red",
};

export const isMicrosoftCalendarConfigured = () => Boolean(MICROSOFT_CLIENT_ID);

const ensureConfigured = () => {
  if (!isMicrosoftCalendarConfigured()) {
    throw new Error("Microsoft Calendar is not configured. Set VITE_MS_CLIENT_ID in your env file.");
  }
};

const getMsalInstance = async () => {
  ensureConfigured();

  if (!msalInstance) {
    msalInstance = new PublicClientApplication(msalConfig);
  }

  if (!msalInitPromise) {
    msalInitPromise = msalInstance.initialize();
  }

  await msalInitPromise;
  return msalInstance;
};

const getAccount = (instance) => {
  const activeAccount = instance.getActiveAccount();
  if (activeAccount) return activeAccount;

  const accounts = instance.getAllAccounts();
  if (accounts.length === 0) return null;

  instance.setActiveAccount(accounts[0]);
  return accounts[0];
};

const acquireGraphAccessToken = async (instance) => {
  const account = getAccount(instance);
  if (!account) throw new Error("No Microsoft account found. Please connect your account first.");

  const tokenRequest = {
    scopes: MICROSOFT_SCOPES,
    account,
  };

  try {
    const silentResult = await instance.acquireTokenSilent(tokenRequest);
    return silentResult.accessToken;
  } catch {
    const popupResult = await instance.acquireTokenPopup({
      ...tokenRequest,
      prompt: "select_account",
    });
    instance.setActiveAccount(popupResult.account || account);
    return popupResult.accessToken;
  }
};

const parseGraphDateTime = (dateTime, timeZone) => {
  if (!dateTime) return null;

  const hasOffset = /([+-]\d{2}:\d{2}|Z)$/.test(dateTime);
  const isoCandidate = hasOffset ? dateTime : `${dateTime}${timeZone === "UTC" ? "Z" : ""}`;
  const parsed = new Date(isoCandidate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const resolveTone = (stage, categories) => {
  const byStage = TONE_BY_STAGE[String(stage || "").toLowerCase()];
  if (byStage) return byStage;

  const categoryTone = (categories || [])
    .map((category) => String(category).toLowerCase())
    .find((category) => TONE_BY_STAGE[category]);

  return categoryTone ? TONE_BY_STAGE[categoryTone] : "blue";
};

const mapGraphEvent = (event) => {
  const start = parseGraphDateTime(event?.start?.dateTime, event?.start?.timeZone);
  const end = parseGraphDateTime(event?.end?.dateTime, event?.end?.timeZone);
  if (!start || !end) return null;

  const durationMins = Math.max(15, Math.round((end.getTime() - start.getTime()) / 60000));
  const stage = event?.categories?.[0] || "Microsoft Calendar";

  return {
    id: event.id,
    title: event.subject || "Interview",
    startsAt: start.toISOString(),
    durationMins,
    stage,
    tone: resolveTone(stage, event.categories),
    candidateName: event?.organizer?.emailAddress?.name || "",
    status: event?.responseStatus?.response || "scheduled",
    location: event?.location?.displayName || "",
    webLink: event?.webLink || "",
    sourceType: "microsoft",
  };
};

export const getMicrosoftCalendarConnection = async () => {
  if (!isMicrosoftCalendarConfigured()) {
    return { configured: false, connected: false, accountName: "" };
  }

  const instance = await getMsalInstance();
  const account = getAccount(instance);
  return {
    configured: true,
    connected: Boolean(account),
    accountName: account?.name || account?.username || "",
  };
};

export const connectMicrosoftCalendar = async () => {
  const instance = await getMsalInstance();
  const loginResult = await instance.loginPopup({
    scopes: MICROSOFT_SCOPES,
    prompt: "select_account",
  });

  if (loginResult?.account) {
    instance.setActiveAccount(loginResult.account);
  }

  const account = loginResult?.account || getAccount(instance);
  return {
    connected: Boolean(account),
    accountName: account?.name || account?.username || "",
  };
};

export const disconnectMicrosoftCalendar = async () => {
  if (!isMicrosoftCalendarConfigured()) return;

  const instance = await getMsalInstance();
  const account = getAccount(instance);
  if (!account) return;

  await instance.logoutPopup({
    account,
    postLogoutRedirectUri: MICROSOFT_REDIRECT_URI,
    mainWindowRedirectUri: MICROSOFT_REDIRECT_URI,
  });
};

export const fetchMicrosoftCalendarEvents = async ({ startDate, endDate, top = 200 }) => {
  const instance = await getMsalInstance();
  const accessToken = await acquireGraphAccessToken(instance);

  const requestUrl = new URL(`${GRAPH_BASE_URL}/me/calendarView`);
  requestUrl.searchParams.set("startDateTime", startDate.toISOString());
  requestUrl.searchParams.set("endDateTime", endDate.toISOString());
  requestUrl.searchParams.set("$top", String(top));
  requestUrl.searchParams.set("$orderby", "start/dateTime");
  requestUrl.searchParams.set(
    "$select",
    "id,subject,start,end,organizer,categories,location,responseStatus,webLink"
  );

  const response = await fetch(requestUrl.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Microsoft Graph request failed (${response.status}): ${errorText}`);
  }

  const payload = await response.json();
  return (payload?.value || []).map(mapGraphEvent).filter(Boolean);
};

