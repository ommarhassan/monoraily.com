import { useState, useMemo } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { getStationName } from '../components/StationPicker';
import { lineColors, lineMeta, stations } from '../data/network';

type Props = { 
  onTicket?: (from: string, to: string) => void 
};

// أيقونات SVG نظيفة وعملية للمشروع
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

const TrainIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <rect x="4" y="3" width="16" height="13" rx="2" />
    <path d="M4 11h16M12 3v8M8 8h.01M16 8h.01M6 19l-2 2M18 19l2 2" />
  </svg>
);

const InfoIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const CheckCircleIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const MapPinIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
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

// مسار المنحنى المايل الرئيسي لخط شرق النيل
const EAST_PATH = "M 70,140 C 120,115 170,110 225,118 C 300,130 380,200 465,278 C 540,330 645,380 745,370 C 845,350 945,236 985,220 C 1045,210 1085,310 1140,460";

// مسار خط غرب النيل (6 أكتوبر)
const WEST_PATH = "M 160,530 C 230,460 330,360 425,244";

// إحداثيات الـ 27 محطة لشرق النيل تقع 100% فوق المنحنى المايل بالضبط
const EAST_COORDS: Record<string, { x: number; y: number }> = {
  'st-1': { x: 70, y: 140 },
  'st-2': { x: 105, y: 126 },
  'st-3': { x: 145, y: 115 },
  'st-4': { x: 185, y: 112 },
  'st-5': { x: 225, y: 118 },
  'st-6': { x: 265, y: 132 },
  'st-7': { x: 305, y: 152 },
  'st-8': { x: 345, y: 178 },
  'st-9': { x: 385, y: 210 },
  'st-10': { x: 425, y: 244 },
  'st-11': { x: 465, y: 278 },
  'st-12': { x: 505, y: 308 },
  'st-13': { x: 545, y: 332 },
  'st-14': { x: 595, y: 358 },
  'st-15': { x: 645, y: 374 },
  'st-16': { x: 695, y: 378 },
  'st-17': { x: 745, y: 370 },
  'st-18': { x: 795, y: 350 },
  'st-19': { x: 845, y: 318 },
  'st-20': { x: 895, y: 278 },
  'st-21': { x: 945, y: 236 },
  'st-22': { x: 985, y: 220 },
  'st-23': { x: 1025, y: 235 },
  'st-24': { x: 1065, y: 285 },
  'st-25': { x: 1095, y: 345 },
  'st-26': { x: 1120, y: 405 },
  'st-27': { x: 1140, y: 460 },
};

// محطات خط غرب النيل (6 أكتوبر)
const WEST_STATIONS = [
  { id: 'w-1', name: { ar: 'جامعة 6 أكتوبر', en: '6th of October Univ' }, area: { ar: '6 أكتوبر', en: '6th of October' }, x: 160, y: 530 },
  { id: 'w-2', name: { ar: 'ميدان الحصري', en: 'El-Hossary Square' }, area: { ar: '6 أكتوبر', en: '6th of October' }, x: 220, y: 470 },
  { id: 'w-3', name: { ar: 'ميدان جهينة', en: 'Juhayna Square' }, area: { ar: '6 أكتوبر', en: '6th of October' }, x: 280, y: 410 },
  { id: 'w-4', name: { ar: 'الشيخ زايد', en: 'Sheikh Zayed' }, area: { ar: 'الشيخ زايد', en: 'Sheikh Zayed' }, x: 335, y: 350 },
  { id: 'w-5', name: { ar: 'محور 26 يوليو', en: '26th of July Axis' }, area: { ar: 'الجيزة', en: 'Giza' }, x: 380, y: 295 },
];

const isInterchangeStation = (st: any): boolean => {
  if (!st) return false;
  return Boolean(st.isInterchange || st.interchange || st.transfer || ['st-1', 'st-10', 'st-24', 'w-5'].includes(st.id));
};

export default function MapPage({ onTicket }: Props) {
  const { lang } = useLanguage();
  const currentLang = (lang || 'ar') as 'ar' | 'en';
  const isAr = currentLang === 'ar';

  const [activeLine, setActiveLine] = useState<'all' | 'east' | 'west' | 'interchange'>('all');
  const [selectedStationId, setSelectedStationId] = useState<string | null>('st-1');
  const [originId, setOriginId] = useState<string | null>('st-1');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // دمج كل المحطات الشرقية والغربية
  const allNetworkStations = useMemo(() => {
    const east = (stations as any[]).map(s => ({ ...s, line: 'east' }));
    const west = WEST_STATIONS.map(w => ({ ...w, line: 'west' }));
    return [...east, ...west];
  }, []);

  const selectedStation = useMemo(
    () => allNetworkStations.find((s) => s.id === selectedStationId) || allNetworkStations[0],
    [selectedStationId, allNetworkStations]
  );

  const originStation = useMemo(
    () => allNetworkStations.find((s) => s.id === originId),
    [originId, allNetworkStations]
  );

  const hoveredStation = useMemo(
    () => allNetworkStations.find((s) => s.id === hoveredId),
    [hoveredId, allNetworkStations]
  );

  const activeStation = hoveredStation || selectedStation;

  const filteredEastStations = useMemo(() => {
    return (stations as any[]).filter((st) => {
      const name = getStationName(st.name, currentLang);
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
      if (activeLine === 'west') return false;
      if (activeLine === 'interchange') return matchesSearch && isInterchangeStation(st);
      return matchesSearch;
    });
  }, [searchQuery, activeLine, currentLang]);

  const filteredWestStations = useMemo(() => {
    return WEST_STATIONS.filter((st) => {
      const name = isAr ? st.name.ar : st.name.en;
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
      if (activeLine === 'east') return false;
      if (activeLine === 'interchange') return matchesSearch && isInterchangeStation(st);
      return matchesSearch;
    });
  }, [searchQuery, activeLine, isAr]);

  const eastColor = lineColors['east-nile'] || '#0284c7';
  const westColor = lineColors['west-nile'] || '#f59e0b';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
      {/* Header Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
              <TrainIcon className="w-3.5 h-3.5" />
              <span>{isAr ? 'شبكة المونوريل التفاعلية الرسمية' : 'Official Monorail Interactive Network'}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {isAr ? 'خريطة مسارات وسرعة المونوريل' : 'Monorail Route & Network Map'}
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl">
              {isAr 
                ? 'استعرض خطوط شرق وغرب النيل مع الربط التبادلي وحاسبة الرحلة والتكلفة المباشرة.'
                : 'Explore East & West Nile monorail lines with interchanges and live trip fare calculator.'}
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="text-center p-2">
              <div className="text-xs text-slate-400">{isAr ? 'إجمالي المحطات' : 'Stations'}</div>
              <div className="text-lg font-bold text-cyan-400">32</div>
            </div>
            <div className="text-center p-2 border-x border-slate-800">
              <div className="text-xs text-slate-400">{isAr ? 'الخطوط' : 'Lines'}</div>
              <div className="text-lg font-bold text-blue-400">{isAr ? 'خطين (شرق/غرب)' : '2 Lines'}</div>
            </div>
            <div className="text-center p-2">
              <div className="text-xs text-slate-400">{isAr ? 'السرعة' : 'Speed'}</div>
              <div className="text-lg font-bold text-emerald-400">{isAr ? '80 كم/س' : '80 km/h'}</div>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-800">
          <div className="relative w-full md:w-80">
            <SearchIcon className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'ابحث عن اسم محطة...' : 'Search station name...'}
              className={`w-full bg-slate-950 border border-slate-800 rounded-xl ${isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all`}
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setActiveLine('all')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeLine === 'all' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {isAr ? 'جميع المحطات' : 'All Lines'}
            </button>
            <button
              onClick={() => setActiveLine('east')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeLine === 'east' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: eastColor }} />
              {isAr ? lineMeta['east-nile']?.name || 'خط شرق النيل' : 'East Nile'}
            </button>
            <button
              onClick={() => setActiveLine('west')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeLine === 'west' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: westColor }} />
              {isAr ? lineMeta['west-nile']?.name || 'خط غرب النيل (6 أكتوبر)' : 'West Nile'}
            </button>
            <button
              onClick={() => setActiveLine('interchange')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeLine === 'interchange' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <ZapIcon className="w-3.5 h-3.5" />
              {isAr ? 'المحطات التبادلية' : 'Interchanges'}
            </button>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveLine('all');
                setSelectedStationId('st-1');
              }}
              className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800 transition-all flex items-center gap-1"
              title={isAr ? 'إعادة الضبط' : 'Reset View'}
            >
              <RotateCcwIcon className="w-3.5 h-3.5" />
              <span>{isAr ? 'إعادة ضبط' : 'Reset'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas & Info Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-xl relative overflow-hidden min-h-[550px] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 px-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-1.5 rounded-full" style={{ background: eastColor }} />
                {isAr ? 'خط شرق النيل (العاصمة الإدارية)' : 'East Nile Line'}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-1.5 rounded-full" style={{ background: westColor }} />
                {isAr ? 'خط غرب النيل (6 أكتوبر)' : 'West Nile Line'}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full border-2 border-cyan-400 bg-slate-950" />
                {isAr ? 'محطة تبادلية' : 'Interchange Station'}
              </span>
            </div>
            <span className="hidden sm:inline text-slate-500 font-mono">MAP CANVAS 1200x600</span>
          </div>

          <div className="w-full h-full min-h-[480px] relative flex items-center justify-center overflow-x-auto">
            <svg viewBox="0 0 1200 600" className="w-full h-full min-w-[900px] select-none">
              <defs>
                <pattern id="mapGrid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1e293b" strokeWidth="0.5" opacity="0.3" />
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

              {/* Grid Background */}
              <rect width="1200" height="600" fill="url(#mapGrid)" rx="16" />

              {/* Sector Boundaries */}
              <g opacity="0.35">
                <rect x="50" y="60" width="310" height="150" rx="14" fill="#0284c7" opacity="0.08" stroke="#0284c7" strokeWidth="1" strokeDasharray="4 4" />
                <text x="65" y="82" fill="#38bdf8" fontSize="12" fontWeight="bold">
                  {isAr ? 'قطاع مدينة نصر' : 'Nasr City Sector'}
                </text>

                <rect x="390" y="160" width="450" height="230" rx="14" fill="#38bdf8" opacity="0.08" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 4" />
                <text x="410" y="185" fill="#38bdf8" fontSize="12" fontWeight="bold">
                  {isAr ? 'قطاع القاهرة الجديدة (التجمع)' : 'New Cairo Sector'}
                </text>

                <rect x="860" y="120" width="320" height="360" rx="14" fill="#06b6d4" opacity="0.08" stroke="#06b6d4" strokeWidth="1" strokeDasharray="4 4" />
                <text x="880" y="145" fill="#06b6d4" fontSize="12" fontWeight="bold">
                  {isAr ? 'قطاع العاصمة الإدارية' : 'New Capital Sector'}
                </text>
              </g>

              {/* WEST NILE MONORAIL TRACK LINE */}
              <path
                d={WEST_PATH}
                fill="none"
                stroke="url(#westGradient)"
                strokeWidth="6"
                strokeLinecap="round"
                opacity={activeLine === 'east' ? 0.2 : 0.85}
              />

              {/* EAST NILE MAIN CURVED MONORAIL TRACK */}
              <path
                d={EAST_PATH}
                fill="none"
                stroke="url(#eastGradient)"
                strokeWidth="7"
                strokeLinecap="round"
                opacity={activeLine === 'west' ? 0.2 : 1}
              />

              {/* ANIMATED TRAIN ON EAST LINE */}
              {activeLine !== 'west' && (
                <g>
                  <animateMotion
                    path={EAST_PATH}
                    dur="30s"
                    repeatCount="indefinite"
                    rotate="auto"
                  />
                  <circle r="10" fill="#0284c7" />
                  <circle r="5" fill="#ffffff" />
                </g>
              )}

              {/* EAST NILE STATIONS (تأتي 100% فوق المنحنى بالضبط) */}
              {(stations as any[]).map((st: any) => {
                const coord = EAST_COORDS[st.id] || { x: 70, y: 140 };
                const isSelected = selectedStationId === st.id;
                const isHovered = hoveredId === st.id;
                const isOrigin = originId === st.id;
                const isMatchingFilter = filteredEastStations.some((s) => s.id === st.id);
                const displayName = getStationName(st.name, currentLang);
                const isInterchange = isInterchangeStation(st);

                const textAngle = -42;
                const textX = coord.x + 3;
                const textY = coord.y - 12;

                return (
                  <g
                    key={st.id}
                    className="cursor-pointer transition-all duration-200"
                    onClick={() => setSelectedStationId(st.id)}
                    onMouseEnter={() => setHoveredId(st.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    opacity={isMatchingFilter ? 1 : 0.2}
                  >
                    {(isSelected || isHovered) && (
                      <circle
                        cx={coord.x}
                        cy={coord.y}
                        r={isInterchange ? '16' : '12'}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2.5"
                      />
                    )}

                    {isInterchange ? (
                      <>
                        <circle cx={coord.x} cy={coord.y} r="9" fill="#0f172a" stroke="#0284c7" strokeWidth="3" />
                        <circle cx={coord.x} cy={coord.y} r="4" fill={isSelected ? '#38bdf8' : '#00b4d8'} />
                      </>
                    ) : (
                      <circle
                        cx={coord.x}
                        cy={coord.y}
                        r={isSelected || isOrigin ? '6.5' : '4.5'}
                        fill={isOrigin ? '#10b981' : isSelected ? '#38bdf8' : '#ffffff'}
                        stroke={isOrigin ? '#059669' : '#0284c7'}
                        strokeWidth="2"
                      />
                    )}

                    {isOrigin && (
                      <g transform={`translate(${coord.x - 12}, ${coord.y + 10})`}>
                        <rect width="24" height="13" rx="3" fill="#10b981" />
                        <text x="12" y="9" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">
                          {isAr ? 'بداية' : 'Start'}
                        </text>
                      </g>
                    )}

                    <text
                      x={textX}
                      y={textY}
                      transform={`rotate(${textAngle} ${textX} ${textY})`}
                      fill={isSelected ? '#ffffff' : isHovered ? '#38bdf8' : '#cbd5e1'}
                      fontSize={isSelected || isInterchange ? '11.5' : '10.5'}
                      fontWeight={isSelected || isInterchange ? '700' : '600'}
                      textAnchor={isAr ? 'end' : 'start'}
                      className="pointer-events-none"
                    >
                      {displayName}
                    </text>
                  </g>
                );
              })}

              {/* WEST NILE STATIONS (محطات خط 6 أكتوبر) */}
              {WEST_STATIONS.map((st: any) => {
                const isSelected = selectedStationId === st.id;
                const isHovered = hoveredId === st.id;
                const isOrigin = originId === st.id;
                const isMatchingFilter = filteredWestStations.some((s) => s.id === st.id);
                const displayName = isAr ? st.name.ar : st.name.en;

                const textAngle = -35;
                const textX = st.x + 3;
                const textY = st.y - 10;

                return (
                  <g
                    key={st.id}
                    className="cursor-pointer transition-all duration-200"
                    onClick={() => setSelectedStationId(st.id)}
                    onMouseEnter={() => setHoveredId(st.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    opacity={isMatchingFilter ? 1 : 0.2}
                  >
                    {(isSelected || isHovered) && (
                      <circle cx={st.x} cy={st.y} r="14" fill="none" stroke="#f59e0b" strokeWidth="2.5" />
                    )}

                    <circle
                      cx={st.x}
                      cy={st.y}
                      r={isSelected || isOrigin ? '6.5' : '4.5'}
                      fill={isOrigin ? '#10b981' : isSelected ? '#f59e0b' : '#ffffff'}
                      stroke={isOrigin ? '#059669' : '#d97706'}
                      strokeWidth="2"
                    />

                    {isOrigin && (
                      <g transform={`translate(${st.x - 12}, ${st.y + 10})`}>
                        <rect width="24" height="13" rx="3" fill="#10b981" />
                        <text x="12" y="9" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">
                          {isAr ? 'بداية' : 'Start'}
                        </text>
                      </g>
                    )}

                    <text
                      x={textX}
                      y={textY}
                      transform={`rotate(${textAngle} ${textX} ${textY})`}
                      fill={isSelected ? '#ffffff' : isHovered ? '#f59e0b' : '#cbd5e1'}
                      fontSize={isSelected ? '11.5' : '10.5'}
                      fontWeight={isSelected ? '700' : '600'}
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

          <div className="mt-4 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800">
            <span className="flex items-center gap-1.5">
              <InfoIcon className="w-4 h-4 text-cyan-400" />
              {isAr ? 'انقر على أي محطة على الخط المائل للاختيار والتوجيه.' : 'Click on any station on the curve line to select.'}
            </span>
            <span className="text-slate-400 font-medium">
              {isAr ? 'سرعة التشغيل: 80 كم/س' : 'Operating Speed: 80 km/h'}
            </span>
          </div>
        </div>

        {/* Sidebar Info Panel */}
        <div className="lg:col-span-4 space-y-6">
          {activeStation && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 relative overflow-hidden">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
                    {activeStation.area ? getStationName(activeStation.area, currentLang) : (isAr ? 'خط غرب النيل' : 'West Nile Line')}
                  </span>
                  <h2 className="text-xl font-bold text-white mt-1">
                    {activeStation.name ? getStationName(activeStation.name, currentLang) : (isAr ? activeStation.name?.ar : activeStation.name?.en)}
                  </h2>
                </div>

                {isInterchangeStation(activeStation) && (
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400" title={isAr ? 'محطة تبادلية' : 'Transfer Hub'}>
                    <ZapIcon className="w-5 h-5" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-400">
                  {isAr ? 'المرافق والتجهيزات المتاحة:' : 'Available Amenities:'}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    isAr ? 'مصاعد كهربائية' : 'Elevators',
                    isAr ? 'تكييف كامل' : 'Full AC',
                    isAr ? 'واي فاي مجاني' : 'Free Wi-Fi',
                    isAr ? 'كاميرات أمان' : '24/7 Security'
                  ].map((facility, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
                      <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{facility}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-2">
                <button
                  onClick={() => setOriginId(activeStation.id)}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    originId === activeStation.id
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  <MapPinIcon className="w-3.5 h-3.5" />
                  <span>
                    {originId === activeStation.id 
                      ? (isAr ? 'محطة البداية المحددة' : 'Selected Departure') 
                      : (isAr ? 'تحديد كمحطة بداية' : 'Set as Departure')}
                  </span>
                </button>

                {onTicket && originStation && selectedStation && originStation.id !== selectedStation.id && (
                  <button
                    onClick={() => onTicket(originStation.id, selectedStation.id)}
                    className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                  >
                    <TicketIcon className="w-4 h-4" />
                    <span>{isAr ? 'احجز التذكرة لهذه الرحلة' : 'Book Ticket for this Route'}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Route Summary Box */}
          {originStation && selectedStation && originStation.id !== selectedStation.id && (
            <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-5 space-y-3">
              <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                {isAr ? 'خط الرحلة المستهدف' : 'Route Overview'}
              </div>
              <div className="flex items-center justify-between text-sm text-white font-semibold">
                <span className="text-emerald-400">
                  {originStation.name ? getStationName(originStation.name, currentLang) : (isAr ? originStation.name?.ar : originStation.name?.en)}
                </span>
                <ArrowRightIcon className={`w-4 h-4 text-cyan-400 ${isAr ? 'rotate-180' : ''}`} />
                <span className="text-rose-400">
                  {selectedStation.name ? getStationName(selectedStation.name, currentLang) : (isAr ? selectedStation.name?.ar : selectedStation.name?.en)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                <span className="flex items-center gap-1">
                  <ClockIcon className="w-3.5 h-3.5 text-cyan-400" />
                  {isAr ? 'الزمن المقدر: ~35 دقيقة' : 'Est. Time: ~35 mins'}
                </span>
                <span className="text-cyan-300 font-bold">
                  {isAr ? 'التذكرة: 15 ج.م' : 'Fare: 15 EGP'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
