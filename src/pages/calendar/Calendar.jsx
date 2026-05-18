import * as React from "react";
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiLink2,
  FiLogIn,
  FiLogOut,
  FiRefreshCw,
  FiUser,
} from "react-icons/fi";
import {
  connectMicrosoftCalendar,
  disconnectMicrosoftCalendar,
  fetchMicrosoftCalendarEvents,
  getMicrosoftCalendarConnection,
  isMicrosoftCalendarConfigured,
} from "../../api/microsoftCalendar";
import { getMeetings, subscribeMeetings } from "../../utils/meetingStore";
import styles from "./Calendar.module.scss";

const WEEK_START_HOUR = 8;
const WEEK_END_HOUR = 24;
const DAY_START_HOUR = 0;
const DAY_END_HOUR = 24;
const HOUR_SLOT_HEIGHT = 36;
const DEFAULT_DATE = new Date(2026, 0, 1);
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const STAGE_TONE_MAP = {
  "pre-screening": "purple",
  assessment: "green",
  "client interview": "blue",
  offer: "orange",
};

const DEFAULT_EVENTS = [
  {
    id: "seed-zr-431212-job",
    title: "ZR_4312I2_JOB",
    startsAt: "2026-01-01T11:00:00.000Z",
    durationMins: 50,
    tone: "purple",
    candidateName: "Mapped Candidate",
    stage: "Sourced",
  },
  {
    id: "seed-jd-1",
    title: "Interview 1",
    startsAt: "2026-01-03T10:00:00.000Z",
    durationMins: 45,
    tone: "blue",
    candidateName: "Priya Sharma",
    stage: "Pre-Screening",
  },
  {
    id: "seed-jd-2",
    title: "Interview 2",
    startsAt: "2026-01-03T14:00:00.000Z",
    durationMins: 45,
    tone: "green",
    candidateName: "Vikram Singh",
    stage: "Assessment",
  },
  {
    id: "seed-jd-3",
    title: "Interview 3",
    startsAt: "2026-01-09T09:30:00.000Z",
    durationMins: 30,
    tone: "orange",
    candidateName: "Ananya Rao",
    stage: "Client interview",
  },
];

const formatDateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;

const startOfWeek = (date) => {
  const safe = new Date(date);
  const day = safe.getDay() === 0 ? 7 : safe.getDay();
  safe.setDate(safe.getDate() - (day - 1));
  safe.setHours(0, 0, 0, 0);
  return safe;
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const getHourSlots = (startHour, endHour, includeEnd = true) => {
  const length = includeEnd ? endHour - startHour + 1 : endHour - startHour;
  return Array.from({ length }, (_, index) => startHour + index);
};

const formatHour12 = (hour) =>
  new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hour12: true,
  }).format(new Date(2000, 0, 1, hour, 0, 0));

const parseDateValue = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toneFromStage = (stage) => {
  const key = String(stage || "").toLowerCase();
  return STAGE_TONE_MAP[key] || "purple";
};

const normalizeEvent = (item, index, sourceType) => {
  const start = parseDateValue(item.startsAt || item.start || item.date);
  if (!start) return null;

  const duration = Number(item.durationMins) > 0 ? Number(item.durationMins) : 45;
  const end = new Date(start.getTime() + duration * 60 * 1000);

  return {
    id: item.id || `${sourceType}-${index}`,
    title: item.title || item.label || item.candidateName || "Interview",
    start,
    end,
    durationMins: duration,
    tone: item.tone || toneFromStage(item.stage),
    candidateName: item.candidateName || "",
    candidateId: item.candidateId || "",
    stage: item.stage || "Pre-Screening",
    status: item.status || "Scheduled",
    jobId: item.jobId || "",
    sourceType,
  };
};

const buildMonthMatrix = (currentDate) => {
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const gridStart = startOfWeek(monthStart);
  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(gridStart, index);
    return {
      date,
      isOutside: date.getMonth() !== currentDate.getMonth(),
    };
  });
};

const formatRangeLabel = (view, date) => {
  if (view === "month") {
    return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
  }
  if (view === "week") {
    const start = startOfWeek(date);
    const end = addDays(start, 6);
    const left = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short" }).format(start);
    const right = new Intl.DateTimeFormat("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(end);
    return `${left} - ${right}`;
  }
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

const getRangeForView = (view, date) => {
  if (view === "month") {
    const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }

  if (view === "week") {
    const start = startOfWeek(date);
    const end = addDays(start, 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const Calendar = () => {
  const [view, setView] = React.useState("month");
  const [currentDate, setCurrentDate] = React.useState(new Date(DEFAULT_DATE));
  const [meetings, setMeetings] = React.useState(() => getMeetings());
  const [selectedEventId, setSelectedEventId] = React.useState("");
  const [isEventPopupOpen, setIsEventPopupOpen] = React.useState(false);
  const [microsoftEvents, setMicrosoftEvents] = React.useState([]);
  const [isMicrosoftConnected, setIsMicrosoftConnected] = React.useState(false);
  const [microsoftAccountName, setMicrosoftAccountName] = React.useState("");
  const [isMicrosoftLoading, setIsMicrosoftLoading] = React.useState(false);
  const [microsoftError, setMicrosoftError] = React.useState("");
  const [lastSyncAt, setLastSyncAt] = React.useState(null);

  const isMicrosoftConfigured = React.useMemo(() => isMicrosoftCalendarConfigured(), []);

  React.useEffect(() => {
    const unsubscribe = subscribeMeetings(setMeetings);
    return unsubscribe;
  }, []);

  React.useEffect(() => {
    let active = true;

    const checkConnection = async () => {
      if (!isMicrosoftConfigured) return;

      try {
        const connection = await getMicrosoftCalendarConnection();
        if (!active) return;
        setIsMicrosoftConnected(connection.connected);
        setMicrosoftAccountName(connection.accountName || "");
      } catch (error) {
        if (!active) return;
        setMicrosoftError(error.message || "Unable to initialize Microsoft Calendar connection.");
      }
    };

    checkConnection();

    return () => {
      active = false;
    };
  }, [isMicrosoftConfigured]);

  const events = React.useMemo(() => {
    const seeded = DEFAULT_EVENTS.map((item, index) => normalizeEvent(item, index, "seed")).filter(Boolean);
    const live = (meetings || [])
      .map((item, index) => normalizeEvent(item, index, "live"))
      .filter(Boolean);
    const graph = (microsoftEvents || [])
      .map((item, index) => normalizeEvent(item, index, "microsoft"))
      .filter(Boolean);

    const merged = [...seeded];
    [...live, ...graph].forEach((item) => {
      const index = merged.findIndex((event) => event.id === item.id);
      if (index >= 0) merged[index] = item;
      else merged.push(item);
    });

    return merged.sort((left, right) => left.start.getTime() - right.start.getTime());
  }, [meetings, microsoftEvents]);

  const eventsByDate = React.useMemo(() => {
    const map = new Map();
    events.forEach((event) => {
      const key = formatDateKey(event.start);
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(event);
    });
    return map;
  }, [events]);

  const selectedEvent = React.useMemo(
    () => events.find((item) => item.id === selectedEventId) || null,
    [events, selectedEventId]
  );

  const dayEvents = React.useMemo(() => {
    const key = formatDateKey(currentDate);
    return eventsByDate.get(key) || [];
  }, [currentDate, eventsByDate]);

  const weekDays = React.useMemo(() => {
    const start = startOfWeek(currentDate);
    return Array.from({ length: 7 }, (_, index) => addDays(start, index));
  }, [currentDate]);

  const monthCells = React.useMemo(() => buildMonthMatrix(currentDate), [currentDate]);

  const weekHourSlots = React.useMemo(() => getHourSlots(WEEK_START_HOUR, WEEK_END_HOUR), []);
  const dayHourSlots = React.useMemo(() => getHourSlots(DAY_START_HOUR, DAY_END_HOUR, false), []);

  const syncMicrosoftCalendar = React.useCallback(async () => {
    if (!isMicrosoftConfigured || !isMicrosoftConnected) return;

    const { start, end } = getRangeForView(view, currentDate);

    setIsMicrosoftLoading(true);
    setMicrosoftError("");

    try {
      const remoteEvents = await fetchMicrosoftCalendarEvents({
        startDate: start,
        endDate: end,
      });
      setMicrosoftEvents(remoteEvents);
      setLastSyncAt(new Date());
    } catch (error) {
      setMicrosoftError(error.message || "Failed to fetch Microsoft Calendar events.");
    } finally {
      setIsMicrosoftLoading(false);
    }
  }, [currentDate, isMicrosoftConfigured, isMicrosoftConnected, view]);

  React.useEffect(() => {
    if (!isMicrosoftConnected) return;
    syncMicrosoftCalendar();
  }, [isMicrosoftConnected, syncMicrosoftCalendar]);

  React.useEffect(() => {
    if (!isEventPopupOpen) return undefined;

    const onEscape = (event) => {
      if (event.key === "Escape") {
        setIsEventPopupOpen(false);
      }
    };

    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("keydown", onEscape);
    };
  }, [isEventPopupOpen]);

  const handleEventClick = React.useCallback((eventId) => {
    setSelectedEventId(eventId);
    setIsEventPopupOpen(true);
  }, []);

  const handleConnectMicrosoft = async () => {
    if (!isMicrosoftConfigured) return;

    setIsMicrosoftLoading(true);
    setMicrosoftError("");

    try {
      const result = await connectMicrosoftCalendar();
      setIsMicrosoftConnected(result.connected);
      setMicrosoftAccountName(result.accountName || "");
    } catch (error) {
      setMicrosoftError(error.message || "Microsoft Calendar sign-in failed.");
    } finally {
      setIsMicrosoftLoading(false);
    }
  };

  const handleDisconnectMicrosoft = async () => {
    setIsMicrosoftLoading(true);
    setMicrosoftError("");

    try {
      await disconnectMicrosoftCalendar();
      setIsMicrosoftConnected(false);
      setMicrosoftAccountName("");
      setMicrosoftEvents([]);
      setLastSyncAt(null);
    } catch (error) {
      setMicrosoftError(error.message || "Microsoft Calendar sign-out failed.");
    } finally {
      setIsMicrosoftLoading(false);
    }
  };

  const toPixelTop = (date, startHour, endHour) => {
    const minutesFromStart = (date.getHours() - startHour) * 60 + date.getMinutes();
    return clamp(
      (minutesFromStart / 60) * HOUR_SLOT_HEIGHT,
      0,
      (endHour - startHour) * HOUR_SLOT_HEIGHT
    );
  };

  const toPixelHeight = (event, startHour, endHour) => {
    const mins = Math.max(30, event.durationMins || 45);
    const eventStartHour = event.start.getHours() + event.start.getMinutes() / 60;
    const maxVisibleMins = Math.max(
      30,
      Math.round((endHour - eventStartHour) * 60)
    );
    const safeMins = Math.min(mins, maxVisibleMins);
    return Math.max(24, (safeMins / 60) * HOUR_SLOT_HEIGHT - 8);
  };

  const handlePrev = () => {
    setCurrentDate((previous) => {
      const next = new Date(previous);
      if (view === "month") next.setMonth(previous.getMonth() - 1);
      else if (view === "week") next.setDate(previous.getDate() - 7);
      else next.setDate(previous.getDate() - 1);
      return next;
    });
  };

  const handleNext = () => {
    setCurrentDate((previous) => {
      const next = new Date(previous);
      if (view === "month") next.setMonth(previous.getMonth() + 1);
      else if (view === "week") next.setDate(previous.getDate() + 7);
      else next.setDate(previous.getDate() + 1);
      return next;
    });
  };

  const setToday = () => setCurrentDate(new Date());

  const renderWeekEvents = (day) => {
    const list = eventsByDate.get(formatDateKey(day)) || [];
    return list.map((event) => (
      <button
        key={event.id}
        type="button"
        className={styles.weekEvent}
        data-tone={event.tone}
        style={{
          top: `${toPixelTop(event.start, WEEK_START_HOUR, WEEK_END_HOUR)}px`,
          height: `${toPixelHeight(event, WEEK_START_HOUR, WEEK_END_HOUR)}px`,
        }}
        onClick={() => handleEventClick(event.id)}
      >
        {event.title}
      </button>
    ));
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.headerRow}>
          <div>
            <h2 className={styles.title}>Calendar</h2>
            <div className={styles.breadcrumb}>
              <span>Dashboard</span>
              <span className={styles.separator}>/</span>
              <span className={styles.current}>Calendar</span>
            </div>
          </div>
        </div>

        <div className={styles.calendarCard}>
          <div className={styles.controls}>
            <div className={styles.controlsLeft}>
              <button type="button" className={styles.todayBtn} onClick={setToday}>
                Today
              </button>
              <select
                className={styles.viewSelect}
                value={view}
                onChange={(event) => setView(event.target.value)}
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
              <button type="button" className={styles.navBtn} aria-label="Previous" onClick={handlePrev}>
                <FiChevronLeft />
              </button>
              <button type="button" className={styles.navBtn} aria-label="Next" onClick={handleNext}>
                <FiChevronRight />
              </button>
              <span className={styles.rangeLabel}>{formatRangeLabel(view, currentDate)}</span>
            </div>

            <div className={styles.controlsRight}>
              {isMicrosoftConfigured ? (
                <div className={styles.microsoftActions}>
                  {isMicrosoftConnected ? (
                    <>
                      <button
                        type="button"
                        className={styles.microsoftBtn}
                        onClick={syncMicrosoftCalendar}
                        disabled={isMicrosoftLoading}
                      >
                        <FiRefreshCw />
                        {isMicrosoftLoading ? "Syncing..." : "Sync Outlook"}
                      </button>
                      <button
                        type="button"
                        className={styles.microsoftBtnSecondary}
                        onClick={handleDisconnectMicrosoft}
                        disabled={isMicrosoftLoading}
                      >
                        <FiLogOut />
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className={styles.microsoftBtn}
                      onClick={handleConnectMicrosoft}
                      disabled={isMicrosoftLoading}
                    >
                      <FiLogIn />
                      {isMicrosoftLoading ? "Connecting..." : "Connect Outlook"}
                    </button>
                  )}
                </div>
              ) : (
                <div className={styles.microsoftHint}>
                  Configure Microsoft Calendar in `.env.dev` / `.env.prod`
                </div>
              )}

              {selectedEvent ? (
                <div className={styles.eventPreview}>
                  <span className={styles.eventPreviewBadge} data-tone={selectedEvent.tone} />
                  <div>
                    <div className={styles.eventPreviewTitle}>{selectedEvent.title}</div>
                    <div className={styles.eventPreviewMeta}>
                      <FiClock />
                      {selectedEvent.start.toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {isMicrosoftConnected ? (
            <div className={styles.microsoftMeta}>
              <span className={styles.microsoftPill}>
                <FiLink2 />
                {microsoftAccountName || "Connected to Microsoft Calendar"}
              </span>
              {lastSyncAt ? <span>Last sync: {lastSyncAt.toLocaleTimeString("en-GB")}</span> : null}
            </div>
          ) : null}

          {microsoftError ? <div className={styles.microsoftError}>{microsoftError}</div> : null}

          {view === "month" ? (
            <div className={styles.monthGrid}>
              {DAY_NAMES.map((day) => (
                <div key={day} className={styles.monthHeaderCell}>
                  {day}
                </div>
              ))}

              {monthCells.map((cell) => {
                const key = formatDateKey(cell.date);
                const list = eventsByDate.get(key) || [];
                const visible = list.slice(0, 3);
                return (
                  <button
                    key={key}
                    type="button"
                    className={`${styles.monthCell}${cell.isOutside ? ` ${styles.monthCellOutside}` : ""}`}
                    onClick={() => setCurrentDate(new Date(cell.date))}
                  >
                    <div className={styles.monthCellDate}>
                      <span>{cell.date.getDate()}</span>
                      <span className={styles.monthCellDay}>
                        {cell.date.toLocaleDateString("en-US", { weekday: "short" })}
                      </span>
                    </div>
                    <div className={styles.monthEvents}>
                      {visible.map((event) => (
                        <span
                          key={event.id}
                          className={styles.monthEvent}
                          data-tone={event.tone}
                          onClick={(eventClick) => {
                            eventClick.stopPropagation();
                            handleEventClick(event.id);
                            setCurrentDate(new Date(cell.date));
                          }}
                        >
                          {event.title}
                        </span>
                      ))}
                      {list.length > 3 ? <span className={styles.monthMore}>+{list.length - 3} more</span> : null}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}

          {view === "week" ? (
            <div className={styles.weekTimeline}>
              <div className={styles.weekTimelineHeader}>
                <div className={styles.weekTimelineTimeSpacer} />
                {weekDays.map((day) => (
                  <div key={formatDateKey(day)} className={styles.weekDayHeader}>
                    <span className={styles.weekDayName}>{day.toLocaleDateString("en-US", { weekday: "short" })}</span>
                    <span className={styles.weekDayDate}>{day.getDate()}</span>
                  </div>
                ))}
              </div>

              <div className={styles.weekTimelineBody}>
                <div className={styles.weekHours}>
                  {weekHourSlots.map((hour) => (
                    <div key={`week-hour-${hour}`} className={styles.hourLabel}>
                      {hour}:00
                    </div>
                  ))}
                </div>
                <div className={styles.weekGrid} style={{ "--slot-height": `${HOUR_SLOT_HEIGHT}px` }}>
                  {weekDays.map((day) => (
                    <div key={`column-${formatDateKey(day)}`} className={styles.weekColumn}>
                      {weekHourSlots.map((hour) => (
                        <div key={`${formatDateKey(day)}-${hour}`} className={styles.weekSlot} />
                      ))}
                      <div className={styles.weekEventsLayer}>{renderWeekEvents(day)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {view === "day" ? (
            <div className={styles.dayTimeline}>
              <div className={styles.timelineDayStrip}>
                <span className={styles.timelineWeekday}>
                  {currentDate.toLocaleDateString("en-US", { weekday: "short" })}
                </span>
                <span className={styles.timelineDayNumber}>{currentDate.getDate()}</span>
              </div>

              <div className={styles.dayTimelineBody}>
                <div className={styles.dayHours}>
                  {dayHourSlots.map((hour) => (
                    <div key={`day-hour-${hour}`} className={styles.hourLabel}>
                      {formatHour12(hour)}
                    </div>
                  ))}
                </div>
                <div className={styles.dayGrid} style={{ "--slot-height": `${HOUR_SLOT_HEIGHT}px` }}>
                  {dayHourSlots.map((hour) => (
                    <div key={`day-slot-${hour}`} className={styles.weekSlot} />
                  ))}
                  <div className={styles.dayEventsLayer}>
                    {dayEvents.map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        className={styles.dayEvent}
                        data-tone={event.tone}
                        style={{
                          top: `${toPixelTop(event.start, DAY_START_HOUR, DAY_END_HOUR)}px`,
                          height: `${toPixelHeight(event, DAY_START_HOUR, DAY_END_HOUR)}px`,
                        }}
                        onClick={() => handleEventClick(event.id)}
                      >
                        {event.title}
                      </button>
                    ))}

                    {dayEvents.length === 0 ? (
                      <div className={styles.noEventsState}>
                        <FiCalendar />
                        No meetings scheduled for this day.
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {selectedEvent && isEventPopupOpen ? (
          <div className={styles.eventModalOverlay} onClick={() => setIsEventPopupOpen(false)}>
            <div className={styles.eventModal} onClick={(event) => event.stopPropagation()}>
              <div className={styles.eventModalHeader}>
                <h3 className={styles.eventModalTitle}>{selectedEvent.title}</h3>
                <button
                  type="button"
                  className={styles.eventModalClose}
                  onClick={() => setIsEventPopupOpen(false)}
                  aria-label="Close event details"
                >
                  ×
                </button>
              </div>
              <div className={styles.eventDetailRow}>
                <FiUser />
                <span>{selectedEvent.candidateName || selectedEvent.candidateId || "Candidate"}</span>
              </div>
              <div className={styles.eventDetailRow}>
                <FiClock />
                <span>
                  {selectedEvent.start.toLocaleString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className={styles.eventDetailRow}>
                <span className={styles.eventDetailPill} data-tone={selectedEvent.tone}>
                  {selectedEvent.stage}
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Calendar;
