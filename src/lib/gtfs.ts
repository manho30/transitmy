export interface GtfsTable {
  rows: Record<string, string>[]
}

export interface ParsedGtfs {
  agency?: GtfsTable
  routes?: GtfsTable
  stops?: GtfsTable
  trips?: GtfsTable
  stopTimes?: GtfsTable
  shapes?: GtfsTable
  calendar?: GtfsTable
  calendarDates?: GtfsTable
}

const parseCsv = (csv: string): GtfsTable => {
  const lines = csv.trim().split(/\r?\n/)
  if (lines.length === 0) {
    return { rows: [] }
  }
  const headers = lines[0].split(',').map((value) => value.trim())
  const rows = lines.slice(1).filter(Boolean).map((line) => {
    const values = line.split(',').map((value) => value.trim())
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']))
  })
  return { rows }
}

export const parseGtfsStatic = (files: Record<string, string>): ParsedGtfs => ({
  agency: files['agency.txt'] ? parseCsv(files['agency.txt']) : undefined,
  routes: files['routes.txt'] ? parseCsv(files['routes.txt']) : undefined,
  stops: files['stops.txt'] ? parseCsv(files['stops.txt']) : undefined,
  trips: files['trips.txt'] ? parseCsv(files['trips.txt']) : undefined,
  stopTimes: files['stop_times.txt'] ? parseCsv(files['stop_times.txt']) : undefined,
  shapes: files['shapes.txt'] ? parseCsv(files['shapes.txt']) : undefined,
  calendar: files['calendar.txt'] ? parseCsv(files['calendar.txt']) : undefined,
  calendarDates: files['calendar_dates.txt'] ? parseCsv(files['calendar_dates.txt']) : undefined,
})
