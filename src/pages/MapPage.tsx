import { useState, useMemo } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { getStationName } from '../components/StationPicker';
import { lineColors, lineMeta, stations } from '../data/network';

type Props = { 
  onTicket?: (from: string, to: string) => void 
};

// أيقونات بسيطة ونظيفة
const SearchIcon = () => (
  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const ArrowSwapIcon = () => (
  <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);

const TicketIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
  </svg>
);

// محطات خط غرب النيل (6 أكتوبر)
const WEST_STATIONS = [
  { id: 'w-1', name: { ar: 'جامعة 6 أكتوبر', en: '6th of October Univ' }, area: { ar: '6 أكتوبر', en: '6th of October' } },
  { id: 'w-2', name: { ar: 'ميدان الحصري', en: 'El-Hossary Square' }, area: { ar: '6 أكتوبر', en: '6th of October' } },
  { id: 'w-3', name: { ar: 'ميدان جهينة', en: 'Juhayna Square' }, area: { ar: '6 أكتوبر', en: '6th of October' } },
  { id: 'w-4', name: { ar: 'الشيخ زايد', en: 'Sheikh Zayed' }, area: { ar: 'الشيخ زايد', en: 'Sheikh Zayed' } },
  { id: 'w-5', name: { ar: 'محور 26 يوليو', en: '26th of July Axis' }, area: { ar: 'الجيزة', en: 'Giza' } },
];

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

  const [originId, setOriginId] = useState<string>('st-1');
  const [destId, setDestId] = useState<string>('st-27');
  const [activeFilter, setActiveFilter] = useState<'all' | 'east' | 'west'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // جميع محطات الشبكة
  const allNetworkStations = useMemo(() => {
    const east = (stations as any[]).map((s) => ({ ...s, line: 'east' }));
    const west = WEST_STATIONS.map((w) => ({ ...w, line: 'west' }));
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

  const filteredEastStations = useMemo(() => {
    return (stations as any[]).filter((st) => {
      const name = getDisplayName(st, currentLang);
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [searchQuery, currentLang]);

  const colorsMap = lineColors as Record<string, string>;
  const metaMap = lineMeta as Record<string, any>;

  const eastColor = colorsMap['east-nile'] || '#0284c7';
  const westColor = colorsMap['west-nile'] || '#f59e0b';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header البسيط والمباشر */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-white">
            {isAr ? 'خريطة شبكة المونوريل' : 'Monorail Network Map'}
          </h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            {isAr 
              ? 'اختر محطة القيام والوصول لعرض التفاصيل وحجز التذكرة فلاقاً' 
              : 'Select your origin & destination stations to book your ticket'}
          </p>
        </div>

        {/* كارت اختيار الرحلة المباشر والسريع */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* محطة البداية */}
          <div className="md:col-span-5 space-y-1">
            <label className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {isAr ? 'محطة القيام (الانطلاق)' : 'Departure Station'}
            </label>
            <select
              value={originId}
              onChange={(e) => setOriginId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
            >
              {allNetworkStations.map((st) => (
                <option key={st.id} value={st.id}>
                  {getDisplayName(st, currentLang)} ({getDisplayArea(st, currentLang) || (isAr ? 'غرب النيل' : 'West Nile')})
                </option>
              ))}
            </select>
          </div>

          {/* زر التبديل */}
          <div className="md:col-span-2 flex justify-center">
            <button
              onClick={() => {
                const temp = originId;
                setOriginId(destId);
                setDestId(temp);
              }}
              className="p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 transition-all border border-slate-700 text-cyan-400"
              title={isAr ? 'تبديل الاتجاه' : 'Swap direction'}
            >
              <ArrowSwapIcon />
            </button>
          </div>

          {/* محطة الوصول */}
          <div className="md:col-span-5 space-y-1">
            <label className="text-xs text-rose-400 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              {isAr ? 'محطة الوصول (الوجهة)' : 'Arrival Station'}
            </label>
            <select
              value={destId}
              onChange={(e) => setDestId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
            >
              {allNetworkStations.map((st) => (
                <option key={st.id} value={st.id}>
                  {getDisplayName(st, currentLang)} ({getDisplayArea(st, currentLang) || (isAr ? 'غرب النيل' : 'West Nile')})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* فلاتر الخريطة البسيطة */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeFilter === 'all' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              {isAr ? 'الكل' : 'All'}
            </button>
            <button
              onClick={() => setActiveFilter('east')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeFilter === 'east' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: eastColor }} />
              {isAr ? metaMap['east-nile']?.name || 'شرق النيل' : 'East Nile'}
            </button>
            <button
              onClick={() => setActiveFilter('west')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeFilter === 'west' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: westColor }} />
              {isAr ? 'غرب النيل (6 أكتوبر)' : 'West Nile'}
            </button>
          </div>

          {/* محرك بحث بسيط */}
          <div className="relative w-full sm:w-64">
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <SearchIcon />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'ابحث عن محطة...' : 'Search station...'}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-9 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>
        </div>

        {/* الخريطة الخطية البسيطة والجميلة (Minimal Linear Transit Map) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg overflow-x-auto">
          <div className="min-w-[850px] space-y-6">
            
            {/* خط شرق النيل */}
            {activeFilter !== 'west' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: eastColor }} />
                  <span>{isAr ? 'خط مونوريل شرق النيل (ستاد القاهرة ➔ العاصمة الإدارية)' : 'East Nile Monorail Line'}</span>
                </div>
                
                <div className="flex items-center justify-between gap-2 overflow-x-auto py-3 px-2 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  {filteredEastStations.map((st: any) => {
                    const isOrigin = originId === st.id;
                    const isDest = destId === st.id;
                    const name = getDisplayName(st, currentLang);

                    return (
                      <button
                        key={st.id}
                        onClick={() => {
                          if (isOrigin) return;
                          setDestId(st.id);
                        }}
                        className={`flex flex-col items-center gap-1.5 shrink-0 px-2 py-1.5 rounded-lg transition-all group ${
                          isOrigin || isDest ? 'scale-105' : 'hover:bg-slate-900'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                          isOrigin 
                            ? 'bg-emerald-400 border-emerald-300 ring-4 ring-emerald-500/20' 
                            : isDest 
                            ? 'bg-rose-500 border-rose-400 ring-4 ring-rose-500/20' 
                            : 'bg-slate-950 border-cyan-400 group-hover:bg-cyan-400'
                        }`} />
                        <span className={`text-[11px] font-medium whitespace-nowrap ${
                          isOrigin ? 'text-emerald-400 font-bold' : isDest ? 'text-rose-400 font-bold' : 'text-slate-300'
                        }`}>
                          {name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* خط غرب النيل */}
            {activeFilter !== 'east' && (
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: westColor }} />
                  <span>{isAr ? 'خط مونوريل غرب النيل (6 أكتوبر)' : 'West Nile Monorail Line (6th of October)'}</span>
                </div>

                <div className="flex items-center justify-start gap-4 overflow-x-auto py-3 px-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  {WEST_STATIONS.map((w: any) => {
                    const isOrigin = originId === w.id;
                    const isDest = destId === w.id;
                    const name = getDisplayName(w, currentLang);

                    return (
                      <button
                        key={w.id}
                        onClick={() => setDestId(w.id)}
                        className={`flex flex-col items-center gap-1.5 shrink-0 px-2 py-1.5 rounded-lg transition-all ${
                          isOrigin || isDest ? 'scale-105' : 'hover:bg-slate-900'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                          isOrigin 
                            ? 'bg-emerald-400 border-emerald-300 ring-4 ring-emerald-500/20' 
                            : isDest 
                            ? 'bg-rose-500 border-rose-400 ring-4 ring-rose-500/20' 
                            : 'bg-slate-950 border-amber-400 hover:bg-amber-400'
                        }`} />
                        <span className={`text-[11px] font-medium whitespace-nowrap ${
                          isOrigin ? 'text-emerald-400 font-bold' : isDest ? 'text-rose-400 font-bold' : 'text-slate-300'
                        }`}>
                          {name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* كارت ملخص الرحلة وحجز التذكرة النظيف */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-right">
            <div className="text-xs text-slate-400">
              {isAr ? 'مسار الرحلة المحددة:' : 'Selected Route:'}
            </div>
            <div className="text-lg font-bold text-white flex items-center justify-center md:justify-start gap-2">
              <span className="text-emerald-400">{getDisplayName(originStation, currentLang)}</span>
              <span className="text-slate-500">➔</span>
              <span className="text-rose-400">{getDisplayName(destStation, currentLang)}</span>
            </div>
            <div className="text-xs text-slate-400 flex items-center justify-center md:justify-start gap-3 pt-1">
              <span>{isAr ? 'الوقت المتوقع: ~35 دقيقة' : 'Est. Time: ~35 mins'}</span>
              <span>•</span>
              <span className="text-cyan-300 font-bold">{isAr ? 'سعر التذكرة: 15 ج.م' : 'Fare: 15 EGP'}</span>
            </div>
          </div>

          {onTicket && (
            <button
              onClick={() => onTicket(originStation.id, destStation.id)}
              className="w-full md:w-auto px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              <TicketIcon />
              <span>{isAr ? 'احجز التذكرة الآن' : 'Book Ticket Now'}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
