import React, { useState, useMemo } from 'react';
import { 
  MapPin, 
  Train, 
  Navigation, 
  Zap, 
  Search, 
  Info, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  Compass, 
  RotateCcw,
  Subway,
  Ticket
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { getStationName } from '../components/StationPicker';
import { lineColors, lineMeta, stations, type Station } from '../data/network';

type Props = { 
  onTicket?: (from: string, to: string) => void 
};

// مسار المنحنى المايل والانسيابي للشبكة (S-Curved Bezier Path)
const TRACK_PATH = "M 60,140 C 140,80 240,110 320,200 C 400,290 480,280 540,210 C 600,140 660,150 720,230 C 770,300 810,360 870,370 C 910,375 940,390 970,400";

// إحداثيات الـ 27 محطة موزعة بدقة على طول الخط المايل
const EAST_COORDS: Record<string, { x: number; y: number }> = {
  'st-1': { x: 60, y: 140 },
  'st-2': { x: 90, y: 122 },
  'st-3': { x: 125, y: 110 },
  'st-4': { x: 160, y: 105 },
  'st-5': { x: 195, y: 110 },
  'st-6': { x: 230, y: 125 },
  'st-7': { x: 265, y: 150 },
  'st-8': { x: 295, y: 178 },
  'st-9': { x: 325, y: 205 },
  'st-10': { x: 355, y: 232 },
  'st-11': { x: 385, y: 252 },
  'st-12': { x: 415, y: 262 },
  'st-13': { x: 450, y: 258 },
  'st-14': { x: 485, y: 242 },
  'st-15': { x: 520, y: 220 },
  'st-16': { x: 555, y: 190 },
  'st-17': { x: 590, y: 162 },
  'st-18': { x: 625, y: 148 },
  'st-19': { x: 660, y: 155 },
  'st-20': { x: 695, y: 185 },
  'st-21': { x: 730, y: 235 },
  'st-22': { x: 765, y: 285 },
  'st-23': { x: 800, y: 332 },
  'st-24': { x: 835, y: 358 },
  'st-25': { x: 870, y: 370 },
  'st-26': { x: 910, y: 378 },
  'st-27': { x: 950, y: 390 },
};

const WEST_LINK_PATH = "M 200,440 C 260,380 310,310 355,232";

export default function MapPage({ onTicket }: Props) {
  const { lang, language, t } = useLanguage();
  const currentLang = lang || language || 'ar';
  const isAr = currentLang === 'ar';

  const [selectedStationId, setSelectedStationId] = useState<string | null>('st-1');
  const [originId, setOriginId] = useState<string | null>('st-1');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'interchange'>('all');

  const selectedStation = useMemo(
    () => stations.find((s) => s.id === selectedStationId) || stations[0],
    [selectedStationId]
  );

  const originStation = useMemo(
    () => stations.find((s) => s.id === originId),
    [originId]
  );

  const hoveredStation = useMemo(
    () => stations.find((s) => s.id === hoveredId),
    [hoveredId]
  );

  const activeStation = hoveredStation || selectedStation;

  const filteredStations = useMemo(() => {
    return stations.filter((st) => {
      const name = getStationName(st.name, currentLang);
      const area = getStationName(st.area, currentLang);
      const matchesSearch = 
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        area.toLowerCase().includes(searchQuery.toLowerCase());

      if (filterMode === 'interchange') {
        return matchesSearch && st.isInterchange;
      }
      return matchesSearch;
    });
  }, [searchQuery, filterMode, currentLang]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
      {/* Header Panel */}
      <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-md rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>{isAr ? 'الخريطة التفاعلية المستقبلية 2026' : 'Futuristic Monorail Map 2026'}</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Compass className="w-8 h-8 text-cyan-400 animate-spin-slow" />
              {isAr ? 'مركز التحكم في شبكة المونوريل' : 'Monorail Network Control'}
            </h1>
            <p className="text-slate-400 text-sm md:text-base max-w-2xl">
              {isAr 
                ? 'استكشف مسار الخط المايل لشرق النيل الممتد من ستاد القاهرة إلى العاصمة الإدارية ومحطات التبادل.'
                : 'Explore the curved East Nile Monorail line connecting Cairo Stadium to the New Capital.'}
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
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
              <div className="text-lg font-bold text-emerald-400">{isAr ? '60 د' : '60m'}</div>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-800/80">
          <div className="relative w-full md:w-80">
            <Search className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'ابحث عن اسم محطة...' : 'Search station name...'}
              className={`w-full bg-slate-950/90 border border-slate-700/80 rounded-xl ${isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all`}
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterMode === 'all'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {isAr ? 'جميع المحطات' : 'All Stations'}
            </button>
            <button
              onClick={() => setFilterMode('interchange')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                filterMode === 'interchange'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
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
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isAr ? 'إعادة ضبط' : 'Reset'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive SVG Canvas (8 cols) & Info Panel (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SVG Canvas Container */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-2xl relative overflow-hidden min-h-[500px] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 px-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1 rounded-full shadow-[0_0_8px_#38bdf8]" style={{ background: lineColors['east-nile'] || '#38bdf8' }} />
                {isAr ? lineMeta['east-nile']?.name || 'خط شرق النيل (الخط المايل)' : 'East Nile Line'}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full border-2 border-cyan-400 bg-slate-950" />
                {isAr ? 'محطة تبادلية' : 'Interchange Station'}
              </span>
            </div>
            <span className="hidden sm:inline text-slate-500 font-mono">INTERACTIVE S-CURVE CANVAS</span>
          </div>

          <div className="w-full h-full min-h-[420px] relative flex items-center justify-center overflow-x-auto">
            <svg viewBox="0 0 1020 480" className="w-full h-full min-w-[780px] select-none">
              <defs>
                <pattern id="mapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" opacity="0.4" />
                </pattern>
                <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="intGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <linearGradient id="trackGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0284c7" />
                  <stop offset="50%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>

              {/* Background Grid */}
              <rect width="1020" height="480" fill="url(#mapGrid)" rx="16" />

              {/* Regional Zone Visual Labels */}
              <g opacity="0.25">
                <rect x="40" y="60" width="220" height="130" rx="14" fill="#0284c7" opacity="0.1" stroke="#0284c7" strokeWidth="1" strokeDasharray="4 4" />
                <text x="55" y="82" fill="#38bdf8" fontSize="11" fontWeight="bold">
                  {isAr ? 'قطاع مدينة نصر' : 'Nasr City Sector'}
                </text>

                <rect x="290" y="150" width="370" height="150" rx="14" fill="#38bdf8" opacity="0.08" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 4" />
                <text x="305" y="172" fill="#38bdf8" fontSize="11" fontWeight="bold">
                  {isAr ? 'قطاع القاهرة الجديدة (التجمع)' : 'New Cairo Sector'}
                </text>

                <rect x="680" y="140" width="310" height="280" rx="14" fill="#06b6d4" opacity="0.1" stroke="#06b6d4" strokeWidth="1" strokeDasharray="4 4" />
                <text x="695" y="162" fill="#06b6d4" fontSize="11" fontWeight="bold">
                  {isAr ? 'قطاع العاصمة الإدارية' : 'New Capital Sector'}
                </text>
              </g>

              {/* Intersecting West Nile Link (Line 6th October) */}
              <path
                d={WEST_LINK_PATH}
                fill="none"
                stroke="#64748b"
                strokeWidth="2.5"
                strokeDasharray="6 6"
                opacity="0.4"
              />
              <text x="130" y="445" fill="#94a3b8" fontSize="10" fontWeight="bold">
                {isAr ? '← إلى 6 أكتوبر (خط غرب النيل)' : '← To 6th of Oct (West Line)'}
              </text>

              {/* S-CURVED TRACK PATH (الخط المايل) */}
              {/* Outer Glow */}
              <path
                d={TRACK_PATH}
                fill="none"
                stroke="#0284c7"
                strokeWidth="16"
                opacity="0.2"
                filter="url(#neonGlow)"
              />
              {/* Medium Track */}
              <path
                d={TRACK_PATH}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="7"
                opacity="0.6"
              />
              {/* Core Gradient Line */}
              <path
                d={TRACK_PATH}
                fill="none"
                stroke="url(#trackGradient)"
                strokeWidth="4"
                strokeLinecap="round"
              />
              {/* Energy pulse particles */}
              <path
                d={TRACK_PATH}
                fill="none"
                stroke="#ffffff"
                strokeWidth="3"
                strokeDasharray="10 160"
                opacity="0.9"
                className="animate-pulse"
              />

              {/* LIVE MOVING MONORAIL TRAIN */}
              <g className="filter drop-shadow-[0_0_10px_rgba(56,189,248,1)]">
                <animateMotion
                  path={TRACK_PATH}
                  dur="28s"
                  repeatCount="indefinite"
                  rotate="auto"
                />
                <circle r="15" fill="#0284c7" className="animate-ping opacity-30" />
                <circle r="11" fill="#0369a1" stroke="#38bdf8" strokeWidth="2" />
                <foreignObject x="-8" y="-8" width="16" height="16">
                  <div className="w-full h-full flex items-center justify-center text-cyan-200">
                    <Train className="w-3.5 h-3.5 transform -rotate-90" />
                  </div>
                </foreignObject>
              </g>

              {/* STATIONS ON THE CURVED TRACK */}
              {stations.map((st: Station, idx: number) => {
                const coord = EAST_COORDS[st.id] || { x: 60 + idx * 33, y: 200 };
                const isSelected = selectedStationId === st.id;
                const isHovered = hoveredId === st.id;
                const isOrigin = originId === st.id;
                const isMatchingFilter = filteredStations.some((s) => s.id === st.id);
                const displayName = getStationName(st.name, currentLang);

                return (
                  <g
                    key={st.id}
                    className="cursor-pointer transition-all duration-300"
                    onClick={() => setSelectedStationId(st.id)}
                    onMouseEnter={() => setHoveredId(st.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    opacity={isMatchingFilter ? 1 : 0.25}
                  >
                    {/* Pulsing Ripple Effect */}
                    {(isSelected || isHovered) && (
                      <circle
                        cx={coord.x}
                        cy={coord.y}
                        r={st.isInterchange ? '20' : '16'}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2"
                        className="animate-ping opacity-50"
                      />
                    )}

                    {/* Interchange Marker vs Standard Marker */}
                    {st.isInterchange ? (
                      <>
                        <circle
                          cx={coord.x}
                          cy={coord.y}
                          r="12"
                          fill="#0f172a"
                          stroke="#38bdf8"
                          strokeWidth="3"
                          filter="url(#intGlow)"
                        />
                        <circle
                          cx={coord.x}
                          cy={coord.y}
                          r="6"
                          fill={isSelected ? '#38bdf8' : '#0284c7'}
                        />
                      </>
                    ) : (
                      <circle
                        cx={coord.x}
                        cy={coord.y}
                        r={isSelected || isOrigin ? '8' : '5'}
                        fill={isOrigin ? '#10b981' : isSelected ? '#38bdf8' : '#0f172a'}
                        stroke={isOrigin ? '#059669' : isSelected ? '#ffffff' : '#38bdf8'}
                        strokeWidth={isSelected ? '3' : '2'}
                      />
                    )}

                    {/* Start Pin Badge */}
                    {isOrigin && (
                      <g transform={`translate(${coord.x - 10}, ${coord.y - 26})`}>
                        <rect width="20" height="13" rx="3" fill="#10b981" />
                        <text x="10" y="9" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">
                          {isAr ? 'بداية' : 'Start'}
                        </text>
                      </g>
                    )}

                    {/* Station Name Label */}
                    <text
                      x={coord.x}
                      y={idx % 2 === 0 ? coord.y - 14 : coord.y + 20}
                      fill={isSelected ? '#ffffff' : isHovered ? '#38bdf8' : '#cbd5e1'}
                      fontSize={isSelected || st.isInterchange ? '10.5' : '9.5'}
                      fontWeight={isSelected || st.isInterchange ? 'bold' : '500'}
                      textAnchor="middle"
                      className="pointer-events-none transition-colors duration-200"
                    >
                      {displayName}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-800">
            <span className="flex items-center gap-1.5">
              <Info className="w-4 h-4 text-cyan-400" />
              {isAr ? 'انقر على أي محطة لعرض التفاصيل وحجز الرحلة.' : 'Click any station to view details and plan routes.'}
            </span>
            <span className="text-slate-400 font-medium">
              {isAr ? 'سرعة المونوريل: 80 كم/س' : 'Monorail Speed: 80 km/h'}
            </span>
          </div>
        </div>

        {/* Sidebar Info Panel */}
        <div className="lg:col-span-4 space-y-6">
          {activeStation && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl -z-10" />

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

                {activeStation.isInterchange && (
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400" title={isAr ? 'محطة تبادلية' : 'Transfer Hub'}>
                    <Zap className="w-5 h-5" />
                  </div>
                )}
              </div>

              {/* Amenities / Facilities */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-400">
                  {isAr ? 'المرافق والتجهيزات المتوفرة:' : 'Station Amenities:'}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    isAr ? 'مصاعد كهربائية' : 'Elevators',
                    isAr ? 'تكييف كامل' : 'Full AC',
                    isAr ? 'واي فاي مجاني' : 'Free Wi-Fi',
                    isAr ? 'كاميرات أمان' : '24/7 Security'
                  ].map((facility, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-950/40 px-2.5 py-1.5 rounded-lg border border-slate-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
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
                  <MapPin className="w-3.5 h-3.5" />
                  <span>
                    {originId === activeStation.id 
                      ? (isAr ? 'محطة البداية المحددة' : 'Selected Departure') 
                      : (isAr ? 'تحديد كمحطة بداية' : 'Set as Departure')}
                  </span>
                </button>

                {onTicket && originStation && selectedStation && originStation.id !== selectedStation.id && (
                  <button
                    onClick={() => onTicket(originStation.id, selectedStation.id)}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                  >
                    <Ticket className="w-4 h-4" />
                    <span>{isAr ? 'احجز التذكرة لهذه الرحلة' : 'Book Ticket for this Route'}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Route Summary Box */}
          {originStation && selectedStation && originStation.id !== selectedStation.id && (
            <div className="bg-gradient-to-br from-cyan-950/60 to-slate-900 border border-cyan-500/30 rounded-2xl p-5 space-y-3">
              <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                {isAr ? 'خط الرحلة المستهدف' : 'Route Overview'}
              </div>
              <div className="flex items-center justify-between text-sm text-white font-semibold">
                <span className="text-emerald-400">{getStationName(originStation.name, currentLang)}</span>
                <ArrowRight className={`w-4 h-4 text-cyan-400 ${isAr ? 'rotate-180' : ''}`} />
                <span className="text-rose-400">{getStationName(selectedStation.name, currentLang)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
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
