import { useState, useMemo } from 'react';
import { stations, lineColors, lineMeta } from '../data/network';
import { getStationName } from '../components/StationPicker';
import { useLanguage } from '../i18n/LanguageContext';

interface MapPageProps {
  onTicket?: (from?: any, to?: any) => void;
  onSelectStation?: (stationId: string) => void;
}

// Helper for safe line checking (Station type uses `lines: string[]`)
const hasLine = (st: any, lineId: string): boolean => {
  if (Array.isArray(st.lines)) return st.lines.includes(lineId);
  if (st.line) return st.line === lineId;
  return false;
};

export default function MapPage({ onTicket, onSelectStation }: MapPageProps) {
  const { lang } = useLanguage();

  // Selection states for origin and destination
  const [originStationId, setOriginStationId] = useState<string | null>('st-1');
  const [destinationStationId, setDestinationStationId] = useState<string | null>('st-5');
  const [activeSelectMode, setActiveSelectMode] = useState<'origin' | 'destination'>('origin');

  // Map Filter & Zoom controls
  const [selectedLine, setSelectedLine] = useState<'all' | 'east-nile' | 'west-nile'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredStationId, setHoveredStationId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  // Cast colors and metadata safely
  const colors = lineColors as Record<string, string>;
  const meta = lineMeta as Record<string, any>;

  const eastColor = colors['east-nile'] || '#EAB308';
  const westColor = colors['west-nile'] || '#0284C7';

  // East Line & West Line Station Arrays
  const eastStations = useMemo(() => stations.filter((s) => hasLine(s, 'east-nile')), []);
  const westStations = useMemo(() => stations.filter((s) => hasLine(s, 'west-nile')), []);

  // Origin & Destination Objects
  const originStation = useMemo(() => stations.find((s) => s.id === originStationId) || null, [originStationId]);
  const destinationStation = useMemo(() => stations.find((s) => s.id === destinationStationId) || null, [destinationStationId]);

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

  // Handle station click to set origin or destination
  const handleSelectStation = (id: string) => {
    if (activeSelectMode === 'origin') {
      setOriginStationId(id);
      // Automatically switch to destination selection step if origin is chosen
      setActiveSelectMode('destination');
      if (destinationStationId === id) {
        setDestinationStationId(null);
      }
    } else {
      if (id === originStationId) return; // Cannot select same station
      setDestinationStationId(id);
    }

    if (onSelectStation) {
      onSelectStation(id);
    }
  };

  // Reset route selection
  const handleResetRoute = () => {
    setOriginStationId(null);
    setDestinationStationId(null);
    setActiveSelectMode('origin');
  };

  // Handle CTA Booking
  const handleBookTicket = () => {
    if (originStationId && destinationStationId && onTicket) {
      onTicket(originStationId, destinationStationId);
    }
  };

  return (
    <div className="subpage w-full min-h-screen bg-slate-50 text-slate-800 p-4 md:p-6 lg:p-8 font-sans dir-rtl">
      
      {/* Top Header */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full mb-2 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            حجز تفاعلي من محطة إلى محطة 🎟️
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            خريطة وحجز مسار المونوريل
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            حدد محطة القيام ومحطة الوصول مباشرة من الخريطة لحجز تذكرتك فوراً
          </p>
        </div>

        {/* Selection Step Controls */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs">
          <button
            onClick={() => setActiveSelectMode('origin')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
              activeSelectMode === 'origin'
                ? 'bg-amber-400 text-slate-950 shadow-sm ring-2 ring-amber-400/20'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>📍 محطة القيام (من)</span>
            {originStation && <span className="text-[10px] bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded font-extrabold">✓</span>}
          </button>
          
          <span className="text-slate-300">←</span>

          <button
            onClick={() => setActiveSelectMode('destination')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
              activeSelectMode === 'destination'
                ? 'bg-sky-500 text-white shadow-sm ring-2 ring-sky-500/20'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>🏁 محطة الوصول (إلى)</span>
            {destinationStation && <span className="text-[10px] bg-sky-600 text-white px-1.5 py-0.5 rounded font-extrabold">✓</span>}
          </button>

          {(originStationId || destinationStationId) && (
            <button
              onClick={handleResetRoute}
              className="px-2.5 py-2 text-xs font-semibold text-slate-400 hover:text-slate-700 transition"
              title="إعادة ضبط المحطات"
            >
              ⟲
            </button>
          )}
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Center Canvas: Interactive Map */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden relative min-h-[560px] flex flex-col justify-between">
            
            {/* Top Canvas Status Toolbar */}
            <div className="p-4 flex items-center justify-between border-b border-slate-100 bg-white/90 backdrop-blur-sm z-10">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${activeSelectMode === 'origin' ? 'bg-amber-400' : 'bg-sky-500'} animate-pulse`}></span>
                  <span className="text-xs font-bold text-slate-700">
                    {activeSelectMode === 'origin' ? 'انقر على الخريطة لتحديد محطة القيام (من)' : 'انقر على الخريطة لتحديد محطة الوصول (إلى)'}
                  </span>
                </div>
              </div>

              {/* Zoom Controls */}
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
                    <linearGradient id="nileGradRoute" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.7" />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.9" />
                    </linearGradient>
                    
                    <filter id="glowRoute" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* River Nile */}
                  <path
                    d="M 460 0 C 470 120, 510 240, 480 360 C 460 440, 490 520, 510 600"
                    fill="none"
                    stroke="url(#nileGradRoute)"
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

                  {/* Dynamic Glowing Active Route Segment line when both stations are selected */}
                  {originStationId && destinationStationId && stationCoordsMap[originStationId] && stationCoordsMap[destinationStationId] && (
                    <line
                      x1={stationCoordsMap[originStationId].x}
                      y1={stationCoordsMap[originStationId].y}
                      x2={stationCoordsMap[destinationStationId].x}
                      y2={stationCoordsMap[destinationStationId].y}
                      stroke="#10b981"
                      strokeWidth="6"
                      strokeDasharray="8,6"
                      className="animate-pulse"
                    />
                  )}

                  {/* Render Interactive Station Nodes */}
                  {stations.map((st) => {
                    if (selectedLine !== 'all' && !hasLine(st, selectedLine)) return null;
                    const coords = stationCoordsMap[st.id];
                    if (!coords) return null;

                    const isOrigin = originStationId === st.id;
                    const isDestination = destinationStationId === st.id;
                    const isHovered = hoveredStationId === st.id;
                    const isEast = hasLine(st, 'east-nile');
                    
                    let nodeColor = isEast ? eastColor : westColor;
                    if (isOrigin) nodeColor = '#f59e0b';
                    if (isDestination) nodeColor = '#0284c7';

                    return (
                      <g
                        key={st.id}
                        transform={`translate(${coords.x}, ${coords.y})`}
                        onClick={() => handleSelectStation(st.id)}
                        onMouseEnter={() => setHoveredStationId(st.id)}
                        onMouseLeave={() => setHoveredStationId(null)}
                        className="cursor-pointer group"
                      >
                        {/* Aura Ring for Selected Origin or Destination */}
                        {(isOrigin || isDestination || isHovered) && (
                          <circle
                            r={isOrigin || isDestination ? 20 : 14}
                            fill={isOrigin ? '#f59e0b' : isDestination ? '#0284c7' : nodeColor}
                            opacity="0.3"
                            className="animate-ping"
                          />
                        )}

                        {/* Node Outer Circle */}
                        <circle
                          r={isOrigin || isDestination ? 12 : 8}
                          fill="#ffffff"
                          stroke={nodeColor}
                          strokeWidth={isOrigin || isDestination ? 4 : 3}
                          className="transition-all duration-200 group-hover:scale-125"
                        />

                        {/* Node Inner Core Dot */}
                        <circle
                          r={isOrigin || isDestination ? 6 : 4}
                          fill={nodeColor}
                        />

                        {/* Label Badge */}
                        {(isOrigin || isDestination || isHovered) && (
                          <g transform="translate(0, -22)" className="pointer-events-none">
                            <rect
                              x="-55"
                              y="-16"
                              width="110"
                              height="24"
                              rx="12"
                              fill={isOrigin ? '#f59e0b' : isDestination ? '#0284c7' : '#0f172a'}
                              stroke="#ffffff"
                              strokeWidth="1.5"
                              filter="url(#glowRoute)"
                            />
                            <text
                              x="0"
                              y="0"
                              textAnchor="middle"
                              fill="#ffffff"
                              fontSize="10"
                              fontWeight="bold"
                            >
                              {isOrigin ? `📍 من: ${getStationName(st.name, lang)}` : isDestination ? `🏁 إلى: ${getStationName(st.name, lang)}` : getStationName(st.name, lang)}
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
                  <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                  <span>محطة القيام (من)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-sky-500"></span>
                  <span>محطة الوصول (إلى)</span>
                </div>
              </div>
            </div>

            {/* Selected Station Route Summary & Booking Bar */}
            <div className="p-4 bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-4 border-t border-slate-800">
              <div className="flex items-center gap-4 w-full md:w-auto">
                
                {/* Origin Badge */}
                <div className="flex items-center gap-2.5 bg-slate-800 p-2.5 rounded-xl border border-slate-700 flex-1 md:flex-initial">
                  <span className="text-base">📍</span>
                  <div>
                    <div className="text-[10px] text-amber-400 font-bold uppercase">القيام (من)</div>
                    <div className="text-xs font-bold text-white">
                      {originStation ? getStationName(originStation.name, lang) : 'لم تحدد بعد'}
                    </div>
                  </div>
                </div>

                <span className="text-slate-400 font-bold text-sm hidden md:inline">←</span>

                {/* Destination Badge */}
                <div className="flex items-center gap-2.5 bg-slate-800 p-2.5 rounded-xl border border-slate-700 flex-1 md:flex-initial">
                  <span className="text-base">🏁</span>
                  <div>
                    <div className="text-[10px] text-sky-400 font-bold uppercase">الوصول (إلى)</div>
                    <div className="text-xs font-bold text-white">
                      {destinationStation ? getStationName(destinationStation.name, lang) : 'انقر على الخريطة لتحديدها'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Ticket Booking CTA */}
              <button
                onClick={handleBookTicket}
                disabled={!originStationId || !destinationStationId}
                className={`w-full md:w-auto px-6 py-3 text-xs font-extrabold rounded-xl transition shadow-md flex items-center justify-center gap-2 ${
                  originStationId && destinationStationId
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <span>🎟️</span>
                <span>
                  {originStation && destinationStation
                    ? `حجز تذكرة من (${getStationName(originStation.name, lang)}) إلى (${getStationName(destinationStation.name, lang)})`
                    : 'حدد المحطتين لحجز التذكرة'}
                </span>
              </button>
            </div>

          </div>
        </div>

        {/* Right Sidebar: Interactive Station Selector */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 flex flex-col min-h-[560px]">
            
            {/* Filter Line Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-2xl mb-4 border border-slate-200">
              <button
                onClick={() => setSelectedLine('all')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                  selectedLine === 'all'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => setSelectedLine('east-nile')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                  selectedLine === 'east-nile'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                الشرقي
              </button>
              <button
                onClick={() => setSelectedLine('west-nile')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                  selectedLine === 'west-nile'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                الغربي
              </button>
            </div>

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

            {/* List Header & Mode Guidance */}
            <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-500 px-1">
              <span>قائمة المحطات ({displayedStations.length})</span>
              <span className="text-[11px] font-semibold text-amber-600">
                {activeSelectMode === 'origin' ? 'اختر القيام 📍' : 'اختر الوصول 🏁'}
              </span>
            </div>

            {/* Station List */}
            <div className="flex-1 overflow-y-auto max-h-[400px] space-y-2 pr-1 custom-scrollbar">
              {displayedStations.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  لا توجد محطات مطابقة
                </div>
              ) : (
                displayedStations.map((st, idx) => {
                  const isOrigin = originStationId === st.id;
                  const isDestination = destinationStationId === st.id;
                  const isEast = hasLine(st, 'east-nile');
                  const badgeBg = isEast ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800';

                  return (
                    <div
                      key={st.id}
                      onClick={() => handleSelectStation(st.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isOrigin
                          ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-md font-extrabold'
                          : isDestination
                          ? 'bg-sky-500 text-white border-sky-600 shadow-md font-extrabold'
                          : 'bg-white hover:bg-slate-50 border-slate-100 text-slate-800 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span 
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 ${
                            isOrigin || isDestination ? 'bg-slate-900 text-white' : badgeBg
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div>
                          <div className="text-xs font-bold">
                            {getStationName(st.name, lang)}
                          </div>
                          <div className={`text-[11px] ${isOrigin || isDestination ? 'opacity-80' : 'text-slate-500'}`}>
                            {getStationName(st.area, lang)}
                          </div>
                        </div>
                      </div>

                      <div>
                        {isOrigin && <span className="text-xs bg-slate-900 text-amber-400 px-2 py-0.5 rounded-full font-bold">القيام 📍</span>}
                        {isDestination && <span className="text-xs bg-slate-900 text-sky-300 px-2 py-0.5 rounded-full font-bold">الوصول 🏁</span>}
                        {!isOrigin && !isDestination && <span className="text-xs text-slate-400">←</span>}
                      </div>
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
