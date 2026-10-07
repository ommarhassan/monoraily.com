import { useState, useMemo } from 'react';
import { stations, lineColors, lineMeta } from '../data/network';
import { getStationName } from '../components/StationPicker';
import { useLanguage } from '../i18n/LanguageContext';

interface MapPageProps {
  onSelectStation?: (stationId: string) => void;
}

// Helper for safe line checking (Station type uses `lines: string[]`)
const hasLine = (st: any, lineId: string): boolean => {
  if (Array.isArray(st.lines)) return st.lines.includes(lineId);
  if (st.line) return st.line === lineId;
  return false;
};

export default function MapPage({ onSelectStation }: MapPageProps) {
  const { lang } = useLanguage();

  // Selected filter line state: 'all' | 'east-nile' | 'west-nile'
  const [selectedLine, setSelectedLine] = useState<'all' | 'east-nile' | 'west-nile'>('all');
  const [selectedStationId, setSelectedStationId] = useState<string | null>('st-1');
  const [hoveredStationId, setHoveredStationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [zoom, setZoom] = useState(1);

  // Cast colors and metadata safely
  const colors = lineColors as Record<string, string>;
  const meta = lineMeta as Record<string, any>;

  const eastColor = colors['east-nile'] || '#EAB308';
  const westColor = colors['west-nile'] || '#0284C7';

  // East Line & West Line Station Arrays
  const eastStations = useMemo(() => stations.filter((s) => hasLine(s, 'east-nile')), []);
  const westStations = useMemo(() => stations.filter((s) => hasLine(s, 'west-nile')), []);

  // Selected Station Object
  const selectedStation = useMemo(() => {
    return stations.find((s) => s.id === selectedStationId) || null;
  }, [selectedStationId]);

  // Filtered station list for sidebar search
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

  // Generate smooth clean layout coordinates for SVG rendering
  const stationCoordsMap = useMemo(() => {
    const map: Record<string, { x: number; y: number }> = {};
    
    // East Line: starts at Nasr City (480, 360) and curves northeast to New Capital (880, 100)
    const eTotal = eastStations.length || 1;
    eastStations.forEach((st, idx) => {
      const t = idx / Math.max(1, eTotal - 1);
      const x = 480 + t * 400;
      const y = 360 - Math.sin(t * Math.PI * 0.4) * 240 - t * 20;
      map[st.id] = { x, y };
    });

    // West Line: starts at October City (180, 460) and heads northeast to Wadi El-Nile (480, 360)
    const wTotal = westStations.length || 1;
    westStations.forEach((st, idx) => {
      const t = idx / Math.max(1, wTotal - 1);
      const x = 180 + t * 300;
      const y = 460 - Math.pow(t, 0.8) * 100;
      map[st.id] = { x, y };
    });

    return map;
  }, [eastStations, westStations]);

  // Polyline SVG path strings
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
      
      {/* Main Header */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            خريطة مونوريل القاهرة
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            خطان .. مدينة واحدة | استكشف شبكة خريطة المونوريل التفاعلية البسيطة والواقعية
          </p>
        </div>

        {/* Line Tabs Switcher */}
        <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-200 shadow-xs">
          <button
            onClick={() => setSelectedLine('all')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
              selectedLine === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            جميع الخطوط
          </button>
          <button
            onClick={() => setSelectedLine('east-nile')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
              selectedLine === 'east-nile'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الخط الشرقي ({meta?.['east-nile']?.totalStations || 22})
          </button>
          <button
            onClick={() => setSelectedLine('west-nile')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
              selectedLine === 'west-nile'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الخط الغربي ({meta?.['west-nile']?.totalStations || 13})
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Center Canvas: Interactive Map */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden relative min-h-[560px] flex flex-col justify-between">
            
            {/* Top Toolbar */}
            <div className="p-4 flex items-center justify-between border-b border-slate-100 bg-white/90 backdrop-blur-sm z-10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold text-slate-700">خريطة تفاعلية أصلية</span>
              </div>

              {/* Zoom Buttons */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
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

            {/* SVG Interactive Canvas */}
            <div className="relative flex-1 w-full bg-[#f4f7f6] overflow-hidden flex items-center justify-center p-2">
              <div 
                className="w-full h-full transition-transform duration-300 ease-out"
                style={{ transform: `scale(${zoom})` }}
              >
                <svg
                  viewBox="0 0 1000 600"
                  className="w-full h-full select-none"
                  style={{ minHeight: '480px' }}
                >
                  <defs>
                    <linearGradient id="nileGradOriginal" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.7" />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.9" />
                    </linearGradient>
                  </defs>

                  {/* River Nile */}
                  <path
                    d="M 460 0 C 470 120, 510 240, 480 360 C 460 440, 490 520, 510 600"
                    fill="none"
                    stroke="url(#nileGradOriginal)"
                    strokeWidth="38"
                    strokeLinecap="round"
                  />
                  <text x="495" y="280" fill="#0284c7" fontSize="13" fontWeight="bold" opacity="0.6" transform="rotate(-75 495 280)">
                    نهر النيل
                  </text>

                  {/* Landmarks */}
                  <text x="820" y="80" fill="#64748b" fontSize="14" fontWeight="bold">العاصمة الإدارية</text>
                  <text x="680" y="440" fill="#64748b" fontSize="14" fontWeight="bold">القاهرة الجديدة</text>
                  <text x="540" y="140" fill="#64748b" fontSize="14" fontWeight="bold">مطار القاهرة الدولي ✈</text>
                  <text x="480" y="320" fill="#334155" fontSize="16" fontWeight="extrabold">القاهرة</text>
                  <text x="240" y="490" fill="#64748b" fontSize="14" fontWeight="bold">6 أكتوبر</text>

                  {/* West Nile Line */}
                  {(selectedLine === 'all' || selectedLine === 'west-nile') && (
                    <g>
                      <polyline
                        points={westPolylinePoints}
                        fill="none"
                        stroke={westColor}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeLinejoin="round"
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

                  {/* East Nile Line */}
                  {(selectedLine === 'all' || selectedLine === 'east-nile') && (
                    <g>
                      <polyline
                        points={eastPolylinePoints}
                        fill="none"
                        stroke={eastColor}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeLinejoin="round"
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

                  {/* Stations */}
                  {stations.map((st) => {
                    if (selectedLine !== 'all' && !hasLine(st, selectedLine)) return null;
                    const coords = stationCoordsMap[st.id];
                    if (!coords) return null;

                    const isSelected = selectedStationId === st.id;
                    const isHovered = hoveredStationId === st.id;
                    const isEast = hasLine(st, 'east-nile');
                    const lineColor = isEast ? eastColor : westColor;

                    return (
                      <g
                        key={st.id}
                        transform={`translate(${coords.x}, ${coords.y})`}
                        onClick={() => handleSelectStation(st.id)}
                        onMouseEnter={() => setHoveredStationId(st.id)}
                        onMouseLeave={() => setHoveredStationId(null)}
                        className="cursor-pointer group"
                      >
                        {(isSelected || isHovered) && (
                          <circle
                            r={isSelected ? 18 : 14}
                            fill={lineColor}
                            opacity="0.25"
                            className="animate-ping"
                          />
                        )}

                        <circle
                          r={isSelected ? 11 : 8}
                          fill="#ffffff"
                          stroke={lineColor}
                          strokeWidth={isSelected ? 4 : 3}
                          className="transition-all duration-200 group-hover:scale-125"
                        />

                        <circle
                          r={isSelected ? 5 : 4}
                          fill={lineColor}
                        />

                        {(isSelected || isHovered) && (
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

            {/* Selected Station Quick Summary Panel */}
            {selectedStation && (
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-t border-slate-800">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-slate-900 shrink-0"
                    style={{ backgroundColor: hasLine(selectedStation, 'east-nile') ? eastColor : westColor }}
                  >
                    🚉
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base text-white">
                      {getStationName(selectedStation.name, lang)}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      المنطقة: {getStationName(selectedStation.area, lang)} | {hasLine(selectedStation, 'east-nile') ? 'الخط الشرقي (شرق النيل)' : 'الخط الغربي (غرب النيل)'}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-amber-400 font-bold bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                  محددة حالياً
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Right Sidebar: Sequential Station List */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 flex flex-col min-h-[560px]">
            
            {/* Search Field */}
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

            {/* List Header */}
            <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-500 px-1">
              <span>محطات الشبكة ({displayedStations.length})</span>
              <span className="text-[11px] font-normal text-slate-400">انقر للتحديد</span>
            </div>

            {/* Station List */}
            <div className="flex-1 overflow-y-auto max-h-[420px] space-y-2 pr-1 custom-scrollbar">
              {displayedStations.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  لا توجد محطات مطابقة
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

                      <span className={`text-xs ${isSelected ? 'text-amber-400' : 'text-slate-400'}`}>
                        ←
                      </span>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
