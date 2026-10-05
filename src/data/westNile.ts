/**
 * West Nile Monorail (6th of October line): under construction, shown for information only.
 * Not used for routing, fares or ticketing.
 * Station list and order follow the Ministry of Transport announcements.
 */

export type PlannedStation = {
  name: string;
  /** 1 = first sector (trial operation planned Oct 2026), 2 = second sector (planned Q1 2027). */
  phase: 1 | 2;
  connections: string[];
};

export const westNile = {
  id: 'west-nile',
  name: 'خط غرب النيل',
  lengthKm: 43.8,
  stationCount: 13,
  status: 'قيد التنفيذ',
  /** Trial operation is not commercial service: no tickets and no official fares yet. */
  note: 'التشغيل التجريبي مش تشغيل تجاري، ومفيش أسعار معلنة للخط لحد دلوقتي.',
  stations: [
    { name: 'أكتوبر الجديدة', phase: 1, connections: [] },
    { name: 'جامعة الأهرام الكندية', phase: 1, connections: [] },
    { name: 'السادات', phase: 1, connections: [] },
    { name: 'جامعة 6 أكتوبر', phase: 1, connections: ['مترو الخط الرابع (مستقبلًا)'] },
    { name: 'نقابة المهندسين', phase: 1, connections: ['القطار الكهربائي السريع (مستقبلًا)'] },
    { name: 'مول مصر', phase: 1, connections: [] },
    { name: 'مدينة الشيخ زايد', phase: 1, connections: [] },
    { name: 'طريق الإسكندرية', phase: 1, connections: [] },
    { name: 'المنصورية', phase: 2, connections: [] },
    { name: 'المريوطية', phase: 2, connections: [] },
    { name: 'الطريق الدائري', phase: 2, connections: [] },
    { name: 'بشتيل', phase: 2, connections: ['محطة سكك حديد الصعيد'] },
    { name: 'وادي النيل', phase: 2, connections: ['مترو الخط الثالث'] },
  ] satisfies PlannedStation[],
};
