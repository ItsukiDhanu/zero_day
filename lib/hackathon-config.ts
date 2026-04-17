const HACKATHON_TIME_ZONE = "Asia/Kolkata";

export const HACKATHON_START_IST = "2026-05-13T09:00:00+05:30";
export const HACKATHON_START_MS = new Date(HACKATHON_START_IST).getTime();

const HACKATHON_START_DATE = new Date(HACKATHON_START_IST);

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "long",
  timeZone: HACKATHON_TIME_ZONE,
});

const dateWithYearFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: HACKATHON_TIME_ZONE,
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: HACKATHON_TIME_ZONE,
});

const countdownDayFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  timeZone: HACKATHON_TIME_ZONE,
});

const countdownMonthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  timeZone: HACKATHON_TIME_ZONE,
});

const countdownTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: HACKATHON_TIME_ZONE,
});

const HACKATHON_TIME_LABEL = `${timeFormatter.format(HACKATHON_START_DATE).toUpperCase()} IST`;

export const HACKATHON_START_LABEL = `${dateFormatter.format(HACKATHON_START_DATE)}, ${HACKATHON_TIME_LABEL}`;
export const HACKATHON_FOOTER_LABEL = `${dateWithYearFormatter.format(HACKATHON_START_DATE)} • ${HACKATHON_TIME_LABEL}`;
export const HACKATHON_COUNTDOWN_TARGET_LABEL = `${countdownDayFormatter
  .format(HACKATHON_START_DATE)
  .toLowerCase()}-${countdownMonthFormatter
  .format(HACKATHON_START_DATE)
  .toLowerCase()}-${countdownTimeFormatter.format(HACKATHON_START_DATE)}-ist`;
