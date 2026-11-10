const DATABASE_DATE_PATTERN =
  /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}(?::\d{2})?)$/;
const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  hour: "2-digit",
  hour12: true,
  minute: "2-digit",
  month: "short",
  year: "numeric",
});

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

/** The API returns "YYYY-MM-DD HH:mm:ss" timestamps in UTC; everything else is parsed as-is. */
export const parseApiDate = (value: string): Date => {
  if (DATABASE_DATE_PATTERN.test(value)) {
    return new Date(value.replace(DATABASE_DATE_PATTERN, "$1T$2") + (value.length === 16 ? ":00Z" : "Z"));
  }
  return new Date(value);
};

const getPart = (
  parts: readonly Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
): string => parts.find((part) => part.type === type)?.value ?? "";

export const formatDateTime = (value: string): string => {
  const date = parseApiDate(value);
  if (Number.isNaN(date.getTime())) return "—";

  const parts = DATE_TIME_FORMATTER.formatToParts(date);
  const day = getPart(parts, "day");
  const month = getPart(parts, "month").toLocaleUpperCase();
  const year = getPart(parts, "year");
  const hour = getPart(parts, "hour");
  const minute = getPart(parts, "minute");
  const dayPeriod = getPart(parts, "dayPeriod").toLocaleUpperCase();
  return `${day} ${month} ${year} ${hour}:${minute} ${dayPeriod}`;
};

export const formatDate = (value: string): string => {
  if (!value) return "TBD";
  const date = parseApiDate(value);
  if (Number.isNaN(date.getTime())) return "—";

  const parts = DATE_FORMATTER.formatToParts(date);
  const day = getPart(parts, "day");
  const month = getPart(parts, "month").toLocaleUpperCase();
  const year = getPart(parts, "year");
  return `${day} ${month} ${year}`;
};
