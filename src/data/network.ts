/**
 * Cairo Monorail network data (East Nile Line, in passenger service since May 2026).
 *
 * To add another line later (for example West Nile / 6 October):
 *   1. add its id to `LineId` and an entry to `lineMeta`
 *   2. add a `linePaths` entry with its stations in order
 *   3. add the new stations to the station rows
 * Routing, the stations page and the map all read from here.
 */

export type LineId = 'east-nile';

export type Connection = { label: string; status: 'active' | 'planned' };

export type Station = {
  id: string;
  name: string;
  area: string;
  lines: LineId[];
  connections: Connection[];
};

export type LinePath = { line: LineId; branch?: string; names: string[] };

export const lineMeta: Record<LineId, { name: string; color: string; lengthKm: number; stationCount: number }> = {
  'east-nile': { name: 'خط شرق النيل', color: '#2f6fd6', lengthKm: 56.5, stationCount: 22 },
};

export const lineColors = Object.fromEntries(Object.entries(lineMeta).map(([id, meta]) => [id, meta.color])) as Record<
  LineId,
  string
>;

export const lineNames = Object.fromEntries(Object.entries(lineMeta).map(([id, meta]) => [id, meta.name])) as Record<
  LineId,
  string
>;

const NASR_CITY = 'مدينة نصر';
const NEW_CAIRO = 'القاهرة الجديدة';
const NEW_CAPITAL = 'العاصمة الإدارية';

const metro3: Connection = { label: 'مترو الخط الثالث', status: 'active' };
const lrt: Connection = { label: 'القطار الكهربائي الخفيف LRT', status: 'active' };
const metro4: Connection = { label: 'مترو الخط الرابع (مستقبلًا)', status: 'planned' };
const metro6: Connection = { label: 'مترو الخط السادس (مستقبلًا)', status: 'planned' };

/** East Nile Line, in running order from Cairo Stadium to Justice City. */
const stationRows: [name: string, area: string, connections?: Connection[]][] = [
  ['الاستاد', NASR_CITY, [metro3]],
  ['هشام بركات', NASR_CITY, [metro4]],
  ['جامعة الأزهر', NASR_CITY],
  ['الحي السابع', NASR_CITY],
  ['المشير أحمد إسماعيل', NASR_CITY],
  ['جيهان السادات', NASR_CITY],
  ['المشير طنطاوي', NEW_CAIRO],
  ['وان ناينتي', NEW_CAIRO],
  ['المستشفى الجوي', NEW_CAIRO],
  ['النرجس', NEW_CAIRO, [metro6]],
  ['المستثمرين', NEW_CAIRO],
  ['اللوتس', NEW_CAIRO],
  ['جولدن سكوير', NEW_CAIRO],
  ['بيت الوطن', NEW_CAIRO],
  ['مسجد الفتاح العليم', NEW_CAPITAL],
  ['الحي R1', NEW_CAPITAL],
  ['الحي R2', NEW_CAPITAL],
  ['حي المال والأعمال', NEW_CAPITAL],
  ['مدينة الفنون والثقافة', NEW_CAPITAL, [lrt]],
  ['الحي الحكومي', NEW_CAPITAL],
  ['مسجد مصر', NEW_CAPITAL],
  ['مدينة العدالة', NEW_CAPITAL],
];

export const linePaths: LinePath[] = [{ line: 'east-nile', names: stationRows.map(([name]) => name) }];

export const stations: Station[] = stationRows.map(([name, area, connections = []]) => ({
  id: name,
  name,
  area,
  lines: ['east-nile'],
  connections,
}));

export const stationById = new Map(stations.map((station) => [station.id, station]));

/** Lines announced but not open yet. Shown for information only, never used for routing. */
export const plannedLines = [
  {
    name: 'خط غرب النيل',
    description: 'من مدينة ٦ أكتوبر لحد وادي النيل في المهندسين، بطول حوالي ٤٤ كم، وبيتم تنفيذه حاليًا.',
  },
];
