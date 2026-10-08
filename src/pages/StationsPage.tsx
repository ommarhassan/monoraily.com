import { useState } from 'react';
import { stations, lineMeta } from '../data/network';
import { getStationName } from '../components/StationPicker';
import { useLanguage } from '../i18n/LanguageContext';

const hasLine = (st: any, lineId: string): boolean => {
  if (Array.isArray(st.lines)) return st.lines.includes(lineId);
  if (st.line) return st.line === lineId;
  return false;
};

export default function StationsPage() {
  const { lang } = useLanguage();
  const [activeLine, setActiveLine] = useState<'east-nile' | 'west-nile'>('east-nile');

  const meta = (lineMeta as Record<string, any>)[activeLine];
  const filteredStations = stations.filter((st: any) => hasLine(st, activeLine));

  return (
    <div className="subpage w-full min-h-screen bg-slate-50 text-slate-800 p-4 md:p-6 lg:p-8 font-sans dir-rtl">
      
      {/* Top Header */}
      <div className="max-w-7xl mx-auto mb-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 inline-block mb-2">
            دليل المحطات
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            محطات شبكة مونوريل القاهرة الكبرى
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            استكشف قائمة المحطات كاملة للخطين الشرقي وغربي واسم كل منطقة
          </p>
        </div>

        {/* Line Switch Tabs */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveLine('east-nile')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition ${
              activeLine === 'east-nile'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الخط الشرقي
          </button>
          <button
            onClick={() => setActiveLine('west-nile')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition ${
              activeLine === 'west-nile'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الخط الغربي 🚧
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xs p-6 md:p-8">
        
        {/* Line Summary */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-6 mb-6 gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900">
              {activeLine === 'east-nile' ? 'الخط الشرقي (شرق النيل)' : 'الخط الغربي (غرب النيل)'}
            </h2>
            <p className="text-xs font-bold text-slate-500 mt-1">
              {filteredStations.length} محطة • {meta?.lengthKm || (activeLine === 'east-nile' ? 56.5 : 43.8)} كم
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeLine === 'west-nile' ? (
              <span className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold">
                🚧 التشغيل التجريبي / تحت الإنشاء
              </span>
            ) : (
              <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
                ⚡ خط يعمل رسمياً
              </span>
            )}
          </div>
        </div>

        {/* Stations List Vertical Timeline */}
        <div className="space-y-3">
          {filteredStations.map((st: any, idx: number) => {
            const isOrigin = idx === 0;
            const isTerminus = idx === filteredStations.length - 1;

            return (
              <div
                key={st.id}
                className="flex items-center justify-between p-4 rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-4">
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                    activeLine === 'east-nile'
                      ? 'bg-amber-100 text-amber-900 border border-amber-200'
                      : 'bg-sky-100 text-sky-900 border border-sky-200'
                  }`}>
                    {idx + 1}
                  </span>

                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {getStationName(st.name, lang)}
                    </div>
                    <div className="text-xs text-slate-400 font-medium mt-0.5">
                      {getStationName(st.area, lang)}
                    </div>
                  </div>
                </div>

                <div>
                  {isOrigin && (
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-amber-400 text-slate-950">
                      بداية الخط
                    </span>
                  )}
                  {isTerminus && (
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-sky-500 text-white">
                      نهاية الخط
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
