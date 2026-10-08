import { useState, useMemo } from 'react';
import { stations, lineMeta } from '../data/network';
import { getStationName } from '../components/StationPicker';
import { useLanguage } from '../i18n/LanguageContext';

export const getTransferLabel = (transfer: any, lang: string): string => {
  if (!transfer) return '';
  if (typeof transfer === 'object' && transfer !== null) {
    return lang === 'en' ? (transfer.en || transfer.ar || '') : (transfer.ar || transfer.en || '');
  }
  const str = String(transfer);
  if (lang === 'en') {
    if (str.includes('مترو الخط الرابع (مستقبلاً)')) return 'Metro Line 4 (Future)';
    if (str.includes('مترو الخط الرابع')) return 'Metro Line 4';
    if (str.includes('مترو الخط السادس (مستقبلاً)')) return 'Metro Line 6 (Future)';
    if (str.includes('مترو الخط السادس')) return 'Metro Line 6';
    if (str.includes('القطار الكهربائي السريع (مستقبلاً)')) return 'High-Speed Rail (Future)';
    if (str.includes('القطار الكهربائي السريع')) return 'High-Speed Rail';
    if (str.includes('مترو الخط الثالث')) return 'Transfer: Metro Line 3';
    if (str.includes('محطة قطارات الصعيد')) return 'Upper Egypt Railway Station';
    if (str === 'بداية الخط') return 'Line start';
    if (str === 'نهاية الخط') return 'Line end';
  }
  return str;
};

const hasLine = (st: any, lineId: string): boolean => {
  if (Array.isArray(st.lines)) return st.lines.includes(lineId);
  if (st.line) return st.line === lineId;
  return false;
};

export default function StationsPage() {
  const { lang } = useLanguage();
  const isEn = lang === 'en';
  const [activeLine, setActiveLine] = useState<'east-nile' | 'west-nile'>('east-nile');

  const meta = (lineMeta as Record<string, any>)[activeLine];
  const filteredStations = useMemo(() => stations.filter((st: any) => hasLine(st, activeLine)), [activeLine]);

  // Group stations by area for structured timeline sections
  const groupedStations = useMemo(() => {
    const groups: { area: any; items: any[] }[] = [];
    filteredStations.forEach((st: any) => {
      const areaName = getStationName(st.area, lang);
      let group = groups.find((g) => getStationName(g.area, lang) === areaName);
      if (!group) {
        group = { area: st.area, items: [] };
        groups.push(group);
      }
      group.items.push(st);
    });
    return groups;
  }, [filteredStations, lang]);

  return (
    <div className={`subpage w-full min-h-screen bg-slate-50 text-slate-800 p-4 md:p-6 lg:p-8 font-sans ${isEn ? 'dir-ltr' : 'dir-rtl'}`}>
      
      {/* Main Grid: Left Timeline Card + Right Banner */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (8 or 9 cols): Official Timeline Card */}
        <div className="lg:col-span-9 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 md:p-8">
          
          {/* Top Line Switcher & Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-6 mb-8 gap-4">
            <div>
              <span className="text-xs font-extrabold text-blue-600 tracking-wide uppercase">
                {isEn ? 'Stations Guide' : 'دليل المحطات'}
              </span>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mt-1">
                {activeLine === 'east-nile'
                  ? isEn ? 'East Nile Line' : 'خط شرق النيل'
                  : isEn ? 'West Nile Line' : 'خط غرب النيل'}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3.5 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-black rounded-full border border-indigo-100">
                {filteredStations.length} {isEn ? 'stations' : 'محطة'}
              </span>

              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <button
                  onClick={() => setActiveLine('east-nile')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition ${
                    activeLine === 'east-nile'
                      ? 'bg-amber-400 text-slate-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isEn ? 'East Nile' : 'الشرقي'}
                </button>
                <button
                  onClick={() => setActiveLine('west-nile')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition ${
                    activeLine === 'west-nile'
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isEn ? 'West Nile 🚧' : 'الغربي 🚧'}
                </button>
              </div>
            </div>
          </div>

          {/* Grouped Area Sections with Right Timeline Line */}
          <div className="space-y-8">
            {groupedStations.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-4">
                
                {/* Area Heading */}
                <h3 className="text-sm font-extrabold text-slate-400 border-b border-slate-100 pb-2">
                  {getStationName(group.area, lang)}
                </h3>

                {/* Stations Timeline List */}
                <div className="relative space-y-5">
                  
                  {/* Vertical Blue Line indicator */}
                  <div className={`absolute top-3 bottom-3 ${isEn ? 'right-4' : 'left-4'} w-0.5 bg-blue-500/40 z-0`}></div>

                  {group.items.map((st: any) => {
                    const transferText = getTransferLabel(st.transfer || st.note || st.connections, lang);
                    const globalIdx = filteredStations.findIndex((item) => item.id === st.id);
                    const isFirst = globalIdx === 0;
                    const isLast = globalIdx === filteredStations.length - 1;

                    return (
                      <div
                        key={st.id}
                        className="relative z-10 flex items-center justify-between py-1 min-h-[44px]"
                      >
                        {/* Station Name & Badges on Left */}
                        <div className="flex items-center gap-3 flex-wrap pr-2">
                          <span className="text-sm font-black text-slate-900">
                            {getStationName(st.name, lang)}
                          </span>

                          {transferText && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60 shadow-2xs">
                              {transferText}
                            </span>
                          )}

                          {isFirst && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                              {isEn ? 'Line start' : 'بداية الخط'}
                            </span>
                          )}

                          {isLast && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                              {isEn ? 'Line end' : 'نهاية الخط'}
                            </span>
                          )}
                        </div>

                        {/* Blue Node Circle on Timeline Bar */}
                        <div className="shrink-0 flex items-center justify-center w-8 h-8">
                          <div className={`w-3.5 h-3.5 rounded-full border-2 bg-white transition ${
                            isFirst || isLast
                              ? 'border-blue-600 ring-4 ring-blue-100 w-4 h-4'
                              : 'border-blue-500 hover:border-amber-500'
                          }`}></div>
                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>
            ))}
          </div>

          {/* Footer Note */}
          <div className="mt-10 pt-4 border-t border-slate-100 text-xs text-slate-400 font-medium flex flex-wrap items-center justify-between gap-2">
            <span>
              {isEn
                ? 'Data is based on official monorail project announcements and subject to change.'
                : 'البيانات مستمدة من الإعلانات الرسمية لمشروع المونوريل وقابلة للتحديث.'}
            </span>
            <span className="font-bold text-slate-600">
              {isEn ? 'National Authority for Tunnels 🔗' : 'الهيئة القومية للأشغال والأنفاق 🔗'}
            </span>
          </div>

        </div>

        {/* Right Column (3 cols): Official Monorail Feature Card */}
        <div className="lg:col-span-3">
          <div className="bg-gradient-to-b from-blue-900 to-indigo-950 text-white rounded-3xl p-6 shadow-md flex flex-col justify-between min-h-[440px] border border-blue-800/60">
            <div>
              {/* Train Icon Badge */}
              <div className="w-12 h-12 bg-amber-400 rounded-2xl flex items-center justify-center text-slate-950 font-black text-2xl shadow-md mb-6">
                🚝
              </div>

              <h2 className="text-xl font-black tracking-tight mb-2">
                {isEn ? 'Driverless trains' : 'قطارات بدون سائق'}
              </h2>
              <p className="text-xs text-blue-200 leading-relaxed font-medium">
                {isEn
                  ? 'The monorail operates automatically with platform screen doors for safety.'
                  : 'يعمل المونوريل بنظام آلي بالكامل بدون سائق مع أبواب زجاجية على الرصيف لأعلى مستويات الأمان.'}
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-blue-800/80">
              <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-wider block mb-1">
                {isEn ? 'Coming soon' : 'قريباً'}
              </span>
              <h3 className="text-lg font-black text-amber-400">
                {isEn ? 'West Nile Line' : 'الخط الغربي'}
              </h3>
              <p className="text-xs text-blue-300 font-bold mt-1">
                {isEn
                  ? `Under construction: ${meta?.totalStations || 13} stations`
                  : `تحت الإنشاء: ${meta?.totalStations || 13} محطة`}
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
