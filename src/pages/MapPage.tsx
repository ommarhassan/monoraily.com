import { useState, useMemo, useRef } from 'react';
import { stations, lineColors } from '../data/network';
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

  // Map Filter state
  const [selectedLine, setSelectedLine] = useState<'all' | 'east-nile' | 'west-nile'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredStationId, setHoveredStationId] = useState<string | null>(null);

  // Notice Toast message state (e.g. for under construction West Line)
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Zoom & Pan Interactive States for Canvas Dragging
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Colors
  const colors = lineColors as Record<string, string>;
  const eastColor = colors['east-nile'] || '#EAB308';
  const westColor = '#0284C7'; // Blue for West Line

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
    
    // East Line (Active): Nasr City (460, 360) -> New Capital (880, 100)
    const eTotal = eastStations.length || 1;
    eastStations.forEach((st, idx) => {
      const t = idx / Math.max(1, eTotal - 1);
      const x = 460 + t * 420;
      const y = 360 - Math.sin(t * Math.PI * 0.45) * 250 - t * 15;
      map[st.id] = { x, y };
    });

    // West Line (Under Construction): 6th of October (140, 480) -> Wadi El-Nile (460, 360)
    const wTotal = westStations.length || 1;
    westStations.forEach((st, idx) => {
      const t = idx / Math.max(1, wTotal - 1);
      const x = 140 + t * 320;
      const y = 480 - Math.pow(t, 0.75) * 120;
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
  const handleSelectStation = (st: any) => {
    const isWestLine = hasLine(st, 'west-nile');

    // West Line is under construction!
    if (isWestLine) {
      setToastMessage(`🚧 محطة (${getStationName(st.name, lang)}) ضمن الخط الغربي (تحت الإنشاء والتشغيل التجريبي قريباً)`);
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }

    const id = st.id;
    if (activeSelectMode === 'origin') {
      setOriginStationId(id);
      setActiveSelectMode('destination');
      if (destinationStationId === id) {
        setDestinationStationId(null);
      }
    } else {
      if (id === originStationId) return;
      setDestinationStationId(id);
    }

    if (onSelectStation) {
      onSelectStation(id);
    }
  };

  // Reset View & Pan Controls
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Dragging Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
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
    <div className="subpage w-full min-h-screen bg-slate-100 text-slate-800 p-3 md:p-6 font-sans dir-rtl">
      
      {/* Top Header */}
      <div className="max-w-7xl mx-auto mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full mb-1 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            خريطة تفاعلية تضاريسية شاملة
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
            خريطة شبكة مونوريل القاهرة الكبرى
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            الخط الشرقي (يعمل حالياً) | الخط الغربي (تحت الإنشاء 🚧) | اسحب الخريطة في أي اتجاه للتنقل
          </p>
        </div>

        {/* Selection Step Controls */}
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveSelectMode('origin')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
              activeSelectMode === 'origin'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>📍 القيام (من)</span>
            {originStation && <span className="text-[10px] bg-amber-600 text-white px-1.5 py-0.2 rounded font-extrabold">✓</span>}
          </button>
          
          <span className="text-slate-400">←</span>

          <button
            onClick={() => setActiveSelectMode('destination')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
              activeSelectMode === 'destination'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>🏁 الوصول (إلى)</span>
            {destinationStation && <span className="text-[10px] bg-sky-700 text-white px-1.5 py-0.2 rounded font-extrabold">✓</span>}
          </button>

          {(originStationId || destinationStationId) && (
            <button
              onClick={handleResetRoute}
              className="px-2 py-1.5 text-xs font-bold text-slate-400 hover:text-slate-700 transition"
              title="إعادة ضبط"
            >
              ⟲
            </button>
          )}
        </div>
      </div>

      {/* Toast Notification Banner for Under Construction Alert */}
      {toastMessage && (
        <div className="max-w-7xl mx-auto mb-4 p-3 bg-amber-500 text-slate-950 rounded-xl font-bold text-xs shadow-md border border-amber-400 flex items-center justify-between animate-bounce">
          <div className="flex items-center gap-2">
            <span className="text-base">🚧</span>
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-900 font-extrabold">✕</button>
        </div>
      )}

      {/* Main Layout Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Center Canvas: Interactive Topographic Map taking full width */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden relative min-h-[580px] flex flex-col justify-between">
            
            {/* Top Canvas Status Toolbar */}
            <div className="p-3 flex items-center justify-between border-b border-slate-100 bg-white/95 backdrop-blur-sm z-20">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold text-slate-700">
                  {activeSelectMode === 'origin' ? 'حدد محطة القيام (من)' : 'حدد محطة الوصول (إلى)'}
                </span>
                <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md hidden sm:inline">
                  💡 يمكنك سحب الخريطة بالماوس في أي اتجاه
                </span>
              </div>

              {/* Zoom & Pan Controls */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setZoom((z) => Math.min(2.2, z + 0.2))}
                  className="w-8 h-8 rounded-lg bg-white shadow-xs flex items-center justify-center text-slate-700 font-bold hover:bg-slate-50 transition"
                  title="تكبير"
                >
                  +
                </button>
                <button
                  onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
                  className="w-8 h-8 rounded-lg bg-white shadow-xs flex items-center justify-center text-slate-700 font-bold hover:bg-slate-50 transition"
                  title="تصغير"
                >
                  -
                </button>
                <button
                  onClick={handleResetView}
                  className="w-8 h-8 rounded-lg bg-white shadow-xs flex items-center justify-center text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
                  title="إعادة تلمركز الخريطة"
                >
                  ⟲
                </button>
              </div>
            </div>

            {/* SVG Topographic Interactive Canvas Container with Drag-to-Pan */}
            <div 
              className={`relative flex-1 w-full bg-[#edf4f0] overflow-hidden select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ minHeight: '500px' }}
            >
              <div 
                className="w-full h-full transition-transform duration-75 ease-out origin-center"
                style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
              >
                <svg
                  viewBox="0 0 1000 620"
                  className="w-full h-full"
                  style={{ minHeight: '500px' }}
                >
                  <defs>
                    {/* River Nile Gradient */}
                    <linearGradient id="nileGradTopo" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#0284c7" stopOpacity="0.9" />
                    </linearGradient>

                    {/* Terrain Land Shading Patterns */}
                    <pattern id="contourGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#dcfce7" strokeWidth="1" opacity="0.4" />
                    </pattern>
                  </defs>

                  {/* Realistic Topographic Background Texture */}
                  <rect width="1000" height="620" fill="#f4f7f4" />
                  <rect width="1000" height="620" fill="url(#contourGrid)" />

                  {/* Topographic Elevation Curves (Contour Lines) */}
                  <g fill="none" stroke="#d1fae5" strokeWidth="1.5" opacity="0.6">
                    <path d="M 0 100 Q 250 80, 500 140 T 1000 120" />
                    <path d="M 0 200 Q 300 180, 600 240 T 1000 220" />
                    <path d="M 0 350 Q 350 320, 700 400 T 1000 380" />
                    <path d="M 0 500 Q 200 460, 550 520 T 1000 490" />
                  </g>

                  {/* Green Park / Agricultural Land Zones */}
                  <g fill="#dcfce7" opacity="0.5">
                    <path d="M 520 200 C 580 180, 650 210, 620 280 C 590 320, 510 300, 520 200 Z" />
                    <path d="M 180 380 C 240 360, 310 400, 280 460 C 220 480, 160 440, 180 380 Z" />
                    <path d="M 750 320 C 820 300, 880 350, 840 420 C 780 440, 720 390, 750 320 Z" />
                  </g>

                  {/* Highways & Ring Roads (الطريق الدائري ومحور 26 يوليو) */}
                  <g stroke="#cbd5e1" strokeWidth="3" fill="none" strokeDasharray="6,4" opacity="0.7">
                    <ellipse cx="500" cy="320" rx="340" ry="220" />
                    <line x1="100" y1="360" x2="900" y2="360" />
                    <line x1="460" y1="50" x2="460" y2="580" />
                  </g>

                  {/* Stylized River Nile Path */}
                  <path
                    d="M 460 0 C 470 120, 510 240, 480 360 C 450 440, 480 530, 500 620"
                    fill="none"
                    stroke="url(#nileGradTopo)"
                    strokeWidth="42"
                    strokeLinecap="round"
                  />
                  <text x="495" y="280" fill="#ffffff" fontSize="13" fontWeight="extrabold" opacity="0.9" transform="rotate(-75 495 280)">
                    نهر النيل 🌊
                  </text>

                  {/* Topographic Region Text Labels */}
                  <text x="830" y="80" fill="#334155" fontSize="14" fontWeight="extrabold">العاصمة الإدارية الجديدة</text>
                  <text x="680" y="440" fill="#475569" fontSize="14" fontWeight="bold">القاهرة الجديدة</text>
                  <text x="690" y="470" fill="#64748b" fontSize="12">التجمع الخامس</text>
                  <text x="540" y="140" fill="#475569" fontSize="13" fontWeight="bold">مطار القاهرة الدولي ✈</text>
                  <text x="475" y="320" fill="#0f172a" fontSize="16" fontWeight="black">القاهرة الكبرى</text>
                  <text x="210" y="490" fill="#334155" fontSize="14" fontWeight="extrabold">مدينة 6 أكتوبر</text>
                  <text x="310" y="400" fill="#64748b" fontSize="12" fontWeight="bold">الشيخ زايد</text>

                  {/* West Nile Transit Line Path (Under Construction - Dashed Blue) */}
                  {(selectedLine === 'all' || selectedLine === 'west-nile') && (
                    <g>
                      <polyline
                        points={westPolylinePoints}
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.6"
                      />
                      <polyline
                        points={westPolylinePoints}
                        fill="none"
                        stroke={westColor}
                        strokeWidth="8"
                        strokeDasharray="10,6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </g>
                  )}

                  {/* East Nile Transit Line Path (Active - Glowing Yellow) */}
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

                  {/* Dynamic Active Connecting Segment Line when both stations are selected */}
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

                    const isWestLine = hasLine(st, 'west-nile');
                    const isOrigin = originStationId === st.id;
                    const isDestination = destinationStationId === st.id;
                    const isHovered = hoveredStationId === st.id;
                    
                    let nodeColor = isWestLine ? westColor : eastColor;
                    if (isOrigin) nodeColor = '#f59e0b';
                    if (isDestination) nodeColor = '#0284c7';

                    return (
                      <g
                        key={st.id}
                        transform={`translate(${coords.x}, ${coords.y})`}
                        onClick={() => handleSelectStation(st)}
                        onMouseEnter={() => setHoveredStationId(st.id)}
                        onMouseLeave={() => setHoveredStationId(null)}
                        className="cursor-pointer group"
                      >
                        {/* Selected / Hovered Pulse Ring */}
                        {(isOrigin || isDestination || isHovered) && (
                          <circle
                            r={isOrigin || isDestination ? 20 : 14}
                            fill={isOrigin ? '#f59e0b' : isDestination ? '#0284c7' : nodeColor}
                            opacity="0.3"
                            className="animate-ping"
                          />
                        )}

                        {/* Outer Circle */}
                        <circle
                          r={isOrigin || isDestination ? 12 : isWestLine ? 7 : 8}
                          fill={isWestLine ? '#f1f5f9' : '#ffffff'}
                          stroke={nodeColor}
                          strokeWidth={isOrigin || isDestination ? 4 : isWestLine ? 2 : 3}
                          strokeDasharray={isWestLine && !isOrigin && !isDestination ? '3,2' : undefined}
                          className="transition-all duration-200 group-hover:scale-125"
                        />

                        {/* Core Dot */}
                        <circle
                          r={isOrigin || isDestination ? 6 : isWestLine ? 3 : 4}
                          fill={nodeColor}
                        />

                        {/* Station Name Badge */}
                        {(isOrigin || isDestination || isHovered || isWestLine) && (
                          <g transform="translate(0, -22)" className="pointer-events-none">
                            <rect
                              x={isWestLine ? "-60" : "-55"}
                              y="-16"
                              width={isWestLine ? "120" : "110"}
                              height="24"
                              rx="12"
                              fill={isOrigin ? '#f59e0b' : isDestination ? '#0284c7' : isWestLine ? '#475569' : '#0f172a'}
                              stroke="#ffffff"
                              strokeWidth="1.5"
                            />
                            <text
                              x="0"
                              y="0"
                              textAnchor="middle"
                              fill="#ffffff"
                              fontSize="10"
                              fontWeight="bold"
                            >
                              {isOrigin 
                                ? `📍 من: ${getStationName(st.name, lang)}` 
                                : isDestination 
                                ? `🏁 إلى: ${getStationName(st.name, lang)}` 
                                : isWestLine 
                                ? `🚧 ${getStationName(st.name, lang)}` 
                                : getStationName(st.name, lang)}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Map Floating Legend */}
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200 shadow-md flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700 z-10">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                  <span>الخط الشرقي (يعمل)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-sky-500 border border-dashed border-slate-400"></span>
                  <span>الخط الغربي (تحت الإنشاء 🚧)</span>
                </div>
              </div>
            </div>

            {/* Selected Station Route Summary & Booking Bar */}
            <div className="p-4 bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-4 border-t border-slate-800 z-20">
              <div className="flex items-center gap-3 w-full md:w-auto">
                
                {/* Origin Badge */}
                <div className="flex items-center gap-2 bg-slate-800 p-2.5 rounded-xl border border-slate-700 flex-1 md:flex-initial">
                  <span className="text-base">📍</span>
                  <div>
                    <div className="text-[10px] text-amber-400 font-bold uppercase">القيام (من)</div>
                    <div className="text-xs font-bold text-white">
                      {originStation ? getStationName(originStation.name, lang) : 'لم تحدد'}
                    </div>
                  </div>
                </div>

                <span className="text-slate-400 font-bold text-sm hidden md:inline">←</span>

                {/* Destination Badge */}
                <div className="flex items-center gap-2 bg-slate-800 p-2.5 rounded-xl border border-slate-700 flex-1 md:flex-initial">
                  <span className="text-base">🏁</span>
                  <div>
                    <div className="text-[10px] text-sky-400 font-bold uppercase">الوصول (إلى)</div>
                    <div className="text-xs font-bold text-white">
                      {destinationStation ? getStationName(destinationStation.name, lang) : 'حددها على الخريطة'}
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
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 flex flex-col min-h-[580px]">
            
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
                جميع الخطوط
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
                الغربي 🚧
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

            {/* List Header & Guidance */}
            <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-500 px-1">
              <span>محطات الشبكة ({displayedStations.length})</span>
              <span className="text-[11px] font-semibold text-amber-600">
                {activeSelectMode === 'origin' ? 'حدد القيام 📍' : 'حدد الوصول 🏁'}
              </span>
            </div>

            {/* Station List */}
            <div className="flex-1 overflow-y-auto max-h-[420px] space-y-2 pr-1 custom-scrollbar">
              {displayedStations.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  لا توجد محطات مطابقة
                </div>
              ) : (
                displayedStations.map((st, idx) => {
                  const isWestLine = hasLine(st, 'west-nile');
                  const isOrigin = originStationId === st.id;
                  const isDestination = destinationStationId === st.id;
                  const isEast = hasLine(st, 'east-nile');
                  const badgeBg = isEast ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600 border border-dashed border-slate-300';

                  return (
                    <div
                      key={st.id}
                      onClick={() => handleSelectStation(st)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isOrigin
                          ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-md font-extrabold'
                          : isDestination
                          ? 'bg-sky-500 text-white border-sky-600 shadow-md font-extrabold'
                          : isWestLine
                          ? 'bg-slate-50 opacity-80 border-slate-200 text-slate-600 hover:bg-slate-100'
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
                          <div className="text-xs font-bold flex items-center gap-1.5">
                            <span>{getStationName(st.name, lang)}</span>
                            {isWestLine && <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-semibold">تحت الإنشاء 🚧</span>}
                          </div>
                          <div className={`text-[11px] ${isOrigin || isDestination ? 'opacity-80' : 'text-slate-500'}`}>
                            {getStationName(st.area, lang)}
                          </div>
                        </div>
                      </div>

                      <div>
                        {isOrigin && <span className="text-xs bg-slate-900 text-amber-400 px-2 py-0.5 rounded-full font-bold">القيام 📍</span>}
                        {isDestination && <span className="text-xs bg-slate-900 text-sky-300 px-2 py-0.5 rounded-full font-bold">الوصول 🏁</span>}
                        {!isOrigin && !isDestination && isWestLine && <span className="text-[11px] text-slate-400 font-bold">قريباً</span>}
                        {!isOrigin && !isDestination && !isWestLine && <span className="text-xs text-slate-400">←</span>}
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
