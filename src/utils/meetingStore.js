const MEETING_STORAGE_KEY = "methodhub.meetings.v1";
const MEETING_UPDATE_EVENT = "methodhub:meetings:updated";

const isBrowser = typeof window !== "undefined";

const safeParse = (value) => {
  try {
    return JSON.parse(value);
  } catch (_) {
    return [];
  }
};

const normalizeMeetings = (items) => {
  if (!Array.isArray(items)) return [];
  return items.filter((item) => item && typeof item === "object" && item.id);
};

const readStorage = () => {
  if (!isBrowser) return [];
  const raw = window.localStorage.getItem(MEETING_STORAGE_KEY);
  return normalizeMeetings(safeParse(raw || "[]"));
};

const writeStorage = (meetings) => {
  if (!isBrowser) return;
  window.localStorage.setItem(MEETING_STORAGE_KEY, JSON.stringify(meetings));
  window.dispatchEvent(new Event(MEETING_UPDATE_EVENT));
};

export const getMeetings = () => readStorage();

export const upsertMeeting = (meeting) => {
  if (!meeting || !meeting.id) return;
  const current = readStorage();
  const index = current.findIndex((item) => item.id === meeting.id);
  const next = index >= 0
    ? current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...meeting } : item))
    : [...current, meeting];
  writeStorage(next);
};

export const subscribeMeetings = (onChange) => {
  if (!isBrowser || typeof onChange !== "function") return () => {};

  const refresh = () => onChange(readStorage());
  const onStorage = (event) => {
    if (event.key === MEETING_STORAGE_KEY) refresh();
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(MEETING_UPDATE_EVENT, refresh);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(MEETING_UPDATE_EVENT, refresh);
  };
};

const parseDurationMinutes = (value) => {
  if (!value) return 45;
  const match = String(value).match(/(\d+)/);
  const minutes = Number(match?.[1]);
  return Number.isFinite(minutes) && minutes > 0 ? minutes : 45;
};

const fallbackDateTime = () => {
  const next = new Date();
  next.setHours(11, 0, 0, 0);
  next.setDate(next.getDate() + 1);
  return next.toISOString();
};

export const buildMeetingFromPreScreening = ({ candidate, job, formData }) => {
  if (!candidate) return null;

  const openingJobId = job?.openingJobId || "JOB";
  const candidateId = candidate.candidateId || candidate.rowId || "candidate";
  const startsAt = formData?.scheduleDateTime
    ? new Date(formData.scheduleDateTime).toISOString()
    : fallbackDateTime();
  const durationMins = parseDurationMinutes(formData?.duration);

  return {
    id: `${openingJobId}-${candidateId}-pre-screening`,
    jobId: openingJobId,
    candidateId,
    candidateName: candidate.candidateName || candidateId,
    title: `${openingJobId} - ${candidate.candidateName || candidateId}`,
    stage: "Pre-Screening",
    status: "Scheduled",
    startsAt,
    durationMins,
    mode: formData?.platform ? "Online" : "Panel",
    platform: formData?.platform || "",
    meetingLink: formData?.meetingLink || "",
    recruiterName: candidate.recruiterName || "",
    tone: "purple",
    createdAt: new Date().toISOString(),
  };
};

