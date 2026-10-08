import { useState, useMemo, useRef } from 'react';
import { stations, lineColors, lineMeta } from '../data/network';
import { getStationName } from '../components/StationPicker';
import { useLanguage } from '../i18n/LanguageContext';

interface MapPageProps {
  onTicket?: (from?: any, to?: any) => void;
  onSelectStation?: (stationId: string) => void;
}

const hasLine = (st: any, lineId: string): boolean => {
  if (Array.isArray(st.lines)) return st.lines.includes(lineId);
  if (st.line) return st.line === lineId;
  return false;
};

export default function MapPage({ onTicket, onSelectStation }: MapPageProps) {
  const { lang } = useLanguage();

  const [originStationId, setOriginStationId] = useState<string | null>('st-1');
  const [destinationStationId, setDestinationStationId] = useState<string | null>('st-5');
  const [activeSelectMode, setActiveSelectMode] = useState<'origin' | 'destination'>('origin');

  const [selectedLine, setSelectedLine] = useState<'all' | 'east-nile' | 'west-nile'>('east-nile');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredStationId, setHoveredStationId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const colors = lineColors as Record<string, string>;
  const meta = lineMeta as Record<string, any>;

  const eastColor = colors['east-nile'] || '#F59E0B';
  const westColor = '#0284C7';

  const eastStations = useMemo(() => stations.filter((s) => hasLine(s, 'east-nile')), []);
  const westStations = useMemo(() => stations.filter((s) => hasLine(s, 'west-nile')), []);

  const originStation = useMemo(() => stations.find((s) => s.id === originStationId) || null, [originStationId]);
  const destinationStation = useMemo(() => stations.find((s) => s.id === destinationStationId) || null, [destinationStationId]);

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

  const stationCoordsMap = useMemo(() => {
    const map: Record<string, { x: number; y: number }> = {};
    const eTotal = eastStations.length || 1;
    eastStations.forEach((st, idx) => {
      const t = idx / Math.max(1, eTotal - 1);
      const x = 460 + t * 420;
      const y = 360 - Math.sin(t * Math.PI * 0.45) * 250 - t * 15;
      map[st.id] = { x, y };
    });

    const wTotal = westStations.length || 1;
    westStations.forEach((st, idx) => {
      const t = idx / Math.max(1, wTotal - 1);
      const x = 140 + t * 320;
      const y = 480 - Math.pow(t, 0.75) * 120;
      map[st.id] = { x, y };
    });

    return map;
  }, [eastStations, westStations]);

  const eastPolylinePoints = useMemo(() => {
    return eastStations.map((st) => stationCoordsMap[st.id]).filter(Boolean).map((pt) => `${pt.x},${pt.y}`).join(' ');
  }, [eastStations, stationCoordsMap]);

  const westPolylinePoints = useMemo(() => {
    return westStations.map((st) => stationCoordsMap[st.id]).filter(Boolean).map((pt) => `${pt.x},${pt.y}`).join(' ');
  }, [westStations, stationCoordsMap]);

  const handleSelectStation = (st: any) => {
    if (hasLine(st, 'west-nile')) {
      setToastMessage(`🚧 محطة (${getStationName(st.name, lang)}) ضمن الخط الغربي (تحت الإنشاء) - قريباً`);
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }

    const id = st.id;
    if (activeSelectMode === 'origin') {
      setOriginStationId(id);
      setActiveSelectMode('destination');
      if (destinationStationId === id) setDestinationStationId(null);
    } else {
      if (id === originStationId) return;
      setDestinationStationId(id);
    }

    if (onSelectStation) onSelectStation(id);
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleResetRoute = () => {
    setOriginStationId(null);
    setDestinationStationId(null);
    setActiveSelectMode('origin');
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStartRef.current.x, y: e.clientY - dragStartRef.current.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleBookTicket = () => {
    if (originStationId && destinationStationId && onTicket) {
      onTicket(originStationId, destinationStationId);
    }
  };

  return (
    <div className="subpage w-full min-h-screen bg-slate-50 text-slate-800 p-4 md:p-6 lg:p-8 font-sans dir-rtl">
      
      {/* Light Blue Top Header Banner */}
      <div className="max-w-7xl mx-auto mb-6 bg-gradient-to-r from-sky-50 via-blue-50/60 to-indigo-50 text-slate-900 p-6 rounded-3xl shadow-sm border border-sky-200/80 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-sky-100 text-sky-900 text-xs font-black rounded-full border border-sky-300">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-ping"></span>
            خريطة تفاعلية حديثة 2026
          </div>
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight">
            خريطة مونوريل القاهرة الكبرى
          </h1>
          <p className="text-xs md:text-sm text-slate-600 font-bold">
            استكشف المحطات والمسارات بسهولة .. اسحب الخريطة وحدد محطة القيام والوصول للحجز المباشر
          </p>
        </div>

        {/* Line Quick Stats Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white hover:bg-amber-50/50 px-4 py-3 rounded-2xl border border-amber-300 flex items-center gap-3 shadow-xs transition">
            <div className="w-4 h-4 rounded-full bg-amber-500 shadow-xs"></div>
            <div>
              <div className="text-[11px] text-amber-800 font-black">الخط الشرقي (يعمل)</div>
              <div className="text-xs font-black text-slate-900">{meta?.['east-nile']?.totalStations || 22} محطة • 56.5 كم</div>
            </div>
          </div>
          <div className="bg-white hover:bg-sky-50/50 px-4 py-3 rounded-2xl border border-sky-300 flex items-center gap-3 shadow-xs transition">
            <div className="w-4 h-4 rounded-full bg-sky-500 border-2 border-dashed border-white"></div>
            <div>
              <div className="text-[11px] text-sky-800 font-black">الخط الغربي (🚧 تحت الإنشاء)</div>
              <div className="text-xs font-black text-slate-900">{meta?.['west-nile']?.totalStations || 13} محطة • 43.8 كم</div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Alert Notice */}
      {toastMessage && (
        <div className="max-w-7xl mx-auto mb-5 p-4 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 rounded-2xl font-black text-xs shadow-md border border-amber-300 flex items-center justify-between animate-bounce">
          <div className="flex items-center gap-2">
            <span className="text-lg">🚧</span>
            <span className="text-sm">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="font-black px-3 py-1 bg-slate-950/20 hover:bg-slate-950/40 rounded-xl text-slate-950 transition">✕</button>
        </div>
      )}

      {/* Main 3-Column Dashboard Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (3 cols): Line Overview Cards */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          
          <div 
            onClick={() => setSelectedLine('east-nile')}
            className={`p-5 rounded-3xl border-2 transition-all duration-200 cursor-pointer shadow-sm transform hover:-translate-y-1 ${
              selectedLine === 'east-nile' 
                ? 'bg-gradient-to-br from-amber-500/10 via-amber-50 to-amber-100/60 border-amber-500 ring-4 ring-amber-500/20 shadow-amber-500/10' 
                : 'bg-white border-slate-200 hover:border-amber-400'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="px-3 py-1 rounded-xl text-xs font-black bg-amber-500 text-slate-950 shadow-xs">
                الخط الشرقي
              </span>
              <span className="w-3.5 h-3.5 rounded-full bg-amber-500 animate-pulse"></span>
            </div>
            <p className="text-xs font-bold text-slate-700 mt-3 mb-2">مدينة نصر ↔ العاصمة الإدارية</p>
            <div className="text-[11px] font-black text-amber-800 bg-amber-100/80 px-3 py-1.5 rounded-xl inline-block border border-amber-300/60">
              ⚡ 22 محطة • 56.5 كم • 80 كم/س
            </div>
          </div>

          <div 
            onClick={() => setSelectedLine('west-nile')}
            className={`p-5 rounded-3xl border-2 transition-all duration-200 cursor-pointer shadow-sm transform hover:-translate-y-1 ${
              selectedLine === 'west-nile' 
                ? 'bg-gradient-to-br from-sky-500/10 via-sky-50 to-sky-100/60 border-sky-500 ring-4 ring-sky-500/20 shadow-sky-500/10' 
                : 'bg-white border-slate-200 hover:border-sky-400'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="px-3 py-1 rounded-xl text-xs font-black bg-sky-500 text-white shadow-xs">
                الخط الغربي
              </span>
              <span className="text-xs text-amber-600 font-black bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-300">🚧 قريباً</span>
            </div>
            <p className="text-xs font-bold text-slate-700 mt-3 mb-2">6 أكتوبر ↔ وادي النيل</p>
            <div className="text-[11px] font-black text-sky-800 bg-sky-100/80 px-3 py-1.5 rounded-xl inline-block border border-sky-300/60">
              🚧 13 محطة • 43.8 كم • تحت الإنشاء
            </div>
          </div>

          <button 
            onClick={() => setSelectedLine(selectedLine === 'all' ? 'east-nile' : 'all')}
            className={`w-full py-3.5 px-4 text-xs font-black rounded-2xl transition-all shadow-xs border flex items-center justify-center gap-2 active:scale-95 ${
              selectedLine === 'all'
                ? 'bg-sky-600 text-white border-sky-700 shadow-md ring-2 ring-sky-300'
                : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-300'
            }`}
          >
            <span>🗺️</span>
            <span>{selectedLine === 'all' ? 'عرض الخط الشرقي فقط' : 'عرض الشبكة بالكامل'}</span>
          </button>

          <div className="bg-gradient-to-br from-sky-50 via-white to-blue-50 text-slate-900 p-5 rounded-3xl shadow-sm border border-sky-200 flex flex-col justify-between">
            <div>
              <div className="inline-block px-2.5 py-1 bg-sky-100 text-sky-900 text-[10px] font-black rounded-lg border border-sky-300 uppercase tracking-wider mb-2">
                رؤية مصر 2030 🇪🇬
              </div>
              <h4 className="text-base font-black text-slate-900">مواصفات عالمية</h4>
              <p className="text-xs text-slate-600 font-medium mt-2 leading-relaxed">
                قطارات كهربائية أحادية السكة صديقة للبيئة بدون سائق بفضل تقنيات الإشارة الحديثة.
              </p>
            </div>
          </div>
        </div>

        {/* Center Column (6 cols): Topographic Map Canvas */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden relative min-h-[590px] flex flex-col justify-between">
            
            {/* Map Canvas Header Toolbar */}
            <div className="p-4 flex flex-wrap items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-md z-20 gap-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-xs"></span>
                <span className="text-xs font-black text-slate-900">
                  {activeSelectMode === 'origin' ? '📍 انقر لتحديد محطة القيام (من)' : '🏁 انقر لتحديد محطة الوصول (إلى)'}
                </span>
              </div>

              {/* Action Toolbar Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetRoute}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition shadow-xs active:scale-95 flex items-center gap-1"
                  title="إعادة ضبط المحطات المحدد"
                >
                  <span>⟲</span>
                  <span>مسح التحديد</span>
                </button>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-xs">
                  <button onClick={() => setZoom((z) => Math.min(2.2, z + 0.2))} className="w-8 h-8 rounded-lg bg-white font-black text-slate-800 hover:bg-amber-50 hover:text-amber-600 transition border border-slate-200 shadow-2xs active:scale-95 flex items-center justify-center">+</button>
                  <button onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))} className="w-8 h-8 rounded-lg bg-white font-black text-slate-800 hover:bg-amber-50 hover:text-amber-600 transition border border-slate-200 shadow-2xs active:scale-95 flex items-center justify-center">-</button>
                  <button onClick={handleResetView} className="w-8 h-8 rounded-lg bg-white font-bold text-xs text-slate-800 hover:bg-amber-50 hover:text-amber-600 transition border border-slate-200 shadow-2xs active:scale-95 flex items-center justify-center" title="تكبير أصلي">⟲</button>
                </div>
              </div>
            </div>

            {/* SVG Topographic Interactive Canvas Container */}
            <div 
              className={`relative flex-1 w-full bg-[#edf4f0] overflow-hidden select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ minHeight: '480px' }}
            >
              <div 
                className="w-full h-full transition-transform duration-75 origin-center"
                style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
              >
                <svg viewBox="0 0 1000 620" className="w-full h-full" style={{ minHeight: '480px' }}>
                  <defs>
                    <linearGradient id="nileGrad3D" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
                      <stop offset="100%" stopColor="#0284c7" stopOpacity="0.95" />
                    </linearGradient>
                  </defs>

                  <rect width="1000" height="620" fill="#f4f7f4" />
                  
                  {/* Terrain Elevation Contour Lines */}
                  <g fill="none" stroke="#d1fae5" strokeWidth="1.5" opacity="0.6">
                    <path d="M 0 100 Q 250 80, 500 140 T 1000 120" />
                    <path d="M 0 200 Q 300 180, 600 240 T 1000 220" />
                    <path d="M 0 350 Q 350 320, 700 400 T 1000 380" />
                    <path d="M 0 500 Q 200 460, 550 520 T 1000 490" />
                  </g>

                  {/* River Nile with Outer Bank Stroke */}
                  <path d="M 460 0 C 470 120, 510 240, 480 360 C 450 440, 480 530, 500 620" fill="none" stroke="#7dd3fc" strokeWidth="46" opacity="0.4" strokeLinecap="round" />
                  <path d="M 460 0 C 470 120, 510 240, 480 360 C 450 440, 480 530, 500 620" fill="none" stroke="url(#nileGrad3D)" strokeWidth="36" strokeLinecap="round" />
                  <text x="495" y="280" fill="#ffffff" fontSize="13" fontWeight="extrabold" transform="rotate(-75 495 280)">نهر النيل 🌊</text>

                  {/* Topographic Area Labels */}
                  <text x="830" y="80" fill="#334155" fontSize="14" fontWeight="extrabold">العاصمة الإدارية الجديدة</text>
                  <text x="680" y="440" fill="#475569" fontSize="14" fontWeight="bold">القاهرة الجديدة</text>
                  <text x="475" y="320" fill="#0f172a" fontSize="16" fontWeight="black">القاهرة الكبرى</text>
                  <text x="210" y="490" fill="#334155" fontSize="14" fontWeight="extrabold">مدينة 6 أكتوبر</text>

                  {/* West Line Dashed Polyline */}
                  {(selectedLine === 'all' || selectedLine === 'west-nile') && (
                    <polyline points={westPolylinePoints} fill="none" stroke={westColor} strokeWidth="8" strokeDasharray="10,6" strokeLinecap="round" />
                  )}

                  {/* East Line Solid Polyline */}
                  {(selectedLine === 'all' || selectedLine === 'east-nile') && (
                    <polyline points={eastPolylinePoints} fill="none" stroke={eastColor} strokeWidth="10" strokeLinecap="round" />
                  )}

                  {/* Glowing Animated Connecting Route Line */}
                  {originStationId && destinationStationId && stationCoordsMap[originStationId] && stationCoordsMap[destinationStationId] && (
                    <line
                      x1={stationCoordsMap[originStationId].x}
                      y1={stationCoordsMap[originStationId].y}
                      x2={stationCoordsMap[destinationStationId].x}
                      y2={stationCoordsMap[destinationStationId].y}
                      stroke="#10b981"
                      strokeWidth="7"
                      strokeDasharray="8,6"
                      className="animate-pulse"
                    />
                  )}

                  {/* Interactive Station Nodes */}
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
                        className="cursor-pointer"
                      >
                        <circle r={isOrigin || isDestination ? 13 : 8} fill="#ffffff" stroke={nodeColor} strokeWidth={3.5} />
                        <circle r={isOrigin || isDestination ? 7 : 4} fill={nodeColor} />

                        {(isOrigin || isDestination || isHovered || isWestLine) && (
                          <g transform="translate(0, -22)">
                            <rect x="-58" y="-16" width="116" height="25" rx="12" fill={isOrigin ? '#f59e0b' : isDestination ? '#0284c7' : '#0f172a'} />
                            <text x="0" y="1" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">
                              {isOrigin ? `📍 ${getStationName(st.name, lang)}` : isDestination ? `🏁 ${getStationName(st.name, lang)}` : isWestLine ? `🚧 ${getStationName(st.name, lang)}` : getStationName(st.name, lang)}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Bottom Light Route Booking Action Bar */}
            <div className="p-4 bg-gradient-to-r from-sky-50 via-white to-blue-50 text-slate-900 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-sky-200 z-20">
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="bg-white px-4 py-2.5 rounded-2xl border border-amber-400 flex-1 md:flex-initial min-w-[130px] shadow-2xs">
                  <div className="text-[10px] text-amber-700 font-black uppercase">📍 محطة القيام</div>
                  <div className="text-xs font-black text-slate-900 truncate">{originStation ? getStationName(originStation.name, lang) : 'غير محددة'}</div>
                </div>

                <span className="text-sky-600 font-black text-base">←</span>

                <div className="bg-white px-4 py-2.5 rounded-2xl border border-sky-400 flex-1 md:flex-initial min-w-[130px] shadow-2xs">
                  <div className="text-[10px] text-sky-700 font-black uppercase">🏁 محطة الوصول</div>
                  <div className="text-xs font-black text-slate-900 truncate">{destinationStation ? getStationName(destinationStation.name, lang) : 'غير محددة'}</div>
                </div>
              </div>

              <button
                onClick={handleBookTicket}
                disabled={!originStationId || !destinationStationId}
                className={`w-full md:w-auto px-8 py-3.5 text-xs font-black rounded-2xl transition-all duration-200 shadow-md flex items-center justify-center gap-2 min-w-[260px] ${
                  originStationId && destinationStationId
                    ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 cursor-pointer shadow-amber-500/20 active:scale-95 ring-2 ring-amber-300'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                }`}
              >
                <span className="text-sm">🎟️</span>
                <span>
                  {originStation && destinationStation
                    ? `حجز التذكرة من (${getStationName(originStation.name, lang)}) إلى (${getStationName(destinationStation.name, lang)})`
                    : 'انقر على المحطتين لتحديد التذكرة'}
                </span>
              </button>
            </div>

          </div>
        </div>

        {/* Right Column (3 cols): Spacious Styled Station List */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-5 flex flex-col min-h-[590px]">
            
            {/* Header & Line Switcher Segmented Control */}
            <h3 className="text-sm font-black text-slate-900 mb-3 flex items-center justify-between">
              <span>قائمة المحطات</span>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                {displayedStations.length} محطة
              </span>
            </h3>

            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1.5 rounded-2xl mb-4 border border-slate-200/80">
              <button
                onClick={() => setSelectedLine('east-nile')}
                className={`py-2 text-xs font-black rounded-xl transition-all duration-150 ${
                  selectedLine === 'east-nile' 
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md shadow-amber-500/20' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                الشرقي
              </button>
              <button
                onClick={() => setSelectedLine('west-nile')}
                className={`py-2 text-xs font-black rounded-xl transition-all duration-150 ${
                  selectedLine === 'west-nile' 
                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/20' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                الغربي 🚧
              </button>
              <button
                onClick={() => setSelectedLine('all')}
                className={`py-2 text-xs font-black rounded-xl transition-all duration-150 ${
                  selectedLine === 'all' 
                    ? 'bg-sky-600 text-white shadow-md' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                الكل
              </button>
            </div>

            {/* Search Input Box */}
            <div className="relative mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث باسم المحطة..."
                className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
              />
              <span className="absolute right-3.5 top-3 text-slate-400 text-sm">🔍</span>
            </div>

            {/* Station List Buttons */}
            <div className="flex-1 overflow-y-auto max-h-[440px] space-y-2.5 pr-1 custom-scrollbar">
              {displayedStations.map((st, idx) => {
                const isWestLine = hasLine(st, 'west-nile');
                const isOrigin = originStationId === st.id;
                const isDestination = destinationStationId === st.id;
                const isEast = hasLine(st, 'east-nile');
                const badgeBg = isEast ? 'bg-amber-100 text-amber-900 border border-amber-300/60' : 'bg-sky-100 text-sky-900 border border-sky-300/60';

                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => handleSelectStation(st)}
                    className={`w-full p-3.5 rounded-2xl border-2 transition-all duration-150 text-right cursor-pointer flex items-center justify-between min-h-[52px] transform active:scale-98 ${
                      isOrigin
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 border-amber-600 shadow-md shadow-amber-500/20 font-black'
                        : isDestination
                        ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white border-sky-700 shadow-md shadow-sky-500/20 font-black'
                        : isWestLine
                        ? 'bg-slate-50/90 border-slate-200/90 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                        : 'bg-white hover:bg-amber-50/50 border-slate-200 hover:border-amber-300 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 shadow-2xs ${
                        isOrigin || isDestination ? 'bg-slate-950 text-white' : badgeBg
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <div className="text-xs font-black truncate">
                          {getStationName(st.name, lang)}
                        </div>
                        <div className={`text-[10px] font-bold truncate ${isOrigin || isDestination ? 'opacity-90' : 'text-slate-400'}`}>
                          {getStationName(st.area, lang)}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 mr-2">
                      {isOrigin && <span className="text-[10px] bg-slate-950 text-amber-400 px-2.5 py-1 rounded-xl font-black shadow-xs">القيام 📍</span>}
                      {isDestination && <span className="text-[10px] bg-slate-950 text-sky-300 px-2.5 py-1 rounded-xl font-black shadow-xs">الوصول 🏁</span>}
                      {!isOrigin && !isDestination && isWestLine && <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-lg font-bold border border-amber-200">🚧 قريباً</span>}
                      {!isOrigin && !isDestination && !isWestLine && <span className="text-xs font-black text-slate-400">←</span>}
                    </div>
                  </button>
                );
              })}
            </div>

          </div>
        </div>

      </div>

      {/* Modern Footer */}
      <div className="max-w-7xl mx-auto mt-6 bg-white border border-slate-200 rounded-3xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-600 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 flex items-center justify-center font-black text-slate-950 text-lg shadow-md shadow-amber-500/20">
            M
          </div>
          <div>
            <div className="font-black text-slate-900 text-sm">منظومة مونوريل القاهرة الكبرى</div>
            <div className="text-[11px] text-slate-500 font-bold">الهيئة القومية للأشغال والأنفاق</div>
          </div>
        </div>
        <div className="flex items-center gap-6 text-slate-700 font-bold overflow-x-auto py-1">
          <span className="flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-xl">❄️ تكييف كامل</span>
          <span className="flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-xl">📶 إنترنت مجاني</span>
          <span className="flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-xl">🖥️ شاشات معلومات</span>
          <span className="flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-xl">💳 حجز إلكتروني</span>
        </div>
      </div>

    </div>
  );
}
