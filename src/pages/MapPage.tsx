import { useState, useMemo } from 'react';
import { stations, lineColors, lineMeta } from '../data/network';
import { getStationName } from '../components/StationPicker';
import { useLanguage } from '../i18n/LanguageContext';

interface MapPageProps {
  onTicket?: (originId: string, destinationId?: string) => void;
  onSelectStation?: (stationId: string) => void;
}

// Helpers for safe line handling (Station type in network.ts uses `lines: string[]`)
const hasLine = (st: any, lineId: string): boolean => {
  if (Array.isArray(st.lines)) return st.lines.includes(lineId);
  if (st.line) return st.line === lineId;
  return false;
};

export default function MapPage({ onTicket, onSelectStation }: MapPageProps) {
  const { lang } = useLanguage();
  
  // Controls & States
  const [selectedLine, setSelectedLine] = useState<'all' | 'east-nile' | 'west-nile'>('east-nile');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStationId, setSelectedStationId] = useState<string | null>('st-1');
  const [hoveredStationId, setHoveredStationId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  // Cast network meta safely
  const colors = lineColors as Record<string, string>;
  const meta = lineMeta as Record<string, any>;

  const eastColor = colors['east-nile'] || '#EAB308';
  const westColor = colors['west-nile'] || '#0284C7';

  // East Line & West Line Station Arrays
  const eastStations = useMemo(() => stations.filter((s) => hasLine(s, 'east-nile')), []);
  const westStations = useMemo(() => stations.filter((s) => hasLine(s, 'west-nile')), []);

  // Filtered station list for side menu search & line tab
  const displayedStations = useMemo(() => {
    let result = stations;
    if (selectedLine !== 'all') {
      result = result.filter((s) => hasLine(s, selectedLine));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) => {
        const name = getStationName(s.name, lang).toLowerCase();
        const area = getStationName(s.area, lang).toLowerCase();
        return name.includes(q) || area.includes(q);
      });
    }
    return result;
  }, [selectedLine, searchQuery, lang]);

  // Selected Station Object
  const selectedStation = useMemo(() => {
    return stations.find((s) => s.id === selectedStationId) || null;
  }, [selectedStationId]);

  // Dynamic layout coordinates generation for stations on SVG canvas
  const stationCoordsMap = useMemo(() => {
    const map: Record<string, { x: number; y: number }> = {};
    
    // East Line: starts at Nasr City (480, 360) and heads northeast towards New Capital (880, 100)
    const eTotal = eastStations.length || 1;
    eastStations.forEach((st, idx) => {
      const t = idx / Math.max(1, eTotal - 1);
      const x = 480 + t * 400;
      const y = 360 - Math.sin(t * Math.PI * 0.4) * 240 - t * 20;
      map[st.id] = { x, y };
    });

    // West Line: starts at October City (180, 460) and heads northeast crossing Nile to Wadi El-Nile (480, 360)
    const wTotal = westStations.length || 1;
    westStations.forEach((st, idx) => {
      const t = idx / Math.max(1, wTotal - 1);
      const x = 180 + t * 300;
      const y = 460 - Math.pow(t, 0.8) * 100;
      map[st.id] = { x, y };
    });

    return map;
  }, [eastStations, westStations]);

  // Generate Polyline SVG path strings
  const eastPolylinePoints = useMemo(() => {
    return eastStations
      .map((st) => stationCoordsMap[st.id])
      .filter(Boolean)
      .map((pt) => `${pt.x},${pt.y}`)
      .join(' ');
  }, [eastStations, stationCoordsMap]);

  const westPolylinePoints = useMemo(() => {
    return westStations
      .map((st) => stationCoordsMap[st.id])
      .filter(Boolean)
      .map((pt) => `${pt.x},${pt.y}`)
      .join(' ');
  }, [westStations, stationCoordsMap]);

  const handleSelectStation = (id: string) => {
    setSelectedStationId(id);
    if (onSelectStation) {
      onSelectStation(id);
    }
  };

  return (
    <div className="subpage w-full min-h-screen bg-slate-50 text-slate-800 p-4 md:p-6 lg:p-8 font-sans dir-rtl">
      
      {/* Top Main Section Header */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full mb-2 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            خريطة تفاعلية أصلية 2026
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            خريطة مونوريل القاهرة
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            خطان .. مدينة واحدة | مشروع المونوريل يربط شرق وغرب القاهرة بشكل سريع وآمن
          </p>
        </div>

        {/* Action Quick Stats */}
        <div className="flex items-center gap-3">
          <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-amber-400"></div>
            <div>
              <div className="text-xs text-slate-400 font-medium">شرق النيل</div>
              <div className="text-sm font-bold text-slate-800">22 محطة | 56.5 كم</div>
            </div>
          </div>
          <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-sky-500"></div>
            <div>
              <div className="text-xs text-slate-400 font-medium">غرب النيل</div>
              <div className="text-sm font-bold text-slate-800">13 محطة | 43.8 كم</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Grid Layout */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Line Summary & Details Cards */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          
          {/* East Line Info Card */}
          <div 
            onClick={() => setSelectedLine('east-nile')}
            className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer shadow-sm relative overflow-hidden ${
              selectedLine === 'east-nile' 
                ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-400 ring-2 ring-amber-400/20' 
                : 'bg-white border-slate-200 hover:border-amber-300 hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-900 font-bold flex items-center justify-center text-base shadow-sm">
                  ←
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">الخط الشرقي</h3>
                  <span className="text-xs text-slate-500 font-medium">مدينة نصر ← العاصمة الإدارية</span>
                </div>
              </div>
              <span className="w-3 h-3 rounded-full bg-amber-400"></span>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-amber-200/50 text-center">
              <div className="bg-white/80 backdrop-blur-xs p-2 rounded-lg border border-amber-100">
                <div className="text-xs text-slate-400">المحطات</div>
                <div className="text-sm font-extrabold text-slate-800">{meta?.['east-nile']?.totalStations || 22}</div>
              </div>
              <div className="bg-white/80 backdrop-blur-xs p-2 rounded-lg border border-amber-100">
                <div className="text-xs text-slate-400">الطول</div>
                <div className="text-sm font-extrabold text-slate-800">{meta?.['east-nile']?.lengthKm || 56.5} كم</div>
              </div>
              <div className="bg-white/80 backdrop-blur-xs p-2 rounded-lg border border-amber-100">
                <div className="text-xs text-slate-400">السرعة</div>
                <div className="text-sm font-extrabold text-slate-800">80 كم/س</div>
              </div>
            </div>
          </div>

          {/* West Line Info Card */}
          <div 
            onClick={() => setSelectedLine('west-nile')}
            className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer shadow-sm relative overflow-hidden ${
              selectedLine === 'west-nile' 
                ? 'bg-gradient-to-br from-sky-50 to-blue-50 border-sky-400 ring-2 ring-sky-400/20' 
                : 'bg-white border-slate-200 hover:border-sky-300 hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500 text-white font-bold flex items-center justify-center text-base shadow-sm">
                  ←
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">الخط الغربي</h3>
                  <span className="text-xs text-slate-500 font-medium">أكتوبر ← وادي النيل</span>
                </div>
              </div>
              <span className="w-3 h-3 rounded-full bg-sky-500"></span>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-sky-200/50 text-center">
              <div className="bg-white/80 backdrop-blur-xs p-2 rounded-lg border border-sky-100">
                <div className="text-xs text-slate-400">المحطات</div>
                <div className="text-sm font-extrabold text-slate-800">{meta?.['west-nile']?.totalStations || 13}</div>
              </div>
              <div className="bg-white/80 backdrop-blur-xs p-2 rounded-lg border border-sky-100">
                <div className="text-xs text-slate-400">الطول</div>
                <div className="text-sm font-extrabold text-slate-800">{meta?.['west-nile']?.lengthKm || 43.8} كم</div>
              </div>
              <div className="bg-white/80 backdrop-blur-xs p-2 rounded-lg border border-sky-100">
                <div className="text-xs text-slate-400">السرعة</div>
                <div className="text-sm font-extrabold text-slate-800">80 كم/س</div>
              </div>
            </div>
          </div>

          {/* Reset Filter Button */}
          {selectedLine !== 'all' && (
            <button 
              onClick={() => setSelectedLine('all')}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition border border-slate-200 flex items-center justify-center gap-2"
            >
              <span>إظهار الخطين معاً</span>
            </button>
          )}

          {/* Banner Promo Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-md border border-slate-700 flex flex-col justify-between min-h-[160px] relative overflow-hidden">
            <div className="relative z-10">
              <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">رؤية مصر 2030</span>
              <h4 className="text-lg font-extrabold mt-1">مستقبل أسرع للحركة</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                تنقل ذكي صديق للبيئة يربط كافة المحاور الرئيسية في القاهرة الكبرى.
              </p>
            </div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-amber-400/10 rounded-full blur-xl pointer-events-none"></div>
          </div>
        </div>

        {/* Center: Interactive Map Visual Area */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden relative min-h-[540px] flex flex-col justify-between">
            
            {/* Map Top Controls Bar */}
            <div className="p-4 flex items-center justify-between border-b border-slate-100 bg-white/90 backdrop-blur-sm z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs border border-slate-200">
                  N
                </div>
                <span className="text-xs font-semibold text-slate-600">الخريطة الجغرافية التفاعلية</span>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setZoom((z) => Math.min(1.6, z + 0.15))}
                  className="w-8 h-8 rounded-lg bg-white shadow-xs flex items-center justify-center text-slate-700 font-bold hover:bg-slate-50 transition"
                  title="تكبير"
                >
                  +
                </button>
                <button
                  onClick={() => setZoom((z) => Math.max(0.7, z - 0.15))}
                  className="w-8 h-8 rounded-lg bg-white shadow-xs flex items-center justify-center text-slate-700 font-bold hover:bg-slate-50 transition"
                  title="تصغير"
                >
                  -
                </button>
                <button
                  onClick={() => setZoom(1)}
                  className="w-8 h-8 rounded-lg bg-white shadow-xs flex items-center justify-center text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
                  title="إعادة ضبط"
                >
                  ⟲
                </button>
              </div>
            </div>

            {/* SVG Interactive Canvas Container */}
            <div className="relative flex-1 w-full bg-[#f4f7f6] overflow-hidden flex items-center justify-center p-2">
              <div 
                className="w-full h-full transition-transform duration-300 ease-out"
                style={{ transform: `scale(${zoom})` }}
              >
                <svg
                  viewBox="0 0 1000 600"
                  className="w-full h-full select-none"
                  style={{ minHeight: '460px' }}
                >
                  <defs>
                    <linearGradient id="nileGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.7" />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.9" />
                    </linearGradient>
                    
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Canvas Background Map Grids & City Labels */}
                  <g className="opacity-40">
                    <rect width="1000" height="600" fill="#f8fafc" />
                    <circle cx="200" cy="180" r="140" fill="#e2e8f0" opacity="0.3" />
                    <circle cx="800" cy="220" r="180" fill="#e2e8f0" opacity="0.3" />
                  </g>

                  {/* Stylized River Nile Winding Path */}
                  <path
                    d="M 460 0 C 470 120, 510 240, 480 360 C 460 440, 490 520, 510 600"
                    fill="none"
                    stroke="url(#nileGrad)"
                    strokeWidth="38"
                    strokeLinecap="round"
                  />
                  <text x="495" y="280" fill="#0284c7" fontSize="13" fontWeight="bold" opacity="0.6" transform="rotate(-75 495 280)">
                    نهر النيل
                  </text>

                  {/* Geographic Region Text Labels */}
                  <text x="820" y="80" fill="#64748b" fontSize="14" fontWeight="bold">العاصمة الإدارية</text>
                  <text x="680" y="440" fill="#64748b" fontSize="14" fontWeight="bold">القاهرة الجديدة</text>
                  <text x="690" y="470" fill="#94a3b8" fontSize="12">التجمع الخامس</text>
                  <text x="540" y="140" fill="#64748b" fontSize="14" fontWeight="bold">مطار القاهرة الدولي ✈</text>
                  <text x="480" y="320" fill="#334155" fontSize="16" fontWeight="extrabold">القاهرة</text>
                  <text x="240" y="490" fill="#64748b" fontSize="14" fontWeight="bold">6 أكتوبر</text>

                  {/* West Nile Transit Line Path (Blue) */}
                  {(selectedLine === 'all' || selectedLine === 'west-nile') && (
                    <g>
                      <polyline
                        points={westPolylinePoints}
                        fill="none"
                        stroke={westColor}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="transition-all duration-300"
                      />
                      <polyline
                        points={westPolylinePoints}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.9"
                      />
                    </g>
                  )}

                  {/* East Nile Transit Line Path (Yellow) */}
                  {(selectedLine === 'all' || selectedLine === 'east-nile') && (
                    <g>
                      <polyline
                        points={eastPolylinePoints}
                        fill="none"
                        stroke={eastColor}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="transition-all duration-300"
                      />
                      <polyline
                        points={eastPolylinePoints}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.9"
                      />
                    </g>
                  )}

                  {/* Interactive Station Nodes Rendering */}
                  {stations.map((st) => {
                    if (selectedLine !== 'all' && !hasLine(st, selectedLine)) return null;
                    const coords = stationCoordsMap[st.id];
                    if (!coords) return null;

                    const isSelected = selectedStationId === st.id;
                    const isHovered = hoveredStationId === st.id;
                    const isEast = hasLine(st, 'east-nile');
                    const lineColor = isEast ? eastColor : westColor;
                    const isInterchange = (st as any).isInterchange || ['st-1', 'st-10', 'st-24'].includes(st.id);

                    return (
                      <g
                        key={st.id}
                        transform={`translate(${coords.x}, ${coords.y})`}
                        onClick={() => handleSelectStation(st.id)}
                        onMouseEnter={() => setHoveredStationId(st.id)}
                        onMouseLeave={() => setHoveredStationId(null)}
                        className="cursor-pointer group"
                      >
                        {/* Selected Pulse Aura */}
                        {(isSelected || isHovered) && (
                          <circle
                            r={isSelected ? 18 : 14}
                            fill={lineColor}
                            opacity="0.25"
                            className="animate-ping"
                          />
                        )}

                        {/* Outer Ring */}
                        <circle
                          r={isSelected ? 11 : isInterchange ? 9 : 7}
                          fill="#ffffff"
                          stroke={lineColor}
                          strokeWidth={isSelected ? 4 : 3}
                          className="transition-all duration-200 group-hover:scale-125"
                        />

                        {/* Core Dot */}
                        <circle
                          r={isSelected ? 5 : isInterchange ? 4 : 3}
                          fill={lineColor}
                        />

                        {/* Station Label Tooltip / Text */}
                        {(isSelected || isHovered || isInterchange) && (
                          <g transform="translate(0, -18)" className="pointer-events-none">
                            <rect
                              x="-50"
                              y="-16"
                              width="100"
                              height="22"
                              rx="11"
                              fill={isSelected ? '#0f172a' : '#ffffff'}
                              stroke={lineColor}
                              strokeWidth="1.5"
                              filter="url(#glow)"
                            />
                            <text
                              x="0"
                              y="-2"
                              textAnchor="middle"
                              fill={isSelected ? '#ffffff' : '#1e293b'}
                              fontSize="10"
                              fontWeight="bold"
                            >
                              {getStationName(st.name, lang)}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Map Floating Legend */}
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200 shadow-md flex items-center gap-4 text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-2 rounded-full bg-amber-400"></span>
                  <span>الخط الشرقي</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-2 rounded-full bg-sky-500"></span>
                  <span>الخط الغربي</span>
                </div>
              </div>
            </div>

            {/* Selected Station Interactive Quick Card Bar */}
            {selectedStation && (
              <div className="p-4 bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-3 border-t border-slate-800">
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-slate-900 shadow-sm shrink-0"
                    style={{ backgroundColor: hasLine(selectedStation, 'east-nile') ? eastColor : westColor }}
                  >
                    🚉
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-base text-white">
                        {getStationName(selectedStation.name, lang)}
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {hasLine(selectedStation, 'east-nile') ? 'الخط الشرقي' : 'الخط الغربي'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      المنطقة: {getStationName(selectedStation.area, lang)}
                    </p>
                  </div>
                </div>

                {/* Ticket Booking CTA */}
                {onTicket && (
                  <button
                    onClick={() => onTicket(selectedStation.id, selectedStation.id)}
                    className="w-full md:w-auto px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-extrabold rounded-xl transition shadow-sm flex items-center justify-center gap-2 shrink-0"
                  >
                    <span>🎟️ حجز تذكرة من هذه المحطة</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Stations List & Search Panel */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 flex flex-col min-h-[540px]">
            
            {/* Filter Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-2xl mb-4 border border-slate-200">
              <button
                onClick={() => setSelectedLine('east-nile')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                  selectedLine === 'east-nile'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                الخط الشرقي
              </button>
              <button
                onClick={() => setSelectedLine('west-nile')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                  selectedLine === 'west-nile'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                الخط الغربي
              </button>
            </div>

            {/* Station Search Input */}
            <div className="relative mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن محطة..."
                className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition"
              />
              <span className="absolute right-3 top-2.5 text-slate-400 text-sm">🔍</span>
            </div>

            {/* List Header Count */}
            <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-500 px-1">
              <span>قائمة المحطات ({displayedStations.length})</span>
              <span className="text-[11px] font-normal text-slate-400">مرتبة حسب المسار</span>
            </div>

            {/* Scrollable Sequential Station List */}
            <div className="flex-1 overflow-y-auto max-h-[380px] space-y-2 pr-1 custom-scrollbar">
              {displayedStations.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  لا توجد محطات مطابقة للبحث
                </div>
              ) : (
                displayedStations.map((st, idx) => {
                  const isSelected = selectedStationId === st.id;
                  const isEast = hasLine(st, 'east-nile');
                  const badgeBg = isEast ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800';

                  return (
                    <div
                      key={st.id}
                      onClick={() => handleSelectStation(st.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-amber-400/30'
                          : 'bg-white hover:bg-slate-50 border-slate-100 text-slate-800 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span 
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 ${
                            isSelected ? 'bg-amber-400 text-slate-950' : badgeBg
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div>
                          <div className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                            {getStationName(st.name, lang)}
                          </div>
                          <div className={`text-[11px] ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                            {getStationName(st.area, lang)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {(st as any).isInterchange && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-semibold">
                            تبادلية
                          </span>
                        )}
                        <span className={`text-xs ${isSelected ? 'text-amber-400' : 'text-slate-400'}`}>
                          ←
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Footer Feature Bar */}
      <div className="max-w-7xl mx-auto mt-8 bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-400 flex items-center justify-center font-bold text-slate-950">
            M
          </div>
          <div>
            <div className="font-extrabold text-slate-800">مونوريل القاهرة الكبرى</div>
            <div className="text-[11px] text-slate-400">ربط أفضل .. لحياة أسهل</div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="flex items-center gap-6 text-slate-600 font-medium overflow-x-auto py-1">
          <span className="flex items-center gap-1.5 whitespace-nowrap">❄️ تكييف كامل</span>
          <span className="flex items-center gap-1.5 whitespace-nowrap">📶 إنترنت مجاني</span>
          <span className="flex items-center gap-1.5 whitespace-nowrap">🖥️ شاشات عرض</span>
          <span className="flex items-center gap-1.5 whitespace-nowrap">💳 دفع إلكتروني</span>
        </div>
      </div>

    </div>
  );
}
