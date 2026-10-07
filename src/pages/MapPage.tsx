import { useState, useMemo } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { getStationName } from '../components/StationPicker';
import { lineColors, lineMeta, stations } from '../data/network';

type Props = { 
  onTicket?: (from: string, to: string) => void 
};

// أيقونات SVG نظيفة وبسيطة وعملية (تصميم بشري قياسي بدون مظاهر AI)
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

// مسار المنحنى المايل الشامل والواسع (S-Curved Bezier Path)
const TRACK_PATH = "M 80,180 C 220,100 380,140 520,280 C 660,420 800,380 940,240 C 1080,100 1200,280 1320,440";

// مسار خط غرب النيل التبادلي
const WEST_LINK_PATH = "M 300,560 C 400,480 470,390 525,282";

// إحداثيات الـ 27 محطة موزعة بمساحات واسعة لتسهيل القراءة وضمان عدم تداخل الأسماء
const EAST_COORDS: Record<string, { x: number; y: number }> = {
  'st-1': { x: 80, y: 180 },
  'st-2': { x: 125, y: 155 },
  'st-3': { x: 175, y: 135 },
  'st-4': { x: 225, y: 125 },
  'st-5': { x: 275, y: 128 },
  'st-6': { x: 325, y: 145 },
  'st-7': { x: 375, y: 175 },
  'st-8': { x: 425, y: 215 },
  'st-9': { x: 475, y: 255 },
  'st-10': { x: 525, y: 282 },
  'st-11': { x: 575, y: 310 },
  'st-12': { x: 625, y: 335 },
  'st-13': { x: 675, y: 350 },
  'st-14': { x: 725, y: 355 },
  'st-15': { x: 775, y: 345 },
  'st-16': { x: 825, y: 320 },
  'st-17': { x: 875, y: 280 },
  'st-18': { x: 925, y: 245 },
  'st-19': { x: 975, y: 210 },
  'st-20': { x: 1025, y: 190 },
  'st-21': { x: 1075, y: 190 },
  'st-22': { x: 1125, y: 220 },
  'st-23': { x: 1175, y: 270 },
  'st-24': { x: 1225, y: 330 },
  'st-25': { x: 1265, y: 380 },
  'st-26': { x: 1300, y: 415 },
  'st-27': { x: 1335, y: 440 },
};

// دالة آمنة لفحص المحطات التبادلية
const isInterchangeStation = (st: any): boolean => {
  if (!st) return false;
  return Boolean(st.isInterchange || st.interchange || st.transfer || ['st-1', 'st-10', 'st-24'].includes(st.id));
};

export default function MapPage({ onTicket }: Props) {
  const { lang } = useLanguage();
  const currentLang = (lang || 'ar') as 'ar' | 'en';
  const isAr = currentLang === 'ar';

  const [selectedStationId, setSelectedStationId] = useState<string | null>('st-1');
  const [originId, setOriginId] = useState<string | null>('st-1');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'interchange'>('all');

  const selectedStation = useMemo(
    () => (stations as any[]).find((s) => s.id === selectedStationId) || stations[0],
    [selectedStationId]
  );

  const originStation = useMemo(
    () => (stations as any[]).find((s) => s.id === originId),
    [originId]
  );

  const hoveredStation = useMemo(
    () => (stations as any[]).find((s) => s.id === hoveredId),
    [hoveredId]
  );

  const activeStation = hoveredStation || selectedStation;

  const filteredStations = useMemo(() => {
    return (stations as any[]).filter((st) => {
      const name = getStationName(st.name, currentLang);
      const area = getStationName(st.area, currentLang);
      const matchesSearch = 
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        area.toLowerCase().includes(searchQuery.toLowerCase());

      if (filterMode === 'interchange') {
        return matchesSearch && isInterchangeStation(st);
      }
      return matchesSearch;
    });
  }, [searchQuery, filterMode, currentLang]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
      {/* Header Panel - تصميم واجهة مواصلات عامة رسمية ونظيفة */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
              <TrainIcon className="w-3.5 h-3.5" />
              <span>{isAr ? 'شبكة مونوريل شرق النيل الرسمية' : 'Official East Nile Monorail Line'}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {isAr ? 'خريطة مسارات وسرعة المونوريل' : 'Monorail Route & Network Map'}
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl">
              {isAr 
                ? 'استعرض محطات خط شرق النيل الممتد من ستاد القاهرة إلى العاصمة الإدارية الجديدة بوضوح وسهولة.'
                : 'Explore all stations connecting Cairo Stadium, New Cairo, and the New Administrative Capital.'}
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="text-center p-2">
              <div className="text-xs text-slate-400">{isAr ? 'المحطات' : 'Stations'}</div>
              <div className="text-lg font-bold text-cyan-400">27</div>
            </div>
            <div className="text-center p-2 border-x border-slate-800">
              <div className="text-xs text-slate-400">{isAr ? 'المسافة' : 'Distance'}</div>
              <div className="text-lg font-bold text-blue-400">{isAr ? '56.5 كم' : '56.5 km'}</div>
            </div>
            <div className="text-center p-2">
              <div className="text-xs text-slate-400">{isAr ? 'الزمن' : 'Time'}</div>
              <div className="text-lg font-bold text-emerald-400">{isAr ? '60 دقيقة' : '60 min'}</div>
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
              onClick={() => setFilterMode('all')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterMode === 'all'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {isAr ? 'جميع المحطات' : 'All Stations'}
            </button>
            <button
              onClick={() => setFilterMode('interchange')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                filterMode === 'interchange'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <ZapIcon className="w-3.5 h-3.5" />
              {isAr ? 'المحطات التبادلية' : 'Interchanges'}
            </button>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterMode('all');
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

      {/* Main Grid: Broad SVG Canvas & Interactive Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SVG Canvas Container - مساحة واسعة ورؤية واضحة جداً للمستخدم */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-xl relative overflow-hidden min-h-[550px] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 px-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-1.5 rounded-full" style={{ background: lineColors['east-nile'] || '#0284c7' }} />
                {isAr ? lineMeta['east-nile']?.name || 'خط شرق النيل' : 'East Nile Line'}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full border-2 border-cyan-400 bg-slate-950" />
                {isAr ? 'محطة تبادلية' : 'Interchange Station'}
              </span>
            </div>
            <span className="hidden sm:inline text-slate-500 font-mono">MAP CANVAS 1400x650</span>
          </div>

          <div className="w-full h-full min-h-[460px] relative flex items-center justify-center overflow-x-auto">
            <svg viewBox="0 0 1400 650" className="w-full h-full min-w-[950px] select-none">
              <defs>
                <pattern id="mapGrid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1e293b" strokeWidth="0.5" opacity="0.3" />
                </pattern>
                <linearGradient id="trackGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0284c7" />
                  <stop offset="50%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>

              {/* Grid background */}
              <rect width="1400" height="650" fill="url(#mapGrid)" rx="16" />

              {/* Sectors / Zones */}
              <g opacity="0.4">
                <rect x="60" y="80" width="340" height="150" rx="16" fill="#0284c7" opacity="0.08" stroke="#0284c7" strokeWidth="1" strokeDasharray="4 4" />
                <text x="80" y="105" fill="#38bdf8" fontSize="13" fontWeight="bold">
                  {isAr ? 'قطاع مدينة نصر' : 'Nasr City Sector'}
                </text>

                <rect x="440" y="180" width="460" height="220" rx="16" fill="#38bdf8" opacity="0.08" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 4" />
                <text x="460" y="205" fill="#38bdf8" fontSize="13" fontWeight="bold">
                  {isAr ? 'قطاع القاهرة الجديدة (التجمع)' : 'New Cairo Sector'}
                </text>

                <rect x="940" y="140" width="420" height="340" rx="16" fill="#06b6d4" opacity="0.08" stroke="#06b6d4" strokeWidth="1" strokeDasharray="4 4" />
                <text x="960" y="165" fill="#06b6d4" fontSize="13" fontWeight="bold">
                  {isAr ? 'قطاع العاصمة الإدارية' : 'New Capital Sector'}
                </text>
              </g>

              {/* West Nile Line Intersecting Link */}
              <path
                d={WEST_LINK_PATH}
                fill="none"
                stroke="#64748b"
                strokeWidth="3"
                strokeDasharray="6 6"
                opacity="0.4"
              />
              <text x="180" y="550" fill="#94a3b8" fontSize="11" fontWeight="bold">
                {isAr ? '← إلى 6 أكتوبر (خط غرب النيل)' : '← To 6th of Oct (West Line)'}
              </text>

              {/* S-CURVED MAIN MONORAIL TRACK */}
              {/* Outer stroke shadow */}
              <path
                d={TRACK_PATH}
                fill="none"
                stroke="#0284c7"
                strokeWidth="12"
                opacity="0.25"
              />
              {/* Main Solid Line */}
              <path
                d={TRACK_PATH}
                fill="none"
                stroke="url(#trackGradient)"
                strokeWidth="6"
                strokeLinecap="round"
              />

              {/* Animated Train Icon */}
              <g>
                <animateMotion
                  path={TRACK_PATH}
                  dur="32s"
                  repeatCount="indefinite"
                  rotate="auto"
                />
                <circle r="12" fill="#0284c7" />
                <circle r="7" fill="#ffffff" />
              </g>

              {/* STATIONS WITH ANGLED LABELS (أسماء مائلة متباعدة تمنع أي تداخل) */}
              {(stations as any[]).map((st: any, idx: number) => {
                const coord = EAST_COORDS[st.id] || { x: 80 + idx * 45, y: 250 };
                const isSelected = selectedStationId === st.id;
                const isHovered = hoveredId === st.id;
                const isOrigin = originId === st.id;
                const isMatchingFilter = filteredStations.some((s) => s.id === st.id);
                const displayName = getStationName(st.name, currentLang);
                const isInterchange = isInterchangeStation(st);

                // مائل بـ -40 درجة لمنع تقاطع أو تداخل النصوص نهائياً
                const textAngle = -40;
                const textX = coord.x + 4;
                const textY = coord.y - 14;

                return (
                  <g
                    key={st.id}
                    className="cursor-pointer transition-all duration-200"
                    onClick={() => setSelectedStationId(st.id)}
                    onMouseEnter={() => setHoveredId(st.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    opacity={isMatchingFilter ? 1 : 0.25}
                  >
                    {/* Ring for active/hovered */}
                    {(isSelected || isHovered) && (
                      <circle
                        cx={coord.x}
                        cy={coord.y}
                        r={isInterchange ? '18' : '14'}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2.5"
                      />
                    )}

                    {/* Interchange vs Regular Marker */}
                    {isInterchange ? (
                      <>
                        <circle
                          cx={coord.x}
                          cy={coord.y}
                          r="10"
                          fill="#0f172a"
                          stroke="#0284c7"
                          strokeWidth="3"
                        />
                        <circle
                          cx={coord.x}
                          cy={coord.y}
                          r="5"
                          fill={isSelected ? '#38bdf8' : '#00b4d8'}
                        />
                      </>
                    ) : (
                      <circle
                        cx={coord.x}
                        cy={coord.y}
                        r={isSelected || isOrigin ? '7' : '5'}
                        fill={isOrigin ? '#10b981' : isSelected ? '#38bdf8' : '#ffffff'}
                        stroke={isOrigin ? '#059669' : '#0284c7'}
                        strokeWidth="2.5"
                      />
                    )}

                    {/* Departure Pin */}
                    {isOrigin && (
                      <g transform={`translate(${coord.x - 12}, ${coord.y + 12})`}>
                        <rect width="24" height="14" rx="4" fill="#10b981" />
                        <text x="12" y="10" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">
                          {isAr ? 'بداية' : 'Start'}
                        </text>
                      </g>
                    )}

                    {/* Angled Station Name Label (مساحة واسعة وقراءة مريحة للمستخدم) */}
                    <text
                      x={textX}
                      y={textY}
                      transform={`rotate(${textAngle} ${textX} ${textY})`}
                      fill={isSelected ? '#ffffff' : isHovered ? '#38bdf8' : '#cbd5e1'}
                      fontSize={isSelected || isInterchange ? '12' : '11'}
                      fontWeight={isSelected || isInterchange ? '700' : '600'}
                      textAnchor={isAr ? 'end' : 'start'}
                      className="pointer-events-none transition-colors duration-150"
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
              {isAr ? 'اضغط على المحطة للاختيار وحجز التذاكر.' : 'Click on any station to select and book tickets.'}
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
              {/* Station Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
                    {getStationName(activeStation.area, currentLang)}
                  </span>
                  <h2 className="text-xl font-bold text-white mt-1">
                    {getStationName(activeStation.name, currentLang)}
                  </h2>
                </div>

                {isInterchangeStation(activeStation) && (
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400" title={isAr ? 'محطة تبادلية' : 'Transfer Hub'}>
                    <ZapIcon className="w-5 h-5" />
                  </div>
                )}
              </div>

              {/* Amenities / Facilities */}
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

              {/* Action Buttons */}
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
                <span className="text-emerald-400">{getStationName(originStation.name, currentLang)}</span>
                <ArrowRightIcon className={`w-4 h-4 text-cyan-400 ${isAr ? 'rotate-180' : ''}`} />
                <span className="text-rose-400">{getStationName(selectedStation.name, currentLang)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                <span className="flex items-center gap-1">
                  <ClockIcon className="w-3.5 h-3.5 text-cyan-400" />
                  {isAr ? 'الزمن المقدر: ~30 دقيقة' : 'Est. Time: ~30 mins'}
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
