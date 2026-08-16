export const LEAGUE_TIME_ZONE = "America/New_York";

/** Returns the league's calendar day as a UTC date-only value for database comparisons. */
export function startOfLeagueDay(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: LEAGUE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value;
  return new Date(Date.UTC(Number(value("year")), Number(value("month")) - 1, Number(value("day"))));
}
