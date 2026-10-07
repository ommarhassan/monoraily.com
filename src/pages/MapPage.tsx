import { useState, useMemo } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { getStationName } from '../components/StationPicker';
import { lineColors, lineMeta, stations } from '../data/network';

type Props = { 
  onTicket?: (from: string, to: string) => void 
};

// أيقونات SVG نظيفة وعصرية
const TrainIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <rect x="4" y="3" width="16" height="13" rx="2" />
    <path d="M4 11h16M12 3v8M8 8h.01M16 8h.01M6 19l-2 2M18 19l2 2" />
  </svg>
);

const SearchIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const ZapIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const RotateCcwIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const TicketIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
  </svg>
);

const ArrowRightIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

const ClockIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="10" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
  </svg>
);

const InfoIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

// مسار الانحناء المائل لشرق النيل
const EAST_PATH = "M 70,140 C 140,105 210,105 280,120 C 370,140 450,220 540,290 C 630,350 740,370 840,340 C 940,300 1020,230 1100,260 C 1170,290 1220,380 1260,440";

// مسار خط غرب النيل (6 أكتوبر)
const WEST_PATH = "M 180,530 C 260,460 380,360 480,245";

// إحداثيات محطات شرق النيل على طول منحنى المسار
const EAST_COORDS: Record<string, { x: number; y: number }> = {
  'st-1': { x: 70, y: 140 },
  'st-2': { x: 110, y: 125 },
  'st-3': { x: 155, y: 115 },
  'st-4': { x: 200, y: 110 },
  'st-5': { x: 245, y: 114 },
  'st-6': { x: 290, y: 124 },
  'st-7': { x: 335, y: 142 },
  'st-8': { x: 380, y: 168 },
  'st-9': { x: 425, y: 202 },
  'st-10': { x: 480, y: 245 },
  'st-11': { x: 530, y: 284 },
  'st-12': { x: 580, y: 316 },
  'st-13': { x: 630, y: 340 },
  'st-14': { x: 685, y: 358 },
  'st-15': { x: 740, y: 366 },
  'st-16': { x: 795, y: 358 },
  'st-17': { x: 850, y: 338 },
  'st-18': { x: 905, y: 312 },
  'st-19': { x: 960, y: 280 },
  'st-20': { x: 1010, y: 252 },
  'st-21': { x: 1060, y: 248 },
  'st-22': { x: 1110, y: 264 },
  'st-23': { x: 1155, y: 298 },
  'st-24': { x: 1195, y: 345 },
  'st-25': { x: 1225, y: 385 },
  'st-26': { x: 1245, y: 415 },
  'st-27': { x: 1260, y: 440 },
};

// محطات خط غرب النيل (6 أكتوبر)
const WEST_STATIONS = [
  { id: 'w-1', name: { ar: 'جامعة 6 أكتوبر', en: '6th of October Univ' }, area: { ar: '6 أكتوبر', en: '6th of October' }, x: 180, y: 530 },
  { id: 'w-2', name: { ar: 'ميدان الحصري', en: 'El-Hossary Square' }, area: { ar: '6 أكتوبر', en: '6th of October' }, x: 240, y: 475 },
  { id: 'w-3', name: { ar: 'ميدان جهينة', en: 'Juhayna Square' }, area: { ar: '6 أكتوبر', en: '6th of October' }, x: 300, y: 420 },
  { id: 'w-4', name: { ar: 'الشيخ زايد', en: 'Sheikh Zayed' }, area: { ar: 'الشيخ زايد', en: 'Sheikh Zayed' }, x: 360, y: 365 },
  { id: 'w-5', name: { ar: 'محور 26 يوليو', en: '26th of July Axis' }, area: { ar: 'الجيزة', en: 'Giza' }, x: 420, y: 305 },
];

const isInterchangeStation = (st: any): boolean => {
  if (!st) return false;
  return Boolean(st.isInterchange || st.interchange || st.transfer || ['st-1', 'st-10', 'st-24', 'w-5'].includes(st.id));
};

const getDisplayName = (st: any, currentLang: 'ar' | 'en'): string => {
  if (!st) return '';
  if (typeof st.name === 'string') {
    return getStationName(st.name, currentLang);
  }
  if (st.name && typeof st.name === 'object') {
    return currentLang === 'ar' ? (st.name.ar || st.name.en || '') : (st.name.en || st.name.ar || '');
  }
  return String(st.id || '');
};

const getDisplayArea = (st: any, currentLang: 'ar' | 'en'): string => {
  if (!st) return '';
  if (typeof st.area === 'string') {
    return getStationName(st.area, currentLang);
  }
  if (st.area && typeof st.area === 'object') {
    return currentLang === 'ar' ? (st.area.ar || st.area.en || '') : (st.area.en || st.area.ar || '');
  }
  return '';
};

export default function MapPage({ onTicket }: Props) {
  const { lang } = useLanguage();
  const currentLang = (lang || 'ar') as 'ar' | 'en';
  const isAr = currentLang === 'ar';

  const [activeLineFilter, setActiveLineFilter] = useState<'all' | 'east' | 'west' | 'interchange'>('all');
  const [originId, setOriginId] = useState<string>('st-1');
  const [destId, setDestId] = useState<string>('st-27');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // دمج المحطات
  const allNetworkStations = useMemo(() => {
    const east = (stations as any[]).map(s => ({ ...s, line: 'east' }));
    const west = WEST_STATIONS.map(w => ({ ...w, line: 'west' }));
    return [...east, ...west];
  }, []);

  const originStation = useMemo(
    () => allNetworkStations.find((s) => s.id === originId) || allNetworkStations[0],
    [originId, allNetworkStations]
  );

  const destStation = useMemo(
    () => allNetworkStations.find((s) => s.id === destId) || allNetworkStations[allNetworkStations.length - 1],
    [destId, allNetworkStations]
  );

  const activeHoverStation = useMemo(
    () => allNetworkStations.find((s) => s.id === hoveredId),
    [hoveredId, allNetworkStations]
  );

  const filteredEastStations = useMemo(() => {
    return (stations as any[]).filter((st) => {
      const name = getDisplayName(st, currentLang);
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
      if (activeLineFilter === 'west') return false;
      if (activeLineFilter === 'interchange') return matchesSearch && isInterchangeStation(st);
      return matchesSearch;
    });
  }, [searchQuery, activeLineFilter, currentLang]);

  const filteredWestStations = useMemo(() => {
    return WEST_STATIONS.filter((st) => {
      const name = getDisplayName(st, currentLang);
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
      if (activeLineFilter === 'east') return false;
      if (activeLineFilter === 'interchange') return matchesSearch && isInterchangeStation(st);
      return matchesSearch;
    });
  }, [searchQuery, activeLineFilter, currentLang]);

  const colorsMap = lineColors as Record<string, string>;
  const metaMap = lineMeta as Record<string, any>;

  const eastColor = colorsMap['east-nile'] || '#0284c7';
  const westColor = colorsMap['west-nile'] || '#f59e0b';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
      
      {/* Header العصر الجديد والمميز */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
              <TrainIcon className="w-3.5 h-3.5" />
              <span>{isAr ? 'خريطة شبكة المونوريل تفاعلية 2026' : 'Interactive Monorail Network Map'}</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
              {isAr ? 'مسارات وسرعة خطوط المونوريل' : 'Monorail Routes & Station Planner'}
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl">
              {isAr 
                ? 'استعرض شبكة المونوريل كاملة لشرق وغرب النيل واحسب تكلفة التذكرة والوقت بدقة.'
                : 'Explore full East & West Nile monorail networks with real-time trip fare planner.'}
            </p>
          </div>

          {/* محرك بحث وفلاتر سريعة */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-64">
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <SearchIcon />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'ابحث عن اسم محطة...' : 'Search station...'}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
              />
            </div>

            <button
              onClick={() => {
                setSearchQuery('');
                setActiveLineFilter('all');
                setOriginId('st-1');
                setDestId('st-27');
              }}
              className="px-3.5 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition-all flex items-center gap-1.5 shrink-0"
            >
              <RotateCcwIcon />
              <span>{isAr ? 'إعادة ضبط' : 'Reset'}</span>
            </button>
          </div>
        </div>

        {/* فلاتر الخطوط البرتقالية والزرقاء */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-t border-slate-800/80 pt-4">
          <button
            onClick={() => setActiveLineFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeLineFilter === 'all' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {isAr ? 'جميع المحطات' : 'All Lines'}
          </button>
          <button
            onClick={() => setActiveLineFilter('east')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeLineFilter === 'east' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: eastColor }} />
            {isAr ? metaMap['east-nile']?.name || 'شرق النيل (العاصمة الإدارية)' : 'East Nile'}
          </button>
          <button
            onClick={() => setActiveLineFilter('west')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeLineFilter === 'west' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: westColor }} />
            {isAr ? metaMap['west-nile']?.name || 'غرب النيل (6 أكتوبر)' : 'West Nile'}
          </button>
          <button
            onClick={() => setActiveLineFilter('interchange')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeLineFilter === 'interchange' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <ZapIcon />
            {isAr ? 'المحطات التبادلية' : 'Interchanges'}
          </button>
        </div>
      </div>

      {/* Canvas الخريطة الرئيسية الكامل العرض بدون عوائق */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 md:p-6 shadow-2xl relative overflow-hidden min-h-[560px] flex flex-col justify-between">
        
        {/* شريط الإرشادات والدليل العلوي */}
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2 px-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-1.5 rounded-full" style={{ background: eastColor }} />
              {isAr ? 'مسار شرق النيل' : 'East Nile Track'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-1.5 rounded-full" style={{ background: westColor }} />
              {isAr ? 'مسار غرب النيل' : 'West Nile Track'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full border-2 border-cyan-400 bg-slate-950" />
              {isAr ? 'محطة تبادلية' : 'Interchange Station'}
            </span>
          </div>
          <span className="hidden sm:inline text-slate-500 font-mono">MAP CANVAS 1300x500</span>
        </div>

        {/* مساحة الخريطة الرسومية التفاعلية SVG */}
        <div className="w-full h-full min-h-[480px] relative flex items-center justify-center overflow-x-auto">
          <svg viewBox="0 0 1300 500" className="w-full h-full min-w-[980px] select-none">
            <defs>
              <pattern id="mapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" opacity="0.3" />
              </pattern>
              <linearGradient id="eastGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="50%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
              <linearGradient id="westGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
            </defs>

            {/* خلفية شبكة ناعمة */}
            <rect width="1300" height="500" fill="url(#mapGrid)" rx="18" />

            {/* القطاعات الجغرافية للمسار */}
            <g opacity="0.3">
              <rect x="50" y="70" width="340" height="150" rx="14" fill="#0284c7" opacity="0.08" stroke="#0284c7" strokeWidth="1" strokeDasharray="4 4" />
              <text x="70" y="95" fill="#38bdf8" fontSize="12" fontWeight="bold">
                {isAr ? 'قطاع مدينة نصر' : 'Nasr City Sector'}
              </text>

              <rect x="420" y="160" width="460" height="230" rx="14" fill="#38bdf8" opacity="0.08" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 4" />
              <text x="440" y="185" fill="#38bdf8" fontSize="12" fontWeight="bold">
                {isAr ? 'قطاع القاهرة الجديدة (التجمع)' : 'New Cairo Sector'}
              </text>

              <rect x="910" y="180" width="340" height="290" rx="14" fill="#06b6d4" opacity="0.08" stroke="#06b6d4" strokeWidth="1" strokeDasharray="4 4" />
              <text x="930" y="205" fill="#06b6d4" fontSize="12" fontWeight="bold">
                {isAr ? 'قطاع العاصمة الإدارية' : 'New Capital Sector'}
              </text>
            </g>

            {/* مسار خط غرب النيل (6 أكتوبر) */}
            <path
              d={WEST_PATH}
              fill="none"
              stroke="url(#westGradient)"
              strokeWidth="6"
              strokeLinecap="round"
              opacity={activeLineFilter === 'east' ? 0.2 : 0.9}
            />

            {/* مسار خط شرق النيل الرئيسي */}
            <path
              d={EAST_PATH}
              fill="none"
              stroke="url(#eastGradient)"
              strokeWidth="7"
              strokeLinecap="round"
              opacity={activeLineFilter === 'west' ? 0.2 : 1}
            />

            {/* قطار مونوريل نيون متدرج الحركة */}
            {activeLineFilter !== 'west' && (
              <g>
                <animateMotion
                  path={EAST_PATH}
                  dur="28s"
                  repeatCount="indefinite"
                  rotate="auto"
                />
                <circle r="12" fill="#0284c7" className="animate-ping opacity-40" />
                <circle r="9" fill="#0369a1" stroke="#38bdf8" strokeWidth="2" />
              </g>
            )}

            {/* محطات خط شرق النيل مائلة متبادلة بزاوية مريحة جداً تمنع التداخل 100% */}
            {(stations as any[]).map((st: any, idx: number) => {
              const coord = EAST_COORDS[st.id] || { x: 70 + idx * 42, y: 200 };
              const isOrigin = originId === st.id;
              const isDest = destId === st.id;
              const isHovered = hoveredId === st.id;
              const isMatchingFilter = filteredEastStations.some((s) => s.id === st.id);
              const displayName = getDisplayName(st, currentLang);
              const isInterchange = isInterchangeStation(st);

              const isEven = idx % 2 === 0;
              const textAngle = isEven ? -38 : 38;
              const textY = isEven ? coord.y - 14 : coord.y + 22;

              return (
                <g
                  key={st.id}
                  className="cursor-pointer transition-all duration-200"
                  onClick={() => {
                    if (isOrigin) return;
                    setDestId(st.id);
                  }}
                  onMouseEnter={() => setHoveredId(st.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  opacity={isMatchingFilter ? 1 : 0.2}
                >
                  {(isOrigin || isDest || isHovered) && (
                    <circle
                      cx={coord.x}
                      cy={coord.y}
                      r={isInterchange ? '18' : '14'}
                      fill="none"
                      stroke={isOrigin ? '#10b981' : isDest ? '#f43f5e' : '#38bdf8'}
                      strokeWidth="2.5"
                    />
                  )}

                  {isInterchange ? (
                    <>
                      <circle cx={coord.x} cy={coord.y} r="9" fill="#0f172a" stroke="#0284c7" strokeWidth="3" />
                      <circle cx={coord.x} cy={coord.y} r="4" fill={isOrigin ? '#10b981' : isDest ? '#f43f5e' : '#38bdf8'} />
                    </>
                  ) : (
                    <circle
                      cx={coord.x}
                      cy={coord.y}
                      r={isOrigin || isDest ? '7' : '5'}
                      fill={isOrigin ? '#10b981' : isDest ? '#f43f5e' : '#ffffff'}
                      stroke={isOrigin ? '#059669' : isDest ? '#e11d48' : '#0284c7'}
                      strokeWidth="2.5"
                    />
                  )}

                  {isOrigin && (
                    <g transform={`translate(${coord.x - 12}, ${coord.y + 12})`}>
                      <rect width="24" height="13" rx="3" fill="#10b981" />
                      <text x="12" y="9" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">
                        {isAr ? 'بداية' : 'Start'}
                      </text>
                    </g>
                  )}

                  {isDest && (
                    <g transform={`translate(${coord.x - 12}, ${coord.y + 12})`}>
                      <rect width="24" height="13" rx="3" fill="#f43f5e" />
                      <text x="12" y="9" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">
                        {isAr ? 'وجهة' : 'End'}
                      </text>
                    </g>
                  )}

                  <text
                    x={coord.x}
                    y={textY}
                    transform={`rotate(${textAngle} ${coord.x} ${textY})`}
                    fill={isOrigin ? '#10b981' : isDest ? '#f43f5e' : isHovered ? '#38bdf8' : '#cbd5e1'}
                    fontSize={isOrigin || isDest || isInterchange ? '11.5' : '10.5'}
                    fontWeight={isOrigin || isDest || isInterchange ? '700' : '600'}
                    textAnchor={isEven ? (isAr ? 'end' : 'start') : (isAr ? 'start' : 'end')}
                    className="pointer-events-none transition-colors duration-150"
                  >
                    {displayName}
                  </text>
                </g>
              );
            })}

            {/* محطات خط غرب النيل (6 أكتوبر) */}
            {WEST_STATIONS.map((st: any) => {
              const isOrigin = originId === st.id;
              const isDest = destId === st.id;
              const isHovered = hoveredId === st.id;
              const isMatchingFilter = filteredWestStations.some((s) => s.id === st.id);
              const displayName = getDisplayName(st, currentLang);

              const textAngle = -35;
              const textX = st.x + 3;
              const textY = st.y - 10;

              return (
                <g
                  key={st.id}
                  className="cursor-pointer transition-all duration-200"
                  onClick={() => setDestId(st.id)}
                  onMouseEnter={() => setHoveredId(st.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  opacity={isMatchingFilter ? 1 : 0.2}
                >
                  {(isOrigin || isDest || isHovered) && (
                    <circle cx={st.x} cy={st.y} r="14" fill="none" stroke="#f59e0b" strokeWidth="2.5" />
                  )}

                  <circle
                    cx={st.x}
                    cy={st.y}
                    r={isOrigin || isDest ? '7' : '5'}
                    fill={isOrigin ? '#10b981' : isDest ? '#f43f5e' : '#ffffff'}
                    stroke={isOrigin ? '#059669' : isDest ? '#e11d48' : '#d97706'}
                    strokeWidth="2.5"
                  />

                  <text
                    x={textX}
                    y={textY}
                    transform={`rotate(${textAngle} ${textX} ${textY})`}
                    fill={isOrigin ? '#10b981' : isDest ? '#f43f5e' : isHovered ? '#f59e0b' : '#cbd5e1'}
                    fontSize={isOrigin || isDest ? '11.5' : '10.5'}
                    fontWeight={isOrigin || isDest ? '700' : '600'}
                    textAnchor={isAr ? 'end' : 'start'}
                    className="pointer-events-none"
                  >
                    {displayName}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* أسفل الخريطة: الملاحظات والمحطة النشطة عند تمرير الماوس */}
        <div className="mt-3 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/80 gap-2">
          <span className="flex items-center gap-1.5">
            <InfoIcon />
            {isAr ? 'انقر على أي محطة لتحديدها كوجهة وصول فورية.' : 'Click on any station to set as destination.'}
          </span>
          {activeHoverStation && (
            <span className="text-cyan-400 font-bold bg-slate-950 px-3 py-1 rounded-full border border-cyan-500/30">
              {isAr ? 'المحطة الحالية: ' : 'Hovered: '}
              {getDisplayName(activeHoverStation, currentLang)}
            </span>
          )}
        </div>
      </div>

      {/* كارت ملخص الرحلة التفاعلي وحجز التذاكر المباشر */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-right">
          <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
            {isAr ? 'تفاصيل الرحلة المحسوبة' : 'Calculated Trip Details'}
          </div>
          <div className="flex items-center justify-center md:justify-start gap-3 text-lg font-bold text-white">
            <span className="text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/30">
              {getDisplayName(originStation, currentLang)}
            </span>
            <ArrowRightIcon className={`w-5 h-5 text-slate-500 ${isAr ? 'rotate-180' : ''}`} />
            <span className="text-rose-400 bg-rose-500/10 px-3 py-1 rounded-xl border border-rose-500/30">
              {getDisplayName(destStation, currentLang)}
            </span>
          </div>
          <div className="flex items-center justify-center md:justify-start gap-4 text-xs text-slate-400 pt-1">
            <span className="flex items-center gap-1">
              <ClockIcon />
              {isAr ? 'الزمن المقدر: ~35 دقيقة' : 'Est. Time: ~35 mins'}
            </span>
            <span>•</span>
            <span className="text-cyan-300 font-bold text-sm">
              {isAr ? 'سعر التذكرة: 15 ج.م' : 'Fare: 15 EGP'}
            </span>
          </div>
        </div>

        {onTicket && (
          <button
            onClick={() => onTicket(originStation.id, destStation.id)}
            className="w-full md:w-auto px-8 py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/20 text-sm"
          >
            <TicketIcon />
            <span>{isAr ? 'احجز التذكرة لهذه الرحلة' : 'Book Ticket for this Route'}</span>
          </button>
        )}
      </div>

    </div>
  );
}
