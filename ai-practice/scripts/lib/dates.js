// Issues are dated in Pacific time: the reader wakes up in the Bay Area.
export function todayPacific() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date());
}
