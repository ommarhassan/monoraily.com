import { useState } from 'react';
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
  const filteredStations = stations.filter((st) => hasLine(st, activeLine));

  return (
    <div className={`subpage w-full min-h-screen bg-slate-50 text-slate-800 p-4 md:p-6 lg:p-8 font-sans ${isEn ? 'dir-ltr' : 'dir-rtl'}`}>
      
      {/* Top Header */}
      <div className="max-w-7xl mx-auto mb-6 bg-gradient-to-r from-sky-50 via-blue-50/60 to-indigo-50 p-6 rounded-3xl border border-sky-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black text-sky-800 uppercase tracking-wider bg-sky-100 px-3 py-1 rounded-full border border-sky-300 inline-block mb-2">
            {isEn ? 'Stations Directory' : 'دليل المحطات'}
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            {isEn ? 'Monorail Network Stations' : 'محطات شبكة مونوريل القاهرة الكبرى'}
          </h1>
          <p className="text-xs md:text-sm text-slate-600 font-bold mt-1">
            {isEn ? 'Explore all stations across East & West Nile lines' : 'استكشف قائمة المحطات كاملة للخطين الشرقي والغربي واسم كل منطقة وسيارات الربط'}
          </p>
        </div>

        {/* Line Switch Tabs */}
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs">
          <button
            onClick={() => setActiveLine('east-nile')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeLine === 'east-nile'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isEn ? 'East Nile Line' : 'الخط الشرقي'}
          </button>
          <button
            onClick={() => setActiveLine('west-nile')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeLine === 'west-nile'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isEn ? 'West Nile Line 🚧' : 'الخط الغربي 🚧'}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-md p-6 md:p-8">
        
        {/* Line Summary */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-6 mb-6 gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900">
              {isEn ? (activeLine === 'east-nile' ? 'East Nile Line' : 'West Nile Line') : (activeLine === 'east-nile' ? 'الخط الشرقي (شرق النيل)' : 'الخط الغربي (غرب النيل)')}
            </h2>
            <p className="text-xs font-bold text-slate-500 mt-1">
              {isEn
                ? `${filteredStations.length} Stations • ${meta?.lengthKm || (activeLine === 'east-nile' ? 56.5 : 43.8)} km`
                : `${filteredStations.length} محطة • ${meta?.lengthKm || (activeLine === 'east-nile' ? 56.5 : 43.8)} كم`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeLine === 'west-nile' ? (
              <span className="px-3 py-1.5 bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-black">
                {isEn ? '🚧 Trial Operation / Under Construction' : '🚧 التشغيل التجريبي / تحت الإنشاء'}
              </span>
            ) : (
              <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-black">
                {isEn ? '⚡ Active Line' : '⚡ خط يعمل رسمياً'}
              </span>
            )}
          </div>
        </div>

        {/* Stations List Vertical Timeline */}
        <div className="space-y-4">
          {filteredStations.map((st, idx) => {
            const transferText = getTransferLabel(st.transfer || st.note, lang);
            const isOrigin = idx === 0;
            const isTerminus = idx === filteredStations.length - 1;

            return (
              <div
                key={st.id}
                className="flex items-center justify-between p-4 rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60 transition group"
              >
                <div className="flex items-center gap-4">
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                    activeLine === 'east-nile'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300/80'
                      : 'bg-sky-100 text-sky-900 border border-sky-300/80'
                  }`}>
                    {idx + 1}
                  </span>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-900">
                        {getStationName(st.name, lang)}
                      </span>
                      {transferText && (
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          {transferText}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 font-bold mt-0.5">
                      {getStationName(st.area, lang)}
                    </div>
                  </div>
                </div>

                <div>
                  {isOrigin && (
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-amber-400 text-slate-950 shadow-2xs">
                      {isEn ? 'Line start' : 'بداية الخط'}
                    </span>
                  )}
                  {isTerminus && (
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-sky-500 text-white shadow-2xs">
                      {isEn ? 'Line end' : 'نهاية الخط'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
}
