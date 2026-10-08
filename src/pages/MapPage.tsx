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

  const eastColor = colors['east-nile'] || '#EAB308';
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
      setToastMessage(`🚧 محطة (${getStationName(st.name, lang)}) ضمن الخط الغربي (تحت الإنشاء)`);
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
      
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full mb-2 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            خريطة تفاعلية شاملة 2026
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            خريطة مونوريل القاهرة الكبرى
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            خطان .. مدينة واحدة | اسحب الخريطة في أي اتجاه للتنقل
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-amber-400"></div>
            <div>
              <div className="text-xs text-slate-400 font-medium">شرق النيل</div>
              <div className="text-sm font-bold text-slate-800">{meta?.['east-nile']?.totalStations || 22} محطة</div>
            </div>
          </div>
          <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-sky-500 border border-dashed border-slate-400"></div>
            <div>
              <div className="text-xs text-slate-400 font-medium">غرب النيل (🚧)</div>
              <div className="text-sm font-bold text-slate-800">{meta?.['west-nile']?.totalStations || 13} محطة</div>
            </div>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="max-w-7xl mx-auto mb-4 p-3 bg-amber-500 text-slate-950 rounded-2xl font-bold text-xs shadow-md border border-amber-400 flex items-center justify-between">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="font-extrabold px-2">✕</button>
        </div>
      )}

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div 
            onClick={() => setSelectedLine('east-nile')}
            className={`p-5 rounded-2xl border transition cursor-pointer shadow-xs ${
              selectedLine === 'east-nile' ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/20' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-900">الخط الشرقي</h3>
              <span className="w-3 h-3 rounded-full bg-amber-400"></span>
            </div>
            <p className="text-xs text-slate-500">مدينة نصر ↔ العاصمة الإدارية</p>
          </div>

          <div 
            onClick={() => setSelectedLine('west-nile')}
            className={`p-5 rounded-2xl border transition cursor-pointer shadow-xs ${
              selectedLine === 'west-nile' ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-400/20' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-900">الخط الغربي</h3>
              <span className="text-xs text-amber-600 font-extrabold">🚧 تحت الإنشاء</span>
            </div>
            <p className="text-xs text-slate-500">6 أكتوبر ↔ وادي النيل</p>
          </div>

          {selectedLine !== 'all' && (
            <button 
              onClick={() => setSelectedLine('all')}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200"
            >
              إظهار الشبكة بالكامل
            </button>
          )}
        </div>

        {/* Center Canvas */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden relative min-h-[580px] flex flex-col justify-between">
            
            <div className="p-3 flex items-center justify-between border-b border-slate-100 bg-white/95 z-20">
              <span className="text-xs font-bold text-slate-800">
                {activeSelectMode === 'origin' ? '📍 اختر محطة القيام (من)' : '🏁 اختر محطة الوصول (إلى)'}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleResetRoute}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
                  title="مسح التحديد"
                >
                  ⟲ مسح
                </button>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button onClick={() => setZoom((z) => Math.min(2.2, z + 0.2))} className="w-7 h-7 rounded bg-white shadow-xs font-bold">+</button>
                  <button onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))} className="w-7 h-7 rounded bg-white shadow-xs font-bold">-</button>
                  <button onClick={handleResetView} className="w-7 h-7 rounded bg-white shadow-xs text-xs font-bold">⟲</button>
                </div>
              </div>
            </div>

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
                  <path d="M 460 0 C 470 120, 510 240, 480 360 C 450 440, 480 530, 500 620" fill="none" stroke="url(#nileGrad3D)" strokeWidth="42" strokeLinecap="round" />
                  <text x="495" y="280" fill="#ffffff" fontSize="13" fontWeight="extrabold" transform="rotate(-75 495 280)">نهر النيل 🌊</text>

                  <text x="830" y="80" fill="#334155" fontSize="14" fontWeight="extrabold">العاصمة الإدارية الجديدة</text>
                  <text x="680" y="440" fill="#475569" fontSize="14" fontWeight="bold">القاهرة الجديدة</text>
                  <text x="475" y="320" fill="#0f172a" fontSize="16" fontWeight="black">القاهرة الكبرى</text>
                  <text x="210" y="490" fill="#334155" fontSize="14" fontWeight="extrabold">مدينة 6 أكتوبر</text>

                  {(selectedLine === 'all' || selectedLine === 'west-nile') && (
                    <polyline points={westPolylinePoints} fill="none" stroke={westColor} strokeWidth="8" strokeDasharray="10,6" strokeLinecap="round" />
                  )}

                  {(selectedLine === 'all' || selectedLine === 'east-nile') && (
                    <polyline points={eastPolylinePoints} fill="none" stroke={eastColor} strokeWidth="10" strokeLinecap="round" />
                  )}

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
                        <circle r={isOrigin || isDestination ? 12 : 8} fill="#ffffff" stroke={nodeColor} strokeWidth={3} />
                        <circle r={isOrigin || isDestination ? 6 : 4} fill={nodeColor} />

                        {(isOrigin || isDestination || isHovered || isWestLine) && (
                          <g transform="translate(0, -22)">
                            <rect x="-55" y="-16" width="110" height="24" rx="12" fill={isOrigin ? '#f59e0b' : isDestination ? '#0284c7' : '#0f172a'} />
                            <text x="0" y="0" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">
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

            {/* Bottom Bar */}
            <div className="p-4 bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-4 border-t border-slate-800 z-20">
              <div className="flex items-center gap-3">
                <div className="text-xs font-bold">📍 القيام: {originStation ? getStationName(originStation.name, lang) : 'لم تحدد'}</div>
                <div className="text-xs font-bold text-sky-400">🏁 الوصول: {destinationStation ? getStationName(destinationStation.name, lang) : 'لم تحدد'}</div>
              </div>

              <button
                onClick={handleBookTicket}
                disabled={!originStationId || !destinationStationId}
                className={`px-6 py-2.5 text-xs font-extrabold rounded-xl transition ${
                  originStationId && destinationStationId
                    ? 'bg-amber-400 text-slate-950 hover:bg-amber-500 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                🎟️ حجز التذكرة
              </button>
            </div>

          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 flex flex-col min-h-[580px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن محطة..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs mb-3"
            />

            <div className="flex-1 overflow-y-auto max-h-[420px] space-y-2 custom-scrollbar">
              {displayedStations.map((st, idx) => {
                const isWestLine = hasLine(st, 'west-nile');
                const isOrigin = originStationId === st.id;
                const isDestination = destinationStationId === st.id;

                return (
                  <div
                    key={st.id}
                    onClick={() => handleSelectStation(st)}
                    className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between text-xs ${
                      isOrigin ? 'bg-amber-400 text-slate-950 font-bold' : isDestination ? 'bg-sky-500 text-white font-bold' : 'bg-white text-slate-800'
                    }`}
                  >
                    <span>{idx + 1}. {getStationName(st.name, lang)} {isWestLine ? '🚧' : ''}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
